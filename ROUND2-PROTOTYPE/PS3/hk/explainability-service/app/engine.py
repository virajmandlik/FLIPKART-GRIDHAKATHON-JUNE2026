"""ExplanationEngine: turns a violation event into an evidence record.

Responsibilities (the AWS Lambda Service in the Violation Detection AI plan):
- Generate a human-readable reasoning chain (no LLM; rule-based templates).
- Normalize and validate the confidence score.
- Apply the human-in-the-loop gate (auto-approve vs manual review).
- Optionally produce an annotated proof image.

Dispatch is by violation type. Each builder receives the event and returns the
(summary, details, reasoning steps) for that violation. Add a violation by
writing a builder and registering it in VIOLATION_BUILDERS.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Optional

from app.annotator import annotate
from app.config import Settings
from app.schemas import (
    Detection,
    EvidenceRecord,
    GeneratedReport,
    ReasoningStep,
    ReviewStatus,
    ViolationEvent,
    ViolationType,
)
from app.storage import StorageBackend


def normalize_confidence(raw: Any) -> float:
    """Normalize a confidence value to a 0-1 float.

    Accepts "96%", "0.96", 96, 0.96. Values > 1 are treated as percentages.
    """
    if raw is None:
        return 0.0
    if isinstance(raw, str):
        raw = raw.strip().rstrip("%")
        try:
            value = float(raw)
        except ValueError:
            return 0.0
    else:
        value = float(raw)
    if value > 1.0:
        value = value / 100.0
    return max(0.0, min(1.0, value))


# A builder returns (summary, details, reasoning_steps).
BuildResult = tuple[str, list[str], list[ReasoningStep]]
Builder = Callable[[ViolationEvent, float], BuildResult]


def _detected(event: ViolationEvent, *labels: str) -> Optional[Detection]:
    """First detection whose label matches any of `labels` (case-insensitive)."""
    wanted = {label.lower() for label in labels}
    for det in event.detections:
        if det.label.lower() in wanted:
            return det
    return None


def _conf_line(conf: float) -> str:
    return f"Confidence Score: {conf:.0%}."


def _helmet(event: ViolationEvent, conf: float) -> BuildResult:
    rider = _detected(event, "Rider", "Driver")
    rider_name = rider.label if rider else "rider"
    summary = f"A {rider_name.lower()} was detected riding without a helmet."
    details = [f"Road user: {rider_name}.", "Helmet status: No Helmet.",
               _conf_line(conf)]
    steps = [
        ReasoningStep(order=1, statement=f"A {rider_name.lower()} was detected "
                      "on a two-wheeler.",
                      confidence=rider.confidence if rider else None),
        ReasoningStep(order=2, statement="No helmet was detected on the "
                      "rider's head region.", confidence=conf),
        ReasoningStep(order=3, statement="Riding without a helmet violates "
                      "mandatory safety rules.", confidence=conf),
    ]
    return summary, details, steps


def _triple_riding(event: ViolationEvent, conf: float) -> BuildResult:
    riders = [d for d in event.detections
              if d.label.lower() in ("rider", "passenger")]
    count = max(len(riders), 3)
    summary = f"{count} people were detected on a single two-wheeler."
    details = [f"Occupants detected: {count}.", _conf_line(conf)]
    steps = [
        ReasoningStep(order=1, statement="A two-wheeler was detected.",
                      confidence=conf),
        ReasoningStep(order=2, statement=f"{count} occupants were detected on "
                      "it, exceeding the limit of two.", confidence=conf),
        ReasoningStep(order=3, statement="Carrying more than two persons "
                      "constitutes triple riding.", confidence=conf),
    ]
    return summary, details, steps


def _seatbelt(event: ViolationEvent, conf: float) -> BuildResult:
    occupant = _detected(event, "Driver", "Passenger")
    name = occupant.label if occupant else "driver"
    summary = f"The {name.lower()} was detected without a seatbelt."
    details = [f"Occupant: {name}.", "Seatbelt status: No Seatbelt.",
               _conf_line(conf)]
    steps = [
        ReasoningStep(order=1, statement=f"A {name.lower()} was detected in "
                      "the vehicle.",
                      confidence=occupant.confidence if occupant else None),
        ReasoningStep(order=2, statement="No seatbelt was detected across the "
                      "occupant's torso.", confidence=conf),
        ReasoningStep(order=3, statement="Driving without a seatbelt violates "
                      "safety regulations.", confidence=conf),
    ]
    return summary, details, steps


def _stop_line(event: ViolationEvent, conf: float) -> BuildResult:
    distance = event.raw_output.get("distance_crossed")
    summary = "The vehicle stopped beyond the designated stop line."
    details: list[str] = []
    if distance is not None:
        details.append(f"Vehicle crossed the stop line by {distance}.")
    details.append(_conf_line(conf))
    steps = [
        ReasoningStep(order=1, statement="The stop line and the vehicle were "
                      "both detected.", confidence=conf),
        ReasoningStep(order=2, statement="The vehicle's position was beyond "
                      "the stop line.", confidence=conf),
        ReasoningStep(order=3, statement="Halting past the stop line is a "
                      "stop-line violation.", confidence=conf),
    ]
    return summary, details, steps


def _red_light(event: ViolationEvent, conf: float) -> BuildResult:
    distance = event.raw_output.get("distance_crossed")
    summary = ("The vehicle crossed the designated stop line while the traffic "
               "signal was red.")
    details: list[str] = []
    if distance is not None:
        details.append(f"Vehicle crossed the stop line by {distance}.")
    details.append(_conf_line(conf))
    steps = [
        ReasoningStep(order=1, statement="The traffic signal was detected as "
                      "red.", confidence=conf),
        ReasoningStep(order=2, statement="The vehicle crossed the stop line "
                      "while the signal was red.", confidence=conf),
        ReasoningStep(order=3, statement="Crossing on a red signal is a "
                      "red-light violation.", confidence=conf),
    ]
    return summary, details, steps


def _wrong_side(event: ViolationEvent, conf: float) -> BuildResult:
    summary = "The vehicle was detected travelling against the legal direction."
    details = ["Direction: against permitted flow.", _conf_line(conf)]
    steps = [
        ReasoningStep(order=1, statement="The vehicle's heading was detected.",
                      confidence=conf),
        ReasoningStep(order=2, statement="The heading opposes the permitted "
                      "flow for the lane.", confidence=conf),
        ReasoningStep(order=3, statement="Travelling against traffic is "
                      "wrong-side driving.", confidence=conf),
    ]
    return summary, details, steps


def _illegal_parking(event: ViolationEvent, conf: float) -> BuildResult:
    zone = event.raw_output.get("zone", "a no-parking zone")
    summary = f"The vehicle was detected parked in {zone}."
    details = [f"Zone: {zone}.", _conf_line(conf)]
    steps = [
        ReasoningStep(order=1, statement="A stationary vehicle was detected.",
                      confidence=conf),
        ReasoningStep(order=2, statement=f"It was located within {zone}.",
                      confidence=conf),
        ReasoningStep(order=3, statement="Parking here is an illegal-parking "
                      "violation.", confidence=conf),
    ]
    return summary, details, steps


VIOLATION_BUILDERS: dict[ViolationType, Builder] = {
    ViolationType.HELMET: _helmet,
    ViolationType.TRIPLE_RIDING: _triple_riding,
    ViolationType.SEATBELT: _seatbelt,
    ViolationType.STOP_LINE: _stop_line,
    ViolationType.RED_LIGHT: _red_light,
    ViolationType.WRONG_SIDE: _wrong_side,
    ViolationType.ILLEGAL_PARKING: _illegal_parking,
}


class ExplanationEngine:
    def __init__(self, settings: Settings, storage: StorageBackend) -> None:
        self.settings = settings
        self.storage = storage

    def explain(self, event: ViolationEvent) -> EvidenceRecord:
        conf = normalize_confidence(event.confidence)
        builder = VIOLATION_BUILDERS[event.violation_type]
        summary, details, steps = builder(event, conf)

        # Final reasoning step records the HITL decision.
        requires_review = (conf * 100.0) < self.settings.auto_approval_threshold
        review_status = (
            ReviewStatus.MANUAL_REVIEW if requires_review
            else ReviewStatus.AUTO_APPROVED
        )
        steps.append(
            ReasoningStep(
                order=len(steps) + 1,
                statement=(
                    f"Confidence {conf:.0%} is below the "
                    f"{self.settings.auto_approval_threshold:.0f}% threshold; "
                    "routed for manual review."
                    if requires_review else
                    f"Confidence {conf:.0%} meets the "
                    f"{self.settings.auto_approval_threshold:.0f}% threshold; "
                    "auto-approved."
                ),
                confidence=conf,
            )
        )

        proof_uri = None
        if event.annotate_image and event.image_uri:
            proof_uri = self._make_proof(event)

        return EvidenceRecord(
            event_id=event.event_id,
            violation_type=event.violation_type.value,
            generated_report=GeneratedReport(
                summary=summary,
                details=details,
                violation_type=event.violation_type.value,
            ),
            reasoning_chain=steps,
            confidence=conf,
            review_status=review_status,
            requires_human_review=requires_review,
            vehicle_number=event.vehicle_number,
            location=event.location,
            proof_image_uri=proof_uri,
            timestamp=event.timestamp or datetime.now(timezone.utc),
            raw_output=event.raw_output,
        )

    def _make_proof(self, event: ViolationEvent) -> Optional[str]:
        regions = [
            {
                "label": d.label,
                **(d.box or {}),
            }
            for d in event.detections
            if d.box
        ]
        if not regions:
            return None
        try:
            source = self.storage.load(event.image_uri)  # type: ignore[arg-type]
        except (FileNotFoundError, OSError):
            return None
        annotated = annotate(source, regions)
        key = f"{event.event_id}.jpg"
        return self.storage.save(key, annotated, content_type="image/jpeg")
