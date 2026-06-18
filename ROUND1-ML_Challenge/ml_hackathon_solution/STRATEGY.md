# Gridlock 2.0 — Traffic Demand Prediction: Solution Strategy

> Evidence-based strategy. Every claim below is backed by `outputs/eda_report.txt`
> and `outputs/split_probe.txt` produced by `src/01_eda.py` and `src/02_split_probe.py`.

## STEP 1 — Problem Understanding

- **Task type:** Supervised **regression**. Target `demand` is continuous, bounded
  in `(0, 1]`, heavy right skew (skew 3.73, kurtosis 17.3, median 0.048, mean 0.094).
- **Prediction target:** `demand` for each test row `(geohash, day=49, timestamp)`.
- **Assumed metric:** **RMSE** (HackerEarth Gridlock scores `demand` regression on RMSE;
  leaderboard score is a monotonic transform like `100*(1-RMSE)`). Minimizing RMSE is the
  objective regardless of the exact transform. *To be confirmed by the user.*
- **Business objective:** Forecast short-horizon traffic demand per spatial cell and
  time-of-day to enable congestion ("gridlock") mitigation and resource allocation.
- **Constraints:** Reproducible, leakage-free, generalizes to 10 unseen test geohashes
  and to the daytime forecast horizon.

## STEP 2 — Dataset Analysis (key findings)

| Aspect | Finding | Implication |
|---|---|---|
| Shapes | train 77,299×11; test 41,778×10; sample 5×2 (format only) | submission needs 41,778 rows |
| **Time split** | train days {48 (all 96 slots), 49 (slots 0–120 / 00:00–02:00)}; **test = day 49 slots 135–825 / 02:15–13:45** | **forecasting the rest of day 49** → temporal validation |
| **Day-over-day** | **88.9%** of test cells have a day-48 same-slot demand | strongest feature = "yesterday same place & time" |
| Target | `(0,1]`, right-skewed, no zeros/negatives/NaN | clip preds to [0,1]; test raw vs log/tweedie |
| **Covariate shift** | test enriched in Highway (4.5→10.2%) & Street (4.9→8.2%) vs Residential; Highway demand 0.61 ≫ Residential 0.057 | test mean demand structurally higher; model must rely on `RoadType`/`NumberofLanes` (provided in test) |
| Strong features | `RoadType`, `NumberofLanes` (4/5≈highways, demand ~0.60), time-of-day cycle (peak 11–13h, trough ~19h) | cyclical time encoding; tree models |
| Redundancy | `LargeVehicles` fully determined by `NumberofLanes`; `Landmarks` mostly | drop/keep (trees tolerant) |
| Weak features | `Weather` (all ~0.093), `Temperature` (corr ~0) | minor; keep, impute |
| Missingness | Temperature 3.23%, Weather 1.03%, RoadType 0.78% — identical in train/test | MCAR-like; native NaN handling / impute |
| Duplicates | none (full, feature, and on key) | clean |
| Geohash | 1249 train / 1190 test, 10 test cold-start | decode to lat/lon; CV-safe target encoding |

## STEP 3 — Validation Strategy (the crux)

Only **2 days** exist, and the dominant feature (day-48 demand at the same cell+time)
is built from day 48 — so it can only be validated **leakage-free on a different day**.

- **CV-A (PRIMARY, model selection):** train on **day 48 (full)** → validate on the
  **day-49 training rows (7,872)**. This *exactly mirrors* the test's feature
  availability (history = day 48, predict a different day). RMSE here is the number we trust.
  - Caveat: day-49-train covers night slots (00:00–02:00) while test is daytime; but day 48
    (in training) covers all slots, so the daily curve is learned. Pessimism, not leakage.
- **CV-B (COMPLEMENT, spatial/cold-start):** `GroupKFold` by `geohash` (5 folds) on day 48,
  aggregates fit on the train fold only. Estimates generalization to the 10 unseen geohashes.
- **Hard rules:** all encoders/aggregates fit on fold-train only; `geo×tod` (prevday) feature
  populated only for day-49 rows (NaN for day-48 rows — they have no prior day);
  fixed seeds; OOF predictions for honest estimates.
- **Rejected:** random K-Fold (leaks the future into the past); pure geohash-only CV as the
  primary (undervalues the day-48 history feature, which IS available for 1180/1190 test cells).

## STEP 4 — Feature Engineering

- **Time:** `tod` (min since midnight), hour, minute, `sin/cos(2π·tod/1440)`.
- **Space:** decode geohash6 → `lat`, `lon` (generalizes to cold-start cells); geohash freq.
- **History (leakage-safe, from day 48):** `hist_geo_tod` = day-48 demand at (geohash, tod)
  [= prevday lag for day 49]; per-geohash demand mean/std/median/min/max/count; per-tod
  demand mean/std; per-RoadType mean. Populated for day-49 rows only.
- **Context:** RoadType, NumberofLanes (+ as category), Landmarks, LargeVehicles, Weather,
  Temperature (impute), day.
- **Interactions:** RoadType×tod, lanes×tod (implicit in trees; explicit aggregates added).
- **Target handling:** compare raw-RMSE vs log1p vs Tweedie by CV; clip final to [0,1].

## STEP 5 — Model Selection
LightGBM (primary), XGBoost, CatBoost (native categoricals), plus baselines:
(1) global mean, (2) **"yesterday" = day-48 geo×tod mean** (the bar to beat), (3) tod-mean.

## STEP 6 — HPO
Optuna (TPE) with CV-A as the objective; early stopping; guard against overfit by
monitoring CV-A vs train gap and CV-B stability.

## STEP 7 — Ensemble
Weighted blend / stacking of LGBM+XGB+CatBoost, accepted **only if CV-A improves**.

## STEP 8 — Explainability
SHAP (global + dependence on top features), gain importance, and error analysis by
RoadType / tod / geohash.

## STEP 9 — Final Pipeline
Retrain on day 48 + day 49-train with the selected config; predict day-49 test; clip [0,1];
write `submissions/submission.csv`. Delivered as a Colab-ready notebook + modular `src/`.
