"""
Deep, leakage-first EDA for the Gridlock 2.0 Traffic Demand Prediction problem.

Run:  python ml_hackathon_solution/src/01_eda.py
Writes a human-readable report to ml_hackathon_solution/outputs/eda_report.txt
and a machine-readable summary to ml_hackathon_solution/outputs/eda_summary.json.

This script makes NO modeling decisions. It only characterises the data so that
the validation strategy and feature engineering can be designed on evidence.
"""

from __future__ import annotations

import json
import os
import sys
from contextlib import redirect_stdout

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                      # ml_hackathon_solution/
REPO = os.path.dirname(ROOT)                      # HACKATHON/
DATA_DIR = os.path.join(REPO, "dataset")
OUT_DIR = os.path.join(ROOT, "outputs")
os.makedirs(OUT_DIR, exist_ok=True)

TRAIN = os.path.join(DATA_DIR, "train.csv")
TEST = os.path.join(DATA_DIR, "test.csv")
SAMPLE = os.path.join(DATA_DIR, "sample_submission.csv")

TARGET = "demand"
summary: dict = {}


def hr(title: str) -> None:
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


def parse_timestamp_to_min(ts: pd.Series) -> pd.Series:
    """'H:M' -> minutes since midnight. Robust to ' 0:0' style values."""
    parts = ts.astype(str).str.strip().str.split(":", expand=True)
    h = pd.to_numeric(parts[0], errors="coerce")
    m = pd.to_numeric(parts[1], errors="coerce")
    return h * 60 + m


