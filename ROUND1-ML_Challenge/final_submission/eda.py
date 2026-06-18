"""
================================================================================
 GRIDLOCK 2.0 -- EXPLORATORY DATA ANALYSIS (standalone, self-contained)
================================================================================
Reproduces the exploratory data analysis that informed the feature engineering
and validation strategy for the traffic-demand regression problem. It reads the
competition data (`dataset/train.csv` + `dataset/test.csv`) and writes a single
human-readable report to `eda_report.txt` next to this script.

This script makes NO modeling decisions. It only characterises the data so that
the leakage-safe feature design and the daytime validation proxy can be argued
from evidence. It consolidates three earlier exploration scripts (basic EDA, the
day-49 split probe, and the ETL / data-quality audit) into one clean pass.

WHAT IT COVERS
--------------
  0. File shapes, columns and dtypes
  1. Target distribution (demand): range, skew, zeros/negatives/NaNs
  2. Temporal structure: days, 15-min slot granularity, train/test horizon
  3. Day-49 split probe: how day 49 is partitioned and lag-feature feasibility
  4. Spatial structure: geohash counts, cold-start cells, grid regularity
  5. Missing values (train vs test parity)
  6. Duplicates
  7. Data-quality / validity audit (ranges, lane values, geohash lengths)
  8. Train-vs-test covariate shift (RoadType, lanes, temperature)
  9. Target relationships: demand by RoadType, by time-of-day curve

HOW TO RUN
----------
    python eda.py

Output: `eda_report.txt` in this folder. The report is also echoed to the
console. All output is plain ASCII (safe for a Windows cp1252 console): arrows
are written as "->" and multipliers as "x".

DETERMINISM
-----------
Pure descriptive statistics over the fixed input files; no randomness, no model
fitting. Re-running yields an identical report.
================================================================================
"""

from __future__ import annotations

import os
import sys
from contextlib import redirect_stdout

import numpy as np
import pandas as pd

TARGET = "demand"

# Day-49 daytime forecast window (minutes since midnight). Informational: the
# test rows fall in [DAY_LO, DAY_HI]; train day-49 rows are the early-morning
# slots that precede it.
DAY_LO, DAY_HI = 135, 825


# --------------------------------------------------------------- data location
def find_data_dir():
    """Locate the folder holding train.csv / test.csv (repo layout or Colab)."""
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
        if os.path.exists(os.path.join(b, "train.csv")) and \
           os.path.exists(os.path.join(b, "test.csv")):
            return os.path.abspath(b)
    raise FileNotFoundError("train.csv / test.csv not found in known locations.")


def hr(title):
    """Section header (ASCII rule)."""
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


def ts_to_min(ts):
    """'H:M' timestamp -> minutes since midnight. Robust to ' 0:0' style."""
    parts = ts.astype(str).str.strip().str.split(":", expand=True)
    h = pd.to_numeric(parts[0], errors="coerce")
    m = pd.to_numeric(parts[1], errors="coerce")
    return h * 60 + m


