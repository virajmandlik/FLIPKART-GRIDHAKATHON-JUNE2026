"""
Gridlock 2.0 -- Approach E: STACK the two VALIDATED gains (B's features + C's blend).

Two independent, leakage-free wins have been proven on the DAYTIME proxy:
  * Approach C (LB 91.186): model DIVERSITY -- blend LightGBM(v1) + XGBoost(geohash
    dropped); daytime-proxy blend RMSE 0.029201 vs best single (xgb) 0.029383.
  * Approach B: two FEATURES -- `road_tod_mean` (mean demand per RoadType x tod) and
    `lanes_tod_mean` (per NumberofLanes x tod) lowered B's daytime proxy 0.05899 ->
    0.05511 (a leakage-free gain measured on day-48 daytime labels).

Approach E MERGES them: take C's exact pipeline (same daytime proxy, same 3 diverse
models, same gated blend, same lag-present CV-A round calibration, same seed-average)
but feed it the COMBINED feature set = v1 (32 feats) + road_tod_mean + lanes_tod_mean.
The two aggregates are fit leakage-free on the per-fold reference (same as B), so the
proxy comparison vs C is apples-to-apples: identical machinery, only the feature set
differs. If B's features help in the ENSEMBLE setting too, every model's daytime-proxy
RMSE -- and the blend -- should drop below C's numbers.

Pipeline (mirrors approach_C.py):
  1. Daytime-proxy 5-fold OOF for LightGBM(v1), XGBoost(geohash dropped), CatBoost on
     the COMBINED feature set. Report each model's OOF RMSE vs C's logged values.
  2. Non-negative blend weights (sum=1) minimizing daytime-proxy RMSE (Dirichlet search
     + coordinate polish). ACCEPT the blend only if it beats the best single model.
  3. Calibrate final rounds via lag-present CV-A (fit day48 no-lag, early-stop day49
     with the real geo_tod lag) -- NOT on the proxy (the proxy inflates rounds).
  4. Final fit on day48+day49 (real lag), seed-averaged (>=6 seeds, only `seed` varied),
     predict test, apply weights, clip [0,1] -> submissions/submission_E.csv.
  5. Backup candidate: 50/50 average of submission_B.csv + submission_C.csv ->
     submissions/submission_BC.csv (+ correlation structure).
  6. outputs/approach_E_report.md: proxy comparison vs C, weights, rounds, corr vs C/v1.

Run (background):
  $env:PYTHONUTF8='1'; cd ml_hackathon_solution/src; python -u approach_E.py *> ../outputs/run_E.log
Env: N_SEEDS (default 6)
"""
from __future__ import annotations

import json
import os
import time
import warnings

import numpy as np
import pandas as pd
from sklearn.model_selection import KFold

import features as F

warnings.filterwarnings("ignore")

T0 = time.time()


def tlog(*a):
    print(f"[{time.time() - T0:7.1f}s]", *a, flush=True)


import lightgbm as lgb
import xgboost as xgb
from catboost import CatBoostRegressor, Pool

# ------------------------------------------------------------------ paths
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset")
OUT = os.path.join(ROOT, "outputs")
SUB = os.path.join(ROOT, "submissions")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SUB, exist_ok=True)

# ------------------------------------------------------------------ config
SEED = 42
TARGET = "demand"
# COMBINED feature set = v1 (32) + B's two validated daytime features.
EXTRA_FEATS = ["road_tod_mean", "lanes_tod_mean"]
FEATS = F.feature_columns() + EXTRA_FEATS
CAT = F.categorical_columns()               # ['geohash','RoadType','Weather']
CAT_XGB = ["RoadType", "Weather"]           # geohash DROPPED for XGBoost
FEATS_XGB = [c for c in FEATS if c != "geohash"]
DAY_LO, DAY_HI = 135, 825                   # test daytime horizon (min since midnight)
N_SEEDS = int(os.environ.get("N_SEEDS", "6"))
SEEDS = [SEED + i * 101 for i in range(N_SEEDS)]
NFOLDS = 5
PROXY_MAX_ROUNDS = 500                       # proxy is only a RELATIVE ranker -> keep fast
CALIB_MAX_ROUNDS = 3000                      # lag-present CV-A: let early stopping decide

# C's logged results (loaded at runtime if available; constants are the fallback).
C_REF = {
    "proxy_rmse": {"lgb_v1": 0.029588555478525916, "cat": 0.03116062761589316,
                   "xgb": 0.029382671327559305},
    "blend_rmse": 0.029201040364857465,
    "weights": {"lgb_v1": 0.4059685413137164, "cat": 0.0, "xgb": 0.5940314586862836},
    "rounds_final": {"lgb": 217, "cat": 196, "xgb": 259},
    "pred_mean": 0.1302733672857055,
    "v1_mean": 0.1308300670213573,
}


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


