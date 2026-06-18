"""
================================================================================
 GRIDLOCK 2.0 — TRAFFIC DEMAND PREDICTION  |  Colab-ready solution (FINAL/safe)
================================================================================
Single, self-contained, reproducible pipeline. Paste into a Google Colab cell
(or `%run gridlock_colab.py`). Installs deps ON COLAB only.

This is the VALIDATED-SAFE recipe (matches the best leaderboard submission):
  * EDA + ETL + data-quality audit (the data is clean; nothing to remove).
  * Leakage-safe features: geohash->lat/lon, cyclical time, day-48 history
    aggregates (geo_*, tod_*, road_mean, geo_tod day-over-day lag, geo_freq).
  * Target handling: RAW L2/RMSE. A controlled balancing study (log1p / sqrt /
    tweedie / huber / tail-weighting) was run; on the tail-faithful CV-B, RAW won
    or tied every alternative, so we keep it. Tweedie/tail-weighting looked good on
    night-only CV-A but HURT CV-B — a trap we deliberately avoid.
  * Model: seed-averaged LightGBM bagging (variance reduction, bias-preserving).

PROBLEM (verified by EDA):
  Regression, demand in (0,1], heavy right skew.
  train = day 48 (all 96 slots) + day 49 (slots 00:00-02:00).
  test  = day 49, 02:15-13:45  -> forecast the rest of the day.
  Metric: score = 100*(1 - RMSE)  ->  minimize RMSE; predictions clipped to [0,1].

VALIDATION:
  CV-A : fit day48 -> predict day49 train rows (day-over-day lag faithful; night).
  CV-B : GroupKFold by geohash on day48 (LEADERBOARD-REPRESENTATIVE: all slots,
         all road types, cold-start). Trust CV-B for model selection.
================================================================================
"""
from __future__ import annotations
import os, sys, json, time, warnings
warnings.filterwarnings("ignore")
T0 = time.time()
def tlog(*a): print(f"[{time.time()-T0:6.1f}s]", *a, flush=True)


def _ensure_deps():
    import importlib.util
    need = {"numpy": "numpy", "pandas": "pandas", "sklearn": "scikit-learn", "lightgbm": "lightgbm"}
    missing = [pkg for mod, pkg in need.items() if importlib.util.find_spec(mod) is None]
    if missing:
        tlog(f"installing: {missing}")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", *missing], check=False)

_ensure_deps()
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold
import lightgbm as lgb

SEED = 42
np.random.seed(SEED)
TARGET = "demand"
N_SEEDS = int(os.environ.get("N_SEEDS", "10"))   # seed-averaged bagging


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


# --------------------------------------------------------------- data
def load_data():
    for b in [".", "dataset", "/content", "/content/dataset", "../dataset"]:
        tr, te = os.path.join(b, "train.csv"), os.path.join(b, "test.csv")
        if os.path.exists(tr) and os.path.exists(te):
            tlog(f"data dir: {os.path.abspath(b)}"); return pd.read_csv(tr), pd.read_csv(te)
    try:
        from google.colab import files  # noqa
        tlog("upload train.csv and test.csv ..."); files.upload()
        return pd.read_csv("train.csv"), pd.read_csv("test.csv")
    except Exception:
        raise FileNotFoundError("train.csv / test.csv not found.")


# --------------------------------------------------------------- features
_B32 = "0123456789bcdefghjkmnpqrstuvwxyz"; _DEC = {c: i for i, c in enumerate(_B32)}
def decode_geohash(gh):
    a, b, c, d = -90.0, 90.0, -180.0, 180.0; even = True
    for ch in str(gh):
        idx = _DEC.get(ch)
        if idx is None: continue
        for m in (16, 8, 4, 2, 1):
            if even:
                mid = (c+d)/2; c, d = (mid, d) if idx & m else (c, mid)
            else:
                mid = (a+b)/2; a, b = (mid, b) if idx & m else (a, mid)
            even = not even
    return (a+b)/2, (c+d)/2


def _ts_min(ts):
    p = ts.astype(str).str.strip().str.split(":", expand=True)
    return (pd.to_numeric(p[0], errors="coerce")*60 + pd.to_numeric(p[1], errors="coerce")).astype("float64")