# ============================================================================
# MAIN ANALYSIS
# ============================================================================
def main():
    data_dir = find_data_dir()
    train = pd.read_csv(os.path.join(data_dir, "train.csv"))
    test = pd.read_csv(os.path.join(data_dir, "test.csv"))
    sample_path = os.path.join(data_dir, "sample_submission.csv")
    sample = pd.read_csv(sample_path) if os.path.exists(sample_path) else None

    print("Gridlock 2.0 -- Exploratory Data Analysis")
    print("data dir: " + data_dir)

    # ----------------------------------------------- 0. SHAPES / COLUMNS
    hr("0. FILE SHAPES, COLUMNS, DTYPES")
    print("train shape: {}".format(train.shape))
    print("test  shape: {}".format(test.shape))
    if sample is not None:
        print("sample_submission shape: {}".format(sample.shape))
    print("\ntrain columns: {}".format(list(train.columns)))
    print("test  columns: {}".format(list(test.columns)))
    print("\ndtypes (train):")
    print(train.dtypes.to_string())
    # The only column present in train but not test is the target.
    only_train = [c for c in train.columns if c not in test.columns]
    print("\ncolumns in train but not test (expected: target): {}".format(only_train))

    # ----------------------------------------------- 1. TARGET DISTRIBUTION
    hr("1. TARGET DISTRIBUTION (demand)")
    y = pd.to_numeric(train[TARGET], errors="coerce")
    desc = y.describe(percentiles=[0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99])
    print(desc.to_string())
    n_neg = int((y < 0).sum())
    n_zero = int((y == 0).sum())
    n_gt1 = int((y > 1).sum())
    n_nan = int(y.isna().sum())
    print("\nnegative values     : {}".format(n_neg))
    print("exact zeros         : {}".format(n_zero))
    print("values > 1          : {}".format(n_gt1))
    print("NaN target          : {}".format(n_nan))
    print("skewness (raw)      : {:.4f}".format(y.skew()))
    print("kurtosis (raw)      : {:.4f}".format(y.kurtosis()))
    print("skew(log1p(demand)) : {:.4f}".format(np.log1p(y.dropna()).skew()))
    print("skew(sqrt(demand))  : {:.4f}".format(np.sqrt(y.dropna()).skew()))
    print(
        "\nNote: demand lies in (0, 1] -- right-skewed (skew ~3.73), median ~0.048,"
        "\nmean ~0.094, no zeros / negatives / NaNs. The skew comes from a small"
        "\nnumber of legitimately high-demand cells (highways), so the target is"
        "\nbest left RAW for an RMSE objective rather than log/sqrt transformed."
    )

    # ----------------------------------------------- 2. TEMPORAL STRUCTURE
    hr("2. TEMPORAL STRUCTURE (day / timestamp / slot granularity)")
    for name, df in [("train", train), ("test", test)]:
        days = sorted(df["day"].dropna().unique().tolist())
        tod = ts_to_min(df["timestamp"])
        slots = sorted(tod.dropna().unique().tolist())
        gran = int(np.min(np.diff(slots))) if len(slots) > 1 else 0
        print("[{}] days={} | slots={} (min={}min, max={}min) | granularity={}min"
              .format(name, days, len(slots), int(min(slots)), int(max(slots)), gran))

    train_days = set(train["day"].unique())
    test_days = set(test["day"].unique())
    print("\nday overlap train & test : {}".format(sorted(train_days & test_days)))
    print("days only in test        : {} (the forecast horizon)"
          .format(sorted(test_days - train_days)))
    print("\nInterpretation: train = day 48 (all 96 fifteen-min slots) + day 49"
          "\nearly-morning slots; test = day 49 daytime slots in [{}, {}] min."
          .format(DAY_LO, DAY_HI))

    # ----------------------------------------------- 3. DAY-49 SPLIT PROBE
    hr("3. DAY-49 SPLIT PROBE (partition + day-over-day lag feasibility)")
    tr = train.copy()
    te = test.copy()
    tr["tod"] = ts_to_min(tr["timestamp"])
    te["tod"] = ts_to_min(te["timestamp"])
    tr48 = tr[tr.day == 48]
    tr49 = tr[tr.day == 49]

    print("train rows day48 : {}".format(len(tr48)))
    print("train rows day49 : {}".format(len(tr49)))
    print("test  rows day49 : {}".format(len(te)))

    s_tr48 = set(tr48.tod.unique())
    s_tr49 = set(tr49.tod.unique())
    s_te = set(te.tod.unique())
    print("\nday48 train slots: {:3d}  range {}..{} min"
          .format(len(s_tr48), int(min(s_tr48)), int(max(s_tr48))))
    print("day49 train slots: {:3d}  range {}..{} min"
          .format(len(s_tr49), int(min(s_tr49)), int(max(s_tr49))))
    print("day49 test  slots: {:3d}  range {}..{} min"
          .format(len(s_te), int(min(s_te)), int(max(s_te))))
    print("day49 train & test slot overlap: {} (disjoint windows of the same day)"
          .format(len(s_tr49 & s_te)))

    # (geohash, tod) key overlap -> does each test cell have a day-48 same-slot
    # observation it can borrow as a day-over-day lag feature?
    k_te = set(zip(te.geohash, te.tod))
    k_tr48 = set(zip(tr48.geohash, tr48.tod))
    k_tr49 = set(zip(tr49.geohash, tr49.tod))
    cover = 100.0 * len(k_te & k_tr48) / len(k_te)
    print("\n(geohash, tod) key overlap:")
    print("  test cells also in day-48 (prev-day same slot -> lag): {}".format(len(k_te & k_tr48)))
    print("  test cells also in day-49 train (would be same-day leak): {}".format(len(k_te & k_tr49)))
    print("  total test cells: {}".format(len(k_te)))
    print("  -> {:.1f}% of test cells have a day-48 same-slot observation".format(cover))

    # exact (geohash, day, tod) overlap must be ~0 (targets are disjoint).
    k_te_full = set(zip(te.geohash, te.day, te.tod))
    k_tr_full = set(zip(tr.geohash, tr.day, tr.tod))
    print("\nexact (geohash,day,tod) test & train overlap: {} (should be 0 -- no leakage)"
          .format(len(k_te_full & k_tr_full)))

    # Level shift across days?
    print("\nmean demand day48 train: {:.5f}".format(tr48[TARGET].mean()))
    print("mean demand day49 train: {:.5f}".format(tr49[TARGET].mean()))
    print("\nValidation implication: day-49 train rows are NIGHT-ONLY (no daytime"
          "\nlabels), so a naive night CV does not measure daytime error. A DAYTIME"
          "\nPROXY (train on day-48 non-daytime, predict day-48 daytime) is the first"
          "\ntrustworthy daytime metric. Because ~{:.1f}% of test cells have a day-48"
          "\nsame-slot value, a day-over-day lag (geo_tod_mean) is highly informative."
          .format(cover))

    # ----------------------------------------------- 4. SPATIAL STRUCTURE
    hr("4. SPATIAL STRUCTURE (geohash)")
    g_tr = set(train["geohash"].unique())
    g_te = set(test["geohash"].unique())
    print("unique geohash train : {}".format(len(g_tr)))
    print("unique geohash test  : {}".format(len(g_te)))
    print("geohash overlap      : {}".format(len(g_tr & g_te)))
    print("cold-start (in test, not in train): {}".format(len(g_te - g_tr)))
    print("only in train        : {}".format(len(g_tr - g_te)))
    lens = sorted(train["geohash"].astype(str).str.len().unique().tolist())
    print("geohash string lengths (train): {} (uniform -> consistent precision)".format(lens))

    gpd = train.groupby(["geohash", "day"]).size()
    print("\nrows per (geohash, day) in train: min={}, median={}, max={}"
          .format(int(gpd.min()), int(gpd.median()), int(gpd.max())))
    print("regular (geohash x slot) grid per day? {}"
          .format("likely yes" if gpd.nunique() == 1 else "no -- irregular"))

    # ----------------------------------------------- 5. MISSING VALUES
    hr("5. MISSING VALUES (train vs test parity)")
    print("{:16s} {:>12s} {:>12s}".format("column", "train %", "test %"))
    any_missing = False
    for c in train.columns:
        a = 100.0 * train[c].isna().mean()
        b = 100.0 * test[c].isna().mean() if c in test.columns else float("nan")
        if a > 0 or (c in test.columns and b > 0):
            any_missing = True
            print("{:16s} {:12.2f} {:12.2f}".format(c, a, b))
    if not any_missing:
        print("  none")
    print("\nNote: Temperature ~3.23%, Weather ~1.03%, RoadType ~0.78% missing, with"
          "\nnearly identical rates in train and test (missingness is structural, not"
          "\na train-only artefact). Tree models consume NaN natively; explicit"
          "\nmissing-indicator flags (temp_missing, weather_missing, roadtype_missing)"
          "\nare added as features.")

    # ----------------------------------------------- 6. DUPLICATES
    hr("6. DUPLICATES")
    key = ["geohash", "day", "timestamp"]
    feat_cols = [c for c in train.columns if c not in ("Index", TARGET)]
    dup_full = int(train.duplicated().sum())
    dup_feat = int(train.duplicated(subset=feat_cols).sum())
    dup_key = int(train.duplicated(subset=key).sum())
    print("fully duplicated rows                 : {}".format(dup_full))
    print("duplicated on features (no Index/target): {}".format(dup_feat))
    print("duplicated on key {}: {}".format(key, dup_key))
    print("(key duplicates > 0 would mean multiple demand values per cell/slot)")

    # ----------------------------------------------- 7. DATA-QUALITY AUDIT
    hr("7. DATA-QUALITY / VALIDITY AUDIT")
    lanes = pd.to_numeric(train["NumberofLanes"], errors="coerce")
    temp = pd.to_numeric(train["Temperature"], errors="coerce")
    print("demand: <0={}  >1={}  ==0={}  NaN={}".format(n_neg, n_gt1, n_zero, n_nan))
    print("NumberofLanes distinct values : {}  (<=0: {})"
          .format(sorted(lanes.dropna().unique().tolist()), int((lanes <= 0).sum())))
    print("Temperature range             : [{:.1f}, {:.1f}]  (negatives = valid winter temps)"
          .format(temp.min(), temp.max()))
    print("geohash lengths               : {}  (single value -> uniform)".format(lens))
    # IQR audit on the target (audit only -- DO NOT clip target for RMSE).
    q1, q3 = y.quantile(0.25), y.quantile(0.75)
    iqr = q3 - q1
    hi = q3 + 1.5 * iqr
    print("\ntarget IQR audit (audit only -- target kept raw):")
    print("  Q1={:.4f}  Q3={:.4f}  IQR={:.4f}  upper_fence={:.4f}"
          .format(q1, q3, iqr, hi))
    print("  rows above fence: {} ({:.1f}%) -- these are high-lane / highway cells"
          " (legitimate signal)".format(int((y > hi).sum()), 100.0 * (y > hi).mean()))
    # Integrity: is NumberofLanes -> LargeVehicles deterministic?
    det = (train.dropna(subset=["NumberofLanes"])
           .groupby("NumberofLanes")["LargeVehicles"].nunique())
    print("\nintegrity: distinct LargeVehicles per NumberofLanes (1 = consistent):")
    print("  {}".format(det.to_dict()))
    print("\nVerdict: data is CLEAN -- valid ranges, uniform geohash precision, no"
          "\nduplicates, no impossible values. No row dropping or target clipping.")

    # ----------------------------------------------- 8. COVARIATE SHIFT
    hr("8. TRAIN vs TEST COVARIATE SHIFT")
    for c in ["Temperature", "NumberofLanes"]:
        a = pd.to_numeric(train[c], errors="coerce")
        b = pd.to_numeric(test[c], errors="coerce")
        print("[{}] train mean={:.3f} std={:.3f} | test mean={:.3f} std={:.3f}"
              .format(c, a.mean(), a.std(), b.mean(), b.std()))
    for c in ["RoadType", "Weather", "LargeVehicles", "Landmarks"]:
        ptr = train[c].value_counts(normalize=True, dropna=False)
        pte = test[c].value_counts(normalize=True, dropna=False)
        comp = pd.concat([ptr.rename("train%"), pte.rename("test%")], axis=1).fillna(0.0)
        print("\n[{}] category share train vs test (%):".format(c))
        print((comp * 100).round(2).to_string())
    print("\nNote: the test (daytime) window is enriched in busier road classes vs"
          "\ntrain -- e.g. Highway ~4.6% -> ~10.2% and Street ~5.1% -> ~8.2%. This"
          "\ncovariate shift is exactly why RoadType x time-of-day and lanes x"
          "\ntime-of-day demand profiles (road_tod_mean, lanes_tod_mean) help.")

    # ----------------------------------------------- 9. TARGET RELATIONSHIPS
    hr("9. TARGET RELATIONSHIPS (demand by RoadType, time-of-day curve)")
    tr["hour"] = (tr["tod"] // 60).astype("Int64")
    print("mean demand by RoadType:")
    print(tr.groupby("RoadType")[TARGET].mean().round(4).sort_values(ascending=False).to_string())
    print("\nmean demand by NumberofLanes:")
    print(tr.groupby("NumberofLanes")[TARGET].mean().round(4).to_string())
    print("\nmean demand by hour-of-day (time-of-day curve):")
    by_hour = tr.groupby("hour")[TARGET].mean().round(4)
    print(by_hour.to_string())
    peak_hour = int(by_hour.idxmax())
    trough_hour = int(by_hour.idxmin())
    print("\npeak hour ~ {}h (demand {:.4f}); trough hour ~ {}h (demand {:.4f})"
          .format(peak_hour, by_hour.max(), trough_hour, by_hour.min()))
    print("\nPearson corr with demand (numeric features):")
    num = tr[["tod", "Temperature", "NumberofLanes", "day", TARGET]].apply(
        pd.to_numeric, errors="coerce")
    print(num.corr()[TARGET].round(4).to_string())
    print("\nNote: demand is dominated by road class (Highway ~0.61 >> Street ~0.27"
          "\n>> Residential ~0.057) and shows a clear daytime curve (midday peak,"
          "\nevening trough). These motivate the geohash and time-of-day aggregates.")

    # ----------------------------------------------- SUBMISSION FORMAT
    if sample is not None:
        hr("10. SAMPLE SUBMISSION FORMAT")
        print(sample.head().to_string(index=False))
        print("\nsample rows: {}  test rows: {}  (match: {})"
              .format(len(sample), len(test), len(sample) == len(test)))

    hr("DONE")
    print("EDA complete. Report written to eda_report.txt")


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    report_path = os.path.join(here, "eda_report.txt")
    # Write the report (ASCII) then echo it to the console.
    with open(report_path, "w", encoding="ascii", errors="replace") as f:
        with redirect_stdout(f):
            main()
    with open(report_path, "r", encoding="ascii", errors="replace") as f:
        sys.stdout.write(f.read())
