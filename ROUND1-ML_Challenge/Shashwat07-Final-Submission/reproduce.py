"""
================================================================================
 GRIDLOCK 2.0 -- WINNING SUBMISSION REPRODUCER  (evaluation score 91.25092)
================================================================================
Single, self-contained, deterministic script. Given the competition data
(`dataset/train.csv` + `dataset/test.csv`), it regenerates the winning file
`submission_BC.csv` and writes it next to this script.

WHAT THE WINNER IS
------------------
The winning prediction is the 50/50 average of two independently-built models:

    submission_BC = 0.5 * B + 0.5 * C        (then clipped to [0, 1])

  * B = a seed-averaged LightGBM (Approach B). v1 feature set PLUS the two
        time-of-day profile features `road_tod_mean` and `lanes_tod_mean`.
  * C = a 2-model blend (Approach C): LightGBM (v1) weight 0.4060 +
        XGBoost (geohash column dropped) weight 0.5940. CatBoost weight was
        exactly 0.0 in the selected blend, so it is omitted here -- dropping a
        zero-weight model changes nothing and keeps the dependency list small.

PROBLEM CONTEXT (for reviewers)
-------------------------------
Gridlock 2.0 traffic-demand regression. Target `demand` in (0, 1]; metric RMSE,
with evaluation score = 100 * (1 - RMSE). `dataset/train.csv` = day 48 (all 96
fifteen-minute slots) + day 49 slots 0-120 min; `dataset/test.csv` = day 49
slots 135-825 min (the daytime window we must forecast). Columns: Index,
geohash (6-char), day, timestamp (H:M), demand, RoadType, NumberofLanes,
LargeVehicles, Landmarks, Temperature, Weather.

DETERMINISM
-----------
Every model is fit with a FIXED, hard-coded seed (and seed-averaged over a fixed
list of seeds). No Optuna, no proxy/CV search, no blend re-optimization: the
final hyper-parameters, round counts, seed lists and blend weights were already
selected offline and are BAKED IN below. Running this script twice on the same
machine/library versions yields the same `submission_BC.csv`.

HOW TO RUN
----------
    python reproduce.py

Expected output: `submission_BC.csv` (41778 rows, columns [Index, demand]) in
this directory, plus a printed verification against the reference winner if
`submission_BC.csv` reference is present (see README).

Colab-compatible: missing dependencies are pip-installed automatically, and the
data is located by probing a few common directories.
================================================================================
"""
from __future__ import annotations

import os
import sys
import time
import warnings

warnings.filterwarnings("ignore")
T0 = time.time()


def tlog(*a):
    # ASCII-only prints + flush=True so the background log streams cleanly on a
    # Windows cp1252 console.
    print(f"[{time.time() - T0:7.1f}s]", *a, flush=True)


# --------------------------------------------------------------- dependencies
def _ensure_deps():
    """Colab/portability convenience: pip-install ONLY genuinely missing deps.

    On the judging machine these are already installed, so nothing happens.
    """
    import importlib.util

    need = {
        "numpy": "numpy",
        "pandas": "pandas",
        "sklearn": "scikit-learn",  # imported as sklearn, installed as scikit-learn
        "lightgbm": "lightgbm",
        "xgboost": "xgboost",
    }
    missing = [pkg for mod, pkg in need.items() if importlib.util.find_spec(mod) is None]
    if missing:
        tlog(f"installing missing deps: {missing}")
        import subprocess

        subprocess.run([sys.executable, "-m", "pip", "install", "-q", *missing], check=False)


_ensure_deps()

import numpy as np
import pandas as pd

# ===================================================================== config
SEED = 42
TARGET = "demand"

# Approach B: seed-averaged LightGBM over seeds [42, 43, 44, 45, 46, 47].
B_N_SEEDS = 6
B_SEEDS = [SEED + s for s in range(B_N_SEEDS)]
# Round count selected offline by the daytime proxy (approach_B_log.json).
B_ROUNDS = 437