# ----------------------------------------------- extended (B-augmented) encoder
class HistoryEncoderE(F.HistoryEncoder):
    """v1 HistoryEncoder + B's two VALIDATED daytime features.

    `road_tod_mean` / `lanes_tod_mean` are smoothed target means per (RoadType,tod)
    and (NumberofLanes,tod), fit on the SAME leakage-safe reference as every other
    aggregate (per-fold train in the proxy; day-48 for the final fit). Held-out
    validation rows never contribute to these means -> leakage-free, exactly as B.
    """

    def _smooth_group(self, ref, keys, name, k=10):
        grp = ref.groupby(keys)[TARGET]
        m, c = grp.mean(), grp.count()
        sm = (m * c + self.global_mean_ * k) / (c + k)
        return sm.rename(name).reset_index()

    def fit(self, ref: pd.DataFrame) -> "HistoryEncoderE":
        super().fit(ref)
        self.road_tod_ = self._smooth_group(ref, ["RoadType", "tod"], "road_tod_mean", 10)
        self.lanes_tod_ = self._smooth_group(ref, ["NumberofLanes", "tod"], "lanes_tod_mean", 10)
        return self

    def transform(self, df: pd.DataFrame, use_geo_tod: bool = True) -> pd.DataFrame:
        out = super().transform(df, use_geo_tod=use_geo_tod)
        out = out.merge(self.road_tod_, on=["RoadType", "tod"], how="left")
        out = out.merge(self.lanes_tod_, on=["NumberofLanes", "tod"], how="left")
        # B's back-off: road_tod -> road_mean -> global; lanes_tod -> tod_mean -> global
        out["road_tod_mean"] = out["road_tod_mean"].fillna(out["road_mean"]).fillna(self.global_mean_)
        out["lanes_tod_mean"] = out["lanes_tod_mean"].fillna(out["tod_mean"]).fillna(self.global_mean_)
        return out


# ------------------------------------------------------- per-model matrices
def cast_lgb(df):
    o = df[FEATS].copy()
    for c in CAT:
        o[c] = o[c].astype("category")
    return o


def prep_xgb(df):
    o = df[FEATS_XGB].copy()
    for c in CAT_XGB:
        o[c] = o[c].astype("object").where(o[c].notna(), "NA").astype("category")
    return o


def prep_cat(df):
    o = df[FEATS].copy()
    for c in CAT:
        o[c] = o[c].astype("object").where(o[c].notna(), "NA").astype(str)
    return o


# -------------------------------------------------------------- LightGBM (v1 params)
def lgb_params(seed=SEED):
    # v1 (LB 90.791): only `seed` was ever set; LightGBM derives the sub-seeds.
    return dict(objective="regression", metric="rmse", learning_rate=0.03,
                num_leaves=63, min_child_samples=40, subsample=0.8, subsample_freq=1,
                colsample_bytree=0.8, reg_lambda=2.0, reg_alpha=0.5,
                max_depth=-1, seed=seed, n_jobs=-1, verbose=-1)


def fit_lgb(Xtr, ytr, Xva, yva, Xpred_list, seed=SEED, rounds=PROXY_MAX_ROUNDS):
    dtr = lgb.Dataset(Xtr, label=ytr, categorical_feature=CAT, free_raw_data=False)
    valid, names, cbs = [dtr], ["train"], [lgb.log_evaluation(0)]
    if Xva is not None:
        dva = lgb.Dataset(Xva, label=yva, categorical_feature=CAT, reference=dtr,
                          free_raw_data=False)
        valid, names = [dtr, dva], ["train", "valid"]
        cbs.append(lgb.early_stopping(150, verbose=False))
    m = lgb.train(lgb_params(seed), dtr, num_boost_round=rounds,
                  valid_sets=valid, valid_names=names, callbacks=cbs)
    it = m.best_iteration or rounds
    preds = [np.clip(m.predict(X, num_iteration=it), 0, 1) for X in Xpred_list]
    return m, it, preds


# -------------------------------------------------------------- XGBoost (geohash dropped)
def xgb_params(seed=SEED):
    return dict(objective="reg:squarederror", eval_metric="rmse", eta=0.03,
                max_depth=8, subsample=0.8, colsample_bytree=0.8,
                min_child_weight=5.0, reg_lambda=2.0, reg_alpha=0.5,
                tree_method="hist", max_cat_to_onehot=1, seed=seed)


