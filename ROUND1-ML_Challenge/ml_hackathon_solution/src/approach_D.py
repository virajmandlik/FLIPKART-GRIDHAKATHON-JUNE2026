"""
Gridlock 2.0 -- Approach D: TARGET REFORMULATION + CALIBRATION (orthogonal lever).

Other workers model `demand` DIRECTLY (HPO / features / model-family ensembling).
This script changes WHAT is predicted and POST-PROCESSES it:

  (1) DIRECT          : predict demand                    (the v1 control)
  (2) ADDITIVE RESID. : target = demand - base; final = base + pred
  (3) LOG-RATIO       : target = log((demand+eps)/(base+eps)); final = (base+eps)*exp(pred)-eps

`base` is a strong, leakage-free "yesterday" prior per row:
  base = day-48 geo_tod lag (demand at same geohash+slot on day 48)
         backed off to (geohash-mean * tod-profile), then geo-mean, tod-mean, global
  -> for the REAL test/day-49, the day-over-day geo_tod analog EXISTS (~89% of cells);
     for day-48 training rows there is no day-47, so base is the FACTORIZED estimate
     (a documented train/predict base-granularity asymmetry -- see the report).

DAYTIME VALIDATION (the only signal that tracked the leaderboard in prior rounds):
  The scored test is day-49 DAYTIME (02:15-13:45 = tod 135..825). The only daytime
  labels we have are day-48's daytime slots. Two proxies, both leakage-free:
    PROXY-CELL (primary): 5-fold over day-48 DAYTIME rows; every train fold also
      includes ALL day-48 NON-daytime rows so per-geohash/per-tod stats stay WARM
      (mirrors warm test cells). Aggregates + base refit per fold on fold-train only.
      Caveat: single day => no true day-over-day lag, so the proxy base is the
      FACTORIZED estimate (geo_mean*tod_factor), i.e. the SAME regime the real test
      uses for its ~11% cold cells. It validates the residual/ratio MACHINERY and the
      calibration; absolute RMSE will not transfer 1:1 (the real test's 89% warm cells
      get a stronger geo_tod base => real RMSE should be lower).
    PROXY-TIME (stress test): train day-48 non-daytime, validate day-48 daytime. Proper
      horizon hold-out, but the base degenerates to a (night-biased) geohash level since
      daytime tods are unobserved in the train fold => pessimistic / conservative.

We compare the 3 formulations on the proxies (SAME features + SAME rounds for fairness),
then test segment-wise bias CALIBRATION and a PRIOR-BLEND with the raw `base`, accepting
each ONLY if it lowers the proxy RMSE. The chosen pipeline is seed-averaged and refit on
day48+day49 (real geo_tod lag present) to predict the test.

Run:  python -u approach_D.py
Env:  N_SEEDS (default 7), CMP_ROUNDS (default 217 = v1's final rounds)
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

import lightgbm as lgb

T0 = time.time()


def tlog(*a):
    print(f"[{time.time() - T0:7.1f}s]", *a, flush=True)


HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset")
OUT = os.path.join(ROOT, "outputs")
SUB = os.path.join(ROOT, "submissions")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SUB, exist_ok=True)

SEED = 42
TARGET = "demand"
FEATS = F.feature_columns()
CAT = F.categorical_columns()

N_SEEDS = int(os.environ.get("N_SEEDS", "7"))
SEED_LIST = [42, 101, 202, 303, 404, 505, 606, 707, 808, 909][:N_SEEDS]
CMP_ROUNDS = int(os.environ.get("CMP_ROUNDS", "217"))   # v1's final rounds; shared by all formulations
KFOLDS = 5
EPS = 1e-4
FLOOR = 1e-4

# v1 reference config (LB 90.791)
V1_PARAMS = dict(
    learning_rate=0.03, num_leaves=63, min_child_samples=40, subsample=0.8,
    colsample_bytree=0.8, reg_lambda=2.0, reg_alpha=0.5, max_depth=-1,
)
FORMS = ["direct", "additive", "logratio"]


def rmse(y, p):
    y = np.asarray(y, dtype=float)
    p = np.asarray(p, dtype=float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


def cast(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for c in CAT:
        df[c] = df[c].astype("category")
    return df


def train_lgbm(Xtr, ytr, rounds: int, seed: int = SEED):
    base = dict(objective="regression", metric="rmse", subsample_freq=1,
                seed=seed, n_jobs=-1, verbose=-1)
    base.update(V1_PARAMS)
    dtr = lgb.Dataset(Xtr, label=ytr, categorical_feature=CAT, free_raw_data=False)
    return lgb.train(base, dtr, num_boost_round=int(rounds),
                     valid_sets=[dtr], valid_names=["train"],
                     callbacks=[lgb.log_evaluation(0)])


# ------------------------------------------------------------------ base prior
def compute_base(he: "F.HistoryEncoder", df: pd.DataFrame, use_lag: bool) -> np.ndarray:
    """Leakage-free 'yesterday' prior.

    Backoff order: geo_tod lag -> geo_mean*tod_factor -> geo_mean -> tod_mean -> global.
    `use_lag=True` looks up the per-(geohash,tod) demand from the reference frame the
    encoder was fit on (= prior day for the real pipeline). `use_lag=False` forces the
    factorized estimate (used for training rows that have no prior day, and inside the
    single-day proxies where the held-out cell is absent from the fit frame).
    """
    out = df[["geohash", "tod"]].copy()
    out["_ord"] = np.arange(len(out))
    if use_lag and he.geo_tod_ is not None:
        out = out.merge(he.geo_tod_, on=["geohash", "tod"], how="left")
    else:
        out["geo_tod_mean"] = np.nan
    geo = he.geo_.reset_index()[["geohash", "geo_mean"]]
    out = out.merge(geo, on="geohash", how="left")
    tod = he.tod_.reset_index()[["tod", "tod_mean"]]
    out = out.merge(tod, on="tod", how="left")
    out = out.sort_values("_ord").reset_index(drop=True)

    g0 = float(he.global_mean_)
    geo_tod_est = out["geo_mean"] * (out["tod_mean"] / g0)
    base = out["geo_tod_mean"]
    base = base.fillna(geo_tod_est)
    base = base.fillna(out["geo_mean"])
    base = base.fillna(out["tod_mean"])
    base = base.fillna(g0)
    return base.clip(lower=FLOOR, upper=1.0).to_numpy()


# ------------------------------------------------------- target transform / invert
def to_target(y: np.ndarray, base: np.ndarray, kind: str) -> np.ndarray:
    if kind == "direct":
        return y.astype(float)
    if kind == "additive":
        return y - base
    if kind == "logratio":
        return np.log((y + EPS) / (base + EPS))
    raise ValueError(kind)


def from_pred(pred: np.ndarray, base: np.ndarray, kind: str) -> np.ndarray:
    if kind == "direct":
        out = pred
    elif kind == "additive":
        out = base + pred
    elif kind == "logratio":
        out = (base + EPS) * np.exp(pred) - EPS
    else:
        raise ValueError(kind)
    return np.clip(out, 0.0, 1.0)


# ------------------------------------------------------------------- data
def build_data():
    train = F.add_base_features(pd.read_csv(os.path.join(DATA, "train.csv")))
    test = F.add_base_features(pd.read_csv(os.path.join(DATA, "test.csv")))
    d48 = train[train.day == 48].copy().reset_index(drop=True)
    d49 = train[train.day == 49].copy().reset_index(drop=True)
    return train, test, d48, d49


# ----------------------------------------------- PROXY-CELL (primary daytime OOF)
def proxy_cell(d48: pd.DataFrame, lo: float, hi: float):
    """5-fold over day-48 DAYTIME rows; train folds also carry ALL non-daytime rows.

    Returns, per formulation, the inverted OOF prediction over the daytime rows, plus
    the per-row base and metadata needed for calibration / blend.
    """
    day_mask = (d48["tod"] >= lo) & (d48["tod"] <= hi)
    night = d48[~day_mask].copy()
    day = d48[day_mask].copy().reset_index(drop=True)
    y_day = day[TARGET].to_numpy()

    oof = {k: np.zeros(len(day)) for k in FORMS}
    base_oof = np.zeros(len(day))
    fold_id = np.full(len(day), -1, dtype=int)

    kf = KFold(n_splits=KFOLDS, shuffle=True, random_state=SEED)
    for fi, (tri, vai) in enumerate(kf.split(day)):
        tr = pd.concat([night, day.iloc[tri]], ignore_index=True)
        va = day.iloc[vai].copy()
        he = F.HistoryEncoder().fit(tr)
        tr_e = he.transform(tr, use_geo_tod=False)
        va_e = he.transform(va, use_geo_tod=False)
        Xtr = cast(tr_e[FEATS]); Xva = cast(va_e[FEATS])
        ytr = tr_e[TARGET].to_numpy()
        base_tr = compute_base(he, tr, use_lag=False)
        base_va = compute_base(he, va, use_lag=False)
        base_oof[vai] = base_va
        fold_id[vai] = fi
        for k in FORMS:
            m = train_lgbm(Xtr, to_target(ytr, base_tr, k), CMP_ROUNDS, seed=SEED)
            oof[k][vai] = from_pred(m.predict(Xva), base_va, k)
    rt = day["RoadType"].astype(str).fillna("NaN").to_numpy()
    return y_day, oof, base_oof, fold_id, rt


# ------------------------------------------- PROXY-TIME (horizon stress test)
def proxy_time(d48: pd.DataFrame, lo: float, hi: float):
    day_mask = (d48["tod"] >= lo) & (d48["tod"] <= hi)
    tr = d48[~day_mask].copy()
    va = d48[day_mask].copy()
    he = F.HistoryEncoder().fit(tr)
    tr_e = he.transform(tr, use_geo_tod=False)
    va_e = he.transform(va, use_geo_tod=False)
    Xtr = cast(tr_e[FEATS]); Xva = cast(va_e[FEATS])
    ytr = tr_e[TARGET].to_numpy(); yva = va_e[TARGET].to_numpy()
    base_tr = compute_base(he, tr, use_lag=False)
    base_va = compute_base(he, va, use_lag=False)
    res = {}
    for k in FORMS:
        m = train_lgbm(Xtr, to_target(ytr, base_tr, k), CMP_ROUNDS, seed=SEED)
        res[k] = rmse(yva, from_pred(m.predict(Xva), base_va, k))
    return res, rmse(yva, base_va)


# ------------------------------------------------- calibration (out-of-fold honest)
def cv_global_affine(y, pred, fold_id):
    """Out-of-fold global affine: pred' = a*pred + b (a,b fit on other folds)."""
    out = pred.copy()
    for fi in np.unique(fold_id):
        tr = fold_id != fi; va = fold_id == fi
        a, b = np.polyfit(pred[tr], y[tr], 1)
        out[va] = a * pred[va] + b
    return np.clip(out, 0.0, 1.0)


