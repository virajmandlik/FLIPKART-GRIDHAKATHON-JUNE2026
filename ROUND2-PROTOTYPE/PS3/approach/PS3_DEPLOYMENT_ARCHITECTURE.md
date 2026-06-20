# SafeSight EN — Deployment & Microservices Architecture

**Problem Statement:** PS3 — Automated Photo Identification & Classification for Traffic Violations
**Project codename:** SafeSight EN (Responsible Edge Enforcement Node for Bengaluru)
**Document purpose:** Production-grade deployment + microservices design. This is the "Feasibility + Scalability" deliverable for an idea-only PS3 submission. Pairs with `PS3_FULL_APPROACH.md` (solution) and `PS3_WINNING_PLAYBOOK.md` (pitch).
**Last updated:** Jun 2026

---

## 0. Guideline reality check (READ FIRST)

These decisions are grounded in the official hackathon FAQ + site (verified Jun 2026), not assumptions.

| Fact | Source | Architectural consequence |
|------|--------|---------------------------|
| **PS3 = idea submission only**; no working model mandatory | HackerEarth support + admin `anushree.hn` | Ship an **architecture + a tiny free-hosted clickable demo**, not a trained model. |
| **No cloud credits / API access "available currently"** | Admin reply on MapmyIndia/API | Design for **free tiers**; present full cloud as the *production target* (a design, not a bill). |
| **Each upload field < 50 MB** | Admin reply | No model weights in the zip. Submit **docs + diagrams + links** to externally hosted demo/repo. |
| **Submission deadline Jun 21, 11:59 PM IST** | FAQ | Demo must be a free-hosted, zero-maintenance app. |
| **Finale Jul 3, Flipkart HQ, top 10, in person** | FAQ | Keep a finale-hardening roadmap (12 days post-shortlist). |
| **Judging: Impact, Feasibility, Scalability & Sustainability, Completeness** | HackerEarth event page | This doc maps 1:1 to Feasibility + Scalability + Sustainability. |

**Golden rule:** *Nothing heavy runs on your laptop, and nothing costs money before the finale.* Training and demo hosting are offloaded to free tiers; the enterprise cloud design is presented as the deployment plan that proves the idea scales.

---

## 1. Architecture principles

1. **Edge-first, cloud-assisted.** Inference happens at the camera pole; only violation *packets* (not raw video) leave the site. This is the privacy + bandwidth + DPDP win.
2. **Microservices, not a monolith.** Each capability (detect, OCR, evidence, review, challan, analytics) is an independently deployable, independently scalable service.
3. **Event-driven backbone.** Services communicate through an async message bus (Kafka). No tight coupling; back-pressure friendly; replayable for audits.
4. **Stateless services + externalized state.** Twelve-factor; state lives in Postgres / object store / Redis, so any pod can be killed and replaced.
5. **Human-in-the-loop by contract.** No challan is auto-issued. A review service gates every low-confidence case (legal + trust requirement).
6. **Compliance is a layer, not an afterthought.** DPDP privacy masking and BSA-2023 evidence integrity are first-class services in the pipeline.
7. **Cloud-agnostic core.** Built on Kubernetes + Kafka + Postgres + S3-compatible storage so it runs on AWS, GCP, Azure, or on-prem BTP datacenter without rewrite.

---

## 2. C4 Level 1 — System context

```
                ┌───────────────────────────────────────────────┐
   CCTV / ANPR  │                                               │
   poles  ───►  │              SafeSight EN system              │  ───►  e-Challan / Parivahan
   (RTSP)       │   (edge nodes + cloud enforcement platform)   │        (challan issuance)
                │                                               │
   Signal phase │                                               │  ───►  ASTraM analytics / BATCS
   feed   ───►  │                                               │        (congestion + dashboards)
                └───────────────────────────────────────────────┘
                      ▲                         ▲
                      │                         │
              Traffic reviewer            BTP admin / auditor
              (approve/reject)            (KPIs, audit trail)
```

**Actors:** CCTV poles, signal controller, traffic reviewer (human-in-loop), BTP admin/auditor.
**External systems:** Parivahan e-Challan, ASTraM/BATCS, MapmyIndia (optional geocoding), DigiLocker/SMS (notice delivery).

---

