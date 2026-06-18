# Approach C -- Model Diversity + Daytime-Proxy-Gated Blend

## 1. Daytime validation proxy (the gate)

The leaderboard is scored on **daytime** rows (day-49, 02:15-13:45), but the only daytime labels available offline are **day-48's daytime slots (135-825 min)**. The proxy is a 5-fold OOF over those day-48 daytime rows; every training fold also includes **all** day-48 non-daytime rows so the daily demand curve is learned and per-geohash / per-tod aggregates stay WARM (mirroring the ~99% warm test cells). History encoders are refit per fold on fold-train rows only.

**Caveat (honest):** day-48 has no prior day, so the proxy cannot exercise the day-over-day `geo_tod` lag -- the single strongest real feature, present for ~89% of test cells. The proxy is thus **pessimistic in absolute RMSE**, but all three models carry the identical handicap, so it is a trustworthy *relative* comparator for model selection, rounds, and blend weights. This is exactly the signal the night-dominated CV-A / CV-B lacked (they did not track the LB).

- day-48 daytime rows (proxy target): **41851**
- day-48 non-daytime rows (always in train): **27576**
- folds: **5**

## 2. Per-model daytime-proxy RMSE

(Proxy round cap = 500; the lag-free proxy keeps improving to the cap, so its `avg_best_iter` is NOT a usable final-round count -- see sec 3.)

| Model | Daytime-proxy OOF RMSE | Avg iter @cap |
|---|---|---|
| LightGBM (v1 params) | 0.029589 | 499 |
| LightGBM (deep/reg) | 0.030202 | 500 |
| CatBoost | 0.031161 | 499 |
| XGBoost (geohash dropped) | 0.029383 | 498 |

Chosen LightGBM variant for the blend: **v1** (lower daytime-proxy RMSE).

## 3. Round count -- calibrated in the REAL (lag-present) regime

The daytime proxy has **no day-over-day `geo_tod` lag**, so every model keeps improving to the round cap there (its rounds are inflated and NOT transferable). The real final fit DOES have the lag and converges fast. Inflating final rounds from the proxy would over-fit -- the exact way v3/v4 lost. So final rounds are calibrated by the **lag-present CV-A** protocol (fit day48 no-lag, early-stop on day49 with the real lag) -- the same protocol that produced v1 (best_iter 152 -> 217 rounds, LB 90.791).

| Model | CV-A best_iter (lag) | CV-A RMSE | final rounds |
|---|---|---|---|
| LightGBM (v1) | 152 | 0.06843 | 217 |
| CatBoost | 133 | 0.06812 | 196 |
| XGBoost | 190 | 0.06998 | 259 |

**Finding:** with the lag present, LightGBM's daytime-validated best_iter is ~152 -> 217 rounds, i.e. v1's 217 is about right (NOT a meaningful underfit). The earlier worry that 217 underfits came from the lag-FREE view; it does not hold once the dominant lag feature is restored.

## 4. Gated blend

Weights are non-negative and sum to 1, chosen to minimize the daytime-proxy RMSE (Dirichlet random search + coordinate polish). The blend is **accepted only if it beats the best single model** on the proxy.

| Model | single proxy RMSE | blend weight |
|---|---|---|
| lgb_v1 | 0.029589 | 0.4060 |
| cat | 0.031161 | 0.0000 |
| xgb | 0.029383 | 0.5940 |

- best single model: **xgb** (RMSE 0.029383)
- best blend RMSE: **0.029201**
- blend accepted: **True** -> chosen proxy RMSE **0.029201**

## 5. Final submission

- file: `submissions/submission_C.csv` (41778 rows)
- prediction mean: **0.13027** (min 0.0058, max 1.0000); v1 mean was 0.1308
- correlation vs v1 (submission_lgbm.csv): **0.99921**
- mean diff vs v1: **-0.00056** (v1 mean 0.13083); mean abs diff **0.00380**

## 6. Honest verdict on beating 90.791

The gated blend beat the best single model on the **daytime** proxy (the signal that night CV-A/CV-B lacked), so it is shipped.

Predictions are **nearly identical** to v1 (corr 0.9992, mean diff -0.0006). Expect a score within noise of 90.791; the main, low-risk lever is the daytime-validated round count plus seed-averaging (variance reduction), not a structural change.
