# Gridlock 2.0 -- Winning Submission (Reproducible Package)

This folder lets the judges **deterministically regenerate the winning prediction
file** for the Gridlock 2.0 traffic-demand regression challenge.

- **Winning file:** `submission_BC.csv`
- **Evaluation score:** **91.25092** (score = `100 * (1 - RMSE)`)
- **Shape:** `41778` rows, columns `[Index, demand]`, `demand` clipped to `[0, 1]`

## What the winner is

`submission_BC` is the **50/50 average of two independently-built models**, then
clipped to `[0, 1]`:

```
submission_BC = clip( 0.5 * B + 0.5 * C , 0, 1 )
```

| | Model | Recipe (final, baked-in) |
|---|---|---|
| **B** | Seed-averaged LightGBM | v1 feature set **+** `road_tod_mean`, `lanes_tod_mean`. 6 seeds (42-47), 437 rounds. |
| **C** | LightGBM + XGBoost blend | `0.4060 * LightGBM(v1)` + `0.5940 * XGBoost(geohash dropped)`. 4 seeds (42, 143, 244, 345); 217 / 259 rounds. |

Notes:
- In Approach C the selected **CatBoost weight was exactly 0.0**, so CatBoost is
  omitted from `reproduce.py` (dropping a zero-weight model changes nothing and
  removes the `catboost` dependency).
- Both models train on **day 48 + day 49** and predict the day-49 daytime test
  window. History aggregates are fit on day 48 only; the day-over-day `geo_tod`
  lag is supplied to day-49 / test rows (cross-day), keeping the pipeline
  leakage-safe.

## Problem context

Forecast `demand` (in `(0, 1]`) for day-49 **daytime** slots (135-825 min).
`train.csv` = day 48 (all 96 fifteen-minute slots) + day 49 slots 0-120 min;
`test.csv` = day 49 slots 135-825 min. Metric is RMSE; the evaluation score is
reported as `100 * (1 - RMSE)`.

## How to run

From inside this folder:

```bash
python reproduce.py
```

The script auto-locates the data at `../dataset/train.csv` and
`../dataset/test.csv` (it also probes a few other common locations, and prompts
for upload on Google Colab).

### Expected output

- Writes **`submission_BC.csv`** (41778 rows) into this folder.
- Prints a verification line comparing the freshly generated file against the
  reference winner (`submission_BC_reference.csv`), e.g. `max_abs_diff`,
  `mean_abs_diff`, and `corr` (correlation is `> 0.9999`; differences are at
  floating-point tolerance).

Approximate runtime: a few minutes on a typical multi-core machine (10 LightGBM
fits + 4 XGBoost fits, all CPU).

## Environment

- **Python:** 3.x (developed and validated on **Python 3.14.3**, Windows).
- **Dependencies:** see `requirements.txt`
  (`numpy`, `pandas`, `scikit-learn`, `lightgbm`, `xgboost`).
  Install with `pip install -r requirements.txt`.
- `reproduce.py` is Colab-compatible: it `pip install`s only genuinely missing
  packages at startup, so it runs unmodified on a fresh Colab runtime.

## Determinism & seeds

- All randomness is controlled by **fixed, hard-coded seeds**. B is averaged over
  seeds `[42, 43, 44, 45, 46, 47]`; C over `[42, 143, 244, 345]`.
- **No search at runtime:** Optuna, the daytime-proxy feature/round selection,
  and the blend-weight optimization were all run offline; their **selected
  outputs (hyper-parameters, round counts, blend weights) are baked in** as
  constants. This makes the script fast and fully deterministic.
- Feature engineering uses no randomness. Re-running on the same machine /
  library versions reproduces `submission_BC.csv` to floating-point tolerance.

## Files

| File | Purpose |
|---|---|
| `reproduce.py` | Self-contained, deterministic regenerator (run this). |
| `submission_BC.csv` | The regenerated winning prediction file (evaluation score 91.25092). |
| `submission_BC_reference.csv` | The validated reference winner, for the match check. |
| `requirements.txt` | Pinned dependency versions. |
| `README.md` | This file. |
