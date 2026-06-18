# Gridlock Hackathon 2.0 — Round 2 — LIVE STRATEGY REPORT

> One-page decision document. Synthesis of 4 research streams + direct dataset profiling.
> Compiled 18 Jun 2026. Deadline: **21 Jun 2026, 23:59 IST (~3 days left)**.
> Deep-dive appendices in same folder: `01_hackathon_judging.md`, `02_bengaluru_domain.md`, `03_tech_solutions.md`, `04_decision_matrix.md`, `00_data_profile.md`.

---

## VERDICT (read this first)

**Pick PS1 — Parking-Induced Congestion. Runner-up: PS2.**
**Hero feature: a "Congestion Impact Score + Enforcement Priority List" — a decision tool that tells BTP WHERE and WHEN to send the next towing van / officer, not just a heatmap.**

Weighted decision score (full matrix in appendix 4): **PS1 = 8.54 | PS2 = 6.62 | PS3 = 3.92.**

Why, in one line: PS1 is the exact skill you won Round 1 with (geospatial-temporal tabular ML), on the only dataset that fully supports its own question, producing a live demo that survives the in-person July 3 finale — while PS3 is idea-only (weak for a working-demo finale), most crowded, and your weakest skill.

---

## THE NON-NEGOTIABLE FACTS

| Fact | Detail | Why it matters |
|---|---|---|
| Deadline | 21 Jun 2026, 23:59 IST | ~3 days. Scope ruthlessly. |
| Jury | **Bengaluru Traffic Police (BTP) + Flipkart** | Build for a cop AND an engineer. |
| Finale | Top 10 → in-person 3 Jul, Flipkart HQ; **working prototype demo required** | Idea-only (PS3) is weak here. Must attend in person. |
| Field | 1635 teams; pick ONE theme | Differentiate hard. |
| Prizes | 2.25L / 1.75L / 1.0L; likely **overall, not per-theme** (confirm in FAQ) | Must be best cross-theme, not just within theme. |
| Submission (PS1/PS2) | Title, description, theme, snapshots, **demo video, deck, demo link, repo, source zip, run instructions** | Each file <50MB. Package = half the battle. |
| Data rule | PS1/PS2 must use **ONLY** the HackerEarth dataset; MapmyIndia/Mappls free API allowed (visualization only) | External data = disqualification. |

---

## THE 3 PROBLEM STATEMENTS — QUICK READ

- **PS1 Parking congestion** — Dataset: **298,450 clean rows**, 100% valid Bengaluru coords, 5 months. Rich geo+time. Fits your strength like a glove. **CHOOSE THIS.**
- **PS2 Event congestion** — Dataset: only 8,173 rows, and the core ask ("recommend manpower/barricading") has **no labels in the data** (assigned-officer 98% empty, no manpower/barricade column, end-time 94% empty). A trap unless reframed honestly. Good runner-up only.
- **PS3 CV violations** — Idea-only (no dataset, no working model). Lowest effort, but most crowded, your weakest skill, and nothing to demo at the finale. Avoid for the cash.

---

## WHY PS1 WINS (the evidence)

1. **Data is a bullseye for your strength.** 298k rows: lat/long, junction (with official BTP junction IDs like `BTP051 Safina Plaza Jn` = 15,449 violations), police_station (Upparpet 34k, Shivajinagar 28k, Malleshwaram 22k), violation_type (Wrong Parking 55%, No Parking 47%, Main Road 8%, footpath, near-crossing), and **11,854 repeat-offender vehicles** (one hit 55 times). This is the same geohash/lat-long, time-feature, leakage-safe ML that won Round 1.
2. **It hits BTP's loudest fundable pain.** Towing restarted in 2025 (BBMP-run, 22 corridors + 75 junctions) but **targeting is manual**. Footpath-parking alone = **1,28,821 cases in 2025**. A prioritized "enforce here next" list is something an officer uses *tomorrow*.
3. **It demos beautifully and safely.** A Streamlit + map dashboard runs fast, looks great on video, AND runs **offline on a laptop** at the finale — no full-stack/cloud/wifi risk (your weak spots avoided).

---

## THE WINNING USP — ship a decision product, not a heatmap

Everyone will plot a heatmap. You win by shipping a **transparent, auditable decision tool**:

- **Congestion Impact Score (CIS)** per H3 hex / junction = blend of: violation **density** x **severity weight** (near-crossing/main-road/footpath choke flow more than generic "no parking") x **dwell/recurrence** x **peak-hour alignment** x **junction proximity**. Report 0-100. Say plainly it is a *defensible proxy*, NOT measured flow (you have no flow data) — honesty + rigor beats a fake congestion predictor.
- **Statistical significance:** keep only hotspots that pass **Getis-Ord Gi* / Local Moran's I** (p<0.05, via PySAL). This is the line that separates you from "I plotted points."
- **Enforcement Priority List:** ranked top-N zones x time windows + a one-line "why" + the Pareto stat ("top 10 hotspots = N% of weighted impact"). This is the BTP money slide.
- **Persistence view:** chronic vs flaring hotspots over weekly bins → "permanent enforcement zones."
- **Round-1 rigor as your brand:** an optional LightGBM forecast of hotspot intensity per hex x hour with strict time-based validation — show the validation, both juries reward defensibility.

