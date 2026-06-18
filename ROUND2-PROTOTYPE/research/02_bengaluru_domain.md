# Bengaluru Traffic Ground Reality + BTP — Domain Research

> Research dossier for Flipkart Gridlock Hackathon 2.0, Round 2. Jury = Bengaluru Traffic Police (BTP) + Flipkart. Onsite finale 3 July 2026, Flipkart HQ Bengaluru.
> Compiled 18 June 2026. **[CONFIRMED]** = directly sourced & cited. **[INFERENCE]** = reasoned conclusion, not explicitly confirmed. Do not present inferences as fact to the jury.

---

## 0. TL;DR — Why this matters for our pitch
- The PS2 dataset ("Astram event data") comes from **ASTraM**, BTP's real AI big-data platform launched Jan 2024 with Arcadis. The jury *built* this. Our PS2 solution must look like a natural ASTraM module, not a competing product.
- The PS1 field **`data_sent_to_scita`** almost certainly refers to **SCITA Solutions**, a Bengaluru parking/ANPR enforcement-tech vendor — i.e., a flag for whether a parking-violation record was pushed to the downstream parking-enforcement system **[INFERENCE]**.
- BTP has *publicly and repeatedly* said it wants to move from **"reactive/firefighting" → "proactive/predictive, data-driven"** traffic management (their exact framing). Our heatmaps + forecasting + manpower recommendation hit this nerve directly.
- BTP's stated constraints: **~6,200 personnel** for a **14,000 km** network and **1,000+ junctions**, **1.2 crore vehicles**, world's **2nd-most-congested city**. They are manpower-starved and tech-hungry.

---

## 1. ASTraM — the platform behind PS2 **[CONFIRMED]**

