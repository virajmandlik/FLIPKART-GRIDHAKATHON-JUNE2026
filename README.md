# Drishaak — Responsible Edge Enforcement Node for Bengaluru

## 🏆 Flipkart Gridlock Hackathon 2.0 (Round 2 — Problem Statement 3)
### Automated Photo Identification and Classification for Traffic Violations Using Computer Vision

---

## 📌 Executive Summary & Thesis

Bengaluru already books **87% of traffic violations contactlessly** via 9,000+ CCTV surveillance cameras (amounting to over 11,800+ AI cases per day). However, current off-the-shelf automated systems suffer from up to **34% false-challan rates**, leading to huge backlogs, lost public trust, and a breakdown in fine recovery (only 24% of 2024 traffic fines were successfully collected). 

**Drishaak** (meaning "eye-witness" or "visionary protector" in Sanskrit) is an **India-first, legally defensible, and privacy-safe computer vision pipeline** designed to integrate directly with Bengaluru Traffic Police's (BTP) existing systems like ASTraM (AI Big-Data Platform) and ITMS (Intelligent Traffic Management System). 

Instead of pitching another simple helmet detector with high theoretical mAP, Drishaak focuses on the **complete trust and evidence layer**:
* **🎯 India-Tuned Multimodal Detection:** Built using datasets like UVH-26 (from IISc) and India Driving Dataset (IDD) to handle culturally unique elements (e.g., Pagdi/turban-wearing riders, loose chinstraps, standard vs. non-standard helmets, and saree/sari seating on triple-riding).
* **🔒 Privacy-Preserving by Design (DPDP Act 2023):** Fully complies with India's DPDP Act 2023. Faces of innocent bystanders or passengers, and license plates of vehicles without confirmed violations, are automatically blurred directly at the edge until a violation is validated.
* **📂 Court-Ready Admissible Evidence (BSA Sec 63):** Automatically generates standard-compliant PDF challans embedded with SHA-256 evidence hashes and secure timestamps to prevent tampering—conforming strictly to Section 63 of Bharatiya Sakshya Adhiniyam (BSA 2023).
* **👥 Human-in-the-Loop Review Workflow:** Restructures the review dashboard to reduce overall cognitive load and lower false-challan rates from ~34% down to **under 5%**, without requiring humans to manually inspect every single raw camera frame.

---

## 🚀 Key Features & Differentiators

| Core Feature/Defense | Traditional AI Enforcement (Streamlit/Kaggle) | Drishaak's Solution (Production Ready) |
| :--- | :--- | :--- |
| **Cultural Awareness** | Falsely flags Turbans/Pagdis as helmetless. | Handles Pagdis, loose chinstraps, and sari seating. |
| **Legal Admissibility** | Simple image output, easily contested in court. | BSA Sec 63-compliant SHA-256 hashed PDF challans. |
| **Data Privacy Policy** | Exposes private citizen data (faces & plates). | Edge-level blurring complying with DPDP Act 2023. |
| **Wrongful Challans** | Primary focus is maximizing raw detector recall. | Primary focus is minimizing wrongful reviews (<5% rate). |
| **Regional Integration** | Isolated application/script. | Designed to ingest ASTraM and ITMS camera feeds natively. |

---

## 📁 Repository Structure

All major components of the project have been streamlined and organized directly within the workspace root:

* 🗺️ **[approach/](approach/)** — High-level strategy, playbooks, and structural approach configurations:
  * **[approach/PS3_FULL_APPROACH.md](approach/PS3_FULL_APPROACH.md)** — Architectural blueprint, pipeline steps (L1–L5), and system math.
  * **[approach/PS3_WINNING_PLAYBOOK.md](approach/PS3_WINNING_PLAYBOOK.md)** — Strategic pitch deck details, competition matrices, and Bengaluru procurement contexts.
  * **[approach/PS3_DEPLOYMENT_ARCHITECTURE.md](approach/PS3_DEPLOYMENT_ARCHITECTURE.md)** — Cloud microservices design, edge billing charts, and sandbox implementation rules.
  * **[approach/hanumant.md](approach/hanumant.md)** — Technical logs and performance summaries.
* 📊 **[benchmarks-matrices-and-models-used/](benchmarks-matrices-and-models-used/)** — Multi-model validation and comparative benchmarking:
  * **[benchmarks-matrices-and-models-used/MODEL_BENCHMARKS.md](benchmarks-matrices-and-models-used/MODEL_BENCHMARKS.md)** — Details on model choices (YOLOv8, RT-DETR, EasyOCR, PaddleOCR) and mAP/FPS stats.
