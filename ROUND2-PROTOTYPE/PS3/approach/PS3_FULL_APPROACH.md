# PS3 — Full Approach Document

## Gridlock Hackathon 2.0 · Round 2 · Theme 3

**Project codename:** Drishaak — Responsible Edge Enforcement Node for Bengaluru  
**Date:** 18 Jun 2026 (updated 18 Jun 11:30 PM)  
**Deadline:** 21 Jun 2026, 23:59 IST  
**Team decision:** PS3 — Automated Photo Identification & Classification for Traffic Violations

> **Companion docs:** [`PS3_WINNING_PLAYBOOK.md`](./PS3_WINNING_PLAYBOOK.md) (pitch/jury strategy) · [`PS3_DEPLOYMENT_ARCHITECTURE.md`](./PS3_DEPLOYMENT_ARCHITECTURE.md) (microservices + cloud deployment + free-tier build plan).

---

## 0. COMPETITION LANDSCAPE (why this approach wins)

**What every other PS3 team will submit (verified from GitHub, SIH, LinkedIn, Devfolio):**
- YOLOv5/v8 helmet + triple-ride + EasyOCR plate → Flask/Streamlit dashboard → "high mAP"
- No legal compliance, no privacy, no evidence integrity, no BTP integration
- Examples: Neuro Vision (StartupTN winner), SIH 2023/24 traffic PS winners, IJERT papers

**What NO hackathon winner has shipped together (our gap = our win):**

| Layer | Others do it? | We do it? |
|-------|:---:|:---:|
| India-tuned detection (UVH-26 / IDD) | Rare | YES |
| Culturally-safe helmet (Pagdi class) | NO | YES |
| DPDP 2023 face/plate blur | NO | YES |
| SHA-256 evidence hash (BSA S.63(4)) | NO | YES |
| Human-in-the-loop review workflow | NO | YES |
| False-challan rate as primary metric | NO | YES |
| ASTraM/ITMS integration architecture | NO | YES |
| Edge deployment cost model | Rare | YES |

**Validated precedent:** Projects like Rule Zer0 (blockchain + traffic), ChainSpeed (TEE + evidence), and the arXiv Edge-AI Perception Node (Jan 2026) prove each layer individually. Nobody has combined all for Indian municipal enforcement.

**Key insight from Bengaluru Mobility Challenge 2024 + Urban Vision Hackathon 2025:** Both were co-run by BTP + IISc. Winners focused on detection accuracy on Indian data. BUT the Gridlock 2.0 jury (BTP + Flipkart) will see 100+ similar detection submissions. The path to top 10 is **system thinking, not model mAP.**

### What the LAST Gridlock winner did (2017, Affine Anonymous, "TrafficSense")

This is the strongest signal we have. Same sponsor, same city, same jury archetype:

| Winning factor | What Affine did | What we will mirror |
|----------------|-----------------|---------------------|
| **Pilot evidence** | Ran pilot at Silk Board junction | We propose 4-week pilot at Silk Board + Marathahalli |
| **Measurable outcome** | "17% reduction in wait time" — one number | We pin 5 hard metrics (false-challan <5%, review <30s, etc.) |
| **Plug-into-existing-system** | Used Google/Bing Maps data, not custom sensors | We plug into ASTraM/ITMS, not parallel infra |
| **Implementable, not theoretical** | Jury picked on "impact, feasibility, scalability, sustainability, completeness" | All 5 explicit in our deck sections |
| **Govt + corporate jury fit** | Pitch served Flipkart CEO + DCP Traffic + Namma Bengaluru | Our deck has separate angles for BTP (operations) + Flipkart (tech/scale) |