def fit_xgb(Xtr, ytr, Xva, yva, Xpred_list, seed=SEED, rounds=PROXY_MAX_ROUNDS):
    dtr = xgb.DMatrix(Xtr, label=ytr, enable_categorical=True)
    dpred = [xgb.DMatrix(X, enable_categorical=True) for X in Xpred_list]
    evals, esr = [], None
    if Xva is not None:
        dva = xgb.DMatrix(Xva, label=yva, enable_categorical=True)
        evals, esr = [(dva, "v")], 150
    m = xgb.train(xgb_params(seed), dtr, num_boost_round=rounds, evals=evals,
                  early_stopping_rounds=esr, verbose_eval=False)
    it = getattr(m, "best_iteration", None)
    rng = dict(iteration_range=(0, it + 1)) if it is not None else {}
    preds = [np.clip(m.predict(X, **rng), 0, 1) for X in dpred]
    return m, (it if it is not None else rounds), preds


# -------------------------------------------------------------- CatBoost
def fit_cat(Xtr, ytr, Xva, yva, Xpred_list, seed=SEED, rounds=PROXY_MAX_ROUNDS):
    trp = Pool(Xtr, ytr, cat_features=CAT)
    prp = [Pool(X, cat_features=CAT) for X in Xpred_list]
    # allow_writing_files=False: do NOT write catboost_info/ (Windows file-lock hangs).
    kw = dict(iterations=rounds, learning_rate=0.03, depth=8, l2_leaf_reg=3.0,
              loss_function="RMSE", random_seed=seed, verbose=False,
              allow_writing_files=False, thread_count=-1)
    if Xva is not None:
        kw.update(od_type="Iter", od_wait=150)
        m = CatBoostRegressor(**kw).fit(trp, eval_set=Pool(Xva, yva, cat_features=CAT),
                                        use_best_model=True)
    else:
        m = CatBoostRegressor(**kw).fit(trp)
    it = m.best_iteration_ if m.best_iteration_ else rounds
    preds = [np.clip(m.predict(X), 0, 1) for X in prp]
    return m, it, preds