## 3. C4 Level 2 — Container view (the two tiers)

```
═══════════════ EDGE TIER (per junction — NVIDIA Jetson Orin Nano Super) ═══════════════
 RTSP frame
    │
    ▼
 [edge-ingest] ─► [preprocess] ─► [detector(RT-DETRv2-S, TensorRT INT8)]
                                        │
                                        ▼
                                   [tracker(BoT-SORT)] ─► [violation-engine]
                                                                │
                                          ┌─────────────────────┼───────────────┐
                                          ▼                     ▼               ▼
                                    [anpr(OCR+regex)]    [privacy-masker]  [evidence-packer]
                                                                                 │ (SHA-256 + sign)
                                          only signed violation packets egress ──┘
                                                                │   (mTLS, store-and-forward queue)
══════════════════════════════════════════════════════════════│════════════════════════════
                                                                ▼
═══════════════ CLOUD TIER (Kubernetes cluster) ═══════════════════════════════════════════
   [api-gateway] ─► [ingest-svc] ──► (Kafka: violations.raw)
                                          │
        ┌─────────────────────────────────┼──────────────────────────────┬───────────────┐
        ▼                                 ▼                                ▼               ▼
  [review-svc]                      [evidence-svc]                  [analytics-svc]  [notify-svc]
  human queue UI                    BSA S.63(4) cert +              KPIs, trends,    SMS/DigiLocker
  approve/reject/recheck            tamper-proof store              false-challan    challan notice
        │                                 │                          rate                │
        └────────► (Kafka: violations.approved) ──► [challan-svc] ──► Parivahan e-Challan API
                                                          │
                                          [vlm-recheck-svc] (optional, low-conf second opinion)
═════════════════════════════════════════════════════════════════════════════════════════════
   Cross-cutting: [auth/RBAC] · [audit-log] · [secrets(Vault)] · [observability(OTel→Prom/Grafana/Loki)]
```

---

## 4. Microservices decomposition

| # | Service | Responsibility | Runtime / tech | Scaling trigger | State store |
|---|---------|----------------|----------------|-----------------|-------------|
| E1 | **edge-ingest** | Pull RTSP, frame-sample, drop dupes | C++/GStreamer or Python | 1 per camera | none (stream) |
| E2 | **preprocess** | CLAHE, denoise, deblur, low-light/rain restore | OpenCV / Kornia | per-frame | none |
| E3 | **detector** | Vehicles/persons/plate-ROI boxes | RT-DETRv2-S, TensorRT INT8 | GPU-bound | model in RAM |
| E4 | **tracker** | One track-id per object → dedupe violations | BoT-SORT | per-frame | in-memory ring |
| E5 | **violation-engine** | Rule+geometry+small classifiers (helmet/triple/seatbelt/red-light/wrong-side/parking) | Python rules + ONNX | per-track | none |
| E6 | **anpr** | Plate detect → OCR → KA/BH RTO regex + temporal vote | fast-plate-ocr / PaddleOCR | per-plate | none |
| E7 | **privacy-masker** | Blur faces + non-violator plates (DPDP) | OpenCV | per-frame | none |
| E8 | **evidence-packer** | Annotated frame + crop + metadata + SHA-256 + device sign; store-and-forward on link loss | Python + hashlib | per-violation | local SQLite buffer |
| C1 | **api-gateway** | TLS termination, authN, rate-limit, routing | Kong / Nginx / Envoy | RPS | none |
| C2 | **ingest-svc** | Validate packet, verify hash+signature, publish to Kafka | FastAPI | RPS | Kafka |
| C3 | **review-svc** | Human queue, approve/reject/recheck, SLA timers | FastAPI + React | reviewers online | Postgres |
| C4 | **evidence-svc** | Generate BSA S.63(4) certificate, WORM-store evidence, chain-of-custody log | FastAPI | violations/sec | Postgres + S3 (object-lock) |
| C5 | **challan-svc** | Format challan, push to Parivahan e-Challan after approval | FastAPI | approvals/sec | Postgres |
| C6 | **analytics-svc** | Violation stats, trends, hotspot heatmap, false-challan-rate KPI | FastAPI + DuckDB/ClickHouse | query load | ClickHouse |
| C7 | **notify-svc** | SMS / DigiLocker notice to violator | FastAPI + provider SDK | notices/sec | Postgres outbox |
| C8 | **vlm-recheck-svc** (optional) | Natural-language second opinion for conf < τ | self-hosted Qwen3-VL-8B | GPU queue depth | none |
| X1 | **auth-svc** | OIDC, RBAC (reviewer/admin/auditor), step-up for sensitive ops | Keycloak | n/a | Postgres |
| X2 | **audit-log** | Append-only, tamper-evident action log | Loki / Postgres WORM | n/a | object-lock |