# Approach C: seed-averaged over seeds [42, 143, 244, 345] (SEED + i*101).
C_N_SEEDS = 4
C_SEEDS = [SEED + i * 101 for i in range(C_N_SEEDS)]
# Round counts calibrated offline via lag-present CV-A (approach_C_log.json).
C_LGB_ROUNDS = 217
C_XGB_ROUNDS = 259
# Blend weights selected offline (approach_C_log.json). CatBoost weight was 0.0.
C_W_LGB = 0.4059685413137164
C_W_XGB = 0.5940314586862836

# day-49 TEST / evaluation horizon (minutes since midnight); informational.
DAY_LO, DAY_HI = 135, 825

# Native categoricals handled by the tree models.
CAT = ["geohash", "RoadType", "Weather"]
# XGBoost drops `geohash` (native categorical crashes on unseen geohashes); geo
# information is retained via geo_mean / lat / lon.
CAT_XGB = ["RoadType", "Weather"]


def rmse(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    return float(np.sqrt(np.mean((y - p) ** 2)))


# --------------------------------------------------------------- data loading
def load_data():
    """Locate train.csv / test.csv robustly (local repo layout or Colab)."""
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "..", "dataset"),  # repo layout: HACKATHON/dataset
        os.path.join(here, "dataset"),
        ".",
        "dataset",
        "/content",
        "/content/dataset",
    ]
    for b in candidates:
        tr, te = os.path.join(b, "train.csv"), os.path.join(b, "test.csv")
        if os.path.exists(tr) and os.path.exists(te):
            tlog(f"data dir: {os.path.abspath(b)}")
            return pd.read_csv(tr), pd.read_csv(te)
    try:
        from google.colab import files  # noqa: F401

        tlog("upload train.csv and test.csv ...")
        files.upload()
        return pd.read_csv("train.csv"), pd.read_csv("test.csv")
    except Exception as e:
        raise FileNotFoundError("train.csv / test.csv not found.") from e


# =============================================================================
# SHARED PRIMITIVES (geohash decode + timestamp parsing) -- identical math in
# both approaches, so they are defined once here.
# =============================================================================
_B32 = "0123456789bcdefghjkmnpqrstuvwxyz"
_DEC = {c: i for i, c in enumerate(_B32)}


def decode_geohash(gh):
    """Decode a geohash string to (lat, lon) at the cell centre."""
    a, b, c, d = -90.0, 90.0, -180.0, 180.0
    even = True
    for ch in str(gh):
        idx = _DEC.get(ch)
        if idx is None:
            continue
        for m in (16, 8, 4, 2, 1):
            if even:
                mid = (c + d) / 2
                c, d = (mid, d) if idx & m else (c, mid)
            else:
                mid = (a + b) / 2
                a, b = (mid, b) if idx & m else (a, mid)
            even = not even
    return (a + b) / 2, (c + d) / 2


def ts_to_min(ts):
    p = ts.astype(str).str.strip().str.split(":", expand=True)
    return (pd.to_numeric(p[0], errors="coerce") * 60
            + pd.to_numeric(p[1], errors="coerce")).astype("float64")