**Source:** [YourStory — Three solutions that sprung from Flipkart's Gridlock](https://yourstory.com/2017/07/flipkart-bengulur-traffic-gridlock-hackathon)

### What Gridlock 2.0 Phase 1 leaderboard winners did (already public)

- **R² = 1.0** with no neural network — pure spatiotemporal lookup ([Bannysukumar repo](https://github.com/Bannysukumar/Gridlock-Hackathon-2.0))
- **R² = 95%** with hierarchical basis-day routing + ridge calibration, no NN ([dev.to writeup](https://dev.to/sniperxdd/95-r2-without-neural-networks-solving-the-flipkart-gridlock-20-traffic-challenge-3dbg))

**Translation for PS3:** This jury rewards **interpretable + simple over complex + black-box**. Lead with workflow, not with deep learning jargon.

---

## 1. Executive summary

We are **not** pitching "YOLO + challan" like every other team.

We propose an **India-first, legally defensible, edge-deployable** computer vision pipeline that:

1. Detects vehicles/riders and violations from CCTV images
2. Generates **court-ready annotated evidence** (hash + chain-of-custody)
3. Runs **privacy-safe** (DPDP 2023: blur faces/plates until violation confirmed)
4. Integrates with **BTP's existing stack** (ITMS / ASTraM / Smart Enforcement Center) — not a parallel system
5. Uses **Bengaluru-specific AI** (UVH-26 from IISc + BTP Safe City cameras context)

**One-line pitch for judges:**  
*Drishaak turns Bengaluru's 9,000+ camera feeds into trustworthy, contactless enforcement — with India-tuned detection, human review, and legally admissible evidence.*

**Winning submission position:**  
*The detector is not the product. The product is a trustworthy evidence workflow that BTP can plug into ITMS/ASTraM without increasing wrongful challans, privacy risk, or manual workload.*

**Round-2 deliverable we should actually submit:**  
Concept note + 10-slide deck + 2-minute video + a lightweight clickable **Evidence Review Demo**. The demo can use pretrained detections or curated sample outputs; the must-have differentiator is that it shows the full workflow: image → violation annotation → privacy masking → SHA-256 evidence hash → human review card → analytics.

---

## 2. Hackathon constraints

| Item | Official rule | Our plan |
|------|---------------|----------|
| Submission type | Concept note / prototype proposal / solution framework | **PDF concept note + pitch deck + lightweight evidence demo** |
| Working model | **Not mandatory** for PS3 | Use a **workflow prototype** first; real detector is a stretch |
| Dataset from HackerEarth | **None provided** for PS3 | Use **public** datasets: UVH-26, IDD, Roboflow (PS1/PS2 restriction does NOT apply) |
| Demo link / repo | Form may still ask for these | GitHub README + Streamlit/HF demo showing evidence workflow |
| File size | Each upload < 50 MB | PDF deck + small code zip |
| Finale (3 Jul) | Top 10 must demo **working prototype** | If shortlisted, extend MVP to live demo on laptop |

**Strategy:** Win Round 2 on **architecture + judge-visible workflow**, not on claiming we trained a perfect multi-violation model in 3 days. If shortlisted, use 12 days before finale to harden the real detector.

**Must not overclaim:** We should not claim production-level detection for all 7 violation types by June 21. We should claim a practical, phased system with a demonstrable evidence pipeline and credible model choices for each violation.

---

## 3. Problem we solve

**Operational pain (Bengaluru reality):**

- BTP already books **~87% violations contactlessly** (Jan–Jul 2025): helmet 36%, pillion helmet 19%, seatbelt 16%, signal jump 13%  
  Source: [Times of India](https://timesofindia.indiatimes.com/city/bengaluru/87-of-traffic-violation-detection-on-bengaluru-roads-now-contactless/articleshow/124535743.cms)
- ITMS at **50 junctions**: 250 ANPR + 80 RLVD cameras  
  Source: [The Hindu](https://www.thehindu.com/news/national/karnataka/traffic-police-enforce-itms-system-to-enforce-rules-in-contactless-way/article66240241.ece)
- Scale target: **50 → 500 junctions** — needs reliable, fair, scalable CV pipeline

**Gap we fill (our USP):**

- Generic Western models fail on **autos, mixed traffic, dupatta/pagdi, Indian plates**
- High mAP alone doesn't matter if **evidence is disputed** or **privacy is violated**
- No unified pipeline: detect → classify → ANPR → privacy mask → evidence hash → human review → analytics → **legal review**

**Core judge insight:** In enforcement AI, the expensive mistake is not a missed detection; it is a **wrong challan**. Therefore our primary operational metric is **false challan rate**, backed by human-in-the-loop review and evidence integrity.

---

## 4. Why our approach is unique

| Generic team | Our team (Drishaak) |
|--------------|-------------------------|
| YOLOv8 helmet detect | **India-tuned** RT-DETRv2 / YOLOv11 on **UVH-26** (Bengaluru CCTV data) |
| EasyOCR plate | **RTO-format validated ANPR** (KA series, BH series, regex correction) |
| "High accuracy" | **False-challan rate** + human-in-loop as primary ops metric |
| Cloud-only | **Edge-first** Jetson node; only violation packets leave camera site |
| No legal layer | **SHA-256 evidence hash + S.63(4) BSA workflow** |
| No privacy | **DPDP 2023** face/plate blur by default |
| Standalone app | **ASTraM / ITMS module** — plugs into Smart Enforcement Center |

**Headline novelty:** Culturally-Safe + Legally-Admissible + ASTraM-Integrated Edge Enforcement

### Winning wedge

Our concept should lead with **Responsible Enforcement**, not raw computer vision.

1. **India-aware model layer:** UVH-26 / IDD / CADSIT-style Indian traffic tuning.
2. **Trust layer:** SHA-256 evidence hashes, model-version metadata, chain-of-custody, human review.
3. **Privacy layer:** DPDP-first masking of faces and non-violator plates.
4. **Operations layer:** ASTraM/ITMS integration (15-min alert cadence), reviewer queue, junction scorecards, false-challan tracking.
5. **2026-fresh layer (stretch):** **VLM-assisted second opinion** for low-confidence detections (<70% conf) — pipe ambiguous frames to Gemini 3 / Qwen3-VL via API for natural-language rationale before human review. Backed by published 2026 research (Two-Pass Zero-Shot Grounding, VISTA distillation). Cost: ~$0.001/frame. This is on the **bleeding edge** and almost no hackathon team will think of it.

This is harder for other teams to copy than "YOLO detects helmet," and it speaks directly to BTP's enforcement reality.

---

## 5. System architecture

```
┌──────────────────── EDGE NODE (per junction / camera pole) ────────────────────┐
│  Input: RTSP / CCTV frame (1080p)                                             │
│                                                                               │
│  [1] PREPROCESS     CLAHE, denoise, deblur, rain/low-light restoration       │
│  [2] DETECT         RT-DETRv2-S or YOLOv11-S (UVH-26 fine-tuned)             │
│                     Classes: 2W, auto, car, bus, truck, person, plate ROI     │
│  [3] TRACK          BoT-SORT / DeepSORT → one violation per track ID         │
│  [4] VIOLATION LOGIC (rule + geometry + small classifiers):                   │
│       • Helmet: 3-class (Helmet / Pagdi / No-Helmet) ← culturally adaptive   │
│       • Triple ride: rider count on 2W bbox                                    │
│       • Seatbelt: torso ROI classifier                                         │
│       • Red-light / stop-line: stop-line ROI + signal phase input              │
│       • Wrong-side: motion vector vs lane direction                            │
│       • Illegal parking: dwell time in no-park ROI                              │
│  [5] ANPR           Plate detect → PaddleOCR/TrOCR → KA/RTO regex validate     │
│  [6] PRIVACY        Blur all faces + non-violator plates (DPDP)               │
│  [7] EVIDENCE PKG   Annotated frame + crop + metadata + SHA-256 hash + sign    │
└──────────────────────────── only violation packets egress ───────────────────┘
                                        │
                    ┌───────────────────▼────────────────────┐
                    │  CLOUD: Smart Enforcement Center layer  │
                    │  • Human review queue (confidence < τ)  │
                    │  • S.63(4) BSA certificate generation     │
                    │  • e-Challan API (Parivahan integration)  │
                    │  • ASTraM analytics dashboard             │
                    └─────────────────────────────────────────┘
```

---

## 5A. Round-2 NON-NEGOTIABLE MVP: Evidence Review Demo

> **THIS IS NOT OPTIONAL.** Every hackathon winner found in research (Neuro Vision, GetFined, Rule Zer0, SIH teams) shipped a clickable demo. Without it, the idea doc is just a PDF. With it, you're in the top 10% of submissions instantly.

Because PS3 is officially idea-only but the submission form may still ask for repo/demo links, AND because every judge unconsciously ranks "I can click it" above "I can read about it," this demo IS the submission's core deliverable.

### Demo user flow

1. Upload/select a sample traffic image.
2. Show model detections or precomputed/mock detections:
   - vehicle/rider bounding boxes
   - suspected violation type
   - confidence score
   - license plate OCR result or placeholder
3. Apply privacy masking:
   - blur faces
   - blur non-violator plates
4. Generate evidence package:
   - annotated frame
   - timestamp
   - camera ID
   - model version
   - confidence
   - SHA-256 hash
   - review status
5. Human reviewer chooses:
   - approve
   - reject
   - needs recheck
6. Dashboard shows:
   - cases by violation type
   - false-positive/rejection rate
   - reviewer time saved
   - junction-wise trends

### Why this demo wins

- It is **clickable** and understandable in 30 seconds.
- It demonstrates the whole enforcement chain, not just a model screenshot.
- It keeps the claims honest: detection can be mocked/precomputed, but evidence, privacy, review, and reporting are real.
- It sets up a strong finale roadmap: replace mock detections with trained models after shortlisting.

### Minimum tech for this demo

- Streamlit frontend
- Python/OpenCV for annotation + blur
- Python `hashlib.sha256` for evidence hash
- CSV/JSON store for case metadata
- Optional: pretrained YOLO/Roboflow/Ultralytics model for 1-2 classes only

---

## 6. Module-by-module design (maps to PS3's 8 tasks)

### Task 1 — Image preprocessing

**Goal:** Stable inputs under Bengaluru conditions (monsoon, night, shadows, blur).

| Technique | Purpose |
|-----------|---------|
| CLAHE | Low-light / shadow normalization |
| Gaussian / bilateral denoise | Rain, sensor noise |
| Deblur (optional lightweight) | Motion blur on moving vehicles |
| Resolution normalize | 1080p → model input (640/1280) |
| Per-condition augmentation (train) | Synthetic rain, fog, night for robustness |

**Output:** Normalized tensor + original frame retained for evidence.

---

### Task 2 — Vehicle & road user detection

**Primary detector:** RT-DETRv2-S or YOLOv11-S, fine-tuned on **UVH-26** (not COCO-only).

**Why UVH-26:**

- **26,646 images** from **~2,800 Bengaluru Safe City cameras**
- **1.8M boxes**, **14 India-specific classes** (2W, auto, LCV, bus, etc.)
- **Up to 31.5% mAP gain** vs COCO baselines
- Built with **BTP collaboration** — strong credibility for jury

Sources:

- [UVH-26 arXiv](https://arxiv.org/html/2511.02563)
- [Hugging Face iisc-aim/UVH-26](https://huggingface.co/datasets/iisc-aim/UVH-26)
- [The Hindu — IISc release](https://www.thehindu.com/news/national/karnataka/aimiisc-releases-dataset-and-advanced-vision-models-for-indian-urban-traffic/article70280902.ece)

**Backup datasets:** IDD / IDD-117K (IIIT-H, includes Bengaluru), Roboflow helmet/triple/plate sets.

**Tracking:** BoT-SORT or DeepSORT — prevents duplicate challans for same rider across frames.

---

### Task 3 — Traffic violation detection

| Violation | Method | Notes |
|-----------|--------|-------|
| **Helmet non-compliance** | 3-class head ROI: Helmet / Pagdi / No-Helmet | Avoid wrongful ticketing ([CADSIT](https://github.com/Rithwik-7274/CADSIT)) |
| **Seatbelt** | Person-in-car ROI + seatbelt classifier | Best with front/side camera angles |
| **Triple riding** | Count persons overlapping 2W bbox | Threshold ≥3 persons |
| **Wrong-side driving** | Track motion vector vs lane direction | Needs calibrated camera homography |
| **Stop-line violation** | Vehicle bbox crosses stop-line ROI before signal | Junction-specific ROI config |
| **Red-light violation** | RLVD: signal phase + stop-line crossing | Needs RLVD camera or signal feed |
| **Illegal parking** | Stationary vehicle dwell > T seconds in no-park ROI | Complements manual enforcement |

**Gating pipeline (efficiency):** Scene detect → 2W filter → helmet check → **only then** run OCR.

---

### Task 4 — Violation classification

- Multi-label classification head per violation type
- **Confidence score** per prediction (0–1)
- **Threshold policy:**
  - conf ≥ 0.85 → auto-queue for review
  - 0.60–0.85 → mandatory human review
  - < 0.60 → discard (reduce false challans)

---

### Task 5 — License plate recognition (ANPR)

**Pipeline:** Plate detect (YOLO) → crop → preprocess (CLAHE/Otsu/adaptive for white/yellow/black plates) → PaddleOCR v4 or TrOCR → **RTO regex validation**

**India-specific handling:**

- KA series, BH (Bharat) series, diplomatic, commercial formats
- State-code correction (e.g., OCR `MB` → `WB`)
- Target: **≥90% char accuracy** on Indian plates

Reference: [ModernLPR](https://github.com/navaneet625/ModernLPR_system) (~97% on curated Indian plate sets)

---

### Task 6 — Evidence generation

Each confirmed violation produces an **Evidence Package (EP)**:

```json
{
  "violation_id": "uuid",
  "timestamp_utc": "...",
  "camera_id": "BTP_JUNCTION_051",
  "gps": [12.981, 77.610],
  "violation_types": ["no_helmet"],
  "confidence": 0.91,
  "plate": "KA01XX1234",
  "annotated_image_path": "...",
  "crop_paths": ["..."],
  "model_version": "drishaak-v1.0",
  "sha256_full_frame": "...",
  "sha256_evidence_bundle": "...",
  "review_status": "pending_human"
}
```

**Legal alignment:**

- **Section 63(4) Bharatiya Sakshya Adhiniyam 2023** — hash-value disclosure for electronic evidence  
  Source: [LiveLaw 2026](https://www.livelaw.in/top-stories/supreme-court-rejects-challenge-to-s634-bsa-mandating-hash-value-disclosure-for-electronic-evidence-535950)
- Optional: append-only log / private blockchain for tamper evidence  
  Source: [Frontiers 2024](https://www.frontiersin.org/journals/sustainable-cities/articles/10.3389/frsc.2024.1426036/full)

---

### Task 7 — Analytics & reporting

**ASTraM-compatible dashboard:**

- Violations by type / junction / hour / zone
- Top junctions (link to BTP junction IDs)
- False-positive rate trend
- Reviewer throughput (cases/hour)
- Search by plate, date, violation type

**Feeds back into:** ASTraM congestion analytics + enforcement prioritization.

---

### Task 8 — Performance evaluation (proposed metrics)

| Metric | Target (pilot) | How measured |
|--------|----------------|--------------|
| mAP@0.5 (detection) | ≥0.85 on UVH-26 val | Standard COCO-style |
| mAP@0.5:0.95 | ≥0.55 | Stricter IoU |
| Helmet P/R/F1 | P≥0.90, R≥0.85 | Per-class on test split |
| ANPR char accuracy | ≥90% | Indian plate test set |
| **False challan rate** | **<5%** | Human audit sample |
| Latency (edge) | ≤100ms/frame | Jetson Orin Nano INT8 |
| FPS | ≥10 FPS | TensorRT benchmark |
| Human review rate | 15–25% | Ops efficiency KPI |

**Slice evaluation (mandatory in report):** day / night / rain / blur / heavy occlusion separately.

**Round-2 evaluation promise:** For the June 21 submission, we will present targets + methodology and, if demo is built, report only demo-level metrics honestly (e.g., sample processing time, evidence hash generation, manual review workflow). Full model metrics are for the finale/pilot phase unless we actually train/evaluate a detector.

---

## 7. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Detection | RT-DETRv2-S or YOLOv11-S | UVH-26 pre-trained weights available |
| Tracking | BoT-SORT | Strong in dense traffic |
| Helmet classifier | Custom 3-class CNN on head ROI | Pagdi-safe |
| OCR | PaddleOCR v4 / TrOCR | Indian plate robustness |
| Edge runtime | TensorRT INT8 on Jetson Orin Nano | 10–32 FPS cited in literature |
| Cloud API | FastAPI | Evidence ingest + review queue |
| Dashboard | Streamlit or React (stretch) | Demo for video |
| MLOps | MLflow (optional) | Model versioning |
| Hosting demo | Hugging Face Spaces (GPU) or local | For submission demo link |

**Reference repos (feasibility proof — cite in deck):**

- [SafeRide YOLOv11](https://github.com/RohitWani-1492/Traffic-Violation-Detection-System) — helmet mAP50 ~96.8%
- [Road-Guard](https://github.com/ibhushani/Road-Guard-Intelligent-Traffic-Violation-Detection-System) — tracking + low-light OCR
- [Edge-AI Perception Node](https://arxiv.org/html/2601.07845v1) — edge + evidence hashing (Jan 2026)
- [CADSIT](https://github.com/Rithwik-7274/CADSIT) — culturally-adaptive helmet

---

## 8. Integration with BTP ecosystem

| Existing system | Our integration |
|-----------------|-----------------|
| **ITMS / ITeMS** (50 junctions, 250 ANPR + 80 RLVD) | Drishaak = next-gen detection module for scale to 500 |
| **ASTraM** (9,000-camera big-data platform, BTP+Arcadis, Jan 2024) | Violation feed → ASTraM 15-min batched alerts to officers; junction scorecards |
| **Smart Enforcement Center** | Evidence packages → human review → e-Challan |
| **Safe City cameras** (~2,800 used in UVH-26) | Training data source + deployment target |
| **e-Challan / Parivahan** | API handoff after human approval |
| **DPDP 2023** | Privacy-by-design compliance documented |
| **BTP Digital Twin** (target Mar 2025) | Violation events as a data layer in the twin |
| **e-Path (ambulance green corridor)** | Optional: detect ambulances → suppress non-critical alerts in that corridor |

**Why this matters:** ASTraM already operates on a **15-minute batched alert cadence** to officers (source: [Insights on India, Feb 2026](https://www.insightsonindia.com/2026/02/27/astram-actionable-intelligence-for-sustainable-traffic-management/)). Our reviewer queue is engineered to match this cadence — meaning we plug into BTP's actual operational rhythm, not ask them to change theirs. **This is a procurement-grade detail other teams will not know.**

**Name-drop in pitch (VERIFIED Jun 2026):** **Karthik Reddy** (current JCP Traffic, replaced M.N. Anucheth on 14 Jul 2025 — do NOT call Anucheth the sitting chief), ASTraM, Arcadis (Dutch consultancy partner), ITMS/ITeMS, ANPR, RLVD, FTVR, contactless enforcement, e-Path, Mobility Digital Twin. M.N. Anucheth (now DIGP Recruitment) is still credited as the **architect of ASTraM/BATCS** — reference him as the visionary, not the current officeholder.

> See `PS3_WINNING_PLAYBOOK.md` for the full citation-checked fact sheet, deck structure, demo plan, Q&A war-room, and legal compliance checklist.

---

## 9. 3-day delivery plan (Jun 18–21)

### PRIORITY ORDER (time is limited — ship in this sequence)

| Priority | Deliverable | Owner(s) | Hours |
|:--------:|-------------|----------|:-----:|
| P0 | **Streamlit Evidence Demo (clickable MVP)** | Dev lead | 8-10h |
| P0 | **10-slide PDF deck** | All (parallel) | 4-6h |
| P0 | **2-min demo video** (screen record of Streamlit) | 1 person | 2h |
| P1 | Architecture diagram (Figma/draw.io) | 1 person | 2h |
| P1 | README + source zip + GitHub repo | Dev lead | 1h |
| P2 | Real YOLO inference (helmet, 1 class) | If time permits | 3-4h |

### Day-by-day

| Day | Morning (3h) | Afternoon (4h) | Evening (3h) |
|-----|-------------|----------------|--------------|
| **Day 1 (Jun 19)** | Finalize approach + wireframe demo screens + collect 5 sample Bangalore traffic images | Build Streamlit skeleton: upload → bbox overlay → privacy blur | SHA-256 hash + evidence card JSON + review buttons |
| **Day 2 (Jun 20)** | Dashboard tab (charts: violations by type, review stats) + polish demo flow | Pitch deck (10 slides) + architecture diagram + cost model slide | Video script + first screen recording attempt |
| **Day 3 (Jun 21)** | Polish demo + fix edge cases + add 1-2 more sample images | Final video recording + README + zip + submission form fill | SUBMIT by 8 PM (buffer before 11:59 PM deadline) |

### MVP demo scope (NON-NEGOTIABLE — all must ship)

| Feature | Status | Notes |
|---------|:------:|-------|
| Upload/select sample image | MUST | Use 3-5 curated Bangalore traffic images |
| Draw bounding boxes/labels | MUST | Precomputed if no model ready — use manual annotations |
| Privacy blur (faces + non-violator plates) | MUST | Visible differentiator — 10 lines of OpenCV code |
| SHA-256 evidence hash | MUST | Very easy, massive signal to judges |
| Evidence card JSON | MUST | Shows legal/audit thinking |
| Human review buttons (approve/reject/recheck) | MUST | Key differentiator: "human-in-the-loop" |
| Basic analytics dashboard | MUST | Simple bar charts: violations by type, review stats |

### Bonus (if time remains after P0 + P1 done)

| Item | Scope | Impact |
|------|-------|--------|
| Real YOLO helmet detection | Pretrained UVH-26 / Roboflow weights | HIGH if working; risky if half-baked |
| Live plate OCR | PaddleOCR on cropped plate region | Medium |
| GitHub repo with clean structure | `models/`, `pipeline/`, `demo/`, `docs/` | Professional signal |

### Do NOT attempt in 3 days (finale scope)

- Full 7 violation types production-ready
- Jetson edge deployment
- Full e-Challan integration
- Train from scratch on full UVH-26

---

## 10. Submission package checklist

- [ ] **Title:** Drishaak: Responsible Edge Enforcement for Bengaluru
- [ ] **Description** (HackerEarth form)
- [ ] **Theme:** PS3 selected
- [ ] **Presentation PDF** (10–12 slides)
- [ ] **Video URL** (~2 min): problem → architecture → evidence demo → impact → pilot
- [ ] **Demo link:** Streamlit / HF Spaces evidence workflow demo, even if detections are mocked/precomputed
- [ ] **Repository URL** with README + diagram
- [ ] **Source zip** (<50 MB)
- [ ] **Instructions to run**

---

## 11. Pilot proposal + cost model (for deck — government jury loves this)

**Pilot:** 2 ITMS junctions in Bengaluru (e.g., Silk Board + Marathahalli)  
**Duration:** 4 weeks  
**Phase 1 violations:** Helmet + ANPR (highest volume; 36%+19% = 55% of all automated violations)

**Success metrics:**

| Metric | Target | Why it matters |
|--------|--------|----------------|
| False challan rate | < 5% | Trust: citizens don't challenge; BTP credibility preserved |
| Human review time | < 30 sec/case | Ops: reviewer handles 120+ cases/hour |
| Edge FPS | ≥ 10 FPS | Coverage: real-time on live CCTV feed |
| Manual review load reduction | ≥ 20% | ROI: fewer officers on review duty |
| Evidence dispute rate | < 2% | Legal: SHA-256 hash + chain-of-custody holds in court |

**Cost model (the killer slide for government jury):**

| Item | Cost | Notes |
|------|------|-------|
| Edge node hardware | ~₹20,000 / junction | Jetson Orin Nano + enclosure + PoE |
| Cloud (review + analytics) | ~₹5,000 / month total | Shared infra for all junctions |
| Maintenance | ~₹2,000 / junction / month | Remote updates + health monitoring |
| **Total per junction** | **~₹27,000 setup + ₹2,000/mo** | vs. 1 constable: ~₹40,000/mo salary |

**ROI pitch:** Each edge node replaces ~40% of one manual reviewer's load. At 500 junctions (BTP's scale target), that's 200 officer-equivalents freed for road duties. Currently BTP has ~6,200 personnel for 1,000+ junctions — this directly addresses their #1 stated constraint.

**Scale path:** 2 junctions → 50 (existing ITMS) → 500 → full Safe City network (9,000 cameras)

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Generic YOLO deck lost in crowd | Lead with **legal + privacy + India-tuning + ASTraM integration** |
| Can't train full model in 3 days | Submit **architecture + benchmarks from literature**; optional pretrained demo |
| Finale needs working prototype | Use Jun 22–Jul 2 to build helmet+plate Streamlit demo |
| Red-light/stop-line needs junction config | Document as **Phase 2**; pilot on helmet+ANPR first |
| Wrongful challan (Pagdi) | **3-class helmet** + mandatory human review band |
| PS3 "idea only" vs form asking demo link | Provide architecture demo + Phase 1 prototype roadmap |

---

## 13. Team review checklist

Before locking, team should agree on:

1. **Product name** — Drishaak or your own?
2. **Headline USP** — Legal/privacy vs culturally-safe helmet vs ASTraM integration?
3. **Build scope for Jun 21** — PDF only vs PDF + mini Streamlit demo?
4. **Who owns** — CV/model, deck/video, legal-privacy section, integration story?
5. **Finale plan** — If top 10, who attends Flipkart HQ on 3 Jul?
6. **GPU access** — Colab / local GPU / HF Spaces for stretch demo?

---

## 14. Key references

1. UVH-26 dataset — [arxiv.org/html/2511.02563](https://arxiv.org/html/2511.02563)
2. Hugging Face UVH-26 — [huggingface.co/datasets/iisc-aim/UVH-26](https://huggingface.co/datasets/iisc-aim/UVH-26)
3. IISc / The Hindu release — [thehindu.com](https://www.thehindu.com/news/national/karnataka/aimiisc-releases-dataset-and-advanced-vision-models-for-indian-urban-traffic/article70280902.ece)
4. BTP 87% contactless — [timesofindia.indiatimes.com](https://timesofindia.indiatimes.com/city/bengaluru/87-of-traffic-violation-detection-on-bengaluru-roads-now-contactless/articleshow/124535743.cms)
5. ITMS cameras — [btp.gov.in/itmscameras.aspx](https://btp.gov.in/itmscameras.aspx)
6. Edge-AI Perception Node — [arxiv.org/html/2601.07845v1](https://arxiv.org/html/2601.07845v1)
7. CADSIT culturally-adaptive helmet — [github.com/Rithwik-7274/CADSIT](https://github.com/Rithwik-7274/CADSIT)
8. S.63(4) BSA evidence — [livelaw.in](https://www.livelaw.in/top-stories/supreme-court-rejects-challenge-to-s634-bsa-mandating-hash-value-disclosure-for-electronic-evidence-535950)
9. IDD India Driving Dataset — [idd.insaan.iiit.ac.in](https://idd.insaan.iiit.ac.in/)
10. DPDP privacy compliance — [bgblur.com DPDP guide](https://www.bgblur.com/blog/dpdp-act-india-video-privacy-face-license-plate-blurring-compliance)

---

## 15. Recommended deck outline (10 slides)

1. **Problem** — Contactless enforcement is scaling, but trust and fairness must scale with it
2. **Why generic AI fails** — Indian traffic, cultural headwear, messy plates, rain/night/occlusion
3. **Solution** — Drishaak: detection + privacy + evidence + human review
4. **Live demo** — Image → annotation → privacy blur → SHA-256 evidence card → reviewer decision
5. **India-tuned detection** — UVH-26 / RT-DETRv2 / YOLOv11 / IDD
6. **Violation coverage** — 7 violations; Phase 1 helmet + ANPR; Phase 2 red-light/stop-line/wrong-side
7. **Evidence integrity** — BSA S.63(4), hash, model version, audit trail
8. **Privacy and false-challan control** — DPDP masking + human-in-loop + false-challan metric
9. **ASTraM/ITMS integration** — Not a rival; a module for Smart Enforcement Center
10. **Pilot + roadmap** — 2 junctions, 4 weeks, scale to 500

---

## 16. Related research in this repo

For deeper technical references and prior analysis, see:

- `ROUND2-PROTOTYPE/research/03_tech_solutions.md` — PS3 repos, stack, USPs
- `ROUND2-PROTOTYPE/research/02_bengaluru_domain.md` — BTP / ASTraM / ITMS context
- `ROUND2-PROTOTYPE/research/01_hackathon_judging.md` — judging playbook

---

*Document prepared for team review. Update Section 13 checklist as decisions are made.*
