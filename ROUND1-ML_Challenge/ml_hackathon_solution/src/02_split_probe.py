"""
Probe HOW day 49 is partitioned between train and test, and whether day-over-day
lag features are feasible. This determines the validation strategy.

Run: python ml_hackathon_solution/src/02_split_probe.py
"""
from __future__ import annotations
import os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset")
OUT = os.path.join(ROOT, "outputs")

train = pd.read_csv(os.path.join(DATA, "train.csv"))
test = pd.read_csv(os.path.join(DATA, "test.csv"))


def tod(df):
    p = df["timestamp"].astype(str).str.strip().str.split(":", expand=True)
    return pd.to_numeric(p[0]) * 60 + pd.to_numeric(p[1])


train["tod"] = tod(train)
test["tod"] = tod(test)

lines = []
def p(*a):
    s = " ".join(str(x) for x in a)
    print(s)
    lines.append(s)

p("=" * 70)
p("DAY-49 PARTITION PROBE")
p("=" * 70)

tr48 = train[train.day == 48]
tr49 = train[train.day == 49]
p(f"train rows day48: {len(tr48)}")
p(f"train rows day49: {len(tr49)}")
p(f"test  rows day49: {len(test)}")

# slot coverage per day
p("\n-- time-of-day slot coverage --")
s_tr48 = set(tr48.tod.unique())
s_tr49 = set(tr49.tod.unique())
s_te = set(test.tod.unique())
p(f"day48 train slots: {len(s_tr48)}  range {min(s_tr48)}..{max(s_tr48)}")
p(f"day49 train slots: {len(s_tr49)}  range {min(s_tr49)}..{max(s_tr49)}")
p(f"day49 test  slots: {len(s_te)}  range {min(s_te)}..{max(s_te)}")
p(f"day49 train∩test slots: {len(s_tr49 & s_te)}")
p(f"day49 slots in TEST only: {sorted(s_te - s_tr49)[:10]} (n={len(s_te - s_tr49)})")
p(f"day49 slots in TRAIN only: {sorted(s_tr49 - s_te)[:10]} (n={len(s_tr49 - s_te)})")

# Are (geohash, tod) test keys present in train day49? in train day48?
def keyset(df, day=None):
    d = df if day is None else df[df.day == day]
    return set(zip(d.geohash, d.tod))

k_te = set(zip(test.geohash, test.tod))
k_tr49 = keyset(train, 49)
k_tr48 = keyset(train, 48)
p("\n-- (geohash, tod) key overlap --")
p(f"test keys also in train-day49 (LEAK if same day same cell/time): {len(k_te & k_tr49)}")
p(f"test keys also in train-day48 (prev-day same slot -> lag feature): {len(k_te & k_tr48)}")
p(f"test keys total: {len(k_te)}")
p(f"  -> {100*len(k_te & k_tr48)/len(k_te):.1f}% of test cells have a day-48 same-slot observation")

# exact (geohash, day, tod) overlap (must be ~0 since disjoint targets)
k_te_full = set(zip(test.geohash, test.day, test.tod))
k_tr_full = set(zip(train.geohash, train.day, train.tod))
p(f"\nexact (geohash,day,tod) test∩train: {len(k_te_full & k_tr_full)} (should be 0)")

# Within day49: does train cover slots complementary to test, or same slots?
# Build per-slot counts
cnt49 = tr49.groupby("tod").size()
cnte = test.groupby("tod").size()
both = pd.concat([cnt49.rename("train49"), cnte.rename("test49")], axis=1).fillna(0).astype(int)
p("\n-- per-slot row counts day49 (head/tail) --")
p(both.head(12).to_string())
p("...")
p(both.tail(12).to_string())

# RoadType shift: is it within day49 (train49 vs test) or only between days?
p("\n-- RoadType share: day48-train vs day49-train vs day49-test --")
comp = pd.concat([
    tr48.RoadType.value_counts(normalize=True, dropna=False).rename("d48_train"),
    tr49.RoadType.value_counts(normalize=True, dropna=False).rename("d49_train"),
    test.RoadType.value_counts(normalize=True, dropna=False).rename("d49_test"),
], axis=1).fillna(0)
p((comp * 100).round(2).to_string())

# Mean demand: day48 vs day49 train (level shift across days?)
p("\n-- mean demand: day48 vs day49 (train) --")
p(f"day48 mean demand: {tr48.demand.mean():.5f}")
p(f"day49 mean demand: {tr49.demand.mean():.5f}")

# geohash coverage per day
p("\n-- geohash coverage --")
p(f"geohash in day48 train: {tr48.geohash.nunique()}")
p(f"geohash in day49 train: {tr49.geohash.nunique()}")
p(f"geohash in day49 test : {test.geohash.nunique()}")
g_te = set(test.geohash)
p(f"test geohash also in day48 train: {len(g_te & set(tr48.geohash))}")
p(f"test geohash also in day49 train: {len(g_te & set(tr49.geohash))}")

# Is the split random within day49? Compare demand-free feature dists train49 vs test
# If RoadType/lanes distributions differ within day49, split was stratified/biased.
p("\n-- NumberofLanes share: day49-train vs day49-test --")
comp2 = pd.concat([
    tr49.NumberofLanes.value_counts(normalize=True).rename("d49_train"),
    test.NumberofLanes.value_counts(normalize=True).rename("d49_test"),
], axis=1).fillna(0)
p((comp2 * 100).round(2).to_string())

with open(os.path.join(OUT, "split_probe.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("\n[written outputs/split_probe.txt]")
