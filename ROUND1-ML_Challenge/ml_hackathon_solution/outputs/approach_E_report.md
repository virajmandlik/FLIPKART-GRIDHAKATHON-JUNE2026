# Approach E -- STACK the two validated gains (B's features + C's blend)

## TL;DR

- Combined feature set = **v1 (32) + `road_tod_mean` + `lanes_tod_mean`** (34 features), run through C's exact pipeline (same daytime proxy, same 3 diverse models, same gated blend, same lag-present CV-A rounds, same 6-seed average).
- **Daytime-proxy blend RMSE: E = `0.029398` vs C `0.029201` (delta `+0.000197`)** -- E does NOT beat C on the proxy.
- Chosen blend weights: `lgb_v1=0.4671`, `cat=0.0000`, `xgb=0.5329` (C: lgb_v1=0.4060, cat=0.0000, xgb=0.5940).
- submission_E vs submission_C (LB 91.186): corr `0.99990`, mean diff `+0.00041`.
- Prediction mean: E `0.13068` (C `0.13027`, v1 `0.13083`).

## 1. Combined-feature daytime-proxy RMSE (vs C's v1-feature numbers)

Identical machinery to Approach C; the ONLY change is the two added features, so any delta is attributable to B's features in the ensemble setting. `road_tod_mean` / `lanes_tod_mean` are smoothed (k=10) target means per (RoadType,tod) / (NumberofLanes,tod), fit leakage-free on each fold's train reference only (held-out rows never contribute), exactly as in Approach B.

| Model | E proxy RMSE (combined) | C proxy RMSE (v1 feats) | delta (E - C) |
|---|---|---|---|
| lgb_v1 | 0.029668 | 0.029589 | +0.000079 |
| cat | 0.031379 | 0.031161 | +0.000219 |
| xgb | 0.029606 | 0.029383 | +0.000223 |
| **blend** | **0.029398** | **0.029201** | **+0.000197** |

(C's reference: lgb_v1 0.029589, xgb 0.029383, cat 0.031161, blend 0.029201.)

## 2. Gated blend

Non-negative weights summing to 1, chosen to minimize the daytime-proxy RMSE (Dirichlet random search + coordinate polish). Accepted only if it beats the best single model on the proxy.

| Model | single proxy RMSE | blend weight |
|---|---|---|
| lgb_v1 | 0.029668 | 0.4671 |
| cat | 0.031379 | 0.0000 |
| xgb | 0.029606 | 0.5329 |

- best single model: **xgb** (RMSE 0.029606)
- best blend RMSE: **0.029398** (accepted: **True**)

## 3. Final rounds -- lag-present CV-A calibration

The proxy has no day-over-day `geo_tod` lag, so its rounds are inflated and NOT transferable. Final rounds are calibrated in the real regime (fit day48 no-lag, early-stop on day49 with the real lag) -- the same protocol that produced v1 (217 LGBM rounds, LB 90.791) and Approach C.

| Model | CV-A best_iter (lag) | CV-A RMSE | E final rounds | C final rounds |
|---|---|---|---|---|
| LightGBM | 148 | 0.06835 | 212 | 217 |
| CatBoost | 151 | 0.06802 | 216 | 196 |
| XGBoost | 162 | 0.06921 | 228 | 259 |

## 4. Final submission (`submissions/submission_E.csv`)

- rows: **41778**; pred min/mean/max = 0.0066 / **0.13068** / 1.0000.
- C mean 0.13027; v1 mean 0.13083.
- vs submission_C (LB 91.186): corr **0.99990**, mean diff **+0.00041**, mean abs diff 0.00144.
- vs v1 (LB 90.791): corr **0.99922**, mean diff **-0.00015**, mean abs diff 0.00387.

## 5. Backup candidate (`submissions/submission_BC.csv`)

- 50/50 average of submission_B + submission_C (41778 rows), clipped [0,1].
- corr(B,C) = **0.99771** (means: B 0.13022, C 0.13027, BC 0.13025).
- corr(BC,B) 0.99943, corr(BC,C) 0.99942, corr(BC,E) 0.99934.
- This is a cheap diversification of the two best validated files; it is a BACKUP, not the main deliverable.

## 6. Honest verdict on beating 91.186

On the daytime proxy, E's blend (0.029398) did NOT beat C's (0.029201) (delta +0.000197). Adding B's features did not produce an additive gain in the ensemble setting (the blend already captures much of the same signal).

**Recommendation:** the safer primary attempt remains **`submission_C.csv`** (91.186). Submit **`submission_BC.csv`** (50/50 B+C) as the diversification candidate; treat `submission_E.csv` as exploratory.