* 🖼️ **[artectImages/](artectImages/)** — Architectural block diagrams and technical flow illustrations.
* 📄 **[Docs/](Docs/)** — In-depth functional specifications for core pipeline layers:
  * **[Docs/Layer2_Evidence_Enhancement_ROI_Intelligence.docx](Docs/Layer2_Evidence_Enhancement_ROI_Intelligence.docx)** — Deep-dive on preprocessing and sharpening algorithms.
  * **[Docs/Layer3_AI_Violation_Detection_Validation_FINAL.docx](Docs/Layer3_AI_Violation_Detection_Validation_FINAL.docx)** — Mathematical explanations of confidence scoring and calibration overlays.
* 💻 **[Drishaak-app/](Drishaak-app/)** — Interactive React + TS + Tailwind + Vite prototype demo app:
  * **[Drishaak-app/src/App.tsx](Drishaak-app/src/App.tsx)** — Main view controller organizing all sections.
  * **[Drishaak-app/src/data/scenarios.ts](Drishaak-app/src/data/scenarios.ts)** — Structured configs for multiple real-world violation scenarios.
  * **[Drishaak-app/src/data/layerOutputs.ts](Drishaak-app/src/data/layerOutputs.ts)** — Interactive simulation outputs feeding into the review layers.
* 📡 **[outputs/](outputs/)** — Mock JSON outputs verifying output formats of the first 3 layers:
  * **[outputs/L1.json](outputs/L1.json)** — Frame ingestion, normalization parameters, and metadata.
  * **[outputs/L2.json](outputs/L2.json)** — Enhancement metadata and ROI-zoomed coordinate frames.
  * **[outputs/L3.json](outputs/L3.json)** — Detected bounding boxes, confidence scoring, and OCR strings.
* 📚 **[researchPapers/](researchPapers/)** — Academic and industrial literature supporting the design choices.
* 🎥 **[Drishaak_PS3_Submission_Deck.pptx](Drishaak_PS3_Submission_Deck.pptx)** — Complete 10-slide pitch presentation for juries and examiners.
* 📝 **[PS3.TXT](PS3.TXT)** — Original problem statement and requirements document.

---

## 🛠️ Interactive Demo App Setup (`Drishaak-app`)

To play with the live pipeline simulation, explore the violation reviews, and export sample PDF court-ready evidence challans:

### 1. Install Dependencies
Navigate into the application folder and run installation:
```bash
cd Drishaak-app
npm install
```

### 2. Launch Local Development Server
Start the Vite development build:
```bash
npm run dev
```

### 3. Build & Preview for Production
To bundle and serve a highly-optimized static release:
```bash
npm run build
npm run preview
```

---

## ⚙️ The Technical Pipeline (Layer 1 — Layer 5)

Our edge-assisted validation workflow is logically split into five secure, performant software layer modules:

### 📥 Layer 1: Ingestion & Normalization
Captures Raw CCTV streams from ITMS/ASTraM junctions. Performs localized histogram equalization and frame alignment to counteract shadows, motion blur, and night-time low-light conditions.

### 🖼️ Layer 2: Enhancement (JPEG-to-ROI)
Runs lightweight region of interest (ROI) proposals to isolate individual riders/drivers. Normalizes resolution scaling and performs localized super-resolution.

### 🧠 Layer 3: India-Tuned Recognition Engine
Performs parallel inference using fine-tuned object detection networks (such as YOLOv8 and RT-DETR). Includes specific custom classifiers to prevent false-alarms on turbans (Pagdi class), recognize chinstrap non-compliance, and identify triple-riding in packed conditions. Performs license plate detection and PaddleOCR text extraction.

### 🛡️ Layer 4: Privacy Mask & Evidence Hash
Transforms validated detections into official items of evidence. Blurs uninvolved vehicle license plates and bystander faces (DPDP 2023 compliance). Produces a SHA-256 visual hashing signature on the raw source image + timestamp + GPS data to generate a legally-unalterable trace (BSA 2023 Section 63).

### 🖥️ Layer 5: Automated Command Center Hub
Aggregates finalized metadata in real-time, displays performance metrics (false-challan rate, avg review speed), displays daily statistics, and exports the court-ready, signed PDF challans directly to dispatch queues.

---

## 📊 Key Target Metrics

* **Wrongful Challan Rate:** `< 5.0%` (reduced from `≈34%` of generic object detectors)
* **Average Inspector Review Time:** `< 6.0` seconds per incident card
* **Pipeline Latency (Edge to Hub):** `< 450ms` total travel time
* **Evidence Processing Cost:** `< ₹0.18` per challan generated on serverless setups

---
*Drishaak represents a paradigm shift from simple neural network inference to structured, legally-conscious systems engineering for Indian Smart Cities. Let's make Bengaluru's roads safer, smarter, and more accountable!*

