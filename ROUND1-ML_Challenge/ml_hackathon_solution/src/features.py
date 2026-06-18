"""
Feature engineering for Gridlock 2.0 traffic demand prediction.

Design principles:
- Deterministic & reproducible (no randomness here).
- "History" aggregates (per-geohash / per-tod / per-(geohash,tod)) are LEAKAGE-PRONE,
  so they are FIT on a caller-provided reference frame (e.g. day 48 only) and then
  applied to the target frame. The caller is responsible for passing a leakage-safe
  reference (see train.py for the day48 -> day49 protocol).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

# ----------------------------------------------------------------- geohash
_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
_DECODE_MAP = {c: i for i, c in enumerate(_BASE32)}


def decode_geohash(geohash: str) -> tuple[float, float]:
    """Decode a geohash string to (lat, lon) at the cell centre."""
    lat_lo, lat_hi = -90.0, 90.0
    lon_lo, lon_hi = -180.0, 180.0
    even = True
    for ch in geohash:
        idx = _DECODE_MAP.get(ch)
        if idx is None:
            continue
        for mask in (16, 8, 4, 2, 1):
            if even:
                mid = (lon_lo + lon_hi) / 2
                if idx & mask:
                    lon_lo = mid
                else:
                    lon_hi = mid
            else:
                mid = (lat_lo + lat_hi) / 2
                if idx & mask:
                    lat_lo = mid
                else:
                    lat_hi = mid
            even = not even
    return (lat_lo + lat_hi) / 2, (lon_lo + lon_hi) / 2


def _geohash_latlon_table(geohashes: pd.Series) -> pd.DataFrame:
    uniq = pd.Index(geohashes.dropna().unique())
    rows = [(g, *decode_geohash(g)) for g in uniq]
    return pd.DataFrame(rows, columns=["geohash", "lat", "lon"])


# ------------------------------------------------------------ base features
TARGET = "demand"
CAT_COLS = ["geohash", "RoadType", "Weather", "LargeVehicles", "Landmarks"]


def timestamp_to_min(ts: pd.Series) -> pd.Series:
    parts = ts.astype(str).str.strip().str.split(":", expand=True)
    h = pd.to_numeric(parts[0], errors="coerce")
    m = pd.to_numeric(parts[1], errors="coerce")
    return (h * 60 + m).astype("float64")


def add_base_features(df: pd.DataFrame) -> pd.DataFrame:
    """Row-local, leakage-free features (no target use)."""
    df = df.copy()
    df["tod"] = timestamp_to_min(df["timestamp"])
    df["hour"] = (df["tod"] // 60).astype("float64")
    df["minute"] = (df["tod"] % 60).astype("float64")
    # cyclical encodings (period = 1 day = 1440 min, and 1 hour = 60 min)
    df["tod_sin"] = np.sin(2 * np.pi * df["tod"] / 1440.0)
    df["tod_cos"] = np.cos(2 * np.pi * df["tod"] / 1440.0)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)

    # spatial
    latlon = _geohash_latlon_table(df["geohash"])
    df = df.merge(latlon, on="geohash", how="left")

    # numeric coercion / redundancy-aware encodings
    df["NumberofLanes"] = pd.to_numeric(df["NumberofLanes"], errors="coerce")
    df["Temperature"] = pd.to_numeric(df["Temperature"], errors="coerce")
    df["large_veh_bin"] = (df["LargeVehicles"].astype(str) == "Allowed").astype("int8")
    df["landmarks_bin"] = (df["Landmarks"].astype(str) == "Yes").astype("int8")

    # missingness flags (MCAR but cheap signal / robustness)
    df["temp_missing"] = df["Temperature"].isna().astype("int8")
    df["weather_missing"] = df["Weather"].isna().astype("int8")
    df["roadtype_missing"] = df["RoadType"].isna().astype("int8")
    return df


# ------------------------------------------------- history (leakage-prone) aggregates
class HistoryEncoder:
    """
    Fit demand aggregates on a REFERENCE frame (must contain `demand`), then apply
    to any target frame. Keep the reference leakage-safe (e.g. a prior day).

    `geo_tod` is the per-(geohash, tod) mean demand on the reference day; when the
    reference is day 48 and the target is day 49 this equals the day-over-day lag.
    """

    def __init__(self, global_smoothing: int = 20):
        self.global_smoothing = global_smoothing
        self.global_mean_: float = np.nan
        self.geo_: pd.DataFrame | None = None
        self.tod_: pd.DataFrame | None = None
        self.geo_tod_: pd.DataFrame | None = None
        self.road_: pd.DataFrame | None = None
        self.geo_freq_: pd.Series | None = None

    def fit(self, ref: pd.DataFrame) -> "HistoryEncoder":
        d = ref
        self.global_mean_ = float(d[TARGET].mean())

        g = d.groupby("geohash")[TARGET]
        self.geo_ = pd.DataFrame({
            "geo_mean": g.mean(), "geo_std": g.std(), "geo_median": g.median(),
            "geo_min": g.min(), "geo_max": g.max(), "geo_cnt": g.count(),
        })
        # smoothed geo_mean toward global
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

    def transform(self, df: pd.DataFrame, use_geo_tod: bool = True) -> pd.DataFrame:
        out = df.copy()
        out = out.merge(self.geo_, on="geohash", how="left")
        out = out.merge(self.tod_, on="tod", how="left")
        out = out.merge(self.road_, on="RoadType", how="left")
        out = out.merge(self.geo_freq_.reset_index(), on="geohash", how="left")
        if use_geo_tod:
            out = out.merge(self.geo_tod_, on=["geohash", "tod"], how="left")
        else:
            out["geo_tod_mean"] = np.nan

        # fills: geo_tod backs off to geo_mean_smooth -> tod_mean -> global
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


# columns fed to the model
def feature_columns() -> list[str]:
    return [
        # time
        "tod", "hour", "minute", "tod_sin", "tod_cos", "hour_sin", "hour_cos", "day",
        # space
        "lat", "lon",
        # context
        "NumberofLanes", "Temperature", "large_veh_bin", "landmarks_bin",
        "temp_missing", "weather_missing", "roadtype_missing",
        # history aggregates
        "geo_mean", "geo_std", "geo_median", "geo_min", "geo_max", "geo_cnt",
        "geo_mean_smooth", "tod_mean", "tod_std", "geo_tod_mean", "road_mean", "geo_freq",
        # native categoricals (handled by model)
        "geohash", "RoadType", "Weather",
    ]


def categorical_columns() -> list[str]:
    return ["geohash", "RoadType", "Weather"]