> **Why this split wins:** judges see you understand that ANPR (CPU-light, bursty) scales differently from the detector (GPU-bound), and that human review is the legal bottleneck — so each is isolated and independently scalable. That is "real-world scalability," the exact phrase in the rubric.

---

## 5. Event-driven backbone (Kafka topics)

| Topic | Producer | Consumers | Key | Retention |
|-------|----------|-----------|-----|-----------|
| `violations.raw` | ingest-svc | review-svc, evidence-svc, analytics-svc | camera_id | 7 days |
| `violations.lowconf` | ingest-svc | vlm-recheck-svc | track_id | 3 days |
| `violations.approved` | review-svc | challan-svc, analytics-svc | violation_id | 30 days |
| `violations.rejected` | review-svc | analytics-svc (model-feedback) | violation_id | 90 days |
| `challan.issued` | challan-svc | notify-svc, analytics-svc | challan_id | 1 year (audit) |
| `audit.events` | all services | audit-log | actor_id | 5 years (legal) |

**Why Kafka (not direct REST):** replayable for audits/court, decouples bursty edge from slow human review, and `violations.rejected` becomes a free continuous-learning dataset for model improvement.

---

## 6. Key data contract — Evidence Package (the heart of the system)

```json
{
  "violation_id": "BLR-KAR-20260619-000412",
  "camera_id": "KA-MGRoad-07",
  "captured_at": "2026-06-19T08:14:22+05:30",
  "violation_type": "NO_HELMET",
  "confidence": 0.91,
  "vehicle": { "class": "2W", "plate_text": "KA01AB1234", "plate_conf": 0.88, "rto_regex_valid": true },
  "rois": { "rider_head_bbox": [x,y,w,h], "plate_bbox": [x,y,w,h] },
  "model": { "detector": "rtdetrv2-s", "version": "1.2.0-uvh26", "ocr": "fast-plate-ocr-1.0" },
  "privacy": { "faces_blurred": 2, "nonviolator_plates_blurred": 3, "dpdp_rule": "Rule 6" },
  "integrity": { "frame_sha256": "ab12...ef", "signed_by": "edge-KA-MGRoad-07", "alg": "ECDSA-P256" },
  "review": { "status": "PENDING", "reviewer_id": null, "decision_at": null },
  "bsa_certificate": null
}
```

This single object is the demo centerpiece and the integration contract. Privacy + integrity + human-review fields are what no generic YOLO team includes.

---

## 7. Deployment topology (Kubernetes)

```
Cluster (EKS / GKE / AKS / on-prem k3s)
├── ns: edge-gateway     → ingest-svc, api-gateway        (HPA on RPS)
├── ns: enforcement      → review-svc, evidence-svc, challan-svc, notify-svc (HPA)
├── ns: ml               → vlm-recheck-svc                (GPU node pool, scale-to-zero)
├── ns: analytics        → analytics-svc, ClickHouse
├── ns: platform         → Kafka, Postgres (HA), Redis, Vault, Keycloak
└── ns: observability    → Prometheus, Grafana, Loki, OTel-collector

Edge: NVIDIA Jetson Orin Nano Super per junction, k3s single-node or bare containers,
      MQTT/HTTP store-and-forward to cloud over mTLS.
```

- **Stateless services:** HPA (Horizontal Pod Autoscaler) on CPU/RPS/queue-depth.
- **GPU service (vlm-recheck):** dedicated GPU node pool, **scale-to-zero** when idle (cost control).
- **Stateful (Kafka/Postgres/ClickHouse):** StatefulSets with PVs, multi-AZ, automated backups.

---

## 8. Cloud-agnostic provider mapping

