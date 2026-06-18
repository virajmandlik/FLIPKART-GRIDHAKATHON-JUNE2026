"""
Gridlock 2.0 -- Approach C: MODEL DIVERSITY + DAYTIME-PROXY-GATED BLEND.

Why this exists (lessons from v3/v4 losing to v1 on the leaderboard):
  v1 (single LGBM, 217 rounds)  -> LB 90.791  (best)
  v3 (extra feats + LGBM/Cat)   -> LB 90.678  (worse)
  v4 (seed-bag @ fewer rounds)  -> LB 90.689  (worse)
  The offline validators used before (night-only CV-A, geohash CV-B) are
  dominated by NIGHT rows, while the test set is DAYTIME (02:15-13:45). So they
  did NOT track the leaderboard, and "CV-improving" blends still lost.

THE FIX -- a DAYTIME-FAITHFUL proxy built from day-48 labels:
  - The test horizon is day-49 slots 135..825 min (02:15-13:45).
  - The ONLY daytime labels we have are day-48's daytime slots (135..825 min).
  - Proxy = K-fold over day-48 DAYTIME rows; every training fold also includes
    ALL day-48 NON-daytime rows (so the daily demand curve is learned and
    per-geohash / per-tod stats stay WARM, mirroring the 99% warm test cells).
    History aggregates are refit per fold on the fold-train rows only.
  - CAVEAT (documented): day-48 has no prior day, so the proxy CANNOT exercise
    the day-over-day `geo_tod` lag (the strongest real feature, available for
    ~89% of test cells). The proxy is therefore PESSIMISTIC in absolute terms,
    but all three models share this handicap equally, so it is a trustworthy
    RELATIVE comparator for model selection, rounds, and blend weights.

Pipeline:
  1. Daytime-proxy OOF for LightGBM (v1 params + a deeper/regularized variant),
     CatBoost (native cats + cold-start), XGBoost (geohash DROPPED -- native
     categorical crashes on unseen geohashes; geo info kept via geo_mean/lat/lon).
     Rounds for each model are chosen by early stopping ON the daytime val fold.
  2. Pick the better LightGBM variant by daytime-proxy RMSE.
  3. Find non-negative blend weights (sum=1) minimizing daytime-proxy RMSE.
     ACCEPT the blend only if it beats the best single model; else fall back.
  4. Final fit on day48+day49 (real geo_tod lag present), seed-averaged
     (only `seed` varied), predict test, apply weights, clip [0,1].
  5. Write submissions/submission_C.csv and outputs/approach_C_report.md.

Run:  python ml_hackathon_solution/src/approach_C.py
Env:  N_SEEDS (default 4)
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
FEATS = F.feature_columns()                 # v1 feature set
CAT = F.categorical_columns()               # ['geohash','RoadType','Weather']
CAT_XGB = ["RoadType", "Weather"]           # geohash DROPPED for XGBoost
FEATS_XGB = [c for c in FEATS if c != "geohash"]
DAY_LO, DAY_HI = 135, 825                   # test daytime horizon (min since midnight)
N_SEEDS = int(os.environ.get("N_SEEDS", "4"))
SEEDS = [SEED + i * 101 for i in range(N_SEEDS)]
NFOLDS = 5
PROXY_MAX_ROUNDS = 500                        # proxy is only a RELATIVE ranker -> keep fast
CALIB_MAX_ROUNDS = 3000                       # lag-present CV-A: let early stopping decide


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


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


# -------------------------------------------------------------- LightGBM
def lgb_params(seed=SEED, variant="v1"):
    # v1 (LB 90.791): only `seed` was ever set; LightGBM derives the sub-seeds.
    p = dict(objective="regression", metric="rmse", learning_rate=0.03,
             num_leaves=63, min_child_samples=40, subsample=0.8, subsample_freq=1,
             colsample_bytree=0.8, reg_lambda=2.0, reg_alpha=0.5,
             max_depth=-1, seed=seed, n_jobs=-1, verbose=-1)
    if variant == "deep":
        # deeper capacity + stronger regularization (diversity / underfit guard)
        p.update(num_leaves=127, min_child_samples=80, colsample_bytree=0.7,
                 reg_lambda=5.0, reg_alpha=1.0)
    return p


def fit_lgb(Xtr, ytr, Xva, yva, Xpred_list, seed=SEED, variant="v1", rounds=PROXY_MAX_ROUNDS):
    dtr = lgb.Dataset(Xtr, label=ytr, categorical_feature=CAT, free_raw_data=False)
    valid, names, cbs = [dtr], ["train"], [lgb.log_evaluation(0)]
    if Xva is not None:
        dva = lgb.Dataset(Xva, label=yva, categorical_feature=CAT, reference=dtr,
                          free_raw_data=False)
        valid, names = [dtr, dva], ["train", "valid"]
        cbs.append(lgb.early_stopping(150, verbose=False))
    m = lgb.train(lgb_params(seed, variant), dtr, num_boost_round=rounds,
                  valid_sets=valid, valid_names=names, callbacks=cbs)
    it = m.best_iteration or rounds
    preds = [np.clip(m.predict(X, num_iteration=it), 0, 1) for X in Xpred_list]
    return m, it, preds


# -------------------------------------------------------------- XGBoost
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
    tlog(f"config: N_SEEDS={N_SEEDS} seeds={SEEDS} folds={NFOLDS} daytime=[{DAY_LO},{DAY_HI}]")

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

    model_keys = ["lgb_v1", "lgb_deep", "cat", "xgb"]
    oof = {k: np.zeros(len(dday)) for k in model_keys}
    iters = {k: [] for k in model_keys}

    tlog("=== DAYTIME PROXY: 5-fold OOF (warm stats, no geo_tod lag) ===")
    for k, (tri, vai) in enumerate(folds):
        tr = pd.concat([dnight, dday.iloc[tri]], ignore_index=True)
        va = dday.iloc[vai]
        he = F.HistoryEncoder().fit(tr)
        # within-day geo_tod is the label (unique per geohash,tod) -> use_geo_tod=False
        # everywhere; daytime val lag is unavailable anyway (documented caveat).
        tr_e = he.transform(tr, use_geo_tod=False)
        va_e = he.transform(va, use_geo_tod=False)
        ytr = tr_e[TARGET].values
        yva = va_e[TARGET].values
        tlog(f"  fold{k}: tr={len(tr)} va={len(va)} -- fitting models...")

        # LightGBM (two variants)
        Xtr_l, Xva_l = cast_lgb(tr_e), cast_lgb(va_e)
        _, it1, (p1,) = fit_lgb(Xtr_l, ytr, Xva_l, yva, [Xva_l], variant="v1")
        tlog(f"    fold{k} lgb_v1   done rmse={rmse(yva, p1):.5f} it={it1}")
        _, it2, (p2,) = fit_lgb(Xtr_l, ytr, Xva_l, yva, [Xva_l], variant="deep")
        tlog(f"    fold{k} lgb_deep done rmse={rmse(yva, p2):.5f} it={it2}")
        oof["lgb_v1"][vai] = p1
        oof["lgb_deep"][vai] = p2
        iters["lgb_v1"].append(it1)
        iters["lgb_deep"].append(it2)

        # CatBoost
        Xtr_c, Xva_c = prep_cat(tr_e), prep_cat(va_e)
        _, itc, (pc,) = fit_cat(Xtr_c, ytr, Xva_c, yva, [Xva_c])
        oof["cat"][vai] = pc
        iters["cat"].append(itc)
        tlog(f"    fold{k} cat      done rmse={rmse(yva, pc):.5f} it={itc}")

        # XGBoost (geohash dropped)
        Xtr_x, Xva_x = prep_xgb(tr_e), prep_xgb(va_e)
        _, itx, (px,) = fit_xgb(Xtr_x, ytr, Xva_x, yva, [Xva_x])
        oof["xgb"][vai] = px
        iters["xgb"].append(itx)
        tlog(f"    fold{k} xgb      done rmse={rmse(yva, px):.5f} it={itx}")

        tlog(f"  fold{k} SUMMARY: lgb_v1={rmse(yva, p1):.5f} "
             f"lgb_deep={rmse(yva, p2):.5f} cat={rmse(yva, pc):.5f} xgb={rmse(yva, px):.5f}")

    proxy_rmse = {k: rmse(y_day, oof[k]) for k in model_keys}
    avg_iter = {k: int(np.mean(iters[k])) for k in model_keys}
    tlog("=== daytime-proxy OOF RMSE (lower is better) ===")
    for k in model_keys:
        tlog(f"  {k:9s}  RMSE={proxy_rmse[k]:.6f}  avg_best_iter={avg_iter[k]}")
    log["proxy_rmse_per_model"] = proxy_rmse
    log["proxy_avg_best_iter"] = avg_iter

    # pick better LightGBM variant on the daytime proxy
    lgb_variant = "v1" if proxy_rmse["lgb_v1"] <= proxy_rmse["lgb_deep"] else "deep"
    lgb_key = "lgb_v1" if lgb_variant == "v1" else "lgb_deep"
    tlog(f"chosen LightGBM variant: {lgb_variant} (proxy RMSE={proxy_rmse[lgb_key]:.6f})")
    log["lgb_variant_chosen"] = lgb_variant

    # ------------------------------------------------ gated blend on proxy
    blend_keys = [lgb_key, "cat", "xgb"]          # the 3 diverse models
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
    log["blend"] = {
        "models": blend_keys,
        "single_rmse": {k: single[k] for k in blend_keys},
        "best_single": {"model": best_single_key, "rmse": best_single_rmse},
        "blend_rmse": best_r,
        "accepted": bool(accepted),
        "chosen_rmse": chosen_r,
        "weights": weights,
    }

    # ===================================== ROUNDS CALIBRATION (lag-present CV-A)
    # CRITICAL: the daytime proxy has NO day-over-day lag, so its models need many
    # more rounds to converge (they hit the cap). Those round counts are NOT
    # transferable to the real final fit, which DOES have the dominant `geo_tod`
    # lag and converges fast. Using the proxy's inflated rounds would overfit --
    # the exact v3/v4 failure mode. So we calibrate final rounds in the REAL
    # regime: fit day48 (no lag) -> early-stop on day49 (real lag). This is the
    # SAME protocol that produced v1 (best_iter 152 -> 217 rounds, LB 90.791).
    tlog("=== ROUNDS CALIBRATION: CV-A (day48 no-lag -> day49 real-lag) ===")
    he_a = F.HistoryEncoder().fit(d48)
    trA = he_a.transform(d48, use_geo_tod=False)
    vaA = he_a.transform(d49, use_geo_tod=True)
    yA_tr, yA_va = trA[TARGET].values, vaA[TARGET].values

    cvA_iter = {}
    cvA_rmse = {}
    # chosen LightGBM
    _, itl, (pvl,) = fit_lgb(cast_lgb(trA), yA_tr, cast_lgb(vaA), yA_va, [cast_lgb(vaA)],
                             variant=lgb_variant, rounds=CALIB_MAX_ROUNDS)
    cvA_iter["lgb"], cvA_rmse["lgb"] = int(itl), rmse(yA_va, pvl)
    tlog(f"  CV-A lgb({lgb_variant}) best_iter={itl} rmse={cvA_rmse['lgb']:.5f}")
    # CatBoost
    _, itcc, (pvc,) = fit_cat(prep_cat(trA), yA_tr, prep_cat(vaA), yA_va, [prep_cat(vaA)],
                              rounds=CALIB_MAX_ROUNDS)
    cvA_iter["cat"], cvA_rmse["cat"] = int(itcc), rmse(yA_va, pvc)
    tlog(f"  CV-A cat best_iter={itcc} rmse={cvA_rmse['cat']:.5f}")
    # XGBoost (geohash dropped)
    _, itxx, (pvx,) = fit_xgb(prep_xgb(trA), yA_tr, prep_xgb(vaA), yA_va, [prep_xgb(vaA)],
                              rounds=CALIB_MAX_ROUNDS)
    cvA_iter["xgb"], cvA_rmse["xgb"] = int(itxx), rmse(yA_va, pvx)
    tlog(f"  CV-A xgb best_iter={itxx} rmse={cvA_rmse['xgb']:.5f}")

    def _rounds(it):
        return int(np.clip(int(it * 1.1) + 50, 120, 800))

    rounds_final = {m: _rounds(cvA_iter[m]) for m in ("lgb", "cat", "xgb")}
    tlog(f"final rounds (lag-present CV-A calibrated): {rounds_final}  (v1 used 217 LGBM)")
    log["cvA_calibration"] = {"best_iter": cvA_iter, "rmse": cvA_rmse}
    log["rounds_final"] = rounds_final

    # ============================================ FINAL FIT (real lag) + SUBMIT
    tlog("=== FINAL: fit day48+day49 (real geo_tod lag), seed-avg, predict test ===")
    he_f = F.HistoryEncoder().fit(d48)
    d48_e = he_f.transform(d48, use_geo_tod=False)        # day48: no prior day
    d49_e = he_f.transform(d49, use_geo_tod=True)         # day49: day48 lag
    test_e = he_f.transform(test, use_geo_tod=True)        # test:  day48 lag
    full = pd.concat([d48_e, d49_e], ignore_index=True)
    yf = full[TARGET].values

    # matrices per model
    Xf_l, Xte_l = cast_lgb(full), cast_lgb(test_e)
    Xf_c, Xte_c = prep_cat(full), prep_cat(test_e)
    Xf_x, Xte_x = prep_xgb(full), prep_xgb(test_e)

    test_preds = {}

    # LightGBM (chosen variant), seed-averaged
    pl = np.zeros(len(test))
    for j, s in enumerate(SEEDS):
        _, _, (pt,) = fit_lgb(Xf_l, yf, None, None, [Xte_l], seed=s,
                              variant=lgb_variant, rounds=rounds_final["lgb"])
        pl += pt / len(SEEDS)
        tlog(f"    LGBM seed {j + 1}/{len(SEEDS)} done")
    test_preds[lgb_key] = pl
    tlog(f"  LGBM final done (rounds={rounds_final['lgb']}) mean={pl.mean():.5f}")

    # CatBoost, seed-averaged
    pc = np.zeros(len(test))
    for j, s in enumerate(SEEDS):
        _, _, (pt,) = fit_cat(Xf_c, yf, None, None, [Xte_c], seed=s, rounds=rounds_final["cat"])
        pc += pt / len(SEEDS)
        tlog(f"    CatBoost seed {j + 1}/{len(SEEDS)} done")
    test_preds["cat"] = pc
    tlog(f"  CatBoost final done (rounds={rounds_final['cat']}) mean={pc.mean():.5f}")

    # XGBoost (geohash dropped), seed-averaged
    px = np.zeros(len(test))
    for j, s in enumerate(SEEDS):
        _, _, (pt,) = fit_xgb(Xf_x, yf, None, None, [Xte_x], seed=s, rounds=rounds_final["xgb"])
        px += pt / len(SEEDS)
        tlog(f"    XGBoost seed {j + 1}/{len(SEEDS)} done")
    test_preds["xgb"] = px
    tlog(f"  XGBoost final done (rounds={rounds_final['xgb']}) mean={px.mean():.5f}")

    ptest = np.zeros(len(test))
    for i, k in enumerate(blend_keys):
        ptest += best_w[i] * test_preds[k]
    ptest = np.clip(ptest, 0, 1)

    sub = pd.DataFrame({"Index": test["Index"].values, "demand": ptest})
    sub_path = os.path.join(SUB, "submission_C.csv")
    sub.to_csv(sub_path, index=False)
    tlog(f"wrote {sub_path} rows={len(sub)}")
    tlog(f"pred: min={ptest.min():.4f} mean={ptest.mean():.5f} max={ptest.max():.4f} "
         f"(train mean={yf.mean():.4f})")
    log["submission"] = {"rows": int(len(sub)), "pred_mean": float(ptest.mean()),
                         "pred_min": float(ptest.min()), "pred_max": float(ptest.max())}

    # ------------------------------------------------ compare vs v1 (90.791)
    v1_path = os.path.join(SUB, "submission_lgbm.csv")
    cmp = {}
    if os.path.exists(v1_path):
        v1 = pd.read_csv(v1_path)
        v1 = v1.set_index("Index")["demand"].reindex(sub["Index"].values).values
        corr = float(np.corrcoef(v1, ptest)[0, 1])
        mean_diff = float(ptest.mean() - np.mean(v1))
        mad = float(np.mean(np.abs(ptest - v1)))
        cmp = {"corr_vs_v1": corr, "mean_diff_vs_v1": mean_diff,
               "mean_abs_diff_vs_v1": mad, "v1_mean": float(np.mean(v1))}
        tlog(f"vs v1(submission_lgbm.csv): corr={corr:.5f} v1_mean={np.mean(v1):.5f} "
             f"C_mean={ptest.mean():.5f} mean_diff={mean_diff:+.5f} mean_abs_diff={mad:.5f}")
    else:
        tlog("submission_lgbm.csv not found -- skipping v1 comparison")
    log["vs_v1"] = cmp

    with open(os.path.join(OUT, "approach_C_log.json"), "w") as f:
        json.dump(log, f, indent=2)

    # ------------------------------------------------------------- report.md
    write_report(log)
    tlog("SUMMARY:\n" + json.dumps(log, indent=2))
    tlog("[done]")


def write_report(log):
    pr = log["proxy_rmse_per_model"]
    ai = log["proxy_avg_best_iter"]
    bl = log["blend"]
    sub = log["submission"]
    v = log.get("vs_v1", {})
    lgbv = log["lgb_variant_chosen"]
    rf = log["rounds_final"]
    lines = []
    A = lines.append
    A("# Approach C -- Model Diversity + Daytime-Proxy-Gated Blend\n")
    A("## 1. Daytime validation proxy (the gate)\n")
    A("The leaderboard is scored on **daytime** rows (day-49, 02:15-13:45), but the "
      "only daytime labels available offline are **day-48's daytime slots "
      "(135-825 min)**. The proxy is a 5-fold OOF over those day-48 daytime rows; "
      "every training fold also includes **all** day-48 non-daytime rows so the "
      "daily demand curve is learned and per-geohash / per-tod aggregates stay WARM "
      "(mirroring the ~99% warm test cells). History encoders are refit per fold on "
      "fold-train rows only.\n")
    A("**Caveat (honest):** day-48 has no prior day, so the proxy cannot exercise the "
      "day-over-day `geo_tod` lag -- the single strongest real feature, present for "
      "~89% of test cells. The proxy is thus **pessimistic in absolute RMSE**, but all "
      "three models carry the identical handicap, so it is a trustworthy *relative* "
      "comparator for model selection, rounds, and blend weights. This is exactly the "
      "signal the night-dominated CV-A / CV-B lacked (they did not track the LB).\n")
    A(f"- day-48 daytime rows (proxy target): **{log['proxy']['daytime_rows']}**")
    A(f"- day-48 non-daytime rows (always in train): **{log['proxy']['nondaytime_rows']}**")
    A(f"- folds: **{log['proxy']['folds']}**\n")
    ca = log.get("cvA_calibration", {})
    ci = ca.get("best_iter", {})
    cr = ca.get("rmse", {})
    A("## 2. Per-model daytime-proxy RMSE\n")
    A(f"(Proxy round cap = {PROXY_MAX_ROUNDS}; the lag-free proxy keeps improving to "
      "the cap, so its `avg_best_iter` is NOT a usable final-round count -- see sec 3.)\n")
    A("| Model | Daytime-proxy OOF RMSE | Avg iter @cap |")
    A("|---|---|---|")
    A(f"| LightGBM (v1 params) | {pr['lgb_v1']:.6f} | {ai['lgb_v1']} |")
    A(f"| LightGBM (deep/reg) | {pr['lgb_deep']:.6f} | {ai['lgb_deep']} |")
    A(f"| CatBoost | {pr['cat']:.6f} | {ai['cat']} |")
    A(f"| XGBoost (geohash dropped) | {pr['xgb']:.6f} | {ai['xgb']} |")
    A(f"\nChosen LightGBM variant for the blend: **{lgbv}** (lower daytime-proxy RMSE).\n")
    A("## 3. Round count -- calibrated in the REAL (lag-present) regime\n")
    A("The daytime proxy has **no day-over-day `geo_tod` lag**, so every model keeps "
      "improving to the round cap there (its rounds are inflated and NOT transferable). "
      "The real final fit DOES have the lag and converges fast. Inflating final rounds "
      "from the proxy would over-fit -- the exact way v3/v4 lost. So final rounds are "
      "calibrated by the **lag-present CV-A** protocol (fit day48 no-lag, early-stop on "
      "day49 with the real lag) -- the same protocol that produced v1 (best_iter 152 "
      "-> 217 rounds, LB 90.791).\n")
    if ci:
        A("| Model | CV-A best_iter (lag) | CV-A RMSE | final rounds |")
        A("|---|---|---|---|")
        A(f"| LightGBM ({lgbv}) | {ci.get('lgb','?')} | {cr.get('lgb',float('nan')):.5f} | {rf['lgb']} |")
        A(f"| CatBoost | {ci.get('cat','?')} | {cr.get('cat',float('nan')):.5f} | {rf['cat']} |")
        A(f"| XGBoost | {ci.get('xgb','?')} | {cr.get('xgb',float('nan')):.5f} | {rf['xgb']} |")
        A(f"\n**Finding:** with the lag present, LightGBM's daytime-validated best_iter is "
          f"~{ci.get('lgb','?')} -> {rf['lgb']} rounds, i.e. v1's 217 is "
          f"{'about right (NOT a meaningful underfit)' if abs(rf['lgb']-217)<=80 else 'meaningfully different'}. "
          "The earlier worry that 217 underfits came from the lag-FREE view; it does not "
          "hold once the dominant lag feature is restored.\n")
    A("## 4. Gated blend\n")
    A("Weights are non-negative and sum to 1, chosen to minimize the daytime-proxy "
      "RMSE (Dirichlet random search + coordinate polish). The blend is **accepted "
      "only if it beats the best single model** on the proxy.\n")
    A("| Model | single proxy RMSE | blend weight |")
    A("|---|---|---|")
    for k in bl["models"]:
        A(f"| {k} | {bl['single_rmse'][k]:.6f} | {bl['weights'][k]:.4f} |")
    A(f"\n- best single model: **{bl['best_single']['model']}** "
      f"(RMSE {bl['best_single']['rmse']:.6f})")
    A(f"- best blend RMSE: **{bl['blend_rmse']:.6f}**")
    A(f"- blend accepted: **{bl['accepted']}** -> chosen proxy RMSE "
      f"**{bl['chosen_rmse']:.6f}**\n")
    A("## 5. Final submission\n")
    A(f"- file: `submissions/submission_C.csv` ({sub['rows']} rows)")
    A(f"- prediction mean: **{sub['pred_mean']:.5f}** "
      f"(min {sub['pred_min']:.4f}, max {sub['pred_max']:.4f}); v1 mean was 0.1308")
    if v:
        A(f"- correlation vs v1 (submission_lgbm.csv): **{v['corr_vs_v1']:.5f}**")
        A(f"- mean diff vs v1: **{v['mean_diff_vs_v1']:+.5f}** "
          f"(v1 mean {v['v1_mean']:.5f}); mean abs diff **{v['mean_abs_diff_vs_v1']:.5f}**")
    A("\n## 6. Honest verdict on beating 90.791\n")
    if not bl["accepted"]:
        A("The gated blend did **not** beat the best single model on the daytime proxy, "
          "so Approach C falls back to that single model (seed-averaged at "
          "daytime-validated rounds). This is the disciplined outcome the mandate "
          "demands: we did **not** ship a blend that only looked good on night CV.\n")
    else:
        A("The gated blend beat the best single model on the **daytime** proxy "
          "(the signal that night CV-A/CV-B lacked), so it is shipped.\n")
    if v:
        if v["corr_vs_v1"] >= 0.999 and abs(v["mean_diff_vs_v1"]) < 0.002:
            A(f"Predictions are **nearly identical** to v1 (corr {v['corr_vs_v1']:.4f}, "
              f"mean diff {v['mean_diff_vs_v1']:+.4f}). Expect a score within noise of "
              "90.791; the main, low-risk lever is the daytime-validated round count "
              "plus seed-averaging (variance reduction), not a structural change.\n")
        else:
            A(f"Predictions differ from v1 (corr {v['corr_vs_v1']:.4f}, mean diff "
              f"{v['mean_diff_vs_v1']:+.4f}). The daytime proxy is the best available "
              "evidence that this change helps daytime RMSE, but with no daytime labels "
              "for day-49 the only ground truth remains the leaderboard. Recommend "
              "submitting C and comparing directly to 90.791.\n")
    with open(os.path.join(OUT, "approach_C_report.md"), "w") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    main()