# ===================================================================== main
def main():
    log = {}
    # load C's logged results if present (robust apples-to-apples comparison)
    c_ref = dict(C_REF)
    c_log_path = os.path.join(OUT, "approach_C_log.json")
    if os.path.exists(c_log_path):
        try:
            cj = json.load(open(c_log_path))
            c_ref["proxy_rmse"] = cj["proxy_rmse_per_model"]
            c_ref["blend_rmse"] = cj["blend"]["blend_rmse"]
            c_ref["weights"] = cj["blend"]["weights"]
            c_ref["rounds_final"] = cj["rounds_final"]
            c_ref["pred_mean"] = cj["submission"]["pred_mean"]
            c_ref["v1_mean"] = cj["vs_v1"]["v1_mean"]
            tlog("loaded C reference numbers from approach_C_log.json")
        except Exception as e:
            tlog(f"could not parse approach_C_log.json ({e}); using fallback constants")
    log["c_reference"] = c_ref

    tlog(f"config: N_SEEDS={N_SEEDS} seeds={SEEDS} folds={NFOLDS} daytime=[{DAY_LO},{DAY_HI}]")
    tlog(f"COMBINED feature set = {len(FEATS)} feats (v1 32 + {EXTRA_FEATS})")

    train = F.add_base_features(pd.read_csv(os.path.join(DATA, "train.csv")))
    test = F.add_base_features(pd.read_csv(os.path.join(DATA, "test.csv")))
    d48 = train[train.day == 48].copy().reset_index(drop=True)
    d49 = train[train.day == 49].copy().reset_index(drop=True)
    tlog(f"rows: day48={len(d48)} day49-train={len(d49)} test={len(test)}")

    # --------------------------------------------------- daytime proxy split
    day_mask = (d48["tod"] >= DAY_LO) & (d48["tod"] <= DAY_HI)
    dday = d48[day_mask].copy().reset_index(drop=True)
    dnight = d48[~day_mask].copy().reset_index(drop=True)
    y_day = dday[TARGET].values
    tlog(f"day-48 daytime rows={len(dday)} (proxy target)  non-daytime rows={len(dnight)} (always train)")
    log["proxy"] = {"daytime_rows": int(len(dday)), "nondaytime_rows": int(len(dnight)),
                    "folds": NFOLDS, "daytime_window_min": [DAY_LO, DAY_HI]}

    kf = KFold(n_splits=NFOLDS, shuffle=True, random_state=SEED)
    folds = list(kf.split(dday))

    model_keys = ["lgb_v1", "cat", "xgb"]
    oof = {k: np.zeros(len(dday)) for k in model_keys}
    iters = {k: [] for k in model_keys}

    tlog("=== DAYTIME PROXY: 5-fold OOF on COMBINED feature set (warm stats, no geo_tod lag) ===")
    for k, (tri, vai) in enumerate(folds):
        tr = pd.concat([dnight, dday.iloc[tri]], ignore_index=True)
        va = dday.iloc[vai]
        he = HistoryEncoderE().fit(tr)                # road_tod/lanes_tod fit on fold-train ONLY
        tr_e = he.transform(tr, use_geo_tod=False)
        va_e = he.transform(va, use_geo_tod=False)
        ytr = tr_e[TARGET].values
        yva = va_e[TARGET].values
        tlog(f"  fold{k}: tr={len(tr)} va={len(va)} -- fitting models...")

        # LightGBM (v1 params)
        Xtr_l, Xva_l = cast_lgb(tr_e), cast_lgb(va_e)
        _, it1, (p1,) = fit_lgb(Xtr_l, ytr, Xva_l, yva, [Xva_l])
        oof["lgb_v1"][vai] = p1
        iters["lgb_v1"].append(it1)
        tlog(f"    fold{k} lgb_v1 done rmse={rmse(yva, p1):.5f} it={it1}")

        # CatBoost
        Xtr_c, Xva_c = prep_cat(tr_e), prep_cat(va_e)
        _, itc, (pc,) = fit_cat(Xtr_c, ytr, Xva_c, yva, [Xva_c])
        oof["cat"][vai] = pc
        iters["cat"].append(itc)
        tlog(f"    fold{k} cat    done rmse={rmse(yva, pc):.5f} it={itc}")

        # XGBoost (geohash dropped)
        Xtr_x, Xva_x = prep_xgb(tr_e), prep_xgb(va_e)
        _, itx, (px,) = fit_xgb(Xtr_x, ytr, Xva_x, yva, [Xva_x])
        oof["xgb"][vai] = px
        iters["xgb"].append(itx)
        tlog(f"    fold{k} xgb    done rmse={rmse(yva, px):.5f} it={itx}")

        tlog(f"  fold{k} SUMMARY: lgb_v1={rmse(yva, p1):.5f} cat={rmse(yva, pc):.5f} xgb={rmse(yva, px):.5f}")

    proxy_rmse = {k: rmse(y_day, oof[k]) for k in model_keys}
    avg_iter = {k: int(np.mean(iters[k])) for k in model_keys}
    cref_pr = c_ref["proxy_rmse"]
    tlog("=== daytime-proxy OOF RMSE on COMBINED features (vs C's v1-feature numbers) ===")
    for k in model_keys:
        cv = cref_pr.get(k, float("nan"))
        tlog(f"  {k:9s}  E={proxy_rmse[k]:.6f}  C={cv:.6f}  delta={proxy_rmse[k]-cv:+.6f}")
    log["proxy_rmse_per_model"] = proxy_rmse
    log["proxy_avg_best_iter"] = avg_iter
    log["proxy_delta_vs_C"] = {k: proxy_rmse[k] - cref_pr.get(k, float("nan")) for k in model_keys}

    # ------------------------------------------------ gated blend on proxy
    blend_keys = ["lgb_v1", "cat", "xgb"]
    P = np.vstack([oof[k] for k in blend_keys])
    single = {k: proxy_rmse[k] for k in blend_keys}
    bi = int(np.argmin([single[k] for k in blend_keys]))
    best_single_key = blend_keys[bi]
    best_single_rmse = single[best_single_key]

    rng = np.random.default_rng(SEED)
    n = len(blend_keys)
    best_w = np.eye(n)[bi].copy()
    best_r = best_single_rmse
    for _ in range(60000):
        w = rng.dirichlet(np.ones(n))
        r = rmse(y_day, w @ P)
        if r < best_r:
            best_r, best_w = r, w
    # coordinate polish around the best
    for _ in range(4000):
        w = best_w + rng.normal(0, 0.03, n)
        w = np.clip(w, 0, None)
        s = w.sum()
        if s <= 0:
            continue
        w = w / s
        r = rmse(y_day, w @ P)
        if r < best_r:
            best_r, best_w = r, w

    accepted = best_r < best_single_rmse - 1e-9
    if not accepted:
        best_w = np.eye(n)[bi].copy()
        chosen_r = best_single_rmse
        tlog(f"BLEND REJECTED: best blend {best_r:.6f} did not beat best single "
             f"{best_single_key}={best_single_rmse:.6f} -> fall back to single model")
    else:
        chosen_r = best_r
        tlog(f"BLEND ACCEPTED: {best_r:.6f} < best single {best_single_key}={best_single_rmse:.6f}")
    weights = {blend_keys[i]: float(best_w[i]) for i in range(n)}
    tlog(f"chosen weights: {json.dumps({k: round(v, 4) for k, v in weights.items()})}")
    tlog(f"blend proxy RMSE: E={best_r:.6f}  C={c_ref['blend_rmse']:.6f}  "
         f"delta={best_r - c_ref['blend_rmse']:+.6f}")
    log["blend"] = {
        "models": blend_keys,
        "single_rmse": {k: single[k] for k in blend_keys},
        "best_single": {"model": best_single_key, "rmse": best_single_rmse},
        "blend_rmse": best_r,
        "accepted": bool(accepted),
        "chosen_rmse": chosen_r,
        "weights": weights,
        "blend_delta_vs_C": best_r - c_ref["blend_rmse"],
    }

    # ===================================== ROUNDS CALIBRATION (lag-present CV-A)
    # The daytime proxy has NO day-over-day lag, so models keep improving to the cap
    # there; those rounds are NOT transferable. The real final fit DOES have the
    # dominant geo_tod lag and converges fast. So calibrate rounds in the REAL regime:
    # fit day48 (no lag) -> early-stop on day49 (real lag). Same protocol as v1/C.
    tlog("=== ROUNDS CALIBRATION: CV-A (day48 no-lag -> day49 real-lag) ===")
    he_a = HistoryEncoderE().fit(d48)
    trA = he_a.transform(d48, use_geo_tod=False)
    vaA = he_a.transform(d49, use_geo_tod=True)
    yA_tr, yA_va = trA[TARGET].values, vaA[TARGET].values

    cvA_iter, cvA_rmse = {}, {}
    _, itl, (pvl,) = fit_lgb(cast_lgb(trA), yA_tr, cast_lgb(vaA), yA_va, [cast_lgb(vaA)],
                             rounds=CALIB_MAX_ROUNDS)
    cvA_iter["lgb"], cvA_rmse["lgb"] = int(itl), rmse(yA_va, pvl)
    tlog(f"  CV-A lgb best_iter={itl} rmse={cvA_rmse['lgb']:.5f}")
    _, itcc, (pvc,) = fit_cat(prep_cat(trA), yA_tr, prep_cat(vaA), yA_va, [prep_cat(vaA)],
                              rounds=CALIB_MAX_ROUNDS)
    cvA_iter["cat"], cvA_rmse["cat"] = int(itcc), rmse(yA_va, pvc)
    tlog(f"  CV-A cat best_iter={itcc} rmse={cvA_rmse['cat']:.5f}")
    _, itxx, (pvx,) = fit_xgb(prep_xgb(trA), yA_tr, prep_xgb(vaA), yA_va, [prep_xgb(vaA)],
                              rounds=CALIB_MAX_ROUNDS)
    cvA_iter["xgb"], cvA_rmse["xgb"] = int(itxx), rmse(yA_va, pvx)
    tlog(f"  CV-A xgb best_iter={itxx} rmse={cvA_rmse['xgb']:.5f}")

    def _rounds(it):
        return int(np.clip(int(it * 1.1) + 50, 120, 800))

    rounds_final = {m: _rounds(cvA_iter[m]) for m in ("lgb", "cat", "xgb")}
    tlog(f"final rounds (lag-present CV-A calibrated): {rounds_final}  "
         f"(C used {c_ref['rounds_final']}; v1 used 217 LGBM)")
    log["cvA_calibration"] = {"best_iter": cvA_iter, "rmse": cvA_rmse}
    log["rounds_final"] = rounds_final

    # ============================================ FINAL FIT (real lag) + SUBMIT
    tlog(f"=== FINAL: fit day48+day49 (real geo_tod lag), seed-avg x{N_SEEDS}, predict test ===")
    he_f = HistoryEncoderE().fit(d48)
    d48_e = he_f.transform(d48, use_geo_tod=False)        # day48: no prior day
    d49_e = he_f.transform(d49, use_geo_tod=True)         # day49: day48 lag
    test_e = he_f.transform(test, use_geo_tod=True)        # test:  day48 lag
    full = pd.concat([d48_e, d49_e], ignore_index=True)
    yf = full[TARGET].values

    Xf_l, Xte_l = cast_lgb(full), cast_lgb(test_e)
    Xf_c, Xte_c = prep_cat(full), prep_cat(test_e)
    Xf_x, Xte_x = prep_xgb(full), prep_xgb(test_e)

    test_preds = {}

    pl = np.zeros(len(test))
    for j, s in enumerate(SEEDS):
        _, _, (pt,) = fit_lgb(Xf_l, yf, None, None, [Xte_l], seed=s, rounds=rounds_final["lgb"])
        pl += pt / len(SEEDS)
        tlog(f"    LGBM seed {j + 1}/{len(SEEDS)} done")
    test_preds["lgb_v1"] = pl
    tlog(f"  LGBM final done (rounds={rounds_final['lgb']}) mean={pl.mean():.5f}")

    pc = np.zeros(len(test))
    for j, s in enumerate(SEEDS):
        _, _, (pt,) = fit_cat(Xf_c, yf, None, None, [Xte_c], seed=s, rounds=rounds_final["cat"])
        pc += pt / len(SEEDS)
        tlog(f"    CatBoost seed {j + 1}/{len(SEEDS)} done")
    test_preds["cat"] = pc
    tlog(f"  CatBoost final done (rounds={rounds_final['cat']}) mean={pc.mean():.5f}")

    px = np.zeros(len(test))
    for j, s in enumerate(SEEDS):
        _, _, (pt,) = fit_xgb(Xf_x, yf, None, None, [Xte_x], seed=s, rounds=rounds_final["xgb"])
        px += pt / len(SEEDS)
        tlog(f"    XGBoost seed {j + 1}/{len(SEEDS)} done")
    test_preds["xgb"] = px
    tlog(f"  XGBoost final done (rounds={rounds_final['xgb']}) mean={px.mean():.5f}")

    ptest = np.zeros(len(test))
    for i, key in enumerate(blend_keys):
        ptest += best_w[i] * test_preds[key]
    ptest = np.clip(ptest, 0, 1)

    sub = pd.DataFrame({"Index": test["Index"].values, "demand": ptest})
    sub_path = os.path.join(SUB, "submission_E.csv")
    sub.to_csv(sub_path, index=False)
    tlog(f"wrote {sub_path} rows={len(sub)}")
    tlog(f"pred: min={ptest.min():.4f} mean={ptest.mean():.5f} max={ptest.max():.4f} "
         f"(train mean={yf.mean():.4f}; C mean={c_ref['pred_mean']:.5f}; v1 mean={c_ref['v1_mean']:.5f})")
    log["submission"] = {"rows": int(len(sub)), "pred_mean": float(ptest.mean()),
                         "pred_min": float(ptest.min()), "pred_max": float(ptest.max())}

    # ------------------------------------------------ compare vs C (91.186) and v1
    cmp = {}
    for label, fname in [("C", "submission_C.csv"), ("v1", "submission_lgbm.csv")]:
        p = os.path.join(SUB, fname)
        if not os.path.exists(p):
            tlog(f"{fname} not found -- skipping {label} comparison")
            continue
        ref = pd.read_csv(p).set_index("Index")["demand"].reindex(sub["Index"].values).values
        corr = float(np.corrcoef(ref, ptest)[0, 1])
        mean_diff = float(ptest.mean() - np.mean(ref))
        mad = float(np.mean(np.abs(ptest - ref)))
        cmp[label] = {"corr": corr, "mean_diff": mean_diff, "mean_abs_diff": mad,
                      "ref_mean": float(np.mean(ref))}
        tlog(f"vs {label}({fname}): corr={corr:.5f} {label}_mean={np.mean(ref):.5f} "
             f"E_mean={ptest.mean():.5f} mean_diff={mean_diff:+.5f} mean_abs_diff={mad:.5f}")
    log["vs_others"] = cmp

    # =================================== BACKUP CANDIDATE: 50/50 B+C average
    tlog("=== BACKUP: 50/50 average of submission_B.csv + submission_C.csv ===")
    bc = {}
    pB_path = os.path.join(SUB, "submission_B.csv")
    pC_path = os.path.join(SUB, "submission_C.csv")
    if os.path.exists(pB_path) and os.path.exists(pC_path):
        dfB = pd.read_csv(pB_path).rename(columns={"demand": "B"})
        dfC = pd.read_csv(pC_path).rename(columns={"demand": "C"})
        m = dfB.merge(dfC, on="Index")
        avg = np.clip(0.5 * m["B"].values + 0.5 * m["C"].values, 0, 1)
        bc_sub = pd.DataFrame({"Index": m["Index"].values, "demand": avg})
        bc_path = os.path.join(SUB, "submission_BC.csv")
        bc_sub.to_csv(bc_path, index=False)
        corr_bc = float(np.corrcoef(m["B"].values, m["C"].values)[0, 1])
        # correlation structure of the BC average vs its parents and vs E
        E_aligned = sub.set_index("Index")["demand"].reindex(m["Index"].values).values
        bc = {
            "rows": int(len(bc_sub)),
            "corr_B_C": corr_bc,
            "mean_B": float(m["B"].mean()), "mean_C": float(m["C"].mean()),
            "mean_BC": float(avg.mean()),
            "corr_BC_B": float(np.corrcoef(avg, m["B"].values)[0, 1]),
            "corr_BC_C": float(np.corrcoef(avg, m["C"].values)[0, 1]),
            "corr_BC_E": float(np.corrcoef(avg, E_aligned)[0, 1]),
        }
        tlog(f"wrote {bc_path} rows={len(bc_sub)}")
        tlog(f"  corr(B,C)={corr_bc:.5f} mean_B={bc['mean_B']:.5f} mean_C={bc['mean_C']:.5f} "
             f"mean_BC={bc['mean_BC']:.5f}")
        tlog(f"  corr(BC,B)={bc['corr_BC_B']:.5f} corr(BC,C)={bc['corr_BC_C']:.5f} "
             f"corr(BC,E)={bc['corr_BC_E']:.5f}")
    else:
        tlog("submission_B.csv / submission_C.csv missing -- skipping BC average")
    log["bc_average"] = bc

    with open(os.path.join(OUT, "approach_E_log.json"), "w") as f:
        json.dump(log, f, indent=2)

    write_report(log)
    tlog("SUMMARY:\n" + json.dumps(log, indent=2))
    tlog("[done]")