| Capability | AWS | GCP | Azure | On-prem (BTP datacenter) |
|------------|-----|-----|-------|--------------------------|
| Kubernetes | EKS | GKE | AKS | k3s / RKE2 |
| Message bus | MSK (Kafka) | Pub/Sub or Managed Kafka | Event Hubs | self-hosted Kafka |
| Object store (WORM evidence) | S3 + Object Lock | GCS + Bucket Lock | Blob + immutability | MinIO + object-lock |
| Relational | RDS Postgres | Cloud SQL | Azure DB Postgres | Patroni Postgres HA |
| Analytics OLAP | ClickHouse on EC2 / Athena | BigQuery | Synapse | ClickHouse |
| Secrets | Secrets Manager / KMS | Secret Manager / KMS | Key Vault | HashiCorp Vault |
| Edge | IoT Greengrass | Edge TPU/IoT | Azure IoT Edge | Jetson + k3s |

**Pitch line:** "BTP can deploy on its own datacenter for data sovereignty, or any cloud — zero rewrite. Evidence never needs to leave Indian soil." (DPDP data-localization story.)

---

## 9. The no-cost build plan (because no credits are provided)

This is how you build/showcase everything at **₹0** until the finale.

| Need | Free tier to use | Limit | What you do there |
|------|------------------|-------|-------------------|
| **Train / fine-tune detector** | Google Colab (free T4) · Kaggle (30 GPU-hrs/wk) · HF AutoTrain | session caps | Fine-tune RT-DETRv2-S on UVH-26 *only if shortlisted* |
| **Host the clickable demo** | **Streamlit Community Cloud** or **HF Spaces** (free CPU) | sleeps when idle | Deploy the Evidence Review demo → gives you the "demo link" the form wants |
| **Repo + CI/CD** | GitHub (public) + GitHub Actions (2,000 free min/mo) | — | Lint, test, build container on push |
| **Container registry** | GHCR (free public) | — | Store demo image |
| **Datasets** | HF Datasets (UVH-26), IDD, Roboflow Universe | — | Download labeled data for finale metrics |
| **Optional VLM** | HF Spaces ZeroGPU / Gemini free tier | quota | Demo the second-opinion feature cheaply |

**Local vs cloud split (your machine stays light):**

| Runs on YOUR laptop (fine) | Offloaded to free cloud (heavy) |
|----------------------------|----------------------------------|
| Editing code, the Streamlit demo on mock detections, diagrams, docs | Any model training / fine-tuning (Colab/Kaggle) |
| Running unit tests | Hosting the public demo (Streamlit Cloud/HF) |
| Generating sample evidence JSON, SHA-256 | GPU inference / VLM (HF Spaces) |

> For **Round 2 you do NOT train anything.** The demo runs on *pre-saved/mock detections* so it's instant, free, and never crashes in front of judges. Training is a finale-only activity on free GPUs.

---

## 10. CI/CD pipeline (GitHub Actions, free tier)

```
push → [lint+typecheck] → [unit tests] → [SAST + dependency scan] → [build container]
     → [push GHCR] → [deploy demo to Streamlit Cloud/HF Spaces]
                   → (prod, post-finale) [deploy to k8s via ArgoCD/Helm, canary]
```

- **Security gates in CI:** SCA (dependency audit) + SAST + secret scanning — fail on criticals. (Matches DevSecOps standards: scan before deploy, no secrets in code.)
- **Artifacts signed** (cosign) before any prod deploy; verify signature at admission.
- **IaC:** Terraform modules per environment; nothing applied until finale.

---

## 11. Security & compliance architecture

| Concern | Control |
|---------|---------|
| **DPDP Act 2023** | Edge-side blur of faces + non-violator plates *before* egress; data-minimization (only violation packet leaves); retention policies per topic; data stays in-country. |
| **BSA 2023 S.63(4)** | SHA-256 frame hash + ECDSA device signature at capture; dual-signed certificate generated by evidence-svc; append-only chain-of-custody in audit-log. |
| **MV Act Rule 167A / CMVR** | Human-approved challan only; helmet logic exempts Pagdi (Sec 129). |
| **Transport** | mTLS edge↔cloud and service↔service (mesh); TLS 1.3; HSTS on dashboards. |
| **AuthN/Z** | OIDC via Keycloak; RBAC (reviewer/admin/auditor); deny-by-default; step-up auth for challan issuance. |
| **Secrets** | Vault/KMS; never in code or env files; short-lived service identities. |
| **Audit** | Every approve/reject/issue logged immutably with actor, time, evidence-id (5-yr legal retention). |
| **Supply chain** | Pinned deps, lockfiles, SBOM, signed images, AGPL-free model stack (Apache-2.0 RT-DETRv2 — the procurement win). |