---

## 3-DAY BUILD PLAN (solo)

- **Day 1:** reuse Round-1 pipeline → clean + time features + dwell + severity weights → H3 binning → Getis-Ord significant hotspots → CIS. Lock scope.
- **Day 2:** Streamlit app — KPI row, Folium map (HeatMap + time slider + H3 choropleth), filters (violation_type / vehicle / police_station), **Enforcement Priority table + CSV download**. Deploy to Streamlit Community Cloud. Optional: LightGBM intensity forecast.
- **Day 3 (freeze code AM):** record ~2-min demo video, build 8-12 slide deck, write run instructions, package repo + source zip, rehearse pitch 5x. **Reserve ~40-50% of total effort for this package.**

**Stack:** pandas + h3 + PySAL(esda)/tobler + scikit-learn(DBSCAN) + LightGBM; UI Streamlit + streamlit-folium (default), optional pydeck 3D-hex for video "wow"; host Streamlit Community Cloud (wake it the morning of judging); MapmyIndia reverse-geocode for road context only. Steal skeletons: `fedderw/baltimore-crash-heat-map`, `sneh-a-15/traffic-accident-hotspot`, `manvirheer/parkingticketanalysis`.

---

## PITCH STRATEGY (dual jury)

- **Narrative spine:** Problem → Why now → Live demo → Impact metric → **Pilot proposal** → Scale/roadmap → Ask.
- **Open and close on the BTP/operational story** (where to deploy patrols); put **tech depth + scalability** in the middle for Flipkart.
- **Bring ONE quantified metric + a "pilot proposal" slide** (scope, metric, timeline, low cost). This is literally what won Gridlock 1.0 ("17% wait reduction at Silk Board, no major investment").
- **Frame as an ASTraM module, never a rival.** ASTraM is BTP's real AI platform (built with Arcadis, Jan 2024); its dashboard/congestion-analytics is exactly where your hotspot tool plugs in.
- **One bulletproof golden-path demo.** Mock anything flaky; never let it crash live.

---

## HARD NUMBERS + TERMS TO SOUND LOCAL

**Cite:** TomTom 2025 — Bengaluru #2 most congested globally (74.4%, ~168 hrs/yr lost, 16.6 km/h). ORR at >2x design capacity (4,800 → 10,400 PCU). 6,200 officers / 1,000+ junctions / 14,000 km. 12 corridors carry ~60% of traffic. Footpath-parking: 1,28,821 cases (2025). 87% of violations now contactless.

**Name-drop:** ASTraM, Mobility Digital Twin (MDT), B-TRAC, ITMS, ANPR/RLVD, VAC/ATCS (CoSiCoSt by C-DAC), ICCC, Enforcement Automation Centre, Public Eye, e-attendance geofence, DULT Parking Policy 2.0 / Area Parking Plan, GBA pay-and-park, BBMP, BMRCL, JCP M.N. Anucheth, JCP Karthik Reddy, Arcadis. **Hotspots:** Indiranagar (CMH Rd, 100 Ft Rd), Koramangala, HSR Layout, CBD (MG/Brigade/Commercial St), KR Market, ORR/Silk Board.

**`data_sent_to_scita` (PS1 column):** most likely a sync flag to **SCITA Solutions**, a Bengaluru parking/ANPR enforcement vendor (inference — say so honestly if asked).

---

## RISKS + MITIGATIONS

| Risk | Mitigation |
|---|---|
| Crowding (rich data attracts strong ML teams) | Win on product framing (patrol plan + ROI) + Gi* rigor, not another heatmap |
| Violations are not congestion ground truth | Position output as a transparent *risk/priority proxy*; never overclaim measured flow |
| Finale needs a live demo; deploy is your weak spot | Stay 100% Python (Streamlit); host for the link AND keep an offline build for July 3 |
| 3-day solo crunch | Reuse Round-1 code, ship MVP by Day 2, package Day 3, treat stretch items as optional |
| Submission incompleteness | Day-3 checklist: demo video, deck, demo link, repo, source zip, run instructions, all <50MB, no secrets in git |

---

## INPUTS I STILL NEED FROM YOU (will sharpen this plan)

1. Can you ship + host a Streamlit map dashboard, or are you ML-notebook-only? (Changes how aggressive the demo can be.)
2. Truly solo, or will Round-1 teammates still help build?
3. Any gut lean toward PS2/PS3 you want me to pressure-test further?
4. Roughly how many focused hours over Jun 18-21?
5. Confirm per-theme vs overall prizes (check HackerEarth FAQ) — flips the PS1-vs-PS2 calculus if per-theme.

**Working assumptions until you say otherwise:** strong ML/Python that can ship a Streamlit map dashboard; effectively solo but capable; optimizing purely for winning odds; ~15-30 hours available.