**What it is:** ASTraM = **Actionable Intelligence for Sustainable Traffic Management**. An AI-driven big-data platform built by **Bengaluru Traffic Police in collaboration with Arcadis** to shift traffic policing from *reactive* (responding to complaints) to *proactive, data-driven* management.
- Launched **January 2024** (during Road Safety Week); citizen companion app launched **Jan/Feb 2025** by Home Minister Dr. G. Parameshwara.
- Sources: [Arcadis project page](https://www.arcadis.com/en/projects/asia/india/actionable-intelligence-for-sustainable-traffic-management), [The Hindu launch](https://www.thehindu.com/news/cities/bangalore/bengaluru-traffic-police-launch-astram-initiative-for-enhanced-traffic-management/article67737199.ece), [The Hindu app launch](https://www.thehindu.com/news/cities/bangalore/btp-astram-app-a-one-stop-platform-for-all-commuter-needs-launched/article69155838.ece).

**Data it ingests:**
- **9,000 police/CCTV cameras**, **ANPR** systems, **cab aggregators** (Ola/Uber/Rapido-type), **map-service providers**, **public-transport utilities** (BMTC/Metro), and open/public data.
- A separate BTP portal aggregates **hourly parking + incoming/outgoing traffic data from 33 major tech parks** on ORR & Sarjapur Road ([Moneycontrol interview, Anucheth](https://www.moneycontrol.com/news/technology/mc-interview-bengalurus-techie-turned-traffic-chief-bets-on-ai-to-ease-congestion-12312701.html)).

**Core features (this is the PS2 feature map — mirror it):**
1. **Congestion alerts** pushed to jurisdictional officers **every 15 minutes**, integrated with the **e-attendance** system so the right officer for that junction/sector gets the alert.
2. **Incident reporting BOT** — authorized field sources log incidents; info is shared to map services for public display; TMC monitors & coordinates resolution.
3. **Special Event Management** — keeps a **log of all major city events**, gives a **spatial understanding** of traffic impact, and supports **resource allocation + alternative-route / diversion planning**. ← *This is exactly PS2.*
4. **Dashboard analytics** for long-term planning.
5. **e-Path / ambulance "green corridor"** — tracks & prioritizes ambulances, alerts control room when an ambulance is **stuck > 120 seconds**, gives shortest route + signal priority + SOS.

**Citizen app features:** real-time congestion within a **5 km radius**, "My Routes" subscription alerts, event/diversion/breakdown alerts, accident & violation reporting (absorbed the old **Public Eye** feature), fine check & online payment, SOS. Available on iOS & Android. (Note: TOI reported the citizen app has **usability complaints** — an opening for us to do reporting/UX better.)

**Internal credibility / momentum:**
- **Former Dutch PM Dick Schoof visited BTP's Traffic Management Centre to study ASTraM** (Feb 2026) — international interest. ([InsightsOnIndia](https://www.insightsonindia.com/2026/02/27/astram-actionable-intelligence-for-sustainable-traffic-management/), [ShankarIAS](https://www.shankariasparliament.com/current-affairs/tech-focused-traffic-policing-in-india)).
- **87% of all traffic violations Jan–Jul 2025 were "contactless"**, compiled via ASTraM data — 3M+ violations, ~11,828 contactless/day vs 1,586 manual challans ([TOI](https://timesofindia.indiatimes.com/city/bengaluru/87-of-traffic-violation-detection-on-bengaluru-roads-now-contactless/articleshow/124535743.cms)).
- ASTraM now powers **AI geo-tagged e-attendance** (Aadhaar-linked selfies + 50m geofence) across ~800–1,000 manned junctions/day, cutting absenteeism to 1–3 officers/day ([NewsFirst](https://newsfirstprime.com/bengaluru/bengaluru-traffic-police-launch-ai-powered-geo-tagged-e-attendance-system-to-boost-accountability-10615207)).

**Key people to name-drop:**
- **M.N. Anucheth** — Joint Commissioner of Police (Traffic), "techie-turned-traffic-chief," public face of ASTraM/AI push (active on social media).
- **Karthik Reddy** — Joint Commissioner of Police (Traffic) driving the **Mobility Digital Twin**.
- **Arcadis** — implementation partner (traffic engineering, data analytics, AI/simulation modelling).

---

## 2. SCITA / `data_sent_to_scita` — what it most likely is

**[INFERENCE — state carefully]** The PS1 parking dataset's `data_sent_to_scita` flag most plausibly refers to **SCITA Solutions**, a **Bengaluru-based (Kumaraswamy Layout) parking, ANPR, toll & surveillance technology vendor** (founded 2012). Their product line is exactly *parking guidance software, LPR/ANPR cameras, photo enforcement, vehicle-presence sensors, parking supervisory software*.
- Sources: [SCITA on Parking.net](https://www.parking.net/parking-industry/scita-solutions), [Inc42 profile](https://inc42.com/company/scita-solutions/), [IndiaMART](https://www.indiamart.com/scitasolutions/about-us.html), [LinkedIn](https://in.linkedin.com/company/scita-solutions). SCITA Solutions is also listed among ITS-India ecosystem vendors (alongside Tecsidel, Metro Infrasys) in the [ITS India Q4 2025-26 digest](https://itsindiaforum.com/wp-content/uploads/2026/02/ITS-INDIA-Q4-Digest.pdf.pdf).
- **Most likely meaning:** a boolean indicating whether a given parking-violation record was **pushed/synced to the SCITA parking-enforcement/management system** (e.g., for towing, paid-parking reconciliation, or downstream challan processing).

**What SCITA is *not* (correct the brief's hypothesis):** Public evidence does **not** support SCITA = "Safe City." Those are different. We could **not** find a public BTP–SCITA contract document, so treat the vendor link as a strong inference, not a confirmed fact. If asked by the jury, say: *"We read `data_sent_to_scita` as the downstream-system sync flag for parking enforcement; we'd love to confirm the exact SCITA endpoint with your team."* (Humble + shows we did homework.)

**Adjacent confirmed context (BTP's enforcement plumbing):**
- BTP's **Enforcement Automation Centre (EAC)** has existed since **2001**; officers use **600+ handheld PDAs** (cashless-capable) tied to a **Central Server at the State Data Center (SDC)**; fines payable via **Bengaluru-One** centres / website ([btp.gov.in/Enforcement](https://btp.gov.in/Enforcement.aspx)).
- "Safe City" is a **separate** Nirbhaya-Fund project (see §3).

---

## 3. BTP's current tech stack & initiatives **[CONFIRMED]**

| System | What it is | Key numbers |
|---|---|---|
| **B-TRAC** (Bengaluru Traffic Improvement Project) | Foundational ITS program, implemented by **KRDCL** | Target: **440 adaptive signals, 400 cameras, 20 VMS**, a state-of-art **TMC**; goal **30% congestion + 30% accident reduction** in CBD. ([btp.gov.in/BTRAC Strategy](https://btp.gov.in/BTRAC%20Strategy.aspx)) |
| **ITMS / ITeMS** (Intelligent Traffic Management System) | Contactless AI violation detection + auto e-challans | **250 ANPR + 80 RLVD cameras at 50 junctions**; books **13 violation types** (no-helmet, triple-riding, seatbelt, mobile use, signal-jump, etc.); plan to scale **50 → 500 junctions**. ([Indian Express](https://indianexpress.com/article/cities/bangalore/artificial-intelligence-cameras-catch-traffic-violators-and-challans-bengaluru-8314181/)) |
| **VAC / ATCS signals** | Vehicle-Actuated Control + Adaptive Traffic Control, **CoSiCoSt** engine by **C-DAC** | **100+ junctions**; **up to 33% congestion reduction across 75 junctions**; run autonomously ~90% of time. ([Indian Express](https://indianexpress.com/article/technology/artificial-intelligence/vac-signals-ai-traffic-control-bengaluru-9791194/)) |
| **Safe City** (Nirbhaya Fund, MHA 60%) | City-wide surveillance + **ICCC**; **Honeywell Automation** is the integrator | **~Rs 496.67 cr**; **~7,000–10,000 cameras at 3,000+ locations** + access to **5 lakh geo-tagged private cameras**; FRS + ANPR; ICCC inaugurated by Amit Shah (2023). Note: ~2,500 cameras were **defunct** in 2024 (maintenance gap). ([Indian Express](https://indianexpress.com/article/cities/bangalore/bengaluru-safe-city-project-awarded-to-private-bidder-7581893/), [The Hindu](https://www.thehindu.com/news/cities/bangalore/bengaluru-police-to-add-over-890-ai-based-cameras-even-while-2500-existing-ones-are-defunct/article68207125.ece)) |
| **Mobility Digital Twin (MDT)** | Real-time "SimCity" virtual replica of the city; next step beyond ASTraM | **~Rs 1 cr tender**; **3,200 of 14,000 km** road network already simulated; integrates weather, accidents, events, citizen apps, enforcement DBs; targets repeat-offender enforcement & pre-planned diversions; claims up to **30% enforcement improvement**. ([Moneycontrol](https://www.moneycontrol.com/artificial-intelligence/bengaluru-to-get-ai-powered-mobility-digital-twin-soon-traffic-police-floats-tender-article-13592801.html)) |
| **Public Eye** (Janaagraha) | Citizen violation-reporting app; **48-hour** BTP response; now folded into ASTraM | Categories include **No parking, Wrong parking, Parking on footpath**. ([Janaagraha](https://www.janaagraha.org/work/public-eye/)) |
| **Namma 112 / ICCC** | City police emergency response (Safe City) | 10,000 cameras, AI/ML dispatch, Hoysala patrol integration. ([Moneycontrol](https://www.moneycontrol.com/news/india/bengaluru-city-police-taps-ai-for-faster-response-rescues-and-narcotics-crackdown-13673934.html)) |
| **Towing (reintroduced)** | Parking enforcement, now **BBMP-run** (private operators excluded) | Restarted on **22 high-density corridors + 75 key junctions** (later expanded to ~**96 corridors**); suspended 2022 after harassment complaints; piloted at Freedom Park Aug 2024. ([The Hindu](https://www.thehindu.com/news/cities/bangalore/towing-set-to-return-in-bengaluru-this-time-with-new-approach/article69905968.ece), [ET](https://economictimes.indiatimes.com/news/bengaluru-news/bengaluru-police-to-restart-towing-of-vehicles-in-100-areas-check-new-traffic-advisory/articleshow/117766775.cms)) |

---

## 4. Bengaluru traffic — current situation & news (2025–2026) **[CONFIRMED]**

**Congestion ranking (TomTom Traffic Index 2025, released Jan 2026):**
- **2nd-most-congested city in the world** (congestion level **74.4%**, up from 72.7%), behind only Mexico City. Also **3rd-slowest** by travel time.
- **10 km drive = 36 min 9 s** on average (up 2 min 4 s YoY).
- Commuters lose **~168 hours/year (≈7 days)** to rush-hour traffic.
- Avg speed **16.6 km/h**; evening rush drops to **13.2 km/h** with congestion hitting **115%**.
- Worst single day: **Saturday, 17 May 2025** (~101% congestion).
- Sources: [TomTom newsroom](https://www.tomtom.com/newsroom/explainers-and-insights/tomtom-traffic-index-2026-headline-numbers/), [Indian Express](https://indianexpress.com/article/cities/bangalore/bengaluru-global-traffic-charts-again-second-congested-city-world-tomtom-10488303/), [NDTV](https://www.ndtv.com/india-news/bengaluru-congestion-worlds-2nd-worst-people-lose-7-days-a-year-to-traffic-10805805).

**The ORR crisis (the single most citable corridor):**
- **Hebbal → Silk Board ≈ 31 km**, **500+ tech companies**, **8–10 lakh daily commuters** — among Bengaluru's Top 5 congested routes.
- Originally designed for **4,800 PCU**, now carries **~10,400 PCU** — **>2× capacity** (figure attributed to **ASTraM data** reviewed by The Hindu).
- **~70 vehicle breakdowns/day** on ORR; a single bus/flyover breakdown can "paralyse traffic for kilometres."
- **Blue Line Metro (Phase 2A, Silk Board↔KR Pura, ~19.75 km)** delayed to **Dec 2026**; white-topping works ongoing — both worsen interim congestion.
- Sources: [The Hindu ORR anatomy](https://www.thehindu.com/news/national/karnataka/where-the-grid-ends-and-gridlock-begins-anatomy-of-the-orr-crisis-in-bengaluru/article70218643.ece), [TOI](https://timesofindia.indiatimes.com/city/bengaluru/outer-ring-road-from-hebbal-to-silk-board-in-bengaluru-31km-of-bumpy-rides-snarling-traffic/articleshow/121981599.cms), [TheNewsMinute](https://www.thenewsminute.com/karnataka/bengaluru-roads-are-choking-but-expanding-them-is-not-the-answer-says-top-traffic-cop).

**High-density corridor concentration:** Bengaluru's **12 high-density corridors (~220 km) carry ~60% of the city's traffic** — strong argument for *prioritized* interventions (Anucheth, Namma Raste 2025).

---

## 5. Event-driven gridlock — examples (gold for PS2) **[CONFIRMED]**

**RCB IPL victory stampede — 4 June 2025 (the defining event-management failure):**
- **11 dead, 71 injured** outside **M. Chinnaswamy Stadium**; **~2.5 lakh crowd** vs **35,000 capacity**.
- The open-top victory parade was **cancelled hours before — explicitly citing CBD traffic congestion** — but crowds had already massed; police were "overwhelmed."
- **5 police officers suspended incl. the City Commissioner (B. Dayananda)**; Justice **Michael D'Cunha** judicial commission blamed RCB, KSCA, DNA Entertainment **and** police for inadequate crowd/event planning. New commissioner: **Seemant Kumar Singh**.
- Sources: [Wikipedia](https://en.wikipedia.org/wiki/2025_Bengaluru_crowd_crush), [The Hindu report](https://www.thehindu.com/news/cities/bangalore/karnataka-government-report-blames-rcb-dna-network-and-ksca-for-stampede-outside-chinnaswamy-stadium-in-bengaluru/article69822445.ece), [The Hindu anatomy](https://www.thehindu.com/news/national/karnataka/rcb-ipl-victory-celebration-the-anatomy-of-a-stampede-in-bengaluru/article69686157.ece).
- **Pitch framing (use sensitively):** This is *the* cautionary tale for why **predictive event-impact modelling + manpower/barricading recommendations (PS2)** matter. Frame as "decision support so commanders aren't blindsided," not as second-guessing officers.

**Routine large-event management (the normal PS2 workload):**
- **Concerts at BIEC, Tumkur Road** (e.g., **Diljit Dosanjh "Dil-Luminati"**): BTP issues advisories, deploys extra personnel, coordinates with **BMRCL to extend metro hours**, urges public transport. ([Indian Express](https://indianexpress.com/article/cities/bangalore/diljit-dosanjh-bengaluru-concert-traffic-police-advisory-9710515/), [Times Now](https://www.timesnownews.com/bengaluru/heading-to-diljit-dosanjhs-bengaluru-concert-check-traffic-advisory-article-116047157)). (Note: Coldplay 2025 was **Mumbai/Ahmedabad only** — Bengaluru lacks a mega-venue; don't cite a Bengaluru Coldplay show.)
- Other recurring triggers in the ASTraM "event" taxonomy: **processions/protests** (CBD/Freedom Park), **VIP movement**, **festivals**, **vehicle breakdowns, tree falls, road closures, flooding, accidents** — matches the PS2 dataset's event types.

---

## 6. Real pain points BTP would pay to solve ("I'd use this tomorrow")

Ranked by how directly each maps to a hackathon PS and how loudly BTP complains about it:

1. **Manpower allocation vs. demand mismatch [PS2].** ~**6,200 personnel** for **1,000+ junctions**, two shifts, **14,000 km** ([TheNewsMinute](https://www.thenewsminute.com/karnataka/bengaluru-roads-are-choking-but-expanding-them-is-not-the-answer-says-top-traffic-cop)). Stationing officers at signals is called a *"repetitive and inefficient exercise"* ([NewsFirst](https://newsfirstprime.com/bengaluru/bengaluru-adds-50-new-traffic-signals-review-planned-to-ease-growing-congestion-11012911)). A tool that says *"deploy N officers + barricades here at this hour for this event"* is directly fundable.
2. **Event/incident pre-planning [PS2].** Post-RCB, *defensible, data-backed* event decisions (allow/deny, diversion plan, manpower) are politically critical.
3. **Illegal-parking hotspots that choke arterials [PS1].** Wrong parking = **24%** of *manual* enforcement; footpath parking alone = **1,28,821 cases in 2025** ([Bangalore Mirror](https://bangaloremirror.indiatimes.com/bangalore/cover-story/waylay-park-policy/articleshow/127782987.cms)). Towing is back but **targeting is manual** — a hotspot heatmap that prioritizes towing/enforcement crews is immediately usable.
4. **Rapid incident response.** ~**70 ORR breakdowns/day**; BTP's #1 stated priority is "rapid incident response."
5. **Repeat-offender / high-risk targeting.** Explicit MDT goal.
6. **Camera maintenance & data trust.** 2,500 defunct cameras + ASTraM app usability complaints → solutions that work with *imperfect/partial* data score points.

**What makes an officer say "yes":** outputs that are **operational, not academic** — a ranked list of *where to send the next towing van / officer / barricade*, tied to **junction + police_station + corridor + time-of-day**, with a confidence score and a one-line "why."

---

## 7. Bengaluru-specific context to cite (sound local) **[CONFIRMED]**

**Parking policy & bodies:**
- **Parking Policy 2.0** — prepared by **DULT (Directorate of Urban Land Transport)**, approved by Govt. of Karnataka **Feb 2021**; mandates **Area Parking Plans (APP)** per zone (originally adopted by **BBMP** in 2012). ([Scribd/DULT](https://www.scribd.com/document/582043110/Parking-Policy-and-Parking-Management-Plan-for-Bengaluru-08-07-2022)).
- **GBA (Greater Bengaluru Authority)** opened a **citywide pay-and-park tender (2026)**; pilot on **MG Road**; rates **₹15/hr (2-wheeler), ₹30/hr (car)**; first zones incl. **Commercial Street, Dickenson Rd, Millers Rd, St John's**. ([NewsFirst](https://newsfirstprime.com/bengaluru/pay-and-park-becomes-citywide-in-bengaluru-gba-opens-tender-new-street-parking-rules-ahead-10986349), [News18](https://www.news18.com/cities/bengaluru-news/parking-on-bengalurus-shopping-streets-to-cost-more-rates-passes-explained-skn-ws-l-9810288.html)).

**Parking/encroachment hotspots (name these neighbourhoods):**
- **Indiranagar** (CMH Road, 100 Ft Road, Defence Colony, HAL 2nd Stage) — footpaths unusable from commercial encroachment + parked vehicles.
- **HSR Layout** (24th Main Rd) — residents converting footpath/road into private parking.
- **Koramangala, JP Nagar, Banashankari** — pre-owned car showrooms, valet, travel agencies grabbing kerb space.
- **CBD** (MG Road, Brigade Road, Commercial Street), **KR Puram** market.
- Vehicle population: **~1.16 crore (Mar 2024) → 1.2 crore+**. Sources: [TheNewsMinute Indiranagar](https://www.thenewsminute.com/karnataka/encroachment-menace-leaves-indiranagar-pavements-unusable-for-pedestrians), [Bangalore Mirror HSR](https://bangaloremirror.indiatimes.com/bangalore/civic/hsr-layout-residents-slam-ongoing-civic-body-inaction/articleshow/121790211.cms), [UrbanAcres](https://urbanacres.in/bengaluru-parking-woes-escalate-amid-encroachments-and-policy-inaction/).

**Other agencies/terms in the ecosystem:** **BBMP** (civic body / roads / now Greater Bengaluru corporations incl. "Bengaluru East City"), **BMRCL / Namma Metro**, **BMTC** (+ feeder buses), **B-SMILE / B-Smile** (SPV for ORR facelift / bus-priority lanes), **DULT**, **KRDCL** (B-TRAC implementer), **GBA**, **Namma Raste** (BBMP mobility initiative), **TMC** (Traffic Management Centre), **FTVR** (Field Traffic Violation Report).

---

## 8. Official BTP/Karnataka data, dashboards & public "we-want-AI" statements **[CONFIRMED]**
- BTP runs a **portal aggregating hourly data from 33 tech parks** + aggregator GPS data, used internally as a "baseline model… to strategise interventions," **with stated plans to make it public** and share live incidents to map providers ([Moneycontrol/Anucheth](https://www.moneycontrol.com/news/technology/mc-interview-bengalurus-techie-turned-traffic-chief-bets-on-ai-to-ease-congestion-12312701.html)).
- Anucheth: *"moving from firefighting on the roads to foresight-driven traffic management"*; "move people, not vehicles"; only metro to **reduce traffic fatalities** recently; speed cameras on high-risk corridors. ([TheNewsMinute](https://www.thenewsminute.com/karnataka/bengaluru-roads-are-choking-but-expanding-them-is-not-the-answer-says-top-traffic-cop), [Analytics India Mag](https://analyticsindiamag.com/ai-features/when-ai-meets-bengaluru-traffic-this-knight-is-in-control)).
- Karthik Reddy (on MDT): *"data-driven command centre… simulate, predict, and solve congestion and safety challenges in real time."* ([Moneycontrol](https://www.moneycontrol.com/artificial-intelligence/bengaluru-to-get-ai-powered-mobility-digital-twin-soon-traffic-police-floats-tender-article-13592801.html)).
- BTP signals openness to **startups** (drones, AI avatars, ASTraM) and to using **9,000 safety cameras to build an AI engine for violation detection / traffic counting** ([Analytics India Mag](https://analyticsindiamag.com/ai-features/when-ai-meets-bengaluru-traffic-this-knight-is-in-control)) — i.e., a built-in opening for **PS3 (CV violation detection)**.
- Public assets: **btp.gov.in** (B-TRAC, enforcement, ANPR/enforcement camera lists, signal timings, BTRAC-assets Google Map), Bengaluru-One payment integration.

---

## TOP 7 ACTIONABLE TAKEAWAYS
1. **Position every solution as an ASTraM/MDT module, not a rival.** BTP built ASTraM (Jan 2024, w/ Arcadis) and is now building the **Mobility Digital Twin**. Use their language: *"actionable intelligence," "proactive not reactive," "foresight-driven."* Show our PS2 forecasting + manpower/diversion engine as the **Event Management module ASTraM already lists but underuses**.
2. **For PS1, output an operational towing/enforcement heatmap keyed to `junction + police_station + corridor + time`.** Towing is back (BBMP-run, 22 corridors + 75 junctions) but **targeting is manual** — a prioritized hotspot list with a "why" is something an officer can act on *tomorrow*. Treat `data_sent_to_scita` as the downstream parking-enforcement sync flag (likely **SCITA Solutions**) and say so honestly.
3. **Anchor credibility with hard numbers:** TomTom 2025 **#2 globally, 74.4%, 168 hrs/yr lost, 16.6 km/h**; ORR **>2× design capacity (4,800→10,400 PCU)**; **6,200 officers / 1,000+ junctions / 14,000 km**; **12 corridors = 60% of traffic**; **1,28,821 footpath-parking cases in 2025**.
4. **Make the RCB-stampede lesson the emotional core of PS2 — handled with respect.** "Predictive event-impact + manpower/barricade recommendations so commanders have defensible, data-backed decisions." Don't blame officers; frame as decision support that protects both public and police.
5. **Design for imperfect data and weak connectivity.** 2,500 defunct Safe City cameras + ASTraM app usability complaints. A solution that degrades gracefully with partial/missing camera data will out-score a demo that assumes perfect feeds.
6. **Lead with manpower optimization — it's their loudest, most fundable pain.** Tie recommendations to the existing **e-attendance/geofence** system so deployment is enforceable, and quantify officer-hours saved.
7. **Bake in PS3 (CV) as a natural extension of the 9,000-camera + ITMS estate.** BTP already books **87% of violations contactless** at 50 junctions and wants to scale to **500** and reuse safety cameras for violation detection — so our CV idea should explicitly plug into ITMS/FTVR and ANPR, not reinvent enforcement.

---

## Credible terms / initiatives to name-drop (to sound legit to BTP)
**Systems & projects:** ASTraM (Actionable Intelligence for Sustainable Traffic Management) · Mobility Digital Twin (MDT) · B-TRAC (Bengaluru Traffic Improvement Project) · ITMS / ITeMS · ANPR · RLVD (Red Light Violation Detection) · VAC / ATCS signals · CoSiCoSt (C-DAC) · Safe City project (Nirbhaya Fund / Honeywell) · ICCC (Integrated Command & Control Centre) · Namma 112 · Enforcement Automation Centre (EAC) · FTVR (Field Traffic Violation Report) · Public Eye · e-Path / green corridor · e-attendance (geofenced) · Bengaluru-One.
**Agencies & people:** Bengaluru Traffic Police (BTP) · M.N. Anucheth (JCP Traffic) · Karthik Reddy (JCP Traffic) · Seemant Kumar Singh (City Commissioner) · Arcadis · DULT · BBMP · GBA (Greater Bengaluru Authority) · BMRCL / Namma Metro · BMTC · B-SMILE · KRDCL · TMC (Traffic Management Centre).
**Places & concepts:** Outer Ring Road (ORR) · Central Silk Board · KR Pura · Marathahalli · Iblur · Hebbal · Whitefield · Sarjapur Road · Indiranagar (CMH Rd, 100 Ft Rd) · Koramangala · HSR Layout · CBD (MG Rd, Brigade Rd, Commercial Street) · BIEC (Tumkur Rd) · Chinnaswamy Stadium · PCU (Passenger Car Units) · v/c ratio · high-density corridors · Parking Policy 2.0 / Area Parking Plan · pay-and-park · white-topping · contactless enforcement.

---

### Source list (primary)
- Arcadis ASTraM: https://www.arcadis.com/en/projects/asia/india/actionable-intelligence-for-sustainable-traffic-management
- The Hindu (ASTraM launch): https://www.thehindu.com/news/cities/bangalore/bengaluru-traffic-police-launch-astram-initiative-for-enhanced-traffic-management/article67737199.ece
- The Hindu (ASTraM app + digital twin): https://www.thehindu.com/news/cities/bangalore/btp-astram-app-a-one-stop-platform-for-all-commuter-needs-launched/article69155838.ece
- InsightsOnIndia (ASTraM, Dutch PM visit): https://www.insightsonindia.com/2026/02/27/astram-actionable-intelligence-for-sustainable-traffic-management/
- TOI (87% contactless + app usability): https://timesofindia.indiatimes.com/city/bengaluru/87-of-traffic-violation-detection-on-bengaluru-roads-now-contactless/articleshow/124535743.cms
- Moneycontrol (MDT tender): https://www.moneycontrol.com/artificial-intelligence/bengaluru-to-get-ai-powered-mobility-digital-twin-soon-traffic-police-floats-tender-article-13592801.html
- Moneycontrol (Anucheth interview, 33 tech parks): https://www.moneycontrol.com/news/technology/mc-interview-bengalurus-techie-turned-traffic-chief-bets-on-ai-to-ease-congestion-12312701.html
- Analytics India Mag (BTP AI, C-DAC, digital twin intent): https://analyticsindiamag.com/ai-features/when-ai-meets-bengaluru-traffic-this-knight-is-in-control
- Indian Express (ITMS AI cameras): https://indianexpress.com/article/cities/bangalore/artificial-intelligence-cameras-catch-traffic-violators-and-challans-bengaluru-8314181/
- Indian Express (VAC/ATCS signals): https://indianexpress.com/article/technology/artificial-intelligence/vac-signals-ai-traffic-control-bengaluru-9791194/
- Indian Express (Safe City / Honeywell): https://indianexpress.com/article/cities/bangalore/bengaluru-safe-city-project-awarded-to-private-bidder-7581893/
- The Hindu (2,500 defunct cameras): https://www.thehindu.com/news/cities/bangalore/bengaluru-police-to-add-over-890-ai-based-cameras-even-while-2500-existing-ones-are-defunct/article68207125.ece
- btp.gov.in (Enforcement/EAC): https://btp.gov.in/Enforcement.aspx | (BTRAC strategy): https://btp.gov.in/BTRAC%20Strategy.aspx
- SCITA Solutions: https://www.parking.net/parking-industry/scita-solutions | https://inc42.com/company/scita-solutions/
- TomTom Traffic Index 2025: https://www.tomtom.com/newsroom/explainers-and-insights/tomtom-traffic-index-2026-headline-numbers/ | https://www.ndtv.com/india-news/bengaluru-congestion-worlds-2nd-worst-people-lose-7-days-a-year-to-traffic-10805805
- The Hindu (ORR crisis): https://www.thehindu.com/news/national/karnataka/where-the-grid-ends-and-gridlock-begins-anatomy-of-the-orr-crisis-in-bengaluru/article70218643.ece
- TheNewsMinute (Anucheth, manpower 6,200 / 14,000 km / breakdowns): https://www.thenewsminute.com/karnataka/bengaluru-roads-are-choking-but-expanding-them-is-not-the-answer-says-top-traffic-cop
- NewsFirst (e-attendance geofence): https://newsfirstprime.com/bengaluru/bengaluru-traffic-police-launch-ai-powered-geo-tagged-e-attendance-system-to-boost-accountability-10615207
- Wikipedia (2025 Bengaluru crowd crush): https://en.wikipedia.org/wiki/2025_Bengaluru_crowd_crush
- The Hindu (stampede commission report): https://www.thehindu.com/news/cities/bangalore/karnataka-government-report-blames-rcb-dna-network-and-ksca-for-stampede-outside-chinnaswamy-stadium-in-bengaluru/article69822445.ece
- Indian Express (Diljit/BIEC advisory): https://indianexpress.com/article/cities/bangalore/diljit-dosanjh-bengaluru-concert-traffic-police-advisory-9710515/
- Bangalore Mirror (footpath-parking 2025 stats): https://bangaloremirror.indiatimes.com/bangalore/cover-story/waylay-park-policy/articleshow/127782987.cms
- The Hindu (towing reintroduction): https://www.thehindu.com/news/cities/bangalore/towing-set-to-return-in-bengaluru-this-time-with-new-approach/article69905968.ece
- NewsFirst (GBA pay-and-park tender): https://newsfirstprime.com/bengaluru/pay-and-park-becomes-citywide-in-bengaluru-gba-opens-tender-new-street-parking-rules-ahead-10986349
- TheNewsMinute (Indiranagar encroachment): https://www.thenewsminute.com/karnataka/encroachment-menace-leaves-indiranagar-pavements-unusable-for-pedestrians
- Janaagraha (Public Eye): https://www.janaagraha.org/work/public-eye/
