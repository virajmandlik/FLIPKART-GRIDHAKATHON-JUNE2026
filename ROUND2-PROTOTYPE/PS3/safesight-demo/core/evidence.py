"""Evidence integrity engine (REAL logic, not mocked).

Produces a tamper-evident evidence package for each violation:
  - SHA-256 hash of the annotated frame bytes
  - structured metadata (camera, time, model version, confidence, privacy)
  - a Bharatiya Sakshya Adhiniyam (BSA) 2023 Section 63(4) style certificate

The hashing + certificate are exactly what makes auto-captured CCTV evidence
legally admissible in India. This is the differentiator over a plain detector.
"""
from __future__ import annotations

import hashlib
import io
import json
from datetime import datetime, timezone, timedelta

from PIL import Image

from .detection import Detection, SceneResult, VIOLATION_LABELS
from . import plates

IST = timezone(timedelta(hours=5, minutes=30))
MODEL_VERSION = "rtdetrv2-s/1.2.0-uvh26 (prototype: simulated)"
OCR_VERSION = "fast-plate-ocr/1.0 + RTO-regex"


def sha256_image(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return hashlib.sha256(buf.getvalue()).hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def make_violation_id(camera_id: str, when: datetime, seq: int) -> str:
    return f"BLR-{camera_id}-{when.strftime('%Y%m%d')}-{seq:06d}"


def build_evidence(detection: Detection, *, camera_id: str, location: str,
                   frame_hash: str, captured_at: datetime, seq: int,
                   faces_blurred: int, plates_blurred: int) -> dict:
    plate_info = None
    if detection.plate_text:
        pr = plates.validate(detection.plate_text)
        plate_info = {
            "plate_text": pr.normalised,
            "plate_pretty": plates.format_pretty(pr.normalised),
            "plate_conf": detection.plate_conf,
            "rto_regex_valid": pr.is_valid,
            "plate_type": pr.plate_type,
            "state_code": pr.state_code,
            "validation_note": pr.notes,
        }

    return {
        "violation_id": make_violation_id(camera_id, captured_at, seq),
        "camera_id": camera_id,
        "location": location,
        "captured_at": captured_at.isoformat(),
        "violation_type": detection.violation,
        "violation_label": VIOLATION_LABELS.get(detection.violation, detection.violation),
        "confidence": round(detection.confidence, 4),
        "vehicle": {
            "class": detection.obj_class,
            "headwear": detection.headwear,
            **({"plate": plate_info} if plate_info else {}),
        },
        "model": {"detector": MODEL_VERSION, "ocr": OCR_VERSION},
        "privacy": {
            "faces_blurred": faces_blurred,
            "nonviolator_plates_blurred": plates_blurred,
            "dpdp_basis": "DPDP Act 2023, Rule 6 (data minimisation)",
        },
        "integrity": {
            "frame_sha256": frame_hash,
            "hash_alg": "SHA-256",
            "signed_by": f"edge-{camera_id}",
            "signature_alg": "ECDSA-P256 (simulated in prototype)",
        },
        "review": {"status": "PENDING", "reviewer_id": None, "decision_at": None,
                   "decision_note": None},
        "bsa_certificate": None,
    }


def issue_bsa_certificate(evidence: dict, reviewer_id: str) -> dict:
    """Generate a Section 63(4) BSA-2023 style certificate after human approval."""
    now = datetime.now(IST)
    cert = {
        "act": "Bharatiya Sakshya Adhiniyam, 2023 - Section 63(4)",
        "statement": (
            "This electronic record was produced by an automated computer-vision "
            "enforcement device operating in its ordinary course. The output was "
            "reviewed and approved by an authorised officer. The integrity of the "
            "source frame is established by the SHA-256 hash recorded below."
        ),
        "violation_id": evidence["violation_id"],
        "frame_sha256": evidence["integrity"]["frame_sha256"],
        "device_id": evidence["integrity"]["signed_by"],
        "approved_by": reviewer_id,
        "certified_at": now.isoformat(),
        "cert_id": "CERT-" + hashlib.sha256(
            (evidence["violation_id"] + reviewer_id + now.isoformat()).encode()
        ).hexdigest()[:16].upper(),
    }
    return cert


def evidence_to_json(evidence: dict) -> str:
    return json.dumps(evidence, indent=2, ensure_ascii=False)