def main() -> None:
    train = pd.read_csv(TRAIN)
    test = pd.read_csv(TEST)
    sample = pd.read_csv(SAMPLE)

    hr("0. FILE SHAPES & COLUMNS")
    print(f"train: {train.shape}")
    print(f"test : {test.shape}")
    print(f"sample_submission: {sample.shape}")
    print(f"\ntrain columns: {list(train.columns)}")
    print(f"test  columns: {list(test.columns)}")
    print(f"sample columns: {list(sample.columns)}")
    summary["shapes"] = {"train": train.shape, "test": test.shape, "sample": sample.shape}
    summary["train_cols"] = list(train.columns)
    summary["test_cols"] = list(test.columns)

    print("\ndtypes (train):")
    print(train.dtypes)

    # ---------------------------------------------------------------- TARGET
    hr("1. TARGET DISTRIBUTION (demand)")
    y = pd.to_numeric(train[TARGET], errors="coerce")
    desc = y.describe(percentiles=[0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99])
    print(desc)
    n_neg = int((y < 0).sum())
    n_zero = int((y == 0).sum())
    print(f"\nnegative values : {n_neg}")
    print(f"exact zeros     : {n_zero}")
    print(f"NaN target      : {int(y.isna().sum())}")
    print(f"skewness        : {y.skew():.4f}")
    print(f"kurtosis        : {y.kurtosis():.4f}")
    # log1p skew (target is >=0, small) to gauge transform usefulness
    if (y.dropna() >= 0).all():
        print(f"skew(log1p(y))  : {np.log1p(y.dropna()).skew():.4f}")
    summary["target"] = {
        "min": float(y.min()), "max": float(y.max()), "mean": float(y.mean()),
        "std": float(y.std()), "skew": float(y.skew()),
        "n_zero": n_zero, "n_neg": n_neg, "n_nan": int(y.isna().sum()),
    }

    # ------------------------------------------------------ TIME STRUCTURE
    hr("2. TEMPORAL STRUCTURE (day / timestamp)")
    for name, df in [("train", train), ("test", test)]:
        days = sorted(df["day"].dropna().unique().tolist())
        tod = parse_timestamp_to_min(df["timestamp"])
        slots = sorted(tod.dropna().unique().tolist())
        print(f"\n[{name}] unique days ({len(days)}): {days[:20]}{' ...' if len(days) > 20 else ''}")
        print(f"[{name}] day range: {min(days)}..{max(days)}")
        print(f"[{name}] unique time-of-day slots: {len(slots)} "
              f"(min={min(slots)}min, max={max(slots)}min)")
        # infer slot granularity
        if len(slots) > 1:
            diffs = np.diff(slots)
            print(f"[{name}] slot granularity (min diff): {int(np.min(diffs))} minutes")
        summary[f"{name}_days"] = days
        summary[f"{name}_n_slots"] = len(slots)

    train_days = set(train["day"].unique())
    test_days = set(test["day"].unique())
    print(f"\nday overlap train∩test: {sorted(train_days & test_days)}")
    print(f"days only in test (FORECAST horizon): {sorted(test_days - train_days)}")
    summary["day_overlap"] = sorted(train_days & test_days)
    summary["test_only_days"] = sorted(test_days - train_days)

    # -------------------------------------------------- GEOHASH / GROUPS
    hr("3. SPATIAL STRUCTURE (geohash)")
    g_tr = set(train["geohash"].unique())
    g_te = set(test["geohash"].unique())
    print(f"unique geohash train: {len(g_tr)}")
    print(f"unique geohash test : {len(g_te)}")
    print(f"geohash in test but NOT in train (cold-start): {len(g_te - g_tr)}")
    print(f"geohash in train but NOT in test            : {len(g_tr - g_te)}")
    print(f"geohash overlap                             : {len(g_tr & g_te)}")
    print(f"geohash string lengths (train): {sorted(train['geohash'].astype(str).str.len().unique())}")
    summary["geohash"] = {
        "n_train": len(g_tr), "n_test": len(g_te),
        "test_cold_start": len(g_te - g_tr), "overlap": len(g_tr & g_te),
    }

    # rows per geohash per day -> is it a regular grid?
    gpd = train.groupby(["geohash", "day"]).size()
    print(f"\nrows per (geohash, day) in train: "
          f"min={gpd.min()}, median={int(gpd.median())}, max={gpd.max()}")
    print(f"is train a full (geohash x slot) grid per day? "
          f"{'likely yes' if gpd.nunique() == 1 else 'NO - irregular'}")

    # ------------------------------------------------------- MISSINGNESS
    hr("4. MISSING VALUES")
    for name, df in [("train", train), ("test", test)]:
        miss = df.isna().sum()
        miss = miss[miss > 0].sort_values(ascending=False)
        print(f"\n[{name}] columns with missing values:")
        if len(miss):
            for c, v in miss.items():
                print(f"   {c:16s} {v:8d}  ({100*v/len(df):5.2f}%)")
        else:
            print("   none")
        summary[f"{name}_missing"] = {c: int(v) for c, v in miss.items()}

    # --------------------------------------------------------- DUPLICATES
    hr("5. DUPLICATES")
    feat_cols = [c for c in train.columns if c not in ("Index", TARGET)]
    dup_full = int(train.duplicated().sum())
    dup_feat = int(train.duplicated(subset=feat_cols).sum())
    key_cols = ["geohash", "day", "timestamp"]
    dup_key = int(train.duplicated(subset=key_cols).sum())
    print(f"fully duplicated rows         : {dup_full}")
    print(f"duplicated on features (no Index/target): {dup_feat}")
    print(f"duplicated on key {key_cols}: {dup_key}  "
          f"(>0 means multiple demand per cell/time)")
    summary["duplicates"] = {"full": dup_full, "features": dup_feat, "key": dup_key}

    # ------------------------------------------- CATEGORICAL / COLLINEARITY
    hr("6. CATEGORICAL FEATURES & SUSPECTED COLLINEARITY")
    for c in ["RoadType", "Weather", "LargeVehicles", "Landmarks", "NumberofLanes"]:
        if c in train.columns:
            vc = train[c].value_counts(dropna=False)
            print(f"\n[{c}] value counts (train):")
            print(vc.head(12).to_string())

    # Check the suspected deterministic map NumberofLanes -> (LargeVehicles, Landmarks)
    print("\n-- NumberofLanes -> (LargeVehicles, Landmarks) cross-tab (train) --")
    cross = (train.dropna(subset=["NumberofLanes"])
             .groupby("NumberofLanes")[["LargeVehicles", "Landmarks"]]
             .agg(lambda s: s.value_counts(dropna=False).index[0]))
    print(cross.to_string())
    purity = (train.groupby("NumberofLanes")[["LargeVehicles", "Landmarks"]]
              .nunique())
    print("\nunique LargeVehicles/Landmarks per NumberofLanes "
          "(1 == perfectly determined):")
    print(purity.to_string())
    summary["lanes_determinism"] = purity.to_dict()

    # static-per-geohash check for road attributes
    print("\n-- Are road attributes static per geohash? (nunique per geohash) --")
    for c in ["RoadType", "NumberofLanes", "LargeVehicles", "Landmarks"]:
        if c in train.columns:
            nun = train.groupby("geohash")[c].nunique(dropna=True)
            pct_varying = 100 * (nun > 1).mean()
            print(f"   {c:16s}: {pct_varying:5.2f}% of geohashes have >1 distinct value")

    # ----------------------------------------------------- TRAIN/TEST DRIFT
    hr("7. TRAIN vs TEST FEATURE DRIFT")
    num_cols = ["Temperature", "NumberofLanes"]
    for c in num_cols:
        if c in train.columns and c in test.columns:
            a = pd.to_numeric(train[c], errors="coerce")
            b = pd.to_numeric(test[c], errors="coerce")
            print(f"\n[{c}] train mean={a.mean():.3f} std={a.std():.3f} | "
                  f"test mean={b.mean():.3f} std={b.std():.3f}")
    for c in ["RoadType", "Weather", "LargeVehicles", "Landmarks"]:
        if c in train.columns and c in test.columns:
            ptr = train[c].value_counts(normalize=True, dropna=False)
            pte = test[c].value_counts(normalize=True, dropna=False)
            comp = pd.concat([ptr.rename("train"), pte.rename("test")], axis=1).fillna(0)
            print(f"\n[{c}] category share train vs test:")
            print((comp * 100).round(2).to_string())

    # --------------------------------------------- TARGET vs KEY FEATURES
    hr("8. TARGET RELATIONSHIPS (sanity, not modeling)")
    tr = train.copy()
    tr["tod_min"] = parse_timestamp_to_min(tr["timestamp"])
    print("\nmean demand by hour-of-day:")
    tr["hour"] = (tr["tod_min"] // 60).astype("Int64")
    print(tr.groupby("hour")[TARGET].mean().round(4).to_string())
    print("\nmean demand by Weather:")
    print(tr.groupby("Weather")[TARGET].mean().round(4).to_string())
    print("\nmean demand by NumberofLanes:")
    print(tr.groupby("NumberofLanes")[TARGET].mean().round(4).to_string())
    print("\nmean demand by RoadType:")
    print(tr.groupby("RoadType")[TARGET].mean().round(4).to_string())

    # correlation of numeric features with target
    print("\nPearson corr with demand (numeric):")
    num = tr[["tod_min", "Temperature", "NumberofLanes", "day", TARGET]].apply(
        pd.to_numeric, errors="coerce")
    print(num.corr()[TARGET].round(4).to_string())

    # ------------------------------------------------- SAMPLE SUBMISSION
    hr("9. SAMPLE SUBMISSION FORMAT")
    print(sample.head())
    print(f"\nsample rows: {len(sample)}, test rows: {len(test)} "
          f"(match: {len(sample) == len(test)})")
    print(f"sample Index == test Index (first 5): "
          f"{sample['Index'].head().tolist()} vs {test['Index'].head().tolist()}")
    summary["submission_rows_match_test"] = bool(len(sample) == len(test))

    with open(os.path.join(OUT_DIR, "eda_summary.json"), "w") as f:
        json.dump(summary, f, indent=2, default=str)

    hr("DONE")
    print("Wrote eda_report.txt and eda_summary.json to outputs/")


if __name__ == "__main__":
    report_path = os.path.join(OUT_DIR, "eda_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        with redirect_stdout(f):
            main()
    # also echo to console
    with open(report_path, "r", encoding="utf-8") as f:
        sys.stdout.write(f.read())
