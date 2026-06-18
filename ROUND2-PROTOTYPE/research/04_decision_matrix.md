# PS Selection Decision Matrix — Gridlock Hackathon 2.0, Round 2

**Analyst lane:** Which of PS1 / PS2 / PS3 maximizes *this* team's odds of winning.
**Date:** 2026-06-18 · **Deadline:** 2026-06-21 23:59 IST (~3 days) · **Team size:** 1 (solo) · **Field:** 1635 teams · **Jury:** Bengaluru Traffic Police + Flipkart · **Finale:** Top 10 → in-person July 3, *must demo a working prototype*.

**Team profile:** Elite tabular / geospatial-temporal ML (won Round 1: LightGBM+XGBoost, geohash→lat/lon, leakage-safe features, rigorous validation). Weak at: computer vision, full-stack web, cloud deploy.

---

## 1. Scored decision matrix

Scores 1–10 (10 = best for *winning*). For "Crowding," a high score = **less** crowded / lower competition risk. Weighted contribution in parentheses.

| # | Criterion | Weight | PS1 — Parking Congestion | PS2 — Event Congestion | PS3 — CV Violations (idea-only) |
|---|-----------|:-----:|:-----:|:-----:|:-----:|
| a | Fit to team's proven strengths | 18% | **10** (1.80) | 7 (1.26) | 3 (0.54) |
| b | Feasibility of polished deliverable in 3 days solo | 16% | **9** (1.44) | 6 (0.96) | 7 (1.12) |
| c | Data quality / availability & defensibility | 14% | **9** (1.26) | 4 (0.56) | 3 (0.42) |
| d | Differentiation potential vs 1635 teams | 12% | 7 (0.84) | 7 (0.84) | 2 (0.24) |
| e | Appeal to BTP jury (enforcement value) | 12% | **9** (1.08) | 8 (0.96) | 6 (0.72) |
| f | Appeal to Flipkart jury (tech / scalability) | 8% | 7 (0.56) | 7 (0.56) | 6 (0.48) |
| g | Strength for in-person finale (live working demo) | 12% | **9** (1.08) | 7 (0.84) | 2 (0.24) |
| h | Crowding / competition risk (high = safer) | 8% | 6 (0.48) | **8** (0.64) | 2 (0.16) |
| | **WEIGHTED TOTAL** | **100%** | **🥇 8.54** | **🥈 6.62** | **🥉 3.92** |

**Weights rationale:** Fit + feasibility dominate because it is a 3-day solo build judged partly by a working demo (a+b = 34%). Data defensibility (c, 14%) is weighted because both juries will probe rigor and PS2/PS3 have data holes. Finale demo (g, 12%) is weighted heavily because no demo = no prize. Crowding (h) and Flipkart-tech (f) are real but secondary, hence 8% each.

---

## 2. Reasoning per score (and the counter-argument)

**PS1 — Parking-Induced Congestion**
- **a=10:** This is *exactly* the Round-1-winning skill: 298k clean rows of lat/long + junction + police_station + violation_type + offence_code + timestamps + validation_status. A geospatial-temporal tabular problem is this team's home court.
- **b=9:** Streamlit + folium/kepler/pydeck makes a polished hotspot dashboard achievable solo in 3 days (validated); only deduction is final UX polish under time pressure.
- **c=9:** Best dataset of the three — large, clean, rich. Single caveat: it is violations-only with **no direct congestion ground truth**, so "congestion impact" must be a defensible *proxy/risk score*, not a measured value.
- **d=7:** Rigor + a true decision-product differentiates, but the great dataset means many teams attempt it; a plain heatmap won't stand out.
- **e=9:** Directly actionable — a prioritized "where/when to enforce" tool is precisely BTP's stated pain (patrol-based, reactive, no prioritization).
- **f=7:** Solid, scalable pipeline, but tabular ML is less flashy to a tech jury than CV.
- **g=9:** Interactive dashboards demo beautifully live, run fast, and can run **offline** at the finale.
- **h=6:** The rich dataset is a magnet → expect crowding from other strong tabular teams. This is the main risk.
- **Strongest counter-argument to PS1:** *Crowding concentrates the best ML teams here, so you fight rigor-vs-rigor exactly where you have least slack.* Rebuttal: this team already beat that same field on this exact skill in Round 1; head-to-head tabular rigor is its **best** matchup, and most rivals will ship a heatmap while you ship a prioritized BTP decision tool.

**PS2 — Event-Driven Congestion**
- **a=7 / b=6 / c=4:** Still geospatial-temporal (playable), but only ~8.2k rows, NULL-heavy, free-text incl. Kannada (NLP, off-strength), and — confirmed in the data and flagged publicly — it records the *event* but **not the response/manpower taken**. The headline ask ("recommend optimal manpower") has **no ground-truth labels**, forcing an unsupervised/heuristic reframe = real design risk in 3 days.
- **d=7 / e=8 / h=8:** Fewer teams will brave the data gap (lower crowding), and event manpower planning is a genuine BTP pain — a credible reframe could stand out.
- **f=7 / g=7:** Forecast-+-plan tool is interesting but harder to validate/trust in a live demo.

