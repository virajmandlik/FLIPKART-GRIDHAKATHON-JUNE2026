# Approach B - Daytime-aware feature engineering (Gridlock 2.0)

## TL;DR

- **Best daytime-proxy RMSE (Proxy-T):** `0.05511` (kept set) vs v1-features `0.05899` -> **+0.00388** improvement.
- **Proxy-S (cold-start daytime):** kept `0.17125` vs v1 `0.16609`.
- **Kept families:** +road/lanes_tod.
- **Vs v1 (LB 90.791):** corr `0.9977`, pred mean `0.1302` (v1 `0.1308`), MAE `0.0052`.
- **Prediction mean:** `0.1302` (v1 was 0.1308); rows `41778`.

## Why a daytime proxy (the v3 trap)

Train labels for day-49 are NIGHT only (slots 0-120); the leaderboard is scored on the DAYTIME window (slots 135-825). Night-based CV ranked v3's morning/shift features as wins but they HURT the daytime test (LB 90.678 < 90.791). Day 48 is the only day with daytime labels, so we validate there.

- **Proxy-T (primary, temporal):** train on day-48 non-daytime (27576 rows) -> predict day-48 daytime (41851 rows). Isolates static / region / profile / ratio features. *Caveat: the per-cell day-over-day lag (`geo_tod`/`geo_hour`) is absent here (no day 47), so the proxy cannot score it; it is kept on theory + 88.9% test coverage.*
- **Proxy-S (cold-start, spatial):** GroupKFold-by-geohash on day 48; score only held-out cells' daytime rows (41851 rows). Validates region/profile back-off for unseen cells.
- **Cold-start:** 15 test cells unseen in day 48; all have their gh5 prefix (15) and gh4 prefix (15) present in train -> region back-off applies.

## Ablation table (fixed rounds, no early-stop peeking)

Each family is measured INDEPENDENTLY on top of v1 (clean marginal value).

| Feature set | Proxy-T RMSE | Proxy-S RMSE (daytime) | vs v1 (T / S) | Decision |
|---|---|---|---|---|
| v1_base | 0.05899 | 0.16609 | -- | baseline |
| +road/lanes_tod | 0.05511 | 0.17125 | -0.00388 / +0.00516 | KEEP |
| +region(gh5/gh4) | 0.05953 | 0.17119 | +0.00054 / +0.00510 | drop |
| +ratios | 0.05909 | 0.17140 | +0.00010 / +0.00531 | drop |
| +geo_hour | 0.05899 | 0.17254 | +0.00000 / +0.00645 | drop |
| **KEPT (combined)** | **0.05511** | **0.17125** | -0.00388 / +0.00516 | final |

Decision rule: keep a family iff it improves Proxy-T (primary) by >= 1e-4, OR improves Proxy-S (cold-start) by >= 1e-4 without hurting Proxy-T by more than 2e-4. This rejects anything that only looked good on night CV.

## Kept feature list

- v1 base features (32): unchanged from `features.py::feature_columns()`.
- Added (2): `road_tod_mean`, `lanes_tod_mean`
- Total fed to LightGBM: 34 (cats: geohash, RoadType, Weather).
- Excluded on purpose: v3 morning_mean / day_shift / scaled_lag (night-CV artefacts that regressed the LB), and any family that failed the daytime gate.

## Final model - top gain features

| feature | gain |
|---|---|
| road_mean | 12224.2 |
| RoadType | 3473.4 |
| geo_mean | 1574.8 |
| geo_median | 675.2 |
| geohash | 554.8 |
| road_tod_mean | 442.7 |
| geo_mean_smooth | 253.7 |
| hour_sin | 174.6 |
| tod_mean | 146.0 |
| tod_std | 129.0 |
| tod | 100.4 |
| tod_sin | 85.1 |
| geo_tod_mean | 80.4 |
| geo_std | 72.4 |
| geo_max | 70.8 |
| tod_cos | 59.5 |
| geo_min | 59.3 |
| lon | 28.9 |

## Final model & submission

- LightGBM v1 params (only `seed` varied), seed-averaged over 6 seeds, 437 rounds (from proxy best_iter=437).
- Trained on day48 + day49; predicted day-49 test; clipped [0,1].
- `submissions/submission_B.csv`: 41778 rows, pred min/mean/max = 0.0024 / 0.1302 / 1.0000.

## Verdict on beating 90.791

- The kept features give a **real, leakage-free daytime-proxy gain** (+0.00388 RMSE on Proxy-T) and predictions are highly correlated with v1 (corr 0.9977) - i.e. a refinement, not a regime change.
- Because the gain is measured on DAYTIME labels (unlike v3/v4 which were ranked on night CV), it is far more likely to transfer to the leaderboard. Honest expectation: a small improvement over 90.791 (the proxy gain is modest and the dominant signal - static road/cell level - is shared with v1). The single biggest unmeasurable risk remains the per-cell day-over-day lag, which the proxy cannot score; we keep it unchanged from v1 to avoid regression.
- Recommendation: submit `submission_B.csv`. If LB <= 90.791, the safe fallback is v1 (`submission_lgbm.csv`), which shares ~all of B's structure.
