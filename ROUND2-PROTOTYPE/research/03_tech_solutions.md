# 03 — Technical Reference Architectures, Repos & Winning USPs
**Flipkart Gridlock Hackathon 2.0 — Round 2 (Prototype)**
Research lane: *open-source repos, buildable-in-3-days stacks, and differentiating USPs.*
Date compiled: **2026-06-18** · Deadline: **2026-06-21 23:59 IST** · Onsite finale: **2026-07-03, Flipkart HQ Bengaluru** · Top 10 shortlisted.

> **Solo-dev reality check (from FAQ):** Team size = 1. PS1/PS2 must use **only the HackerEarth datasets** (external data = disqualification); MapmyIndia/Mappls free tier is allowed. PS1/PS2 need **working prototype + repo + demo video + deck**. PS3 is **idea-only** (concept note / proposal / framework) — no working model or dataset required, even though the brief lists Acc/P/R/F1/mAP. Each field upload ≤ 50 MB.
>
> **Your edge:** world-class tabular/geospatial-temporal ML (LightGBM/XGBoost, geohash→lat/lon, leakage-safe features, rigorous validation). **Weak spots:** CV, full-stack web, cloud. → *Win on the analytics/ML substance, buy the UI cheaply with Streamlit, and turn PS3's CV weakness into an idea/architecture flex.*

---

## 0. How to read this doc
Each PS section has: **(A) Repos/blogs/papers** (link + 1-liner), **(B) 3-day reference architecture**, **(C) Stack + hosting**, **(D) USPs: table-stakes vs winning differentiator**. PS1/PS2 also have a dedicated *"how to be honest/rigorous with this exact dataset"* subsection. The doc ends with **TOP 7 ACTIONABLE TAKEAWAYS**.

### Table-stakes vs. winning differentiator (applies to all 3)
| | Table stakes (everyone will have it) | Winning differentiator (what gets you to top 10) |
|---|---|---|
| **PS1** | A heatmap of violations + counts by area/time | **Quantified congestion-impact score** per hotspot + **enforcement-ROI ranking** ("patrol these 10 junctions → X% of impact") |
| **PS2** | "Here are events on a map / counts by type" | **Severity/impact score + duration prediction + road-closure classifier + rule-based resource recommender**, with **honest disclosure** of the label gap |
| **PS3** | "We'll run YOLO to find helmets" | **Deployment-realistic, evidence-integrity-aware, DPDP-compliant, India-tuned** concept with metrics methodology + edge/cost numbers |

---

# PS1 — Parking-Induced Congestion Intelligence
**Goal:** detect illegal-parking hotspots and **quantify their impact on traffic flow** to enable targeted enforcement, using **only** the ~298k Bengaluru parking-violation rows (id, lat/lon, location, vehicle_type, violation_type, offence_code, created/closed/action_taken timestamps, police_station, junction_name, validation_status).

## (A) Repos / blogs / papers
**Hotspot detection & geospatial analytics (directly reusable patterns):**
- **manvirheer/parkingticketanalysis** — Vancouver parking tickets → DBSCAN persistent-hotspot detection + Folium heatmaps + temporal trends + ANOVA. The single closest analog to PS1. https://github.com/manvirheer/parkingticketanalysis
- **apwheele/crimepy** — battle-tested crime-analysis package: **DBSCAN hotspots, aoristic analysis (spreads an event over its open→close interval — perfect for `created`→`closed` parking durations), patrol districting with Google OR-Tools, Folium interactive maps.** https://github.com/apwheele/crimepy
- **ChiefAj23/Nashville-Crime-Hotspot-Analysis-App** — DBSCAN on 911 calls (Haversine, eps≈400m, min 30 incidents), risk scoring, interactive hotspot app. Clean template for "config the eps/min_samples in sidebar." https://github.com/ChiefAj23/Nashville-Crime-Hotspot-Analysis-App
- **AqibNiazi/urban-crime-intelligence-platform** — XGBoost classification + **DBSCAN with haversine metric** + Prophet forecast, deployed on **HF Spaces (Docker)**; explicitly argues haversine-DBSCAN > Euclidean-KMeans for coords. https://github.com/AqibNiazi/urban-crime-intelligence-platform
- **kgw220/crime-nexus** — daily-updated map with **UMAP→HDBSCAN clusters + Getis-Ord-style hotspot layer** in Folium (toggleable layers). https://github.com/kgw220/crime-nexus
- **ChristopherLandaverde/chicago-airflow** — **Streamlit** crime dashboard: KMeans+DBSCAN hotspots, ARIMA forecast, 1–100 risk score, model-comparison view. Good "executive dashboard" layout to copy. https://github.com/ChristopherLandaverde/chicago-airflow
- **ericmaddox/crime-analyst-ai** — DBSCAN hotspots + Prophet + Folium + **Gradio** UI; shows hotspot radius in km, noise filtering. https://github.com/ericmaddox/crime-analyst-ai