# =============================================================================
# APPROACH B -- daytime-aware LightGBM (verbatim recipe from src/approach_B.py)
#
# Feature machinery: B's own `add_base_B` (adds gh5/gh4 prefixes) + `EncoderB`
# (adds road_tod_mean / lanes_tod_mean and other families). Only the kept families
# end up in the model; here we hard-code the selected kept set: v1 base + the
# `+road/lanes_tod` family (road_tod_mean, lanes_tod_mean). The per-cell lag
# `geo_tod_mean` is left NaN for unseen (geohash, tod) pairs -- LightGBM handles
# NaN natively (B deliberately does NOT back-fill it, unlike Approach C).
# =============================================================================
def add_base_B(df):
    df = df.copy()
    df["tod"] = ts_to_min(df["timestamp"])
    df["hour"] = (df["tod"] // 60).astype("float64")
    df["minute"] = (df["tod"] % 60).astype("float64")
    df["tod_sin"] = np.sin(2 * np.pi * df["tod"] / 1440.0)
    df["tod_cos"] = np.cos(2 * np.pi * df["tod"] / 1440.0)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    uniq = pd.Index(df["geohash"].dropna().unique())
    ll = pd.DataFrame([(g, *decode_geohash(g)) for g in uniq],
                      columns=["geohash", "lat", "lon"])
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


class EncoderB:
    """Fit demand aggregates on a leakage-safe reference; transform any frame.

    All target-derived tables come from `ref` ONLY. Per-cell time lags
    (geo_tod/geo_hour) are populated only when `cross_day=True`, so the current
    training day never sees its own same-slot demand.
    """

    def __init__(self, smooth=20):
        self.smooth = smooth

    def _smooth_group(self, d, keys, name, k):
        grp = d.groupby(keys)[TARGET]
        m, c = grp.mean(), grp.count()
        sm = (m * c + self.gm * k) / (c + k)
        return sm.rename(name).reset_index()

    def fit(self, ref):
        d = ref
        self.gm = float(d[TARGET].mean())
        g = d.groupby("geohash")[TARGET]
        self.geo = pd.DataFrame({
            "geo_mean": g.mean(), "geo_std": g.std(), "geo_median": g.median(),
            "geo_min": g.min(), "geo_max": g.max(), "geo_cnt": g.count(),
        })
        n = self.geo["geo_cnt"]
        self.geo["geo_mean_smooth"] = (self.geo["geo_mean"] * n + self.gm * self.smooth) / (n + self.smooth)
        t = d.groupby("tod")[TARGET]
        self.tod = pd.DataFrame({"tod_mean": t.mean(), "tod_std": t.std()})
        self.road = pd.DataFrame({"road_mean": d.groupby("RoadType")[TARGET].mean()})
        self.road_tod = self._smooth_group(d, ["RoadType", "tod"], "road_tod_mean", 10)
        self.lanes_tod = self._smooth_group(d, ["NumberofLanes", "tod"], "lanes_tod_mean", 10)
        g5 = d.groupby("gh5")[TARGET]
        self.gh5 = pd.DataFrame({"gh5_mean": g5.mean(), "gh5_std": g5.std()})
        self.gh4 = pd.DataFrame({"gh4_mean": d.groupby("gh4")[TARGET].mean()})
        self.geo_tod = (d.groupby(["geohash", "tod"])[TARGET].mean()
                        .rename("geo_tod_mean").reset_index())
        dd = d.copy()
        dd["hour"] = (dd["tod"] // 60)
        self.geo_hour = (dd.groupby(["geohash", "hour"])[TARGET].mean()
                         .rename("geo_hour_mean").reset_index())
        self.geo_freq = d.groupby("geohash").size().rename("geo_freq")
        return self

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
            o["geo_tod_mean"] = np.nan
            o["geo_hour_mean"] = np.nan
        # spatial back-off: cell -> gh5 -> gh4 -> global
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
        # relative intensity (how busy a cell is vs its road class / region)
        o["geo_vs_road"] = o["geo_mean_smooth"] / (o["road_mean"] + 1e-6)
        o["geo_vs_gh5"] = o["geo_mean_smooth"] / (o["gh5_mean"] + 1e-6)
        return o


# v1 base feature set (== features.py::feature_columns()) ...
B_BASE_FEATS = [
    "tod", "hour", "minute", "tod_sin", "tod_cos", "hour_sin", "hour_cos", "day",
    "lat", "lon", "NumberofLanes", "Temperature", "large_veh_bin", "landmarks_bin",
    "temp_missing", "weather_missing", "roadtype_missing",
    "geo_mean", "geo_std", "geo_median", "geo_min", "geo_max", "geo_cnt",
    "geo_mean_smooth", "tod_mean", "tod_std", "geo_tod_mean", "road_mean", "geo_freq",
    "geohash", "RoadType", "Weather",
]
# ... PLUS the one kept family (selected offline): +road/lanes_tod.
B_FEATS = B_BASE_FEATS + ["road_tod_mean", "lanes_tod_mean"]


def cast_B(df, feats):
    df = df[feats].copy()
    for c in CAT:
        if c in df.columns:
            df[c] = df[c].astype("category")
    return df


def fit_lgbm_B(Xtr, ytr, Xpred, rounds, seed):
    """Final LightGBM fit (no validation set, fixed rounds). v1 params; only
    `seed` varies for seed-averaging."""
    import lightgbm as lgb

    params = dict(objective="regression", metric="rmse", learning_rate=0.03,
                  num_leaves=63, min_child_samples=40, subsample=0.8, subsample_freq=1,
                  colsample_bytree=0.8, reg_lambda=2.0, reg_alpha=0.5, max_depth=-1,
                  seed=seed, n_jobs=-1, verbose=-1)
    dtr = lgb.Dataset(Xtr, ytr, categorical_feature=CAT, free_raw_data=False)
    m = lgb.train(params, dtr, num_boost_round=rounds,
                  valid_sets=[dtr], valid_names=["train"],
                  callbacks=[lgb.log_evaluation(0)])
    return np.clip(m.predict(Xpred, num_iteration=rounds), 0, 1)


def build_B(raw_train, raw_test):
    """Rebuild Approach B and return its test predictions (clipped [0,1])."""
    tlog("=== Approach B: seed-averaged LightGBM (v1 + road/lanes_tod) ===")
    train = add_base_B(raw_train)
    test = add_base_B(raw_test)
    d48 = train[train.day == 48].copy().reset_index(drop=True)
    d49 = train[train.day == 49].copy().reset_index(drop=True)

    # Aggregates fit on day 48 only. day48 has no prior day (cross_day=False);
    # day49 morning and the test daytime window get the day-over-day lag
    # (cross_day=True) which equals day48's same-slot demand.
    enc = EncoderB().fit(d48)
    f48 = enc.transform(d48, cross_day=False)
    f49 = enc.transform(d49, cross_day=True)
    fte = enc.transform(test, cross_day=True)
    full = pd.concat([f48, f49], ignore_index=True)

    Xf, yf = cast_B(full, B_FEATS), full[TARGET].values
    Xte = cast_B(fte, B_FEATS)

    preds = np.zeros(len(test))
    for s in B_SEEDS:
        preds += fit_lgbm_B(Xf, yf, Xte, rounds=B_ROUNDS, seed=s) / B_N_SEEDS
        tlog(f"  B seed {s} done")
    preds = np.clip(preds, 0, 1)
    tlog(f"  B pred: min={preds.min():.4f} mean={preds.mean():.5f} max={preds.max():.4f}")
    return test["Index"].values, preds


# =============================================================================
# APPROACH C -- LightGBM (v1) + XGBoost(geohash dropped) blend.
#
# Feature machinery: the SIMPLER v1 machinery from src/features.py
# (`add_base_features` + `HistoryEncoder`). NOTE this differs from Approach B:
# here `geo_tod_mean` IS back-filled (geo_mean_smooth -> tod_mean -> global),
# and there are no gh5/gh4/road_tod features. We reproduce it verbatim.
# CatBoost is omitted because its selected blend weight was exactly 0.0.
# =============================================================================
def add_base_features(df):
    """Row-local, leakage-free features (no target use) -- features.py verbatim."""
    df = df.copy()
    df["tod"] = ts_to_min(df["timestamp"])
    df["hour"] = (df["tod"] // 60).astype("float64")
    df["minute"] = (df["tod"] % 60).astype("float64")
    df["tod_sin"] = np.sin(2 * np.pi * df["tod"] / 1440.0)
    df["tod_cos"] = np.cos(2 * np.pi * df["tod"] / 1440.0)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    uniq = pd.Index(df["geohash"].dropna().unique())
    latlon = pd.DataFrame([(g, *decode_geohash(g)) for g in uniq],
                          columns=["geohash", "lat", "lon"])
    df = df.merge(latlon, on="geohash", how="left")
    df["NumberofLanes"] = pd.to_numeric(df["NumberofLanes"], errors="coerce")
    df["Temperature"] = pd.to_numeric(df["Temperature"], errors="coerce")
    df["large_veh_bin"] = (df["LargeVehicles"].astype(str) == "Allowed").astype("int8")
    df["landmarks_bin"] = (df["Landmarks"].astype(str) == "Yes").astype("int8")
    df["temp_missing"] = df["Temperature"].isna().astype("int8")
    df["weather_missing"] = df["Weather"].isna().astype("int8")
    df["roadtype_missing"] = df["RoadType"].isna().astype("int8")
    return df


class HistoryEncoder:
    """Fit demand aggregates on a REFERENCE frame, then apply to any target frame
    -- features.py verbatim. `geo_tod` (per-(geohash,tod) mean) equals the
    day-over-day lag when ref=day48 and target=day49."""

    def __init__(self, global_smoothing: int = 20):
        self.global_smoothing = global_smoothing
        self.global_mean_ = np.nan

    def fit(self, ref):
        d = ref
        self.global_mean_ = float(d[TARGET].mean())
        g = d.groupby("geohash")[TARGET]
        self.geo_ = pd.DataFrame({
            "geo_mean": g.mean(), "geo_std": g.std(), "geo_median": g.median(),
            "geo_min": g.min(), "geo_max": g.max(), "geo_cnt": g.count(),
        })
        n = self.geo_["geo_cnt"]
        self.geo_["geo_mean_smooth"] = (
            (self.geo_["geo_mean"] * n + self.global_mean_ * self.global_smoothing)
            / (n + self.global_smoothing)
        )
        t = d.groupby("tod")[TARGET]
        self.tod_ = pd.DataFrame({"tod_mean": t.mean(), "tod_std": t.std()})
        gt = d.groupby(["geohash", "tod"])[TARGET].mean().rename("geo_tod_mean")
        self.geo_tod_ = gt.reset_index()
        r = d.groupby("RoadType")[TARGET]
        self.road_ = pd.DataFrame({"road_mean": r.mean()})
        self.geo_freq_ = d.groupby("geohash").size().rename("geo_freq")
        return self

    def transform(self, df, use_geo_tod: bool = True):
        out = df.copy()
        out = out.merge(self.geo_, on="geohash", how="left")
        out = out.merge(self.tod_, on="tod", how="left")
        out = out.merge(self.road_, on="RoadType", how="left")
        out = out.merge(self.geo_freq_.reset_index(), on="geohash", how="left")
        if use_geo_tod:
            out = out.merge(self.geo_tod_, on=["geohash", "tod"], how="left")
        else:
            out["geo_tod_mean"] = np.nan
        # geo_tod backs off to geo_mean_smooth -> tod_mean -> global
        out["geo_tod_mean"] = (
            out["geo_tod_mean"]
            .fillna(out["geo_mean_smooth"])
            .fillna(out["tod_mean"])
            .fillna(self.global_mean_)
        )
        for c in ["geo_mean", "geo_mean_smooth", "geo_median", "road_mean", "tod_mean"]:
            out[c] = out[c].fillna(self.global_mean_)
        for c in ["geo_std", "tod_std", "geo_min", "geo_max"]:
            out[c] = out[c].fillna(0.0)
        out["geo_freq"] = out["geo_freq"].fillna(0).astype("float64")
        out["geo_cnt"] = out["geo_cnt"].fillna(0).astype("float64")
        return out


# v1 feature columns (features.py::feature_columns()).
C_FEATS = [
    "tod", "hour", "minute", "tod_sin", "tod_cos", "hour_sin", "hour_cos", "day",
    "lat", "lon",
    "NumberofLanes", "Temperature", "large_veh_bin", "landmarks_bin",
    "temp_missing", "weather_missing", "roadtype_missing",
    "geo_mean", "geo_std", "geo_median", "geo_min", "geo_max", "geo_cnt",
    "geo_mean_smooth", "tod_mean", "tod_std", "geo_tod_mean", "road_mean", "geo_freq",
    "geohash", "RoadType", "Weather",
]
C_FEATS_XGB = [c for c in C_FEATS if c != "geohash"]


def cast_lgb_C(df):
    o = df[C_FEATS].copy()
    for c in CAT:
        o[c] = o[c].astype("category")
    return o


def prep_xgb_C(df):
    o = df[C_FEATS_XGB].copy()
    for c in CAT_XGB:
        o[c] = o[c].astype("object").where(o[c].notna(), "NA").astype("category")
    return o


def fit_lgb_C(Xtr, ytr, Xpred, seed, rounds):
    """Final LightGBM fit for Approach C (v1 params, no validation set)."""
    import lightgbm as lgb

    params = dict(objective="regression", metric="rmse", learning_rate=0.03,
                  num_leaves=63, min_child_samples=40, subsample=0.8, subsample_freq=1,
                  colsample_bytree=0.8, reg_lambda=2.0, reg_alpha=0.5,
                  max_depth=-1, seed=seed, n_jobs=-1, verbose=-1)
    dtr = lgb.Dataset(Xtr, label=ytr, categorical_feature=CAT, free_raw_data=False)
    m = lgb.train(params, dtr, num_boost_round=rounds,
                  valid_sets=[dtr], valid_names=["train"],
                  callbacks=[lgb.log_evaluation(0)])
    return np.clip(m.predict(Xpred, num_iteration=rounds), 0, 1)


def fit_xgb_C(Xtr, ytr, Xpred, seed, rounds):
    """Final XGBoost fit for Approach C (no validation set; uses all `rounds`).

    Mirrors approach_C.fit_xgb: with no early stopping `best_iteration` is unset,
    so prediction uses the full booster (all `rounds` trees)."""
    import xgboost as xgb

    params = dict(objective="reg:squarederror", eval_metric="rmse", eta=0.03,
                  max_depth=8, subsample=0.8, colsample_bytree=0.8,
                  min_child_weight=5.0, reg_lambda=2.0, reg_alpha=0.5,
                  tree_method="hist", max_cat_to_onehot=1, seed=seed)
    dtr = xgb.DMatrix(Xtr, label=ytr, enable_categorical=True)
    dpred = xgb.DMatrix(Xpred, enable_categorical=True)
    m = xgb.train(params, dtr, num_boost_round=rounds, evals=[], verbose_eval=False)
    it = getattr(m, "best_iteration", None)
    rng = dict(iteration_range=(0, it + 1)) if it is not None else {}
    return np.clip(m.predict(dpred, **rng), 0, 1)


def build_C(raw_train, raw_test):
    """Rebuild Approach C and return its test predictions (clipped [0,1])."""
    tlog("=== Approach C: 0.406*LightGBM(v1) + 0.594*XGBoost(no geohash) ===")
    train = add_base_features(raw_train)
    test = add_base_features(raw_test)
    d48 = train[train.day == 48].copy().reset_index(drop=True)
    d49 = train[train.day == 49].copy().reset_index(drop=True)

    # Aggregates fit on day 48; day48 has no prior day (use_geo_tod=False), while
    # day49 morning and the test daytime window get the day48 same-slot lag.
    he = HistoryEncoder().fit(d48)
    d48_e = he.transform(d48, use_geo_tod=False)
    d49_e = he.transform(d49, use_geo_tod=True)
    test_e = he.transform(test, use_geo_tod=True)
    full = pd.concat([d48_e, d49_e], ignore_index=True)
    yf = full[TARGET].values

    Xf_l, Xte_l = cast_lgb_C(full), cast_lgb_C(test_e)
    Xf_x, Xte_x = prep_xgb_C(full), prep_xgb_C(test_e)

    # LightGBM (v1 params), seed-averaged.
    pl = np.zeros(len(test))
    for j, s in enumerate(C_SEEDS):
        pl += fit_lgb_C(Xf_l, yf, Xte_l, seed=s, rounds=C_LGB_ROUNDS) / C_N_SEEDS
        tlog(f"  C LGBM seed {j + 1}/{C_N_SEEDS} done")
    tlog(f"  C LGBM mean={pl.mean():.5f}")

    # XGBoost (geohash dropped), seed-averaged.
    px = np.zeros(len(test))
    for j, s in enumerate(C_SEEDS):
        px += fit_xgb_C(Xf_x, yf, Xte_x, seed=s, rounds=C_XGB_ROUNDS) / C_N_SEEDS
        tlog(f"  C XGB seed {j + 1}/{C_N_SEEDS} done")
    tlog(f"  C XGB mean={px.mean():.5f}")

    preds = np.clip(C_W_LGB * pl + C_W_XGB * px, 0, 1)
    tlog(f"  C pred: min={preds.min():.4f} mean={preds.mean():.5f} max={preds.max():.4f}")
    return test["Index"].values, preds


# ===================================================================== verify
def verify_against_reference(sub, here):
    """If a reference winner is present, report max-abs-diff and correlation."""
    ref_path = os.path.join(here, "submission_BC_reference.csv")
    if not os.path.exists(ref_path):
        # Fall back to the in-repo validated winner if available.
        repo_ref = os.path.join(here, "..", "ml_hackathon_solution", "submissions",
                                 "submission_BC.csv")
        ref_path = repo_ref if os.path.exists(repo_ref) else None
    if ref_path is None or not os.path.exists(ref_path):
        tlog("verify: no reference file found -- skipping comparison")
        return
    ref = pd.read_csv(ref_path).sort_values("Index").reset_index(drop=True)
    mine = sub.sort_values("Index").reset_index(drop=True)
    merged = mine.merge(ref, on="Index", suffixes=("_new", "_ref"))
    diff = (merged["demand_new"] - merged["demand_ref"]).abs()
    corr = float(np.corrcoef(merged["demand_new"], merged["demand_ref"])[0, 1])
    tlog(f"verify vs reference ({os.path.basename(ref_path)}): "
         f"rows={len(merged)} max_abs_diff={diff.max():.3e} "
         f"mean_abs_diff={diff.mean():.3e} corr={corr:.8f}")


# ======================================================================= main
def main():
    here = os.path.dirname(os.path.abspath(__file__))
    raw_train, raw_test = load_data()
    tlog(f"loaded: train={len(raw_train)} test={len(raw_test)} "
         f"(daytime horizon [{DAY_LO},{DAY_HI}] min)")

    idx_b, preds_b = build_B(raw_train, raw_test)
    idx_c, preds_c = build_C(raw_train, raw_test)

    # B and C are built on the same test frame in the same row order; assert it.
    assert np.array_equal(idx_b, idx_c), "B and C produced different Index ordering"

    preds_bc = np.clip(0.5 * preds_b + 0.5 * preds_c, 0, 1)
    sub = pd.DataFrame({"Index": idx_b, "demand": preds_bc})

    out_path = os.path.join(here, "submission_BC.csv")
    sub.to_csv(out_path, index=False)
    tlog(f"wrote {out_path} rows={len(sub)}")
    tlog(f"BC pred: min={preds_bc.min():.4f} mean={preds_bc.mean():.5f} "
         f"max={preds_bc.max():.4f}")

    verify_against_reference(sub, here)
    tlog("[done]")


if __name__ == "__main__":
    main()