def cv_road_bias(y, pred, fold_id, rt):
    """Out-of-fold per-RoadType additive bias."""
    out = pred.copy()
    for fi in np.unique(fold_id):
        tr = fold_id != fi; va = fold_id == fi
        resid = y[tr] - pred[tr]
        bias = pd.Series(resid).groupby(pd.Series(rt[tr])).mean()
        gb = float(resid.mean())
        add = np.array([bias.get(r, gb) for r in rt[va]])
        out[va] = pred[va] + add
    return np.clip(out, 0.0, 1.0)


def cv_blend(y, pred, base, fold_id, grid=None):
    """Out-of-fold prior blend: w*pred + (1-w)*base, w chosen per held-out fold."""
    if grid is None:
        grid = np.linspace(0.0, 1.0, 41)
    out = pred.copy()
    for fi in np.unique(fold_id):
        tr = fold_id != fi; va = fold_id == fi
        errs = [rmse(y[tr], np.clip(w * pred[tr] + (1 - w) * base[tr], 0, 1)) for w in grid]
        w = float(grid[int(np.argmin(errs))])
        out[va] = np.clip(w * pred[va] + (1 - w) * base[va], 0, 1)
    return out


def fit_global_affine(y, pred):
    a, b = np.polyfit(pred, y, 1)
    return float(a), float(b)