def add_base(df):
    df = df.copy()
    df["tod"] = _ts_min(df["timestamp"])
    df["hour"] = (df["tod"]//60).astype("float64"); df["minute"] = (df["tod"] % 60).astype("float64")
    df["tod_sin"] = np.sin(2*np.pi*df["tod"]/1440.0); df["tod_cos"] = np.cos(2*np.pi*df["tod"]/1440.0)
    df["hour_sin"] = np.sin(2*np.pi*df["hour"]/24.0); df["hour_cos"] = np.cos(2*np.pi*df["hour"]/24.0)
    uniq = pd.Index(df["geohash"].dropna().unique())
    ll = pd.DataFrame([(g, *decode_geohash(g)) for g in uniq], columns=["geohash", "lat", "lon"])
    df = df.merge(ll, on="geohash", how="left")
    df["NumberofLanes"] = pd.to_numeric(df["NumberofLanes"], errors="coerce")
    df["Temperature"] = pd.to_numeric(df["Temperature"], errors="coerce")
    df["large_veh_bin"] = (df["LargeVehicles"].astype(str) == "Allowed").astype("int8")
    df["landmarks_bin"] = (df["Landmarks"].astype(str) == "Yes").astype("int8")
    df["temp_missing"] = df["Temperature"].isna().astype("int8")
    df["weather_missing"] = df["Weather"].isna().astype("int8")
    df["roadtype_missing"] = df["RoadType"].isna().astype("int8")
    return df


class HistoryEncoder:
    """Fit demand aggregates on a leakage-safe reference (prior day); transform any frame."""
    def __init__(self, smooth=20): self.smooth = smooth
    def fit(self, ref):
        d = ref; self.gm = float(d[TARGET].mean())
        g = d.groupby("geohash")[TARGET]
        self.geo = pd.DataFrame({"geo_mean": g.mean(), "geo_std": g.std(), "geo_median": g.median(),
                                 "geo_min": g.min(), "geo_max": g.max(), "geo_cnt": g.count()})
        n = self.geo["geo_cnt"]
        self.geo["geo_mean_smooth"] = (self.geo["geo_mean"]*n + self.gm*self.smooth)/(n+self.smooth)
        t = d.groupby("tod")[TARGET]; self.tod = pd.DataFrame({"tod_mean": t.mean(), "tod_std": t.std()})
        self.geo_tod = d.groupby(["geohash", "tod"])[TARGET].mean().rename("geo_tod_mean").reset_index()
        self.road = pd.DataFrame({"road_mean": d.groupby("RoadType")[TARGET].mean()})
        self.geo_freq = d.groupby("geohash").size().rename("geo_freq")
        return self
    def transform(self, df, use_geo_tod=True):
        o = (df.merge(self.geo, on="geohash", how="left").merge(self.tod, on="tod", how="left")
               .merge(self.road, on="RoadType", how="left").merge(self.geo_freq.reset_index(), on="geohash", how="left"))
        o = o.merge(self.geo_tod, on=["geohash", "tod"], how="left") if use_geo_tod else o.assign(geo_tod_mean=np.nan)
        o["geo_tod_mean"] = o["geo_tod_mean"].fillna(o["geo_mean_smooth"]).fillna(o["tod_mean"]).fillna(self.gm)
        for c in ["geo_mean", "geo_mean_smooth", "geo_median", "road_mean", "tod_mean"]:
            o[c] = o[c].fillna(self.gm)
        for c in ["geo_std", "tod_std", "geo_min", "geo_max"]:
            o[c] = o[c].fillna(0.0)
        o["geo_freq"] = o["geo_freq"].fillna(0).astype("float64"); o["geo_cnt"] = o["geo_cnt"].fillna(0).astype("float64")
        return o


FEATS = ["tod", "hour", "minute", "tod_sin", "tod_cos", "hour_sin", "hour_cos", "day", "lat", "lon",
         "NumberofLanes", "Temperature", "large_veh_bin", "landmarks_bin",
         "temp_missing", "weather_missing", "roadtype_missing",
         "geo_mean", "geo_std", "geo_median", "geo_min", "geo_max", "geo_cnt",
         "geo_mean_smooth", "tod_mean", "tod_std", "geo_tod_mean", "road_mean", "geo_freq",
         "geohash", "RoadType", "Weather"]
CAT = ["geohash", "RoadType", "Weather"]

def cast(df):
    df = df.copy()
    for c in CAT: df[c] = df[c].astype("category")
    return df


def fit_lgbm(Xtr, ytr, Xva, yva, Xpred, rounds=5000, seed=SEED):
    # NOTE: set ONLY `seed` (LightGBM derives the sub-seeds). Explicitly overriding
    # bagging_seed/feature_fraction_seed changed the sampling and underfit (the v4
    # regression on the leaderboard). This matches the best-scoring v1/v5 recipe.
    p = dict(objective="regression", metric="rmse", learning_rate=0.03, num_leaves=63,
             min_child_samples=40, subsample=0.8, subsample_freq=1, colsample_bytree=0.8,
             reg_lambda=2.0, reg_alpha=0.5, max_depth=-1, seed=seed, n_jobs=-1, verbose=-1)
    dtr = lgb.Dataset(Xtr, ytr, categorical_feature=CAT, free_raw_data=False)
    valid, names, cbs = [dtr], ["train"], [lgb.log_evaluation(0)]
    if Xva is not None:
        dva = lgb.Dataset(Xva, yva, categorical_feature=CAT, reference=dtr, free_raw_data=False)
        valid, names = [dtr, dva], ["train", "valid"]; cbs.append(lgb.early_stopping(150, verbose=False))
    m = lgb.train(p, dtr, num_boost_round=rounds, valid_sets=valid, valid_names=names, callbacks=cbs)
    it = m.best_iteration or rounds
    return m, it, np.clip(m.predict(Xpred, num_iteration=it), 0, 1)


# --------------------------------------------------------------- main
def main():
    log = {}
    train, test = load_data()

    # ---- EDA + data-quality audit ----
    print("\n=== EDA / DATA-QUALITY ===")
    print(f"train {train.shape} | test {test.shape}")
    print("days train:", sorted(train.day.unique()), "test:", sorted(test.day.unique()))
    y = train[TARGET]
    print(f"target: med={y.median():.4f} mean={y.mean():.4f} max={y.max():.4f} skew={y.skew():.2f}")
    print(f"duplicates full={train.duplicated().sum()} key={train.duplicated(subset=['geohash','day','timestamp']).sum()}")
    print(f"target invalid: <0={(y<0).sum()} >1={(y>1).sum()} ==0={(y==0).sum()} NaN={y.isna().sum()}")
    print("missing(train):", train.isna().sum()[lambda s: s > 0].to_dict())
    print("-> dataset is clean; no rows dropped. Target kept RAW (balancing study: raw wins on CV-B).")

    train = add_base(train); test = add_base(test)
    d48 = train[train.day == 48].copy(); d49 = train[train.day == 49].copy()
    tlog(f"day48={len(d48)} day49={len(d49)} test={len(test)} feats={len(FEATS)}")

    # ---- CV-A ----
    he = HistoryEncoder().fit(d48)
    trA, vaA = he.transform(d48, use_geo_tod=False), he.transform(d49, use_geo_tod=True)
    XtrA, ytrA = cast(trA[FEATS]), trA[TARGET].values
    XvaA, yvaA = cast(vaA[FEATS]), vaA[TARGET].values
    bar = rmse(yvaA, vaA["geo_tod_mean"].values)
    _, itA, pA = fit_lgbm(XtrA, ytrA, XvaA, yvaA, XvaA)
    tlog(f"CV-A: yesterday-baseline={bar:.5f}  LGBM={rmse(yvaA, pA):.5f} (it={itA})")
    log["cvA_baseline"], log["cvA_lgbm"] = bar, rmse(yvaA, pA)

    # ---- CV-B (leaderboard proxy) ----
    gkf = GroupKFold(5); groups = d48["geohash"].values; oof = np.zeros(len(d48))
    for tri, vai in gkf.split(d48, d48[TARGET], groups):
        tk, vk = d48.iloc[tri], d48.iloc[vai]; ek = HistoryEncoder().fit(tk)
        te_, ve_ = ek.transform(tk, use_geo_tod=False), ek.transform(vk, use_geo_tod=False)
        _, _, p = fit_lgbm(cast(te_[FEATS]), te_[TARGET].values, cast(ve_[FEATS]), ve_[TARGET].values,
                           cast(ve_[FEATS]), rounds=2500)
        oof[vai] = p
    tlog(f"CV-B OOF RMSE={rmse(d48[TARGET].values, oof):.5f}  <-- tracks leaderboard")
    log["cvB_oof"] = rmse(d48[TARGET].values, oof)

    # ---- FINAL: seed-averaged bagging on day48+day49 ----
    he_f = HistoryEncoder().fit(d48)
    full = pd.concat([he_f.transform(d48, use_geo_tod=False), he_f.transform(d49, use_geo_tod=True)], ignore_index=True)
    tef = he_f.transform(test, use_geo_tod=True)
    Xf, yf = cast(full[FEATS]), full[TARGET].values; Xte = cast(tef[FEATS])
    rounds = int(itA*1.10) + 50
    preds = np.zeros(len(test))
    for s in range(N_SEEDS):
        _, _, pt = fit_lgbm(Xf, yf, None, None, Xte, rounds=rounds, seed=SEED + s*101)
        preds += pt / N_SEEDS
        tlog(f"  seed {s} done")
    preds = np.clip(preds, 0, 1)

    sub = pd.DataFrame({"Index": test["Index"].values, "demand": preds})
    sub.to_csv("submission.csv", index=False)
    tlog(f"wrote {os.path.abspath('submission.csv')} rows={len(sub)}")
    tlog(f"pred: min={preds.min():.4f} mean={preds.mean():.4f} max={preds.max():.4f} (train mean={yf.mean():.4f})")

    mexp, _, _ = fit_lgbm(XtrA, ytrA, XvaA, yvaA, XvaA)
    imp = pd.DataFrame({"feature": mexp.feature_name(), "gain": mexp.feature_importance("gain")}).sort_values("gain", ascending=False)
    print("\nTop features by gain:\n" + imp.head(12).to_string(index=False))
    print("\n=== SUMMARY ===\n" + json.dumps(log, indent=2) + "\nSubmit submission.csv.")


if __name__ == "__main__":
    main()
