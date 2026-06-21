"""Unit tests for the ExplanationEngine (no DB or network required)."""

import io

from PIL import Image

from app.config import Settings
from app.engine import ExplanationEngine, normalize_confidence
from app.schemas import Detection, ReviewStatus, ViolationEvent, ViolationType
from app.storage import LocalStorage


def _engine(tmp_path) -> ExplanationEngine:
    settings = Settings(
        storage_backend="local",
        local_storage_dir=str(tmp_path / "proofs"),
        auto_approval_threshold=90.0,
    )
    return ExplanationEngine(settings, LocalStorage(str(tmp_path / "proofs")))


def test_normalize_confidence_variants():
    assert normalize_confidence("96%") == 0.96
    assert normalize_confidence("0.96") == 0.96
    assert normalize_confidence(96) == 0.96
    assert normalize_confidence(0.96) == 0.96
    assert normalize_confidence(None) == 0.0
    assert normalize_confidence("garbage") == 0.0


def test_red_light_auto_approved(tmp_path):
    engine = _engine(tmp_path)
    event = ViolationEvent(
        violation_type=ViolationType.RED_LIGHT,
        confidence="96%",
        raw_output={"signal": "red", "vehicle_crossed_line": True,
                    "distance_crossed": "1.8m"},
    )
    record = engine.explain(event)

    assert record.confidence == 0.96
    assert record.review_status == ReviewStatus.AUTO_APPROVED
    assert record.requires_human_review is False
    assert record.generated_report.violation_type == "Red-Light Violation"
    assert record.generated_report.summary == (
        "The vehicle crossed the designated stop line while the traffic "
        "signal was red."
    )
    assert "Vehicle crossed the stop line by 1.8m." in record.generated_report.details
    # Reasoning chain: 3 violation steps + 1 HITL decision step.
    assert len(record.reasoning_chain) == 4
    assert "auto-approved" in record.reasoning_chain[-1].statement


def test_below_threshold_routes_to_manual_review(tmp_path):
    engine = _engine(tmp_path)
    event = ViolationEvent(
        violation_type=ViolationType.RED_LIGHT,
        confidence=85,  # below 90
        raw_output={"signal": "red"},
    )
    record = engine.explain(event)
    assert record.review_status == ReviewStatus.MANUAL_REVIEW
    assert record.requires_human_review is True
    assert "manual review" in record.reasoning_chain[-1].statement


def test_helmet_uses_detected_rider(tmp_path):
    engine = _engine(tmp_path)
    event = ViolationEvent(
        violation_type=ViolationType.HELMET,
        confidence=0.93,
        detections=[
            Detection(label="Rider", confidence=0.97),
            Detection(label="No Helmet", confidence=0.93),
        ],
    )
    record = engine.explain(event)
    assert record.generated_report.violation_type == "Helmet Non-Compliance"
    assert record.review_status == ReviewStatus.AUTO_APPROVED


def test_all_seven_violation_types_supported(tmp_path):
    engine = _engine(tmp_path)
    for vt in ViolationType:
        record = engine.explain(
            ViolationEvent(violation_type=vt, confidence=0.95)
        )
        assert record.violation_type == vt.value
        # Every record has a reasoning chain ending in a HITL decision.
        assert len(record.reasoning_chain) >= 2


def test_evidence_fields_carried_through(tmp_path):
    engine = _engine(tmp_path)
    event = ViolationEvent(
        violation_type=ViolationType.SEATBELT,
        confidence=0.91,
        vehicle_number="MH12AB1234",
        location="Junction 7, MG Road",
    )
    record = engine.explain(event)
    assert record.vehicle_number == "MH12AB1234"
    assert record.location == "Junction 7, MG Road"
    assert record.timestamp is not None


def test_annotated_proof_is_written(tmp_path):
    src = tmp_path / "source.jpg"
    Image.new("RGB", (200, 200), (120, 120, 120)).save(src)

    engine = _engine(tmp_path)
    event = ViolationEvent(
        violation_type=ViolationType.HELMET,
        confidence=0.93,
        image_uri=str(src),
        annotate_image=True,
        detections=[
            Detection(label="No Helmet", confidence=0.93,
                      box={"x": 10, "y": 10, "width": 50, "height": 50}),
        ],
    )
    record = engine.explain(event)
    assert record.proof_image_uri is not None
    with open(record.proof_image_uri, "rb") as fh:
        Image.open(io.BytesIO(fh.read())).verify()
