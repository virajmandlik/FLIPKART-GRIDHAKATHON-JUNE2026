# Approach D -- target reformulation + calibration (orthogonal lever)

Other workers model `demand` directly (HPO / features / model ensembling). Approach D changes WHAT is predicted (residual/ratio around a 'yesterday' prior) and POST-PROCESSES it (segment bias calibration + prior blend), gating every decision on a daytime-faithful proxy.

## 1. Daytime validation proxies
The scored test is day-49 DAYTIME (tod [135,825] = 02:15-13:45). Prior rounds (v3/v4) regressed because the only offline CV was NIGHT-dominated and did not track the leaderboard. We use day-48 daytime labels:

- **PROXY-CELL (primary):** 5-fold over day-48 DAYTIME rows; every train fold also carries ALL day-48 non-daytime rows (warm geo/tod stats, mirroring warm test cells). Aggregates and `base` refit per fold on fold-train rows only.
- **PROXY-TIME (stress test):** train day-48 non-daytime, validate day-48 daytime (proper horizon hold-out; base degenerates to a night-biased geohash level, so it is pessimistic).

**Key asymmetry (documented):** for the REAL test/day-49 the day-over-day analog `base = geo_tod` (day-48 demand at the same geohash+slot) EXISTS for ~89% of cells; but day-48 has no day-47, so inside both proxies (and for day-48 TRAIN rows in the final) `base` is the FACTORIZED estimate (geo_mean*tod_factor). The proxies therefore validate the residual/ratio MACHINERY and the calibration under the *weaker-base* regime; the real test's 89% warm cells get a stronger geo_tod base, so the real RMSE should be LOWER than the proxy numbers and absolute values will NOT transfer 1:1.

## 2. Three target formulations (same features, same rounds = 217)

| formulation | PROXY-CELL RMSE | PROXY-TIME RMSE |
|---|---|---|
| base-only (raw prior) | 0.05685 | 0.10935 |
| (i) DIRECT (v1 control) | 0.03116 | 0.06518 |
| (ii) ADDITIVE residual | 0.03052 | 0.07272 |
| (iii) LOG-RATIO | 0.03600 | 0.08416 |

**Chosen formulation: `direct`** (primary gate = PROXY-CELL; a non-DIRECT formulation is adopted only on a clear PROXY-CELL win that PROXY-TIME also corroborates, honoring the v3/v4 lesson that unverified changes to the proven pipeline tend to regress the LB).

## 3. Segment-wise bias calibration (gated on PROXY-CELL OOF)

Out-of-fold (honest) estimation; a candidate is accepted only if it lowers OOF RMSE.

| calibration | OOF RMSE |
|---|---|
| none | 0.03116 |
| global_affine | 0.03112 |
| road_bias | 0.03116 |
| road_bias+affine | 0.03115 |

**Accepted calibration: `global_affine`** (RMSE after calibration 0.03112).

## 4. Prior blend with the raw yesterday prior

final = w * model + (1-w) * base. Out-of-fold blend RMSE **0.03112** vs no-blend **0.03112**; full-data weight w = **1.000**. Accepted: **False**.

**Final pipeline PROXY-CELL OOF RMSE: 0.03112** (DIRECT baseline 0.03116; raw base-only 0.05685).

## 5. Submission vs v1 (submission_lgbm.csv, LB 90.791)
- prediction mean = **0.13152** (v1 mean 0.1308; min=0.0052, max=1.0000).
- correlation vs v1 = **0.99984**, mean abs diff = **0.00198** over 41778 rows (mean_D=0.13152 vs mean_v1=0.13083).

## 6. Honest verdict: will D beat 90.791?

- **The reparametrizations did NOT robustly help.** ADDITIVE residual looked marginally better on PROXY-CELL (0.03052 vs DIRECT 0.03116, a 0.64e-3 edge) but REVERSED on the proper horizon hold-out PROXY-TIME (0.07272 vs DIRECT 0.06518) -- a textbook repeat of the v3/v4 trap where a non-horizon signal flatters a change that then regresses. The guard therefore (correctly) kept DIRECT. LOG-RATIO was clearly worse on both proxies.
- **Calibration / blend gains are noise-level.** The accepted global affine moved OOF RMSE 0.03116->0.03112 (delta 0.00005, below the ~2e-04 noise floor of this proxy); the prior blend was REJECTED (optimal w=1.000, i.e. the model already absorbs the geo_tod prior as a feature). The affine is kept only because it is compliant, global, and essentially free (corr unchanged).
- **Net:** D collapses to a seed-averaged v1-equivalent (corr vs v1 = 0.9998, mean abs diff 0.00198, mean 0.1315 vs v1 0.1308). **Most likely outcome: parity with ~90.791, not a clear gain.** It will not beat v1 by a margin, and it is too correlated with v1 (~1.0) to help an ensemble. Recommend keeping v1 as the submission of record; ship submission_D.csv only as a near-duplicate safety net.
- **Why the orthogonal lever found no free signal here:** the strongest base (geo_tod lag) is ALREADY a model feature, so anchoring the target on it is redundant; and the train/predict base-granularity asymmetry (day-48 train uses the factorized base, day-49/test use the true lag) means residual/ratio targets carry a structural mismatch no single-day proxy can fully measure -- a real risk, not a win. The one durable, reusable artifact is the daytime-proxy + honest out-of-fold calibration harness, which is model-agnostic and can sit on top of whichever base model (v1 / Approach A/B/C) ultimately wins.
