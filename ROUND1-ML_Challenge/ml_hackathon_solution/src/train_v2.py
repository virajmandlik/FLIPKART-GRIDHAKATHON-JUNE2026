"""
Gridlock 2.0 — IMPROVED pipeline (v2). Self-contained (no local imports).

Why v2 beats the first submission (LB 90.79 == RMSE ~0.092):
  * The submitted file was bare LightGBM (default params, no HPO/ensemble) and
    lacked the strongest daytime profile features.
  * LB tracks CV-B (geohash GroupKFold), NOT the optimistic CV-A. So we OPTIMIZE
    and SELECT on CV-B, the leaderboard-representative metric.

New leakage-safe features (all fit on the reference/fold-train ONLY):
  * road_tod_mean   : RoadType x time-of-day  (captures rush-hour per road class)
  * lanes_tod_mean  : NumberofLanes x tod
  * gh5_mean/std    : geohash-5 prefix region (helps the 10 cold-start test cells)
  * gh4_mean        : geohash-4 prefix region (coarser)
  * geo_hour_mean   : day-over-day lag at coarser hour grain (higher fill)
  * geo_tod_mean    : day-over-day lag (exact 15-min slot)  [cross-day only]
Lag features are populated ONLY across different days (no same-day target leak);
NaN otherwise and handled natively by the trees.

Run:  python ml_hackathon_solution/src/train_v2.py
Env:  N_OPTUNA_TRIALS (default 25), N_SEEDS (default 3)
"""
from __future__ import annotations
import os, json, warnings, time
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

warnings.filterwarnings("ignore")
T0 = time.time()

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset")
OUT = os.path.join(ROOT, "outputs")
SUB = os.path.join(ROOT, "submissions")
os.makedirs(OUT, exist_ok=True); os.makedirs(SUB, exist_ok=True)

SEED = 42
TARGET = "demand"
N_OPTUNA_TRIALS = int(os.environ.get("N_OPTUNA_TRIALS", "25"))
N_SEEDS = int(os.environ.get("N_SEEDS", "3"))

import lightgbm as lgb
try:
    import xgboost as xgb; HAVE_XGB = True
except Exception: HAVE_XGB = False
try:
    from catboost import CatBoostRegressor, Pool; HAVE_CAT = True
except Exception: HAVE_CAT = False
try:
    import optuna; optuna.logging.set_verbosity(optuna.logging.WARNING); HAVE_OPTUNA = True
except Exception: HAVE_OPTUNA = False


def tlog(*a):
    print(f"[{time.time()-T0:6.1f}s]", *a, flush=True)


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


# ----------------------------------------------------------------- geohash
_B32 = "0123456789bcdefghjkmnpqrstuvwxyz"; _DEC = {c: i for i, c in enumerate(_B32)}
def decode_geohash(gh):
    a, b, c, d = -90.0, 90.0, -180.0, 180.0; even = True
    for ch in str(gh):
        idx = _DEC.get(ch)
        if idx is None: continue
        for m in (16, 8, 4, 2, 1):
            if even:
                mid = (c + d) / 2; c, d = (mid, d) if idx & m else (c, mid)
            else:
                mid = (a + b) / 2; a, b = (mid, b) if idx & m else (a, mid)
            even = not even
    return (a + b) / 2, (c + d) / 2


def ts_to_min(ts):
    p = ts.astype(str).str.strip().str.split(":", expand=True)
    return (pd.to_numeric(p[0], errors="coerce") * 60 + pd.to_numeric(p[1], errors="coerce")).astype("float64")


