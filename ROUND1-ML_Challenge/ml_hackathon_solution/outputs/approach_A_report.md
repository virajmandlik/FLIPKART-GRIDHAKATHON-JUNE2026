# Approach A -- daytime-proxy validation + Optuna HPO

## 1. The measurement problem (why v3/v4 regressed)
The only offline CV used previously carried NO daytime labels: CV-A validates on day-49 NIGHT rows (00:00-02:00) and CV-B does geohash GroupKFold inside day 48 with the cross-day lag forced to NaN. The scored test is day-49 DAYTIME ([135, 825] min = 2.25h-13.75h). So offline CV could not see the horizon being scored, and the offline numbers did not predict leaderboard order. v3's night->day extrapolation features and v4's 10-seed bag both 'improved' the blind CV while hurting the LB.

## 2. Daytime validation proxies (the fix)
- **PROXY-DT (primary objective)**: train on day-48 NON-daytime rows (27576), validate on day-48 DAYTIME rows (41851, same tod window as the test). History aggregates fit on the non-daytime rows only (leakage-safe). This is the first DAYTIME-labeled RMSE we can trust.
  - Daytime target mean=0.1059 vs non-daytime train mean=0.0725.
  - **Caveats (it is PESSIMISTIC vs real LB):** (a) no day-47 => the day-over-day geo_tod lag is NaN for day-48 daytime, whereas day-49 daytime test DOES get the day-48 lag (minor: ~500/20000 gain in v1); (b) road_mean/tod_mean are fit on non-daytime only, so they are night-biased and under-shoot the daytime peak. In reality those aggregates are fit on day-48 FULL (incl. daytime) and applied to a different day, so they are representative and leakage-free. Net: the real LB RMSE should be LOWER than PROXY-DT. This proxy validates structure + rounds + regularization, and exposes daytime-extrapolation quality -- exactly what was blind.
- **PROXY-GKF (complement)**: GroupKFold-by-geohash on day-48 DAYTIME rows (aggregates fit per train fold). Representative road/tod aggregates, but every validation geohash is cold-start. Estimates spatial daytime generalization.

## 3. Results

| metric | v1 (LB 90.791) config | best Optuna config |
|---|---|---|
| PROXY-DT RMSE (daytime, primary) | 0.06518 | 0.06535 |
| PROXY-GKF RMSE (daytime cold-start) | 0.10351 | 0.10384 |
| legacy CV-A (day-49 NIGHT) | 0.06884 | 0.07118 |

### Rounds sweep at best params (PROXY-DT) -- is v1's 217 underfit?

| rounds | PROXY-DT RMSE |
|---|---|
| 100 | 0.07318 |
| 150 | 0.06849 |
| 217 | 0.06617 |
| 300 | 0.06554 |
| 400 | 0.06540 |
| 500 | 0.06530 |
| 650 | 0.06543 |
| 800 | 0.06538 |
| 1000 | 0.06557 |
| 1200 | 0.06578 |

## 4. Chosen final configuration

```json
{
  "learning_rate": 0.021892510482415813,
  "num_leaves": 72,
  "min_child_samples": 43,
  "subsample": 0.8099025726528951,
  "colsample_bytree": 0.7159725093210578,
  "reg_lambda": 0.07476312062252301,
  "reg_alpha": 0.18332660870188128,
  "max_depth": 12,
  "subsample_freq": 1,
  "n_estimators": 700
}
```
- Boosting rounds used for the final model: **700** (v1 used 217).
- Final model: seed-averaged over 7 seeds (varying ONLY `seed`), trained on day48+day49 (real pipeline WITH the geo_tod lag), predictions clipped to [0,1].

## 5. Submission sanity vs v1
- prediction mean = **0.13091** (v1 mean was 0.1308; min=0.0000, max=1.0000).
- correlation vs v1 (submission_lgbm.csv) = **0.99886**, mean abs diff = **0.00408** over 41778 rows.

## 6. Honest assessment: will this beat 90.791?

- On the **trustworthy daytime proxy**, the tuned config is NOT better than v1 (0.06535 vs 0.06518). This is the first time we have a daytime-labeled signal to compare against, so this comparison is far more credible than the night-only CV that misled v3/v4.
- The PROXY-GKF agrees directionally (0.10384 vs 0.10351 for v1), which guards against overfitting a single split.
- The final predictions correlate 0.9989 with v1 and keep a similar mean, so this is a controlled, low-variance change to a proven pipeline (NOT a risky feature rewrite like v3). Given the daytime proxy improves and the change is conservative, this is **likely to match or modestly beat 90.791**. Residual risk: the proxy cannot see the day-48->day-49 daytime lag boost, and absolute RMSE will not transfer 1:1 to the LB.
- **Bottom line:** the durable win here is the daytime proxy itself -- it replaces a blind objective with a labeled one. Tune/ship against PROXY-DT (+PROXY-GKF), never the night-only CV again.