**PS3 — CV Traffic-Violation Detection (idea-only)**
- **a=3:** CV is the team's explicit weakness.
- **b=7:** Idea-only is genuinely low-burden to *produce* — but "polished/winning" is hard, and it builds nothing that leverages the team's edge.
- **c=3:** No dataset; the PS even lists mAP/precision/recall as outcomes that **cannot be backed** with no model → unverifiable claims.
- **d=2:** Most crowded, lowest barrier; validated — the web is saturated with near-identical YOLO+OCR helmet/triple-riding/ANPR projects. An idea-only doc is nearly impossible to differentiate across 1635 teams.
- **e=6 / f=6:** Concept appeals to both juries, but an idea-only doc gives them nothing deployable to reward.
- **g=2 / h=2:** **The killers.** The finale *requires* a working prototype demo on July 3; an idea-only theme leaves nothing to demo, in a domain the team can't quickly build — and it's the most contested theme. (Note: candidates report the submission portal forces "source code" + "demo link" fields even for PS3, so idea-only may be penalized outright.)

---

## 3. Final recommendation

**Primary: PS1 — Parking-Induced Congestion. Runner-up: PS2 — Event-Driven Congestion.**

> **Sharpest justification:** PS1 lets a solo, finale-bound team play its single proven winning hand — leakage-safe geospatial-temporal ML on the richest, cleanest dataset — and turn it into a live, BTP-deployable enforcement-prioritization demo, while PS3 strands the team in its weakest skill on the most crowded theme with nothing to demo at the finale.

*Pick PS2 only if you obtain credible signal that prizes are awarded **per theme** AND that PS1 is overwhelmingly contested — its under-crowding then becomes the edge, at the cost of a much weaker data foundation.*

---

## 4. PS1 winning angle / USP

- **Ship a decision product, not a heatmap.** Output a ranked **"Enforcement Priority List"** (top-N zones × time windows) so BTP knows *where and when* to deploy limited patrols tomorrow — directly answering their "can't prioritize" pain.
- **Parking Congestion-Risk Score** per hex/junction = f(violation density, recurrence/persistence, repeat-offender concentration, peak-hour intensity, road criticality). Frame "congestion impact" honestly as a *risk proxy* (defuses the no-ground-truth weakness) and enrich road class via the allowed MapmyIndia free API.
- **Leakage-safe spatiotemporal forecasting** (H3/geohash hex × hour, LightGBM, strict time-based validation) — lead with the *same rigor that won Round 1*; show the validation, since both juries reward defensibility.
- **Enforcement-effectiveness loop:** use `validation_status` + `action_taken_timestamp` vs. recurrence to show whether enforcing a hotspot reduces repeat violations → an ROI story unique to this dataset.
- **Finale-proof demo:** pure-Python Streamlit app, hosted (Community Cloud) for the demo link **and** runnable fully offline on a laptop at Flipkart HQ — no full-stack/cloud dependency, no wifi risk.

### Realistic 3-day scope
- **MVP (Days 1–2, must-have):** clean pipeline (reuse Round-1 code) → H3/geohash aggregation → interactive hotspot map with time slider → ranked Enforcement Priority table → peak-hour + repeat-offender analytics → deployed Streamlit link.
- **Core model (Day 2):** LightGBM forecast of hotspot intensity per hex×time with leakage-safe time split; report one clean validation metric.
- **Stretch (Day 3 if ahead):** intervention simulator ("enforce top-k zones → est. violation/congestion-hours avoided"), MapmyIndia road-context enrichment, exportable patrol/shift roster PDF.
- **Day 3 (locked):** record 2-min demo video, build deck, write run instructions, package repo + source zip. Freeze features by Day-3 morning.

---

## 5. Top risks of PS1 + mitigations

| Risk | Mitigation |
|------|-----------|
| **Crowding** — strong tabular teams cluster on the rich dataset | Win on *product framing* (BTP-ready patrol plan + ROI) and *validation rigor*, not another heatmap |
| **No congestion ground truth** (violations ≠ congestion) | Explicitly position output as a defensible *congestion-risk / enforcement-priority* proxy; justify with road criticality + recurrence; don't overclaim measured congestion |
| **Deploy / full-stack is a team weakness, but finale needs a live demo** | Stay 100% Python (Streamlit); host for the link **and** keep an offline-runnable build for July 3 |
| **3-day solo time crunch** | Lock MVP Day 1, reuse Round-1 pipeline, ship MVP by Day 2, polish/package Day 3; treat stretch items as optional |
| **Credibility loss from leakage/overfit** before a rigor-minded jury | Strict time-based train/val; no target leakage from `action_taken`/`validation` timestamps into predictors; document the validation in deck + repo |
| **Submission completeness** (repo, demo link, video, deck, run instructions) | Reserve Day-3 afternoon strictly for packaging; checklist each required field before the 23:59 IST cutoff |

---

*Sources used (light validation only): public GitHub corpus confirms CV helmet/ANPR violation detection is a saturated, low-barrier theme (PS3 crowding); streamlit-folium / kepler.gl / pydeck docs confirm a polished geospatial dashboard is feasible solo in days (PS1 feasibility). Hackathon facts and the PS2 manpower-label gap are grounded in the provided FAQ, problem statements, and the datasets themselves.*