def add_base(df):
    df = df.copy()
    df["tod"] = ts_to_min(df["timestamp"])
    df["hour"] = (df["tod"] // 60).astype("float64")
    df["minute"] = (df["tod"] % 60).astype("float64")
    df["tod_sin"] = np.sin(2*np.pi*df["tod"]/1440.0); df["tod_cos"] = np.cos(2*np.pi*df["tod"]/1440.0)
    df["hour_sin"] = np.sin(2*np.pi*df["hour"]/24.0); df["hour_cos"] = np.cos(2*np.pi*df["hour"]/24.0)
    uniq = pd.Index(df["geohash"].dropna().unique())
    ll = pd.DataFrame([(g, *decode_geohash(g)) for g in uniq], columns=["geohash", "lat", "lon"])
    df = df.merge(ll, on="geohash", how="left")
    df["gh5"] = df["geohash"].astype(str).str[:5]
    df["gh4"] = df["geohash"].astype(str).str[:4]
    df["NumberofLanes"] = pd.to_numeric(df["NumberofLanes"], errors="coerce")
    df["Temperature"] = pd.to_numeric(df["Temperature"], errors="coerce")
    df["large_veh_bin"] = (df["LargeVehicles"].astype(str) == "Allowed").astype("int8")
    df["landmarks_bin"] = (df["Landmarks"].astype(str) == "Yes").astype("int8")
    df["temp_missing"] = df["Temperature"].isna().astype("int8")
    df["weather_missing"] = df["Weather"].isna().astype("int8")
    df["roadtype_missing"] = df["RoadType"].isna().astype("int8")
    return df


class Encoder:
    """Fit demand aggregates on a leakage-safe reference; transform any frame."""
    def __init__(self, smooth=20): self.smooth = smooth

    def fit(self, ref):
        d = ref; self.gm = float(d[TARGET].mean())
        g = d.groupby("geohash")[TARGET]
        self.geo = pd.DataFrame({"geo_mean": g.mean(), "geo_std": g.std(), "geo_median": g.median(),
                                 "geo_min": g.min(), "geo_max": g.max(), "geo_cnt": g.count()})
        n = self.geo["geo_cnt"]
        self.geo["geo_mean_smooth"] = (self.geo["geo_mean"]*n + self.gm*self.smooth)/(n+self.smooth)
        t = d.groupby("tod")[TARGET]
        self.tod = pd.DataFrame({"tod_mean": t.mean(), "tod_std": t.std()})
        self.road = pd.DataFrame({"road_mean": d.groupby("RoadType")[TARGET].mean()})
        # interaction profiles (smoothed toward global)
        self.road_tod = self._smooth_group(d, ["RoadType", "tod"], "road_tod_mean", 10)
        self.lanes_tod = self._smooth_group(d, ["NumberofLanes", "tod"], "lanes_tod_mean", 10)
        # spatial prefixes
        g5 = d.groupby("gh5")[TARGET]; self.gh5 = pd.DataFrame({"gh5_mean": g5.mean(), "gh5_std": g5.std()})
        self.gh4 = pd.DataFrame({"gh4_mean": d.groupby("gh4")[TARGET].mean()})
        # day-over-day lags (cross-day only)
        self.geo_tod = d.groupby(["geohash", "tod"])[TARGET].mean().rename("geo_tod_mean").reset_index()
        dd = d.copy(); dd["hour"] = (dd["tod"] // 60)
        self.geo_hour = dd.groupby(["geohash", "hour"])[TARGET].mean().rename("geo_hour_mean").reset_index()
        self.geo_freq = d.groupby("geohash").size().rename("geo_freq")
        return self

    def _smooth_group(self, d, keys, name, k):
        grp = d.groupby(keys)[TARGET]
        m, c = grp.mean(), grp.count()
        sm = (m*c + self.gm*k)/(c+k)
        return sm.rename(name).reset_index()

    def transform(self, df, cross_day=False):
        o = (df.merge(self.geo, on="geohash", how="left")
               .merge(self.tod, on="tod", how="left")
               .merge(self.road, on="RoadType", how="left")
               .merge(self.road_tod, on=["RoadType", "tod"], how="left")
               .merge(self.lanes_tod, on=["NumberofLanes", "tod"], how="left")
               .merge(self.gh5, on="gh5", how="left")
               .merge(self.gh4, on="gh4", how="left")
               .merge(self.geo_freq.reset_index(), on="geohash", how="left"))
        if cross_day:
            o = o.merge(self.geo_tod, on=["geohash", "tod"], how="left")
            o["_h"] = (o["tod"] // 60)
            gh = self.geo_hour.rename(columns={"hour": "_h"})
            o = o.merge(gh, on=["geohash", "_h"], how="left").drop(columns=["_h"])
        else:
            o["geo_tod_mean"] = np.nan; o["geo_hour_mean"] = np.nan
        # backoff fills for STATIC features (lags kept NaN -> native handling)
        o["gh5_mean"] = o["gh5_mean"].fillna(o["gh4_mean"]).fillna(self.gm)
        o["gh4_mean"] = o["gh4_mean"].fillna(self.gm)
        o["road_tod_mean"] = o["road_tod_mean"].fillna(o["road_mean"]).fillna(self.gm)
        o["lanes_tod_mean"] = o["lanes_tod_mean"].fillna(o["tod_mean"]).fillna(self.gm)
        for c in ["geo_mean", "geo_mean_smooth", "geo_median", "road_mean", "tod_mean"]:
            o[c] = o[c].fillna(o["gh5_mean"]).fillna(self.gm)
        for c in ["geo_std", "tod_std", "geo_min", "geo_max", "gh5_std"]:
            o[c] = o[c].fillna(0.0)
        o["geo_freq"] = o["geo_freq"].fillna(0).astype("float64")
        o["geo_cnt"] = o["geo_cnt"].fillna(0).astype("float64")
        # relative intensity (how busy vs its road class / region)
        o["geo_vs_road"] = o["geo_mean_smooth"] / (o["road_mean"] + 1e-6)
        o["geo_vs_gh5"] = o["geo_mean_smooth"] / (o["gh5_mean"] + 1e-6)
        return o


FEATS = ["tod", "hour", "minute", "tod_sin", "tod_cos", "hour_sin", "hour_cos", "day",
         "lat", "lon", "NumberofLanes", "Temperature", "large_veh_bin", "landmarks_bin",
         "temp_missing", "weather_missing", "roadtype_missing",
         "geo_mean", "geo_std", "geo_median", "geo_min", "geo_max", "geo_cnt",
         "geo_mean_smooth", "tod_mean", "tod_std", "road_mean",
         "road_tod_mean", "lanes_tod_mean", "gh5_mean", "gh5_std", "gh4_mean",
         "geo_tod_mean", "geo_hour_mean", "geo_freq", "geo_vs_road", "geo_vs_gh5",
         "geohash", "RoadType", "Weather"]
CAT = ["geohash", "RoadType", "Weather"]


def cast(df):
    df = df.copy()
    for c in CAT: df[c] = df[c].astype("category")
    return df


# --------------------------------------------------------------- model fits
def fit_lgbm(Xtr, ytr, Xva, yva, Xpred, params=None, rounds=5000, seed=SEED):
    base = dict(objective="regression", metric="rmse", learning_rate=0.03, num_leaves=63,
                min_child_samples=40, subsample=0.8, subsample_freq=1, colsample_bytree=0.8,
                reg_lambda=2.0, reg_alpha=0.5, seed=seed, n_jobs=-1, verbose=-1)
    if params: base.update(params)
    dtr = lgb.Dataset(Xtr, ytr, categorical_feature=CAT, free_raw_data=False)
    valid, names, cbs = [dtr], ["train"], [lgb.log_evaluation(0)]
    if Xva is not None:
        dva = lgb.Dataset(Xva, yva, categorical_feature=CAT, reference=dtr, free_raw_data=False)
        valid, names = [dtr, dva], ["train", "valid"]; cbs.append(lgb.early_stopping(150, verbose=False))
    m = lgb.train(base, dtr, num_boost_round=rounds, valid_sets=valid, valid_names=names, callbacks=cbs)
    it = m.best_iteration or rounds
    return m, it, np.clip(m.predict(Xpred, num_iteration=it), 0, 1)


# XGBoost cannot handle categories unseen in fold-train (cold-start geohashes).
# Drop high-cardinality `geohash` (redundant with geo_mean/lat/lon here) and keep
# only the always-covered low-cardinality categoricals.
CAT_XGB = ["RoadType", "Weather"]
def _xprep(df):
    df = df.drop(columns=[c for c in ["geohash"] if c in df.columns]).copy()
    for c in CAT_XGB: df[c] = df[c].astype("category")
    return df

def fit_xgb(Xtr, ytr, Xva, yva, Xpred, rounds=5000, seed=SEED):
    dtr = xgb.DMatrix(_xprep(Xtr), label=ytr, enable_categorical=True)
    dpr = xgb.DMatrix(_xprep(Xpred), enable_categorical=True)
    p = dict(objective="reg:squarederror", eval_metric="rmse", eta=0.03, max_depth=9,
             subsample=0.8, colsample_bytree=0.8, min_child_weight=5, reg_lambda=2.0,
             seed=seed, tree_method="hist", max_cat_to_onehot=1)
    evals, esr = [], None
    if Xva is not None:
        dva = xgb.DMatrix(_xprep(Xva), label=yva, enable_categorical=True)
        evals, esr = [(dva, "v")], 150
    m = xgb.train(p, dtr, num_boost_round=rounds, evals=evals, early_stopping_rounds=esr, verbose_eval=False)
    it = getattr(m, "best_iteration", None)
    rng = dict(iteration_range=(0, it+1)) if it is not None else {}
    return m, it, np.clip(m.predict(dpr, **rng), 0, 1)


def _cprep(df):
    df = df.copy()
    for c in CAT: df[c] = df[c].astype(str).fillna("NA")
    return df

def fit_cat(Xtr, ytr, Xva, yva, Xpred, rounds=5000, seed=SEED):
    trp = Pool(_cprep(Xtr), ytr, cat_features=CAT); prp = Pool(_cprep(Xpred), cat_features=CAT)
    kw = dict(iterations=rounds, learning_rate=0.03, depth=8, l2_leaf_reg=3.0,
              loss_function="RMSE", random_seed=seed, verbose=False)
    if Xva is not None:
        kw.update(od_type="Iter", od_wait=150)
        m = CatBoostRegressor(**kw).fit(trp, eval_set=Pool(_cprep(Xva), yva, cat_features=CAT), use_best_model=True)
    else:
        m = CatBoostRegressor(**kw).fit(trp)
    return m, m.best_iteration_, np.clip(m.predict(prp), 0, 1)


# ------------------------------------------------------------------- main
def main():
    log = {}
    train = add_base(pd.read_csv(os.path.join(DATA, "train.csv")))
    test = add_base(pd.read_csv(os.path.join(DATA, "test.csv")))
    d48 = train[train.day == 48].copy().reset_index(drop=True)
    d49 = train[train.day == 49].copy().reset_index(drop=True)
    tlog(f"day48={len(d48)} day49={len(d49)} test={len(test)}")

    # ============ CV-A (lag check; secondary) ============
    enc = Encoder().fit(d48)
    trA = enc.transform(d48, cross_day=False); vaA = enc.transform(d49, cross_day=True)
    XtrA, ytrA = cast(trA[FEATS]), trA[TARGET].values
    XvaA, yvaA = cast(vaA[FEATS]), vaA[TARGET].values
    bar = rmse(yvaA, vaA["geo_tod_mean"].fillna(vaA["geo_mean_smooth"]).values)
    _, itA, pvA = fit_lgbm(XtrA, ytrA, XvaA, yvaA, XvaA)
    tlog(f"CV-A: yesterday-baseline={bar:.5f}  LGBM={rmse(yvaA, pvA):.5f} (it={itA})")
    log["cvA"] = {"baseline": bar, "lgbm": rmse(yvaA, pvA)}

    # ============ CV-B (PRIMARY, LB-representative) ============
    tlog("CV-B 5-fold GroupKFold(geohash) — primary metric")
    gkf = GroupKFold(n_splits=5); groups = d48["geohash"].values
    oof = {"lgbm": np.zeros(len(d48))}
    if HAVE_XGB: oof["xgb"] = np.zeros(len(d48))
    if HAVE_CAT: oof["cat"] = np.zeros(len(d48))
    for k, (tri, vai) in enumerate(gkf.split(d48, d48[TARGET], groups)):
        tk, vk = d48.iloc[tri], d48.iloc[vai]
        ek = Encoder().fit(tk)
        te_, ve_ = ek.transform(tk, cross_day=False), ek.transform(vk, cross_day=False)
        Xt, yt = cast(te_[FEATS]), te_[TARGET].values
        Xv, yv = cast(ve_[FEATS]), ve_[TARGET].values
        _, _, p = fit_lgbm(Xt, yt, Xv, yv, Xv, rounds=3000); oof["lgbm"][vai] = p
        if HAVE_XGB:
            try: _, _, px = fit_xgb(Xt, yt, Xv, yv, Xv, rounds=3000); oof["xgb"][vai] = px
            except Exception as e: tlog("xgb fold err", e)
        if HAVE_CAT:
            try: _, _, pc = fit_cat(Xt, yt, Xv, yv, Xv, rounds=3000); oof["cat"][vai] = pc
            except Exception as e: tlog("cat fold err", e)
        tlog(f"  fold{k} lgbm={rmse(yv, oof['lgbm'][vai]):.5f}")
    yB = d48[TARGET].values
    for kk in oof: tlog(f"CV-B OOF {kk}: {rmse(yB, oof[kk]):.5f}")
    log["cvB"] = {kk: rmse(yB, oof[kk]) for kk in oof}

    # blend weights on CV-B OOF
    keys = list(oof.keys()); P = np.vstack([oof[k] for k in keys])
    rng = np.random.default_rng(SEED); bestw, bestr = None, min(rmse(yB, oof[k]) for k in keys)
    for _ in range(6000):
        w = rng.dirichlet(np.ones(len(keys)))
        r = rmse(yB, w @ P)
        if r < bestr: bestr, bestw = r, w
    tlog(f"CV-B blend best={bestr:.5f} weights={dict(zip(keys, np.round(bestw,3))) if bestw is not None else 'n/a'}")
    log["cvB_blend"] = bestr

    # ============ OPTUNA (geohash holdout, LB-like) ============
    best_params = None
    if HAVE_OPTUNA and N_OPTUNA_TRIALS > 0:
        tlog(f"Optuna {N_OPTUNA_TRIALS} trials on geohash holdout")
        tri, vai = next(GroupKFold(5).split(d48, d48[TARGET], groups))
        tk, vk = d48.iloc[tri], d48.iloc[vai]; ek = Encoder().fit(tk)
        te_, ve_ = ek.transform(tk, False), ek.transform(vk, False)
        Xt, yt = cast(te_[FEATS]), te_[TARGET].values
        Xv, yv = cast(ve_[FEATS]), ve_[TARGET].values
        def obj(t):
            p = dict(learning_rate=t.suggest_float("learning_rate", 0.015, 0.08, log=True),
                     num_leaves=t.suggest_int("num_leaves", 31, 255),
                     min_child_samples=t.suggest_int("min_child_samples", 15, 150),
                     subsample=t.suggest_float("subsample", 0.6, 1.0),
                     colsample_bytree=t.suggest_float("colsample_bytree", 0.5, 1.0),
                     reg_lambda=t.suggest_float("reg_lambda", 1e-2, 30.0, log=True),
                     reg_alpha=t.suggest_float("reg_alpha", 1e-3, 10.0, log=True),
                     max_depth=t.suggest_int("max_depth", 5, 14))
            _, _, p2 = fit_lgbm(Xt, yt, Xv, yv, Xv, params=p, rounds=3000)
            return rmse(yv, p2)
        st = optuna.create_study(direction="minimize", sampler=optuna.samplers.TPESampler(seed=SEED))
        st.optimize(obj, n_trials=N_OPTUNA_TRIALS, show_progress_bar=False)
        best_params = st.best_params
        tlog(f"Optuna best holdout RMSE={st.best_value:.5f}")
        log["optuna_best"] = st.best_value; log["best_params"] = best_params

    # ============ FINAL: seed-averaged blend on day48+day49 ============
    tlog("Final fit (day48+day49), seed-averaged, predict test")
    encf = Encoder().fit(d48)
    f48 = encf.transform(d48, cross_day=False); f49 = encf.transform(d49, cross_day=True)
    full = pd.concat([f48, f49], ignore_index=True)
    tef = encf.transform(test, cross_day=True)
    Xf, yf = cast(full[FEATS]), full[TARGET].values
    Xte = cast(tef[FEATS])
    rounds_l = int(itA * 1.15) + 60

    test_preds = {}
    pl = np.zeros(len(test))
    for s in range(N_SEEDS):
        _, _, pt = fit_lgbm(Xf, yf, None, None, Xte, params=best_params, rounds=rounds_l, seed=SEED+s)
        pl += pt / N_SEEDS
    test_preds["lgbm"] = pl
    if HAVE_XGB and "xgb" in oof:
        try:
            px = np.zeros(len(test))
            for s in range(N_SEEDS):
                _, _, pt = fit_xgb(Xf, yf, None, None, Xte, rounds=700, seed=SEED+s); px += pt/N_SEEDS
            test_preds["xgb"] = px
        except Exception as e: tlog("xgb final err", e)
    if HAVE_CAT and "cat" in oof:
        try:
            pc = np.zeros(len(test))
            for s in range(N_SEEDS):
                _, _, pt = fit_cat(Xf, yf, None, None, Xte, rounds=900, seed=SEED+s); pc += pt/N_SEEDS
            test_preds["cat"] = pc
        except Exception as e: tlog("cat final err", e)

    # apply CV-B blend weights (fallback to lgbm if a model missing)
    if bestw is not None and all(k in test_preds for k in keys):
        ptest = np.clip(bestw @ np.vstack([test_preds[k] for k in keys]), 0, 1)
        tlog("using CV-B blended test preds")
    else:
        ptest = np.clip(test_preds["lgbm"], 0, 1); tlog("using lgbm-only test preds")

    sub = pd.DataFrame({"Index": test["Index"].values, "demand": ptest})
    path = os.path.join(SUB, "submission_v2.csv"); sub.to_csv(path, index=False)
    tlog(f"wrote {path} rows={len(sub)}")
    tlog(f"pred: min={ptest.min():.4f} mean={ptest.mean():.4f} max={ptest.max():.4f} (train mean={yf.mean():.4f})")

    # importance + shap
    mexp, itx, _ = fit_lgbm(XtrA, ytrA, XvaA, yvaA, XvaA, params=best_params)
    imp = pd.DataFrame({"feature": mexp.feature_name(), "gain": mexp.feature_importance("gain")}).sort_values("gain", ascending=False)
    imp.to_csv(os.path.join(OUT, "lgbm_v2_importance.csv"), index=False)
    tlog("top features:\n" + imp.head(18).to_string(index=False))

    with open(os.path.join(OUT, "train_v2_log.json"), "w") as f: json.dump(log, f, indent=2)
    tlog("SUMMARY:\n" + json.dumps(log, indent=2))


if __name__ == "__main__":
    main()