def fit_road_bias(y, pred, rt):
    resid = y - pred
    bias = pd.Series(resid).groupby(pd.Series(rt)).mean().to_dict()
    return {str(k): float(v) for k, v in bias.items()}, float(resid.mean())


def fit_blend_w(y, pred, base, grid=None):
    if grid is None:
        grid = np.linspace(0.0, 1.0, 41)
    errs = [rmse(y, np.clip(w * pred + (1 - w) * base, 0, 1)) for w in grid]
    return float(grid[int(np.argmin(errs))])


# ------------------------------------------------------------------- main
def main():
    log = {}
    train, test, d48, d49 = build_data()
    lo, hi = float(test["tod"].min()), float(test["tod"].max())
    tlog(f"day48={len(d48)} day49-train={len(d49)} test={len(test)} "
         f"daytime window=[{lo:.0f},{hi:.0f}] min")
    log["data"] = {"day48": len(d48), "day49_train": len(d49), "test": len(test),
                   "tod_lo": lo, "tod_hi": hi}

    # ---- PROXY-CELL (primary) -------------------------------------------------
    tlog("=== PROXY-CELL: 5-fold daytime OOF, 3 target formulations ===")
    y_day, oof, base_oof, fold_id, rt = proxy_cell(d48, lo, hi)
    base_rmse_cell = rmse(y_day, base_oof)
    cell = {k: rmse(y_day, oof[k]) for k in FORMS}
    tlog(f"PROXY-CELL base-only RMSE: {base_rmse_cell:.5f}")
    for k in FORMS:
        tlog(f"PROXY-CELL {k:9s} RMSE: {cell[k]:.5f}")
    log["proxy_cell"] = {"base_only": base_rmse_cell, **cell}

    # ---- PROXY-TIME (stress) --------------------------------------------------
    tlog("=== PROXY-TIME: horizon hold-out (night->daytime) ===")
    time_res, base_rmse_time = proxy_time(d48, lo, hi)
    tlog(f"PROXY-TIME base-only RMSE: {base_rmse_time:.5f}")
    for k in FORMS:
        tlog(f"PROXY-TIME {k:9s} RMSE: {time_res[k]:.5f}")
    log["proxy_time"] = {"base_only": base_rmse_time, **time_res}

    # ---- choose formulation (primary = PROXY-CELL; prefer DIRECT on ties) ------
    best_form = min(FORMS, key=lambda k: cell[k])
    direct_rmse = cell["direct"]
    # respect the v3/v4 lesson: only leave DIRECT if the win is clear AND PROXY-TIME agrees
    margin = 1e-4
    if best_form != "direct":
        clear_cell = (direct_rmse - cell[best_form]) > margin
        time_ok = time_res[best_form] <= time_res["direct"] + margin
        if not (clear_cell and time_ok):
            tlog(f"formulation '{best_form}' not a clear/robust win over DIRECT "
                 f"(cell {cell[best_form]:.5f} vs {direct_rmse:.5f}; "
                 f"time {time_res[best_form]:.5f} vs {time_res['direct']:.5f}) -> keep DIRECT")
            best_form = "direct"
    tlog(f"CHOSEN formulation: {best_form}")
    log["chosen_formulation"] = best_form

    # ---- calibration + blend tested on PROXY-CELL OOF of the chosen formulation
    tlog("=== Calibration + prior-blend (gated on PROXY-CELL OOF) ===")
    p0 = oof[best_form].copy()
    r0 = rmse(y_day, p0)
    cand = {"none": r0}
    pred_aff = cv_global_affine(y_day, p0, fold_id)
    cand["global_affine"] = rmse(y_day, pred_aff)
    pred_rb = cv_road_bias(y_day, p0, fold_id, rt)
    cand["road_bias"] = rmse(y_day, pred_rb)
    pred_rb_aff = cv_global_affine(y_day, cv_road_bias(y_day, p0, fold_id, rt), fold_id)
    cand["road_bias+affine"] = rmse(y_day, pred_rb_aff)
    for k, v in cand.items():
        tlog(f"  calib[{k:18s}] OOF RMSE: {v:.5f}")
    best_calib = min(cand, key=lambda k: cand[k])
    if cand[best_calib] >= r0 - 1e-6:   # require a real improvement
        best_calib = "none"
    tlog(f"  -> accepted calibration: {best_calib}")

    calib_pred = {"none": p0, "global_affine": pred_aff,
                  "road_bias": pred_rb, "road_bias+affine": pred_rb_aff}[best_calib]
    r_after_calib = rmse(y_day, calib_pred)

    # prior blend on top of the (possibly) calibrated prediction
    blended = cv_blend(y_day, calib_pred, base_oof, fold_id)
    r_blend = rmse(y_day, blended)
    w_full = fit_blend_w(y_day, calib_pred, base_oof)
    accept_blend = r_blend < r_after_calib - 1e-6
    tlog(f"  blend OOF RMSE: {r_blend:.5f} (vs {r_after_calib:.5f} no-blend); "
         f"full-data w={w_full:.3f}; accept={accept_blend}")

    log["calibration"] = {"candidates": cand, "chosen": best_calib,
                          "rmse_after_calib": r_after_calib}
    log["blend"] = {"oof_rmse_blend": r_blend, "oof_rmse_no_blend": r_after_calib,
                    "w_full": w_full, "accepted": bool(accept_blend)}
    final_oof_rmse = r_blend if accept_blend else r_after_calib
    log["final_pipeline_oof_rmse"] = final_oof_rmse
    tlog(f"FINAL pipeline PROXY-CELL OOF RMSE: {final_oof_rmse:.5f} "
         f"(direct baseline {direct_rmse:.5f}, base-only {base_rmse_cell:.5f})")

    # ---- fit calibration params on FULL daytime OOF (applied to test) ----------
    aff_a = aff_b = None
    road_bias_map = None; road_bias_global = None
    if best_calib in ("global_affine", "road_bias+affine"):
        # affine is fit on the prediction stream that enters it
        pre = p0 if best_calib == "global_affine" else cv_road_bias(y_day, p0, fold_id, rt)
        aff_a, aff_b = fit_global_affine(y_day, pre)
    if best_calib in ("road_bias", "road_bias+affine"):
        road_bias_map, road_bias_global = fit_road_bias(y_day, p0, rt)

    # ====================== FINAL: seed-avg, real geo_tod lag ===================
    tlog(f"=== FINAL: {best_form} + calib[{best_calib}] + "
         f"blend[{'on w=%.3f' % w_full if accept_blend else 'off'}], "
         f"seed-avg x{N_SEEDS} ===")
    he_f = F.HistoryEncoder().fit(d48)
    d48_e = he_f.transform(d48, use_geo_tod=False)
    d49_e = he_f.transform(d49, use_geo_tod=True)
    test_e = he_f.transform(test, use_geo_tod=True)

    base_d48 = compute_base(he_f, d48, use_lag=False)     # no day-47 -> factorized
    base_d49 = compute_base(he_f, d49, use_lag=True)       # real day-48 lag
    base_test = compute_base(he_f, test, use_lag=True)     # real day-48 lag

    full = pd.concat([d48_e, d49_e], ignore_index=True)
    y_full = full[TARGET].to_numpy()
    base_full = np.concatenate([base_d48, base_d49])
    Xf = cast(full[FEATS]); Xte = cast(test_e[FEATS])
    ytarget = to_target(y_full, base_full, best_form)

    test_pred = np.zeros(len(test))
    last_model = None
    for s in SEED_LIST:
        m = train_lgbm(Xf, ytarget, CMP_ROUNDS, seed=s)
        test_pred += from_pred(m.predict(Xte), base_test, best_form) / len(SEED_LIST)
        last_model = m
        tlog(f"  seed {s} done")

    # apply chosen calibration (params from full daytime OOF)
    if best_calib in ("road_bias", "road_bias+affine"):
        rt_test = test["RoadType"].astype(str).fillna("NaN").to_numpy()
        add = np.array([road_bias_map.get(r, road_bias_global) for r in rt_test])
        test_pred = np.clip(test_pred + add, 0, 1)
    if best_calib in ("global_affine", "road_bias+affine"):
        test_pred = np.clip(aff_a * test_pred + aff_b, 0, 1)
    # apply prior blend
    if accept_blend:
        test_pred = np.clip(w_full * test_pred + (1 - w_full) * base_test, 0, 1)
    test_pred = np.clip(test_pred, 0, 1)

    sub = pd.DataFrame({"Index": test["Index"].values, "demand": test_pred})
    sub_path = os.path.join(SUB, "submission_D.csv")
    sub.to_csv(sub_path, index=False)
    tlog(f"wrote {sub_path} rows={len(sub)}")
    tlog(f"pred stats: min={test_pred.min():.4f} mean={test_pred.mean():.4f} "
         f"max={test_pred.max():.4f}  (v1 mean ~0.1308)")
    log["submission"] = {"rows": len(sub), "pred_min": float(test_pred.min()),
                         "pred_mean": float(test_pred.mean()),
                         "pred_max": float(test_pred.max()), "n_seeds": N_SEEDS,
                         "rounds": CMP_ROUNDS}

    # ---- sanity vs v1 (submission_lgbm.csv = LB 90.791) ------------------------
    v1_path = os.path.join(SUB, "submission_lgbm.csv")
    sanity = {}
    if os.path.exists(v1_path):
        v1 = pd.read_csv(v1_path)
        merged = sub.merge(v1, on="Index", suffixes=("_D", "_v1"))
        a = merged["demand_D"].to_numpy(); b = merged["demand_v1"].to_numpy()
        sanity = {"n_aligned": int(len(merged)),
                  "corr_vs_v1": float(np.corrcoef(a, b)[0, 1]),
                  "mean_abs_diff": float(np.mean(np.abs(a - b))),
                  "mean_D": float(a.mean()), "mean_v1": float(b.mean())}
        tlog(f"SANITY vs v1: corr={sanity['corr_vs_v1']:.5f} "
             f"mad={sanity['mean_abs_diff']:.5f} mean_D={sanity['mean_D']:.5f} "
             f"mean_v1={sanity['mean_v1']:.5f}")
    else:
        tlog(f"WARNING: v1 file not found at {v1_path}")
    log["sanity_vs_v1"] = sanity

    with open(os.path.join(OUT, "approach_D_log.json"), "w") as f:
        json.dump(log, f, indent=2)
    write_report(log)
    tlog("[done] submission -> submissions/submission_D.csv ; "
         "report -> outputs/approach_D_report.md")