**Spatial statistics (the rigor that impresses judges):**
- **PySAL `esda` — Local Moran's I** (hotspot / coldspot / doughnut / diamond classification with permutation p-values). This is the "real geostatistics" move. https://pysal.org/notebooks/explore/esda/Spatial_Autocorrelation_for_Areal_Unit_Data.html
- **CARTO — Getis-Ord Gi\* vs Local Moran's I explainer** (when to use which; k-ring neighborhoods). https://carto.com/blog/spatial-hotspot-tools/
- **CARTO — space-time Getis-Ord Gi\* on H3 + weekly bins (traffic-accident hotspots, Barcelona)** — the exact "persistent vs flaring hotspot over time" method. https://academy.carto.com/advanced-spatial-analytics/spatial-analytics-for-bigquery/step-by-step-tutorials/space-time-hotspot-analysis-identifying-traffic-accident-hotspots

**H3 / hex binning (your geohash skill transfers 1:1):**
- **pysal/tobler `h3fy`** — turn points/polygons into an H3 hexgrid in a few lines (res 6=city, 9=neighborhood, 10+=street). https://deepwiki.com/pysal/tobler/3.1-h3-hexgrid-generation
- **"Guide to Uber's H3"** (2025) — H3 + Folium for ride/POI density and congestion; copy-paste-able. https://dataforcee.us/2025/03/04/guide-to-ubers-h3-for-spatial-indexing/
- **H3 + KeplerGl space-time binning blog** — bin in space (H3) + time window, plot in Kepler. https://sebastianof.github.io/GeoDsBlog/posts/gds-2024-06-20-dataset-profiling/index.html

**Parking-congestion impact (academic grounding for your "impact score"):**
- **UTTRI (U. Toronto) — *Impacts of Illegal On-Street Parking on Toronto's CBD Congestion*** — microsimulation; defines link delay/flow/speed/travel-time; assigns **duration by infraction type** (parked ≈10 min, stopped ≈5 min). Gives you a literature-backed way to weight events by duration. https://uttri.utoronto.ca/wp-content/uploads/sites/19/2017/09/Impacts-of-Illegal-On-Street-Parking-on-Torontos-CBD-Congestion.pdf
- **Morillo & Campos (UPV CIT2016)** — microsimulation of illegal parking effect on travel time vs flow & location. https://ocs.editorial.upv.es/index.php/CIT/CIT2016/paper/view/3521
- **Thessaloniki study** — illegal parking → **road-capacity reduction**, related to adjacent land use. https://www.academia.edu/55361999/The_impacts_of_illegal_parking_on_the_urban_areas_traffic_and_environmental_conditions_The_case_of_the_city_of_Thessaloniki
- **JGST 2026 — Space Pressure Index (OL + EWR → SPI)** — a *composite occupancy* metric (longitudinal occupation, effective-width reduction). A ready-made "make up a defensible index" template. https://jurnal.ugj.ac.id/index.php/JGST/article/view/11969

## (B) PS1 — How to quantify "congestion impact" using ONLY this dataset (no external data)
You have **no traffic-flow data**, so you build a **transparent, composite "Congestion Impact Score (CIS)"** per hotspot/junction from signals *that exist in the file*. Be explicit that it's a **proxy index**, not measured flow — judges reward honesty + rigor over a fake "we predicted congestion."

Per H3 cell (res 9–10) **or** per `junction_name`/`police_station`, engineer:
1. **Violation density** — count per cell; normalize by area (H3 cells are equal-area → fair comparison). *Repeat-offense density* = distinct days with ≥1 violation (persistence beats one-off spikes).
2. **Severity weight by `violation_type`** — `PARKING NEAR ROAD CROSSING` / blocking junctions >> `NO PARKING` >> generic `WRONG PARKING`. Encode an ordinal "carriageway-choke weight." This is your most defensible domain move (the brief literally says crossings/intersections choke flow).
3. **Duration / dwell** — `closed_datetime − created_datetime` and/or `action_taken_timestamp − created_datetime`. Longer unresolved = longer lane blockage. Mirrors the UTTRI "duration by type" logic. (Validate timestamp sanity; drop negatives.)
4. **Temporal peak alignment** — fraction of a cell's violations in **AM/PM peak hours & weekdays** (peak-hour blockage hurts flow far more). Pure feature-engineering off `created_datetime`.
5. **Junction/road-crossing proximity** — use `junction_name` presence + cluster distance to junction centroids (derive centroids from the data itself, no external map). Crossing/junction-tagged violations get a multiplier.
6. **Spatial significance** — run **Getis-Ord Gi\*** or **Local Moran's I** on the H3 counts to keep only **statistically significant** hotspots (p<0.05), not just "wherever there are many points." This is the credibility differentiator.
7. **Vehicle-type weight (optional)** — trucks/buses block more carriageway width than 2-wheelers → small multiplier from `vehicle_type`.

