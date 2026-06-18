"""
Formal ETL / data-quality audit (separate from modeling). Writes a report so the
cleaning decisions are explicit and auditable.

Run: python ml_hackathon_solution/src/data_quality.py
"""
from __future__ import annotations
import os, json
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE); REPO = os.path.dirname(ROOT)
DATA = os.path.join(REPO, "dataset"); OUT = os.path.join(ROOT, "outputs")
TARGET = "demand"

lines, rep = [], {}
def p(*a):
    s = " ".join(str(x) for x in a); print(s); lines.append(s)


def main():
    tr = pd.read_csv(os.path.join(DATA, "train.csv"))
    te = pd.read_csv(os.path.join(DATA, "test.csv"))

    p("="*70); p("ETL / DATA-QUALITY AUDIT"); p("="*70)

    # 1. schema / dtypes
    p("\n[1] schema")
    p("train cols:", list(tr.columns))
    p("test  cols:", list(te.columns))
    rep["n_train"], rep["n_test"] = len(tr), len(te)

    # 2. duplicates
    key = ["geohash", "day", "timestamp"]
    rep["dup_full"] = int(tr.duplicated().sum())
    rep["dup_key"] = int(tr.duplicated(subset=key).sum())
    p(f"\n[2] duplicates: full={rep['dup_full']}  on key{key}={rep['dup_key']}")

    # 3. invalid / impossible values
    p("\n[3] validity checks")
    y = tr[TARGET]
    rep["target_neg"] = int((y < 0).sum()); rep["target_gt1"] = int((y > 1).sum())
    rep["target_zero"] = int((y == 0).sum()); rep["target_nan"] = int(y.isna().sum())
    p(f"  demand: <0={rep['target_neg']}  >1={rep['target_gt1']}  ==0={rep['target_zero']}  NaN={rep['target_nan']}")
    lanes = pd.to_numeric(tr["NumberofLanes"], errors="coerce")
    rep["lanes_values"] = sorted(lanes.dropna().unique().tolist())
    rep["lanes_le0"] = int((lanes <= 0).sum())
    p(f"  NumberofLanes values={rep['lanes_values']}  <=0={rep['lanes_le0']}  (4/5 are rare HIGH-demand highways - KEEP)")
    temp = pd.to_numeric(tr["Temperature"], errors="coerce")
    p(f"  Temperature range=[{temp.min():.1f}, {temp.max():.1f}] (negative = valid winter temps)")
    # geohash length consistency
    gl = tr["geohash"].astype(str).str.len().unique().tolist()
    rep["geohash_lengths"] = gl
    p(f"  geohash lengths={gl} (should be a single value)")

    # 4. missingness (train vs test parity)
    p("\n[4] missingness train vs test (%)")
    for c in tr.columns:
        if c in te.columns:
            a, b = 100*tr[c].isna().mean(), 100*te[c].isna().mean()
            if a > 0 or b > 0:
                p(f"  {c:16s} train={a:5.2f}  test={b:5.2f}")
    rep["missing_train"] = {c: int(tr[c].isna().sum()) for c in tr.columns if tr[c].isna().any()}

    # 5. outlier audit on target (IQR + tail mass)
    p("\n[5] target outlier audit (audit only - DO NOT clip target for RMSE)")
    q1, q3 = y.quantile(.25), y.quantile(.75); iqr = q3 - q1
    hi = q3 + 1.5*iqr
    rep["iqr_upper_fence"] = float(hi)
    rep["target_above_fence"] = int((y > hi).sum())
    p(f"  Q1={q1:.4f} Q3={q3:.4f} IQR={iqr:.4f} upper_fence={hi:.4f}")
    p(f"  rows above fence={rep['target_above_fence']} ({100*(y>hi).mean():.1f}%)")
    p(f"  these are HIGHWAY/high-lane cells (legit signal). For RMSE we keep them and"
      f" instead BALANCE via objective/weights (see balancing experiment).")
    p(f"  skew(raw)={y.skew():.3f}  skew(log1p)={np.log1p(y).skew():.3f}  skew(sqrt)={np.sqrt(y).skew():.3f}")
    rep["skew_raw"] = float(y.skew()); rep["skew_log1p"] = float(np.log1p(y).skew())

    # 6. consistency: NumberofLanes -> LargeVehicles determinism (data integrity)
    p("\n[6] integrity: NumberofLanes -> LargeVehicles (expect deterministic)")
    det = tr.dropna(subset=["NumberofLanes"]).groupby("NumberofLanes")["LargeVehicles"].nunique()
    p("  distinct LargeVehicles per lane (1 = consistent):"); p("  " + det.to_dict().__str__())

    with open(os.path.join(OUT, "data_quality_report.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    with open(os.path.join(OUT, "data_quality.json"), "w") as f:
        json.dump(rep, f, indent=2, default=str)
    p("\n[written outputs/data_quality_report.txt + .json]")


if __name__ == "__main__":
    main()