# ----------------------------------------------------------------- report.md
def write_report(log):
    pr = log["proxy_rmse_per_model"]
    dC = log["proxy_delta_vs_C"]
    bl = log["blend"]
    sub = log["submission"]
    cmp = log.get("vs_others", {})
    rf = log["rounds_final"]
    cref = log["c_reference"]
    ca = log.get("cvA_calibration", {})
    ci, cr = ca.get("best_iter", {}), ca.get("rmse", {})
    bc = log.get("bc_average", {})

    def f6(x):
        return f"{x:.6f}" if isinstance(x, (int, float)) else str(x)

    L = []
    A = L.append
    A("# Approach E -- STACK the two validated gains (B's features + C's blend)\n")
    A("## TL;DR\n")
    A(f"- Combined feature set = **v1 (32) + `road_tod_mean` + `lanes_tod_mean`** "
      f"({len(FEATS)} features), run through C's exact pipeline (same daytime proxy, "
      "same 3 diverse models, same gated blend, same lag-present CV-A rounds, "
      f"same {N_SEEDS}-seed average).")
    A(f"- **Daytime-proxy blend RMSE: E = `{f6(bl['blend_rmse'])}` vs C `{f6(cref['blend_rmse'])}` "
      f"(delta `{bl['blend_delta_vs_C']:+.6f}`)** -- "
      f"{'E IMPROVES on C' if bl['blend_delta_vs_C'] < 0 else 'E does NOT beat C'} on the proxy.")
    A(f"- Chosen blend weights: " +
      ", ".join(f"`{k}={v:.4f}`" for k, v in bl["weights"].items()) +
      f" (C: " + ", ".join(f"{k}={cref['weights'].get(k, float('nan')):.4f}" for k in bl["weights"]) + ").")
    if "C" in cmp:
        A(f"- submission_E vs submission_C (LB 91.186): corr `{cmp['C']['corr']:.5f}`, "
          f"mean diff `{cmp['C']['mean_diff']:+.5f}`.")
    A(f"- Prediction mean: E `{sub['pred_mean']:.5f}` (C `{cref['pred_mean']:.5f}`, v1 `{cref['v1_mean']:.5f}`).")
    A("")

    A("## 1. Combined-feature daytime-proxy RMSE (vs C's v1-feature numbers)\n")
    A("Identical machinery to Approach C; the ONLY change is the two added features, "
      "so any delta is attributable to B's features in the ensemble setting. "
      "`road_tod_mean` / `lanes_tod_mean` are smoothed (k=10) target means per "
      "(RoadType,tod) / (NumberofLanes,tod), fit leakage-free on each fold's train "
      "reference only (held-out rows never contribute), exactly as in Approach B.\n")
    A("| Model | E proxy RMSE (combined) | C proxy RMSE (v1 feats) | delta (E - C) |")
    A("|---|---|---|---|")
    for k in ["lgb_v1", "cat", "xgb"]:
        A(f"| {k} | {f6(pr[k])} | {f6(cref['proxy_rmse'].get(k, float('nan')))} | {dC[k]:+.6f} |")
    A(f"| **blend** | **{f6(bl['blend_rmse'])}** | **{f6(cref['blend_rmse'])}** | "
      f"**{bl['blend_delta_vs_C']:+.6f}** |")
    A("\n(C's reference: lgb_v1 0.029589, xgb 0.029383, cat 0.031161, blend 0.029201.)\n")

    A("## 2. Gated blend\n")
    A("Non-negative weights summing to 1, chosen to minimize the daytime-proxy RMSE "
      "(Dirichlet random search + coordinate polish). Accepted only if it beats the "
      "best single model on the proxy.\n")
    A("| Model | single proxy RMSE | blend weight |")
    A("|---|---|---|")
    for k in bl["models"]:
        A(f"| {k} | {f6(bl['single_rmse'][k])} | {bl['weights'][k]:.4f} |")
    A(f"\n- best single model: **{bl['best_single']['model']}** (RMSE {f6(bl['best_single']['rmse'])})")
    A(f"- best blend RMSE: **{f6(bl['blend_rmse'])}** (accepted: **{bl['accepted']}**)\n")

    A("## 3. Final rounds -- lag-present CV-A calibration\n")
    A("The proxy has no day-over-day `geo_tod` lag, so its rounds are inflated and NOT "
      "transferable. Final rounds are calibrated in the real regime (fit day48 no-lag, "
      "early-stop on day49 with the real lag) -- the same protocol that produced v1 "
      "(217 LGBM rounds, LB 90.791) and Approach C.\n")
    if ci:
        A("| Model | CV-A best_iter (lag) | CV-A RMSE | E final rounds | C final rounds |")
        A("|---|---|---|---|---|")
        A(f"| LightGBM | {ci.get('lgb','?')} | {cr.get('lgb',float('nan')):.5f} | {rf['lgb']} | {cref['rounds_final'].get('lgb','?')} |")
        A(f"| CatBoost | {ci.get('cat','?')} | {cr.get('cat',float('nan')):.5f} | {rf['cat']} | {cref['rounds_final'].get('cat','?')} |")
        A(f"| XGBoost | {ci.get('xgb','?')} | {cr.get('xgb',float('nan')):.5f} | {rf['xgb']} | {cref['rounds_final'].get('xgb','?')} |")
    A("")

    A("## 4. Final submission (`submissions/submission_E.csv`)\n")
    A(f"- rows: **{sub['rows']}**; pred min/mean/max = "
      f"{sub['pred_min']:.4f} / **{sub['pred_mean']:.5f}** / {sub['pred_max']:.4f}.")
    A(f"- C mean {cref['pred_mean']:.5f}; v1 mean {cref['v1_mean']:.5f}.")
    if "C" in cmp:
        A(f"- vs submission_C (LB 91.186): corr **{cmp['C']['corr']:.5f}**, "
          f"mean diff **{cmp['C']['mean_diff']:+.5f}**, mean abs diff {cmp['C']['mean_abs_diff']:.5f}.")
    if "v1" in cmp:
        A(f"- vs v1 (LB 90.791): corr **{cmp['v1']['corr']:.5f}**, "
          f"mean diff **{cmp['v1']['mean_diff']:+.5f}**, mean abs diff {cmp['v1']['mean_abs_diff']:.5f}.")
    A("")

    A("## 5. Backup candidate (`submissions/submission_BC.csv`)\n")
    if bc:
        A(f"- 50/50 average of submission_B + submission_C ({bc['rows']} rows), clipped [0,1].")
        A(f"- corr(B,C) = **{bc['corr_B_C']:.5f}** (means: B {bc['mean_B']:.5f}, C {bc['mean_C']:.5f}, "
          f"BC {bc['mean_BC']:.5f}).")
        A(f"- corr(BC,B) {bc['corr_BC_B']:.5f}, corr(BC,C) {bc['corr_BC_C']:.5f}, "
          f"corr(BC,E) {bc['corr_BC_E']:.5f}.")
        A("- This is a cheap diversification of the two best validated files; it is a "
          "BACKUP, not the main deliverable.\n")
    else:
        A("- (skipped: submission_B.csv / submission_C.csv not both present)\n")

    A("## 6. Honest verdict on beating 91.186\n")
    delta = bl["blend_delta_vs_C"]
    corrC = cmp.get("C", {}).get("corr")
    if delta < -1e-5:
        A(f"On the daytime proxy -- the only offline signal that has tracked the "
          f"leaderboard so far -- E's blend ({f6(bl['blend_rmse'])}) beats C's "
          f"({f6(cref['blend_rmse'])}) by {delta:+.6f}. B's two features stacked on top of "
          "C's model diversity give an ADDITIVE proxy gain, so E is the best-justified "
          "candidate to beat 91.186.")
        A(f"\n**Caveats (honest):** the proxy cannot exercise the dominant day-over-day "
          "`geo_tod` lag (no day-47), so it is pessimistic in absolute RMSE and the gain "
          "may compress on the real (lag-present) test. The added features are a refinement "
          f"of the same signal C already uses{(' (corr E vs C ' + format(corrC, '.4f') + ')') if corrC is not None else ''}, "
          "so expect an improvement on the order of B's proxy gain, not a regime change.")
        A("\n**Recommendation:** submit **`submission_E.csv`** as the primary attempt to "
          "beat 91.186. If a second slot is available, submit **`submission_BC.csv`** as a "
          "low-variance backup; keep `submission_C.csv` (91.186) as the safe fallback.\n")
    else:
        A(f"On the daytime proxy, E's blend ({f6(bl['blend_rmse'])}) did NOT beat C's "
          f"({f6(cref['blend_rmse'])}) (delta {delta:+.6f}). Adding B's features did not "
          "produce an additive gain in the ensemble setting (the blend already captures "
          "much of the same signal).")
        A(f"\n**Recommendation:** the safer primary attempt remains **`submission_C.csv`** "
          "(91.186). Submit **`submission_BC.csv`** (50/50 B+C) as the diversification "
          "candidate; treat `submission_E.csv` as exploratory.\n")

    with open(os.path.join(OUT, "approach_E_report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))


if __name__ == "__main__":
    main()