**CIS = z-score blend** of (density × severity × duration × peak-alignment × junction-proximity), reported 0–100. Then:
- **Enforcement-ROI ranking:** sort cells by `CIS × (violations not yet acted upon / total)` to recommend *"deploy here first."* Quantify coverage: *"the top 10 hotspots = N% of total weighted impact"* (classic Pareto slide — judges love it).
- **Space-time view:** persistent vs. emerging hotspots (Gi\* over weekly bins) → "chronic enforcement zones" vs "new flare-ups."
- **(Optional, allowed) MapmyIndia overlay:** reverse-geocode hotspot centroids to road names / show nearby POIs (metro/commercial) — adds "why here?" context without external *datasets* (it's an allowed API). Don't make the model depend on it.

> **Defensibility script for the deck/video:** "We do **not** claim to measure flow we don't have. We compute a *transparent, auditable Congestion Impact Proxy* from blockage severity, dwell time, peak alignment, and junction proximity, and we keep only spatially-significant hotspots via Getis-Ord Gi\*. Validation: hotspots are stable across train/test time-splits."

## (C) PS1 — 3-day reference architecture
```
parking.csv ──► [pandas clean + timestamp sanity + validation_status filter]
            ──► [feature eng: hour/dow/peak, dwell=closed-created, severity weight, vehicle weight]
            ──► [H3 binning res 9/10  (h3 + tobler.h3fy)]  ──► counts per cell
            ──► [Getis-Ord Gi* / Local Moran (esda)]  ──► significant hotspots (p<0.05)
            ──► [DBSCAN(haversine) for raw cluster shapes] (optional, for "cluster cards")
            ──► [Congestion Impact Score + Enforcement-ROI ranking]
            ──► Streamlit app:
                  • KPI row (total, peak hour, top junction, % impact in top-10)
                  • Folium/pydeck map: HeatMap + H3 choropleth (CIS) + significant-hotspot polygons
                  • Time slider (HeatMapWithTime) + filters (violation_type, vehicle, police_station)
                  • "Patrol Plan" table: ranked hotspots + why + recommended slot
                  • Download CSV of the ranked plan
            ──► deploy: Streamlit Community Cloud (CPU is plenty)
```
- **Heatmap-with-time-slider template (copy this):** `fedderw/baltimore-crash-heat-map` (`folium.plugins.HeatMap` + `streamlit_folium`, date sliders, basemap selector). https://github.com/fedderw/baltimore-crash-heat-map · multi-map Folium patterns: https://thetechbriefs.com/how-to-build-interactive-geospatial-dashboards-using-folium-with-heatmaps-choropleths-time-animation-marker-clustering-and-advanced-interactive-plugins/
- **Accident-hotspot Streamlit app** (markers+heatmap+severity+filters; near-identical skeleton): https://github.com/sneh-a-15/traffic-accident-hotspot

## (C2) PS1 — Stack + hosting (max wow / hour)
- **Compute/ML:** pandas, `h3`, `pysal`/`esda`/`tobler`, scikit-learn (DBSCAN), LightGBM only if you add a forecast.
- **Map (pick ONE primary):**
  - **Folium + `streamlit-folium`** → fastest, most familiar, HeatMap + HeatMapWithTime out of the box. **Recommended default.**
  - **pydeck (`st.pydeck_chart`) HexagonLayer (3D extruded)** → biggest visual "wow" per hour for hotspots; great for the video. Template: `TheLogeek/Logistics-Intelligence` (3D hex density). https://github.com/TheLogeek/Logistics-Intelligence · pydeck tutorial: https://medium.com/@agiraldoal/how-to-create-a-3d-geospatial-dashboard-with-python-streamlit-and-pydeck-c1f2cc3c2cf4
  - **kepler.gl via `streamlit-keplergl`** → gorgeous, but heavier/less interactive in Streamlit. Use only if time permits. https://github.com/chrieke/streamlit-keplergl
  - **`leafmap` / `opengeos/streamlit-geospatial`** → switch folium/kepler/pydeck backends with one selectbox (1k★). https://github.com/opengeos/streamlit-geospatial
- **Hosting:** **Streamlit Community Cloud** (1-click from GitHub; CPU/1GB RAM is enough for tabular+maps; sleeps after 7 days inactivity — wake it before the demo). Keep the CSV in-repo (≤50 MB — it likely is) or pre-aggregate to parquet.

## (D) PS1 — USPs ranked
1. **Congestion Impact Score + Enforcement-ROI Pareto** (winning differentiator).
2. **Statistically-significant hotspots (Getis-Ord Gi\*/Local Moran)** — separates you from "I plotted a heatmap."
3. **Space-time persistence** (chronic vs flaring) + **peak-hour patrol scheduling**.
4. **Explainability** (every score is decomposable; show the formula) — aligns with your rigor brand.
5. *Table stakes:* heatmap, counts, filters, top-junction list.

---

# PS2 — Event-Driven Congestion (Planned & Unplanned)
**Goal:** forecast event traffic impact and **recommend manpower, barricading, diversions**, using ~8.2k Astram event rows (event_type planned/unplanned, lat/long, event_cause, **requires_road_closure**, start/end_datetime, status, **priority**, corridor, police_station, zone, junction, resolved timestamps).
**Known hard gap (confirmed by other candidates in FAQ):** the dataset records the **event**, not the **response** (no manpower/barricading labels). So "recommend manpower" has **no ground-truth** to train/score against.

## (A) Repos / blogs / papers
**Resource allocation / dispatch optimization (the closest analog to "recommend manpower"):**
- **GustyCube/APW-DTE** — *the* template: **LightGBM predicts escalation risk + job duration**, then **Google OR-Tools VRP** assigns crews under skill/time-window constraints, baseline (FIFO) vs optimized comparison, **Streamlit** dashboard. Map "crews→barricade/officer units," "jobs→events." https://github.com/GustyCube/APW-DTE
- **kangwooho0126-prog/Intelligent-Last-Mile-Logistics-Optimization-System** — OR-Tools CVRP + baseline + KPI + **Streamlit + LLM "replan" chat** ("replan with capacity 120"). Great for a "what-if" demo. https://github.com/kangwooho0126-prog/Intelligent-Last-Mile-Logistics-Optimization-System
- **chripiermarini/decision-intelligence-logistics-engine** — forecast → simulate → **OR-Tools (GLOP/CBC) optimization** under capacity/cost. Clean modular design. https://github.com/chripiermarini/decision-intelligence-logistics-engine

**Event/incident impact + duration prediction (your strongest, honest, trainable target):**
- **Future-Mobility-Lab/SydneyIncidents** — **predicting traffic-incident duration** with **LightGBM/XGBoost + SHAP** (XGBoost RMSE 33.7; F1 0.62 short/long at 30-min threshold). Paper: arXiv 2406.18861. This is exactly your wheelhouse and *is* trainable from `start→resolved`. https://github.com/Future-Mobility-Lab/SydneyIncidents
- **Incident clearance time via XGBoost (+ K-means clusters, Bayesian opt)** — methodology + significant factors. https://onlinelibrary.wiley.com/doi/10.1155/2020/6401082
- **Survival-analysis review (AFT / hazard-based, KNN/RF)** — for "probability event still ongoing at t+Δt" framing (impressive, optional). https://www.sciencedirect.com/science/article/abs/pii/S2213665720300130

**Forecasting + congestion-aware routing / "what-if":**
- **rizolli2000/UrbanFlow** — corridor congestion forecast (RandomForest→XGBoost/LGBM) with **"recommended action cards" + what-if simulation (closure/rain/event load)**. Mirror its "action card" UX for resource recs. https://github.com/rizolli2000/Trafffic-congestion-prediction-using-ML
- **devarshpatel1506/smart_traffic_routing** — congestion classification (XGBoost) → **dynamic Dijkstra/A\* re-routing on predicted edge costs** + Streamlit. Pattern for diversion routing. https://github.com/devarshpatel1506/smart_traffic_routing
- **FabianS10/Traffic-OS** — congestion-aware routing + forecasting + AI operational PDF reports (command-center UX inspiration). https://github.com/FabianS10/Traffic-OS
- **Basmala-ElKady/CairoGrid-Optimizer** — graph toolkit: A* emergency routing, **DP for resource allocation/scheduling**, RF forecasting. https://github.com/Basmala-ElKady/CairoGrid-Optimizer

**Isochrone / diversion (no external dataset needed — OSM is a map service, but to stay safe treat it as visualization-only / or use MapmyIndia which is explicitly allowed):**
- **OSMnx isochrones** (reachable area in N minutes from a point) — notebook 13. https://github.com/gboeing/osmnx-examples/blob/main/notebooks/13-isolines-isochrones.ipynb · concept: https://geoffboeing.com/2017/08/isochrone-maps-osmnx-python/
- **MapmyIndia/Mappls Routing API** (allowed): alternate routes, distance matrix, **drive-time range polygons (isochrones)** for diversion/serviceability. https://about.mappls.com/api/routing

## (B) PS2 — How to honestly deliver "recommend manpower/barricading" despite the label gap
Frame the solution as a **decision-support stack of 3 trainable models + 1 transparent recommender**, and **explicitly state** the response data is missing so the recommender is **rule/severity-based, not learned** (this honesty is itself a differentiator — multiple candidates flagged the gap, so judges know it's there).

**Trainable from the data you DO have (defensible, scoreable):**
1. **Road-closure classifier** — predict `requires_road_closure` (binary) from event_cause, type, priority, corridor, zone, time. **Real labels exist** → report Accuracy/P/R/F1/ROC-AUC honestly. (Your LightGBM comfort zone.)
2. **Event-duration / clearance-time regressor** — predict `(resolved/end − start)` from cause/type/priority/zone/time. **Real labels exist** → RMSE/MAE + SHAP feature importance (à la SydneyIncidents). Longer predicted duration ⇒ more resources.
3. **Severity / Impact score (unsupervised + rules)** — composite of: `requires_road_closure`, `priority`, predicted duration, corridor criticality (derived from event density on that corridor in-dataset), junction/zone, planned-vs-unplanned (unplanned = less lead time = higher ops load). Cluster events (**KMeans/HDBSCAN**) into **archetypes** ("short low-impact breakdown," "long road-closing tree-fall on arterial," "planned rally on corridor X") — gives narrative + per-archetype playbooks.

**The recommender (be explicit it's rule-based, calibrated to severity):**
4. **Resource recommender** = transparent mapping `severity tier × closure flag × predicted duration → {#officers, #barricades, diversion: yes/no}`, encoded as an auditable rule table (you can cite that real agencies use SOP tables, and that this is *upgradeable to learned policy once response data is logged* — frame as "Phase 2"). Optionally wrap OR-Tools to **allocate a fixed officer pool across concurrent events** by severity (this *is* a real optimization with a real objective, even without response labels) — reuse **APW-DTE** pattern.

**What's defensible to claim vs not:**
- ✅ "We predict whether an event needs closure, and how long it'll last, with measured accuracy."
- ✅ "We score severity and cluster event archetypes; we recommend resources via a transparent, SOP-style rule engine and optimally distribute a limited officer pool across simultaneous events."
- ✅ "Post-event learning loop: once response actions are logged, models 1–3 feed a learned policy." (turns the gap into a roadmap)
- ❌ Don't claim a *learned* manpower model with accuracy numbers — there are no labels; saying so = instant credibility loss with technical judges.

## (C) PS2 — 3-day reference architecture
```
astram_events.csv ─► [clean + dt features + corridor/zone density (in-dataset)]
                  ─► Model 1: LightGBM closure classifier   → P/R/F1/AUC (REAL labels)
                  ─► Model 2: LightGBM duration regressor    → RMSE/MAE + SHAP (REAL labels)
                  ─► Model 3: KMeans/HDBSCAN event archetypes → playbooks per cluster
                  ─► Severity/Impact Score (closure × priority × duration × corridor)
                  ─► Rule-based Resource Recommender (officers/barricades/diversion)
                  ─► (opt) OR-Tools: distribute fixed officer pool across live events
                  ─► (opt) Diversion map: MapmyIndia routing / OSMnx isochrone around closure
                  ─► Streamlit app:
                        • "New event" form → instant: closure prob, predicted duration,
                          severity tier, recommended resources, archetype + playbook
                        • Map of historic events colored by severity; corridor hotspots
                        • What-if panel (change cause/priority → recs update)
                        • Honest "Data gap & roadmap" tab
                  ─► deploy: Streamlit Community Cloud
```

## (C2) PS2 — Stack + hosting
- pandas, LightGBM/XGBoost, scikit-learn, SHAP, (optional) `ortools`, `osmnx`/MapmyIndia for routing, Streamlit + folium/pydeck. **Streamlit Community Cloud** hosting.
- **Wow-per-hour:** the **"enter an event → instant resource recommendation card + diversion polygon"** interaction is the money shot for the video.

## (D) PS2 — USPs ranked
1. **Honesty-as-strength:** explicitly name the label gap, deliver what's *truly* trainable (closure + duration), and frame manpower as transparent rule engine + Phase-2 learning loop. **This is the winning differentiator** given everyone else will either fake it or get stuck.
2. **Duration prediction with SHAP** (interpretable, real metrics) — your rigor brand.
3. **Event archetypes + per-archetype playbooks** (operational, narrative-friendly).
4. **OR-Tools officer-pool allocation across concurrent events** (real optimization).
5. *Table stakes:* event map + counts by type/cause/zone.

---

# PS3 — Automated Photo Identification & Classification of Traffic Violations (CV) — **IDEA ONLY**
**Goal of submission:** a **concept note / solution framework** (no working model, no dataset required) for a CV system that preprocesses images, detects road users, detects+classifies violations (helmet, seatbelt, triple-riding, wrong-side, stop-line, red-light, illegal parking), does **ANPR/OCR**, generates **annotated evidence**, and reports analytics — robust to low light/rain/blur. You **win on architecture quality, deployment realism, India-tuning, evidence-integrity/privacy, and a rigorous (proposed) metrics plan**, NOT on a trained model.

## (A) Repos / datasets / papers to cite (proves feasibility without you building it)
**End-to-end violation pipelines (cite as feasibility evidence + benchmark numbers):**
- **RohitWani-1492/Traffic-Violation-Detection-System ("SafeRide", YOLOv11)** — helmet + triple-ride + plate, with a **YOLOv8→v11 benchmark table** (e.g., helmet mAP50 ~96.8% YOLOv11; plate mAP50 ~97.4%) and automatic challan. Best single citation for "this is achievable + here are real numbers." https://github.com/RohitWani-1492/Traffic-Violation-Detection-System
- **ibhushani/Road-Guard (YOLOv11 + DeepSORT)** — helmet/triple/plate + **tracking to handle occlusion in dense traffic** + React dashboard + challan; explicitly addresses low-light & low-res OCR pre-processing. https://github.com/ibhushani/Road-Guard-Intelligent-Traffic-Violation-Detection-System
- **kumarvishal01971/Traffic_violation_detection** — multi-model: **no-helmet, triple-riding, red-light, plate OCR**, deployed on Render. Shows a modular multi-detector design (one model per violation). https://github.com/kumarvishal01971/Traffic_violation_detection
- **McGill SafeRide_Dtection** — helmet+plate YOLOv8+EasyOCR with **MLflow tracking + FastAPI serving** (MLOps maturity to cite). https://github.com/McGill-MMA-EnterpriseAnalytics/SafeRide_Dtection
- **kashishparmar02/triple-rider-detection** — YOLOv8 triple-riding + helmet + mobile-use, custom 6k-image dataset. https://github.com/kashishparmar02/triple-rider-detection
- **Chaturvediharsh123/Usagi-AI** — minimal helmet+plate+OCR+Streamlit (good "MVP scope" reference). https://github.com/Chaturvediharsh123/Usagi-AI-

**ANPR / OCR for Indian plates (the hardest sub-problem — cite India-specific work):**
- **navaneet625/ModernLPR_system** — YOLOv11 + **Mamba-SSM / TrOCR** dual engine, **97% char accuracy on Indian plates**, regex correction for RTO formats, beam search, FP16. State-of-the-art angle. https://github.com/navaneet625/ModernLPR_system
- **ayan2k05/ANPR-Parallel-Processing** — YOLO + **PaddleOCR**, Indian plate **format validation + state-code regex correction** (e.g., `MB→WB`), multi-GPU throughput. https://github.com/ayan2k05/ANPR-Parallel-Processing
- **nimal0704/ANPR_YOLOv11** — YOLOv8 + EasyOCR + **SORT tracking** + **5-variant plate preprocessing (CLAHE/Otsu/adaptive)** for white/yellow/black plates; lists Indian formats (standard/BH/diplomatic/army). https://github.com/nimal0704/ANPR_YOLOv11
- **techbyvj/PlateRecognizePy** — pip-installable Indian-plate library (EasyOCR/Tesseract, white+yellow, all state codes). https://github.com/techbyvj/PlateRecognizePy
- **PaddleX license-plate tutorial** (PP-OCRv4 server vs mobile; detection Hmean ~99.7%). https://paddlepaddle.github.io/PaddleX/main/en/practical_tutorials/ocr_det_license_tutorial.html
- **mftnakrsu/Automatic_Number_Plate_Recognition_YOLO_OCR** — YOLOv5 + EasyOCR/PaddleOCR + Flask (189★, well-documented). https://github.com/mftnakrsu/Automatic_Number_Plate_Recognition_YOLO_OCR

**Datasets to name (India-specific = huge credibility for an India hackathon):**
- **IDD — India Driving Dataset (IIIT-H)** — unstructured Indian roads, front-camera, Hyderabad + **Bengaluru**. Detection set 47k images; **IDD-117K** detection (≈117k images, 13 classes incl. rider, auto-rickshaw, vehicle-fallback). The single most important dataset to cite. https://idd.insaan.iiit.ac.in/ · detection details https://idd.insaan.iiit.ac.in/dataset/details/ · IDD-95K/117K https://mobility.iiit.ac.in/idd95k_blog.php
- **Roboflow Universe** — ready helmet / triple-ride / number-plate / traffic-light datasets (RohitWani's repo lists exact sizes: helmet ~25k, triple ~3k, plate ~45k). Name these as the assembly plan.
- For **stop-line/red-light**: you need the **signal phase + stop-line geometry** — note that this requires either signal-state input (camera sees the light) or a registered ROI per junction; call this out as a deployment requirement (shows you understand the hard part).

**Edge deployment realism (numbers that make the concept "real"):**
- **YOLOv8n INT8 on Jetson Orin Nano** — 94.7 ms→ FPS 10.6, ~1% mAP loss, 98% soft-deadline compliance (IET ITS 2026). https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/itr2.70135
- **Jetson Orin NX YOLOv8 TensorRT benchmark** (batch tuning → ~32 FPS) (MDPI 2026). https://www.mdpi.com/2073-431X/15/2/74
- **Jetson Nano + YOLOv8 TensorRT INT8 ≈ 28–32 FPS, 4× over FP32, ~1% mAP drop** (practical guide). https://espstack.com/blogs/posts/yolov8-jetson-nano.html
- **DeepStream + Triton multi-camera RTSP on Jetson Orin** (scale to many cameras). https://iitmengineer.substack.com/p/mastering-edge-ai-on-nvidia-jetson

**Evidence integrity, privacy & legality (THE winning differentiator for an enforcement CV concept in India):**
- **Edge-AI Perception Node (arXiv 2026)** — **on-device processing, salted SHA-256 hashing of plates, raw evidence stays on-device unless legal escrow, MoRTH AIS-159 / ISO compliance**, 97.7% violation accuracy, faces not processed. The gold reference for "responsible enforcement CV." https://arxiv.org/html/2601.07845v1
- **CCTV/e-challan legality (India)** — admissibility hinges on **Section 65B (Evidence Act) / now S.63 BSA 2023** certification; *Anvar P.V. v. P.K. Basheer*; privacy under *K.S. Puttaswamy*. https://advocategandhi.com/cctv-and-traffic-violations-legality-of-automated-challans/
- **Supreme Court (2026) upholds S.63(4) BSA — mandatory hash-value disclosure for electronic evidence** → bake **cryptographic hashing of every evidence frame** into the design. https://www.livelaw.in/top-stories/supreme-court-rejects-challenge-to-s634-bsa-mandating-hash-value-disclosure-for-electronic-evidence-535950
- **DPDP Act 2023 — face/plate blurring compliance** (anonymize unless violation detected; penalties up to ₹250 cr). https://www.bgblur.com/blog/dpdp-act-india-video-privacy-face-license-plate-blurring-compliance
- **IJSAT 2025 review** — blockchain evidence chains + federated learning + DPDP for traffic enforcement. https://www.ijsat.org/papers/2025/2/6693.pdf

## (B) PS3 — Strongest idea-level architecture (what makes a CV concept WIN without a model)
**Pitch it as a layered, edge-first, legally-defensible pipeline — not "we run YOLO".**

```
                 ┌──────────────────────── EDGE NODE (per junction) ───────────────────────┐
 CCTV / RTSP ──► │ 1. Pre-proc: CLAHE/denoise/deblur, low-light & rain restoration         │
                 │ 2. Detection: YOLOv11 (vehicles, rider, person, plate) + DeepSORT track  │
                 │ 3. Violation logic (rule + geometry per detected objects):               │
                 │    • helmet/seatbelt: head/torso ROI classify                            │
                 │    • triple-riding: persons-per-2wheeler count                           │
                 │    • wrong-side: motion vector vs lane direction                         │
                 │    • stop-line/red-light: signal-state + stop-line ROI crossing          │
                 │    • illegal parking: stationary-vehicle dwell in no-park ROI            │
                 │ 4. ANPR: plate detect → PaddleOCR/TrOCR → RTO-format regex validation    │
                 │ 5. PRIVACY: blur faces + non-violator plates (DPDP); keep only on viol.  │
                 │ 6. EVIDENCE: annotated crop+full frame, timestamp, GPS, model+version,   │
                 │    confidence; compute SHA-256 hash; sign; (opt) anchor to ledger        │
                 └─────────────── only HASHED metadata + evidence package leaves node ──────┘
                                              │
        ┌─────────────────────────────────────┴──────────────────────────────────┐
        │ CLOUD: e-challan workflow + human-in-loop review + S.65B/63 BSA cert      │
        │ Analytics dashboard: violation trends, hotspots, junction scorecards     │
        └──────────────────────────────────────────────────────────────────────────┘
```

**Five "win" pillars to make the concept note stand out (this is the actual differentiator vs. generic YOLO decks):**
1. **Deployment realism with real numbers** — edge (Jetson Orin Nano, INT8 TensorRT, ~10–32 FPS, ~1% mAP loss) vs. cloud trade-off; cost per junction; bandwidth saved by sending only violations. Cite the Jetson benchmarks above.
2. **Evidence integrity for legal use** — per-frame **SHA-256 hashing + Section 65B/63(4) BSA certification workflow + chain-of-custody + tamper-evident log/ledger** + human-in-the-loop confirmation before challan. Directly cites 2026 SC ruling.
3. **Privacy by design (DPDP 2023)** — on-device processing, blur faces & non-offending plates, data minimization, retention limits, hashed identifiers. Turns a liability into a selling point.
4. **India-tuning & robustness** — IDD/IDD-117K + Roboflow datasets; unstructured traffic (autos, mixed vehicles), non-standard plate fonts/multilingual scripts, monsoon/low-light restoration; **DeepSORT** for occlusion in dense traffic.
5. **Rigorous (proposed) metrics & validation plan** — per-class P/R/F1 + **mAP@0.5 / mAP@0.5:0.95**, OCR char/seq accuracy, **per-condition slices (night/rain/blur)**, confusion analysis, false-challan rate (the metric that matters operationally), latency/FPS/Watts, and a **human-review escalation** for low-confidence. Propose **active learning + synthetic augmentation (rain/low-light)** to bootstrap with little labeled data.

**Novelty hooks (pick 1–2 to headline):** (a) **edge-first + hashed-evidence + DPDP** "responsible enforcement node"; (b) **violation-severity-weighted prioritization** so cities act on dangerous violations first (ties back to your PS1/PS2 analytics brand); (c) **closed-loop with city analytics** — every challan feeds a junction risk dashboard.

## (C) PS3 — Concept-note structure to submit (maps 1:1 to the 8 tasks + judging)
1. Problem & impact (India stats: ~1 officer / 4,000 vehicles — cite arXiv node paper). 2. System overview diagram (above). 3. Per-task method (preproc → detection → violation logic → classification+confidence → ANPR → evidence → analytics → evaluation). 4. Datasets & training plan (IDD/IDD-117K + Roboflow + active learning + synthetic aug). 5. **Deployment architecture** (edge/cloud, Jetson numbers, cost, scalability). 6. **Evidence integrity & legal** (65B/63 BSA, hashing, chain-of-custody). 7. **Privacy/ethics** (DPDP, blurring, minimization, bias audit). 8. **Evaluation strategy** (metrics + per-condition slices + false-challan rate + human-in-loop). 9. Roadmap/Phases. 10. Risks & mitigations. *(Optional flex: include 3–4 annotated mock evidence images or a Roboflow/Streamlit demo link — not required, but "no working model is mandatory.")*

---

# Stack & Hosting Cheat-Sheet (solo dev, 3 days)
| Need | Pick | Why | Link |
|---|---|---|---|
| PS1/PS2 dashboard | **Streamlit** | Pure-Python, you already know pandas; fastest path to a UI | streamlit.io |
| Map (default) | **Folium + streamlit-folium** | HeatMap + HeatMapWithTime + choropleth, zero JS | https://github.com/fedderw/baltimore-crash-heat-map |
| Map (wow) | **pydeck HexagonLayer (3D)** | Best visual per hour for the video | https://github.com/TheLogeek/Logistics-Intelligence |
| Map (pretty, optional) | **kepler.gl via streamlit-keplergl** | Cinematic, but heavier | https://github.com/chrieke/streamlit-keplergl |
| Multi-backend maps | **leafmap / opengeos/streamlit-geospatial** | folium/kepler/pydeck behind one selectbox | https://github.com/opengeos/streamlit-geospatial |
| Hotspot stats | **PySAL esda + h3 + tobler** | Getis-Ord/Local Moran + hexbins = rigor | https://pysal.org |
| Optimization (PS2) | **Google OR-Tools** | crew/officer allocation, VRP | https://github.com/GustyCube/APW-DTE |
| Hosting PS1/PS2 | **Streamlit Community Cloud** | free, 1-click GitHub deploy, CPU enough (1GB RAM, ≤3 apps, sleeps 7d) | — |
| Hosting (if CV/GPU ever needed) | **Hugging Face Spaces** | free CPU 16GB; ZeroGPU w/ Pro; ML-native | https://huggingface.co/docs/hub/en/spaces-overview |
| Hosting REST API | **Render** | full REST, custom domain | — |
| Allowed map API | **MapmyIndia/Mappls free tier** | geocode/reverse/nearby/routing + drive-time isochrone polygons | https://about.mappls.com/api/routing |

**Deploy gotchas:** Streamlit Cloud sleeps after 7 days inactivity → **open the app the morning of judging**; keep data ≤50 MB (pre-aggregate to parquet); pin `requirements.txt`; never commit API keys (use Streamlit Secrets — also satisfies the no-hardcoded-credentials rule).

---

# TOP 7 ACTIONABLE TAKEAWAYS
1. **PS1 is your highest-win-probability build** — it's pure geospatial-temporal tabular ML (your superpower) with a Streamlit+Folium UI. Lead the portfolio here.
2. **Make the "Congestion Impact Score + Enforcement-ROI Pareto" the PS1 hero feature** (density × severity × dwell × peak × junction-proximity, filtered to **Getis-Ord Gi\*/Local Moran significant** hotspots). Say plainly it's a *transparent proxy*, not measured flow — rigor + honesty beats a fake congestion predictor.
3. **For PS2, weaponize the label gap:** ship the two **truly trainable** models (LightGBM **road-closure classifier** + **duration regressor** with SHAP, both with real metrics), add **event-archetype clustering**, and deliver manpower/barricading via a **transparent SOP rule engine + OR-Tools officer-pool allocation**, explicitly framed as "Phase-2 learned policy once response data is logged." Clone **GustyCube/APW-DTE** for the optimizer.
4. **Buy your UI cheaply:** Streamlit + `streamlit-folium` (HeatMapWithTime) as default; add one **pydeck 3D hex** view purely for the demo video's "wow." Reuse `fedderw/baltimore-crash-heat-map` and `sneh-a-15/traffic-accident-hotspot` skeletons. Host both apps on **Streamlit Community Cloud** (wake them before judging).
5. **PS3 wins on architecture, not a model:** headline **edge-first (Jetson INT8 ~10–32 FPS) + cryptographic evidence integrity (SHA-256 + Section 65B/63(4) BSA + chain-of-custody) + DPDP privacy-by-design (face/non-offender-plate blurring) + India-tuning (IDD/IDD-117K, autos, non-standard plates)**. These are the pillars generic "we'll run YOLO" decks miss.
6. **Cite real benchmarks to prove feasibility** (don't fabricate): RohitWani SafeRide (YOLOv11 helmet mAP50 ~96.8%, plate ~97.4%), ModernLPR (97% Indian-plate OCR), Jetson INT8 numbers, arXiv edge-evidence node (97.7%). Name **IDD (IIIT-H, includes Bengaluru)** + Roboflow datasets as the data plan.
7. **Use the allowed levers, avoid the disqualifiers:** PS1/PS2 use **only** the HackerEarth CSVs for modeling; treat MapmyIndia/Mappls (routing/isochrone/reverse-geocode) as an **optional visualization enhancer**, never a model input. Keep every file ≤50 MB, secrets out of git, and deliverables complete (repo + demo video + deck for PS1/PS2; concept note PDF for PS3).