---

## 12. Observability

- **Metrics (Prometheus):** FPS/latency per edge node, queue depth, review SLA, **false-challan rate** (the KPI that matters).
- **Logs (Loki):** structured JSON, PII-redacted, correlation-id per violation_id.
- **Traces (OpenTelemetry):** end-to-end span capture → ingest → review → challan.
- **Dashboards (Grafana):** ops health + a BTP-facing enforcement dashboard (violations by type/zone/time).

---

## 13. Scalability & cost path

| Stage | Cameras | Edge cost | Cloud cost/mo | Notes |
|-------|---------|-----------|---------------|-------|
| Demo (Round 2) | 0 (mock) | ₹0 | ₹0 (free tier) | Streamlit/HF demo |
| Pilot | 1–5 junctions | ~₹20k/node | ~₹5k total | Single cluster, 1 reviewer |
| City phase | ~500 junctions | edge fleet | scale K8s + Kafka partitions | HPA + GPU scale-to-zero |
| Full Bengaluru | ~9,000 cameras | edge fleet | multi-AZ, sharded ClickHouse | data-localized, BTP datacenter option |

**Sustainability story:** edge-first means cloud cost grows with *violations*, not with *video volume* — so cost scales sub-linearly with cameras. That is the answer to "will it scale for the real world" in the rubric.

---

## 14. Phased roadmap

| Phase | Window | Deliverable |
|-------|--------|-------------|
| **Round 2** | now → Jun 21 | This architecture doc + diagrams + free-hosted Evidence Review demo (mock detections) + 10-slide deck + 2-min video |
| **Finale prep** | if top-10, → Jul 3 | Fine-tune RT-DETRv2-S on UVH-26 (free GPU), real metrics (mAP/P/R/F1), live demo polish |
| **Pilot** | post-win | 1–5 junction deployment with BTP, real Jetson nodes |
| **Scale** | 6–18 mo | 500 → 9,000 cameras, BTP datacenter or cloud |

---

## 15. Tech stack summary

| Layer | Choice | License |
|-------|--------|---------|
| Detector | RT-DETRv2-S / DEIMv2-S (TensorRT INT8) | Apache-2.0 |
| Small-object | SAHI | MIT/Apache |
| Tracker | BoT-SORT | MIT |
| ANPR | fast-plate-ocr / PaddleOCR + RTO regex | MIT / Apache-2.0 |
| VLM (optional) | Qwen3-VL-8B (self-hosted) | Apache-2.0 |
| Services | FastAPI (Python), React (dashboard) | MIT |
| Bus | Apache Kafka | Apache-2.0 |
| Stores | Postgres, ClickHouse, S3/MinIO, Redis | OSS |
| Orchestration | Kubernetes + Helm + ArgoCD | Apache-2.0 |
| Edge | NVIDIA Jetson Orin Nano Super + k3s | — |
| Observability | Prometheus, Grafana, Loki, OpenTelemetry | Apache-2.0 |
| Secrets/Auth | Vault, Keycloak | OSS |

**Every component is OSS and AGPL-free** (except optional YOLO fallback) → procurement-clean for a government buyer.

---

## 16. What actually goes into the Jun 21 submission

1. **This doc** + `PS3_FULL_APPROACH.md` + `PS3_WINNING_PLAYBOOK.md` (the idea + approach + pitch).
2. **Architecture diagrams** (export the ASCII to a clean Figma/draw.io image for the deck).
3. **Free-hosted demo link** (Streamlit Cloud / HF Spaces) — the Evidence Review clickable demo on mock detections.
4. **Public GitHub repo** link (demo code + this architecture).
5. **10-slide deck** (≤50 MB) + **2-min video** (problem → architecture → evidence demo → impact → pilot).

Nothing in the zip exceeds 50 MB because weights/video live on external free hosts and are linked, not uploaded.
