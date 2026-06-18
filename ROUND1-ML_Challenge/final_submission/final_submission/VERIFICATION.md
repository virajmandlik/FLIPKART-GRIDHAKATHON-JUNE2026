# Independent Verification — Gridlock 2.0 Winning Submission

**Subject:** `submission_BC.csv` (final model "BC"), evaluation score **(91.25092)** = `100 * (1 - RMSE)`
**Verdict:** ✅ **VALID and EXACTLY REPRODUCIBLE**
**Date:** 2026-06-03

This document records an independent verification of the submission's
**prediction-file integrity** and its **deterministic reproducibility** from
`reproduce.py`. The verification was performed read-only: no existing file was
modified, and the committed `submission_BC.csv` was never overwritten (the
reproducer was run from an isolated copy whose output was directed to a
throwaway temporary directory).

---

## 1. Prediction-File Integrity — `submission_BC.csv`

| Check | Expected | Observed | Result |
|---|---|---|---|
| Row count | 41778 | **41778** | ✅ |
| Columns | `[Index, demand]` | `[Index, demand]` | ✅ |
| `Index` contiguity | `0 … 41777`, no gaps/dups | min `0`, max `41777`, 41778 unique, 0 duplicates, 0 missing | ✅ |
| `demand` NaN count | 0 | **0** | ✅ |
| `demand` value range | within `[0, 1]` | 0 values `< 0`, 0 values `> 1` | ✅ |

**`demand` distribution (observed):**

| Statistic | Value |
|---|---|
| min | `0.0048327026698935` |
| mean | `0.13024565632727886` |
| max | `1.0` |

**`submission_BC.csv` vs `submission_BC_reference.csv`** (validated reference, merged on `Index`, 41778/41778 rows matched):

| Metric | Value |
|---|---|
| max absolute difference | `4.44e-16` |
| mean absolute difference | `2.97e-17` |
| Pearson correlation | `1.0` |

The committed submission is byte-for-byte equivalent to the validated reference
up to floating-point round-off (differences at the `1e-16` level, correlation
exactly `1.0`).

---

## 2. Determinism / Reproducibility

`reproduce.py` was **copied** to an isolated temporary directory and executed
there (the original `reproduce.py` was not edited, and the regenerated output
was written to the temporary directory — the real `submission_BC.csv` was left
untouched). The freshly regenerated predictions were then compared against the
validated reference `submission_BC_reference.csv`.

| Metric | Value | Tolerance | Result |
|---|---|---|---|
| **max absolute difference (regenerated vs reference)** | **`4.440892098500626e-16`** | `< 1e-9` | ✅ |
| mean absolute difference | `2.97e-17` | — | ✅ |
| Pearson correlation | `1.0` | — | ✅ |
| Rows compared | `41778 / 41778` | — | ✅ |

The regenerated file (41778 rows, `demand` in `min=0.0048, mean=0.13025,
max=1.0000`) matches the reference to floating-point tolerance — well below the
`1e-9` threshold.

### Fixed-seed reproducibility note

The pipeline is fully deterministic. Every model is fit with **fixed, hard-coded
seeds** and seed-averaged over fixed seed lists; there is **no runtime search**
(no Optuna, no CV/proxy round selection, no blend re-optimization — all selected
hyper-parameters, round counts, and blend weights are baked in as constants):

- **B** — feature-enhanced LightGBM, seeds `[42, 43, 44, 45, 46, 47]`, 437 rounds.
- **C** — `0.4060 * LightGBM` (217 rounds) + `0.5940 * XGBoost` (geohash dropped,
  259 rounds), seeds `[42, 143, 244, 345]` (CatBoost weight was exactly `0.0`, so
  it is omitted with no effect).
- **Final** — `clip(0.5 * B + 0.5 * C, 0, 1)`.

Feature engineering uses no randomness. Re-running on the same machine and
library versions reproduces `submission_BC.csv` to floating-point tolerance, as
demonstrated above.

---

## 3. Environment

| Component | Version |
|---|---|
| Python | `3.14.3` |
| numpy | `2.4.4` |
| pandas | `3.0.3` |
| scikit-learn | `1.8.0` |
| lightgbm | `4.6.0` |
| xgboost | `3.2.0` |
| OS | Windows |

*(Python: `3.14.3 (tags/v3.14.3:323c59a, Feb 3 2026) [MSC v.1944 64 bit (AMD64)]`.)*

---

## 4. Conclusion

The submission `submission_BC.csv` is **valid** (41778 rows, correct
`[Index, demand]` schema, contiguous `Index` `0…41777`, no NaNs, all `demand`
values within `[0, 1]`) and is **exactly reproducible** from `reproduce.py`
(regenerated predictions match the validated reference to `4.44e-16`, far below
the `1e-9` tolerance) — confirming the reported **evaluation score (91.25092)**.
