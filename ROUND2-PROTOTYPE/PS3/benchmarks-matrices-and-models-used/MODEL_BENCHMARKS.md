# SafeSight EN — Models & Benchmarks

> **Honesty rule:** No model evaluated on our dataset yet. `L1/L2/L3.json` confidences are demo-only. Numbers below = **published literature** or **pilot targets** from `PS3_FULL_APPROACH.md`.

---

## Models Used

| Task | Model |
| --- | --- |
| Enhancement | Restormer |
| Super Resolution | Real-ESRGAN |
| Detection | RT-DETRv2-S (UVH-26 fine-tuned) |
| OCR | PaddleOCR |
| Helmet | YOLOv11n/s ROI (Helmet / Pagdi / No-Helmet) |
| Seatbelt | YOLOv11 ROI |
| Rider Count | RT-DETR person detection |
| Vehicle Type | RT-DETR classification |
| Validation | Gemini / Qwen2.5-VL |

---

## Component Benchmarks (Published)

| Component | Model | Metric | Published | Source |
| --- | --- | --- | --- | --- |
| Image Restoration | Restormer | PSNR / SSIM | 40.01 dB / 0.963 (SIDD); 33.96 dB / 0.935 (derain avg) | CVPR 2022 |
| Super Resolution | Real-ESRGAN | PSNR / LPIPS | ~27.3 dB / 0.120 (lit.); NIQE-focused in paper | arXiv 2107.10833 |
| Object Detection | RT-DETRv2-S | mAP50 / mAP50-95 | 65.1% / 48.1% (COCO); UVH-26 best ~0.67–0.70 mAP50-95 | RT-DETR GitHub; UVH-26 arXiv |
| OCR | PaddleOCR | Char accuracy | PP-OCRv5: 86.38%; PP-OCRv6 Print-EN: 94.1% | PaddleOCR docs |
| Indian ANPR | PaddleOCR + regex | Char accuracy | 97–98.4% (ModernLPR / Awiros on Indian plates) | GitHub / HuggingFace |
| Helmet | YOLOv11 ROI | mAP50 / P / R | 90–98% mAP50; SafeRide 96.8% | SafeRide repo; ICDAM 2025 |
| Seatbelt | YOLOv11 ROI | mAP50 / F1 | mAP50 90–98%; F1 ~95–98% | ACS 2024; Iowa State 2024 |
| Rider Count | RT-DETR + logic | Count accuracy | Inherits detector mAP | UVH-26 |
| Vehicle Class | RT-DETR ROI | Accuracy | ~97% AVC (expressway ITS) | ITS case study |
| Wrong-Side | Rule + BoT-SORT | P / R | Rule-based — no standard ML benchmark | Architecture |
| Red-Light | Rule + signal logic | P / R | Rule-based — no standard ML benchmark | Architecture |
| Agentic Validation | Qwen2.5-VL / Gemini | FP reduction | ~10–19% FP reduction (VLM lit.); DocVQA 95.7% | arXiv 2510.13232; Qwen README |

---

## Key Published Numbers

| Model | Performance | Dataset |
| --- | --- | --- |
| RT-DETR-L | 53.0% AP, 71.6% mAP50, 114 FPS | COCO val2017 |
| RT-DETRv2-S | 48.1% AP, 65.1% mAP50, 217 FPS | COCO val2017 |
| RT-DETR-X (UVH-26) | ~0.67–0.70 mAP50-95 (+31.5% vs COCO) | UVH-26 Bengaluru CCTV |
| PaddleOCR | 86–94% recognition (version-dependent) | PaddleOCR eval |
| YOLOv11 Helmet | 92–98% mAP50 | Custom / Roboflow sets |
| Restormer | SOTA on SIDD / deraining / deblurring | CV benchmarks |
| Real-ESRGAN | SOTA perceptual blind SR | Real-world SR |

---

## End-to-End Targets (Pilot — Not Yet Measured)

| Metric | Target |
| --- | --- |
| Violation Precision | >95% |
| Violation Recall | >92% |
| F1 | >93% |
| mAP50 | >90% |
| OCR (Indian plates) | >95% (doc min ≥90%) |
| Agentic FP Reduction | 15–30% |
| Processing Time | <2 sec/event |
| **False Challan Rate** | **<5%** (primary KPI) |
| Human Review Rate | 15–25% |

---

## Per-Layer Status

| Layer | Published Benchmark | Our Status |
| --- | --- | --- |
| L1 Ingest | N/A | Demo only |
| L2 Enhancement | Restormer SOTA restoration | Demo quality score only |
| L2 Detection | 65.1% mAP50 COCO; UVH-26 +31.5% gain | UVH-26 weights; not re-evaluated |
| L3 Helmet | 90–98% mAP50 | Target P≥0.90, R≥0.85 |
| L3 OCR | 97–98% Indian plates (lit.) | Demo conf. 0.98 — not eval |
| L3 Agentic | ~10–19% FP reduction (lit.) | Demo consistency 0.95 — not eval |
| L4 Evidence | ~34% wrong challans (Mumbai-Pune RTI) | Target <5% false challans |

---

## Judge One-Liner

*"Component numbers are from published benchmarks (UVH-26, RT-DETR, PaddleOCR, YOLOv11). Our Bengaluru evaluation is pending pilot. We optimize false-challan rate, not inflated mAP."*