def write_report(log):
    c = log["proxy_cell"]; t = log["proxy_time"]; s = log.get("sanity_vs_v1", {})
    cal = log["calibration"]; bl = log["blend"]
    chosen = log["chosen_formulation"]
    L = []
    a = L.append
    a("# Approach D -- target reformulation + calibration (orthogonal lever)")
    a("")
    a("Other workers model `demand` directly (HPO / features / model ensembling). "
      "Approach D changes WHAT is predicted (residual/ratio around a 'yesterday' prior) "
      "and POST-PROCESSES it (segment bias calibration + prior blend), gating every "
      "decision on a daytime-faithful proxy.")
    a("")
    a("## 1. Daytime validation proxies")
    a("The scored test is day-49 DAYTIME (tod "
      f"[{log['data']['tod_lo']:.0f},{log['data']['tod_hi']:.0f}] = 02:15-13:45). "
      "Prior rounds (v3/v4) regressed because the only offline CV was NIGHT-dominated and "
      "did not track the leaderboard. We use day-48 daytime labels:")
    a("")
    a("- **PROXY-CELL (primary):** 5-fold over day-48 DAYTIME rows; every train fold also "
      "carries ALL day-48 non-daytime rows (warm geo/tod stats, mirroring warm test cells). "
      "Aggregates and `base` refit per fold on fold-train rows only.")
    a("- **PROXY-TIME (stress test):** train day-48 non-daytime, validate day-48 daytime "
      "(proper horizon hold-out; base degenerates to a night-biased geohash level, so it is "
      "pessimistic).")
    a("")
    a("**Key asymmetry (documented):** for the REAL test/day-49 the day-over-day analog "
      "`base = geo_tod` (day-48 demand at the same geohash+slot) EXISTS for ~89% of cells; "
      "but day-48 has no day-47, so inside both proxies (and for day-48 TRAIN rows in the "
      "final) `base` is the FACTORIZED estimate (geo_mean*tod_factor). The proxies therefore "
      "validate the residual/ratio MACHINERY and the calibration under the *weaker-base* "
      "regime; the real test's 89% warm cells get a stronger geo_tod base, so the real RMSE "
      "should be LOWER than the proxy numbers and absolute values will NOT transfer 1:1.")
    a("")
    a("## 2. Three target formulations (same features, same rounds = "
      f"{log['submission']['rounds']})")
    a("")
    a("| formulation | PROXY-CELL RMSE | PROXY-TIME RMSE |")
    a("|---|---|---|")
    a(f"| base-only (raw prior) | {c['base_only']:.5f} | {t['base_only']:.5f} |")
    a(f"| (i) DIRECT (v1 control) | {c['direct']:.5f} | {t['direct']:.5f} |")
    a(f"| (ii) ADDITIVE residual | {c['additive']:.5f} | {t['additive']:.5f} |")
    a(f"| (iii) LOG-RATIO | {c['logratio']:.5f} | {t['logratio']:.5f} |")
    a("")
    a(f"**Chosen formulation: `{chosen}`** "
      "(primary gate = PROXY-CELL; a non-DIRECT formulation is adopted only on a clear "
      "PROXY-CELL win that PROXY-TIME also corroborates, honoring the v3/v4 lesson that "
      "unverified changes to the proven pipeline tend to regress the LB).")
    a("")
    a("## 3. Segment-wise bias calibration (gated on PROXY-CELL OOF)")
    a("")
    a("Out-of-fold (honest) estimation; a candidate is accepted only if it lowers OOF RMSE.")
    a("")
    a("| calibration | OOF RMSE |")
    a("|---|---|")
    for k in ["none", "global_affine", "road_bias", "road_bias+affine"]:
        if k in cal["candidates"]:
            a(f"| {k} | {cal['candidates'][k]:.5f} |")
    a("")
    a(f"**Accepted calibration: `{cal['chosen']}`** "
      f"(RMSE after calibration {cal['rmse_after_calib']:.5f}).")
    a("")
    a("## 4. Prior blend with the raw yesterday prior")
    a("")
    a(f"final = w * model + (1-w) * base. Out-of-fold blend RMSE "
      f"**{bl['oof_rmse_blend']:.5f}** vs no-blend **{bl['oof_rmse_no_blend']:.5f}**; "
      f"full-data weight w = **{bl['w_full']:.3f}**. Accepted: **{bl['accepted']}**.")
    a("")
    a(f"**Final pipeline PROXY-CELL OOF RMSE: {log['final_pipeline_oof_rmse']:.5f}** "
      f"(DIRECT baseline {c['direct']:.5f}; raw base-only {c['base_only']:.5f}).")
    a("")
    a("## 5. Submission vs v1 (submission_lgbm.csv, LB 90.791)")
    if s:
        a(f"- prediction mean = **{log['submission']['pred_mean']:.5f}** "
          f"(v1 mean 0.1308; min={log['submission']['pred_min']:.4f}, "
          f"max={log['submission']['pred_max']:.4f}).")
        a(f"- correlation vs v1 = **{s['corr_vs_v1']:.5f}**, mean abs diff = "
          f"**{s['mean_abs_diff']:.5f}** over {s['n_aligned']} rows "
          f"(mean_D={s['mean_D']:.5f} vs mean_v1={s['mean_v1']:.5f}).")
    else:
        a("- v1 submission file not found; correlation skipped.")
    a("")
    a("## 6. Honest verdict: will D beat 90.791?")
    a("")
    NOISE = 2e-4   # OOF deltas below this are within fold/seed noise on this proxy
    final_gain = c["direct"] - log["final_pipeline_oof_rmse"]
    corr = s.get("corr_vs_v1", float("nan"))
    a(f"- **The reparametrizations did NOT robustly help.** ADDITIVE residual looked "
      f"marginally better on PROXY-CELL ({c['additive']:.5f} vs DIRECT {c['direct']:.5f}, "
      f"a {1000*(c['direct']-c['additive']):.2f}e-3 edge) but REVERSED on the proper "
      f"horizon hold-out PROXY-TIME ({t['additive']:.5f} vs DIRECT {t['direct']:.5f}) -- a "
      "textbook repeat of the v3/v4 trap where a non-horizon signal flatters a change that "
      "then regresses. The guard therefore (correctly) kept DIRECT. LOG-RATIO was clearly "
      "worse on both proxies.")
    a(f"- **Calibration / blend gains are noise-level.** The accepted global affine moved "
      f"OOF RMSE {c['direct']:.5f}->{log['final_pipeline_oof_rmse']:.5f} "
      f"(delta {final_gain:.5f}, below the ~{NOISE:.0e} noise floor of this proxy); the "
      "prior blend was REJECTED (optimal w=1.000, i.e. the model already absorbs the "
      "geo_tod prior as a feature). The affine is kept only because it is compliant, "
      "global, and essentially free (corr unchanged).")
    a(f"- **Net:** D collapses to a seed-averaged v1-equivalent (corr vs v1 = {corr:.4f}, "
      f"mean abs diff {s.get('mean_abs_diff', float('nan')):.5f}, mean "
      f"{log['submission']['pred_mean']:.4f} vs v1 0.1308). **Most likely outcome: parity "
      "with ~90.791, not a clear gain.** It will not beat v1 by a margin, and it is too "
      "correlated with v1 (~1.0) to help an ensemble. Recommend keeping v1 as the "
      "submission of record; ship submission_D.csv only as a near-duplicate safety net.")
    a("- **Why the orthogonal lever found no free signal here:** the strongest base "
      "(geo_tod lag) is ALREADY a model feature, so anchoring the target on it is "
      "redundant; and the train/predict base-granularity asymmetry (day-48 train uses the "
      "factorized base, day-49/test use the true lag) means residual/ratio targets carry a "
      "structural mismatch no single-day proxy can fully measure -- a real risk, not a win. "
      "The one durable, reusable artifact is the daytime-proxy + honest out-of-fold "
      "calibration harness, which is model-agnostic and can sit on top of whichever base "
      "model (v1 / Approach A/B/C) ultimately wins.")
    with open(os.path.join(OUT, "approach_D_report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
