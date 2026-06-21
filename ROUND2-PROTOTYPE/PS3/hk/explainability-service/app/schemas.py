"""API contract for the Explainability Service.

Position in the pipeline (Violation Detection AI):

    Violation Intelligence Engine ─▶ Explainability Service ─▶ Evidence Generator

Input is a *violation event* (violation type + confidence + supporting
detections + plate + location). Output is an evidence record containing a
human-readable reasoning chain, a HITL review decision, and everything the
Evidence Generator needs to assemble a challan.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ViolationType(str, Enum):
    """The seven violations supported by the Violation Intelligence Engine."""

    HELMET = "Helmet Non-Compliance"
    TRIPLE_RIDING = "Triple Riding"
    SEATBELT = "Seatbelt Non-Compliance"
    STOP_LINE = "Stop-Line Violation"
    RED_LIGHT = "Red-Light Violation"
    WRONG_SIDE = "Wrong-Side Driving"
    ILLEGAL_PARKING = "Illegal Parking"


class ReviewStatus(str, Enum):
    AUTO_APPROVED = "auto_approved"
    MANUAL_REVIEW = "manual_review"


class Detection(BaseModel):
    """A single object detected upstream (YOLO / RT-DETR), optionally boxed."""

    label: str = Field(..., description="e.g. 'Rider', 'No Helmet', 'Stop Line'")
    confidence: float = Field(..., ge=0, le=1, description="Detector score, 0-1")
    box: Optional[dict[str, float]] = Field(
        None, description="Pixel box: {x, y, width, height}"
    )


class ReasoningStep(BaseModel):
    """One step in the human-readable reasoning chain."""

    order: int
    statement: str
    confidence: Optional[float] = Field(None, ge=0, le=1)


class ViolationEvent(BaseModel):
    """Input: one violation flagged by the Violation Intelligence Engine."""

    violation_type: ViolationType
    confidence: float | str = Field(
        ..., description="Overall confidence (percent 0-100 or fraction 0-1)"
    )
    detections: list[Detection] = Field(
        default_factory=list,
        description="Supporting detections behind this violation",
    )
    vehicle_number: Optional[str] = Field(
        None, description="Plate from License Plate Recognition"
    )
    location: Optional[str] = Field(None, description="Camera/junction location")
    image_uri: Optional[str] = Field(
        None, description="Enhanced source image (s3:// or local path)"
    )
    raw_output: dict[str, Any] = Field(
        default_factory=dict,
        description="Original model payload, kept for audit/replay",
    )
    event_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique id for this event; generated if not supplied",
    )
    timestamp: Optional[datetime] = Field(
        None, description="When the violation occurred; defaults to now"
    )

    annotate_image: bool = Field(
        False, description="Generate an annotated proof image from detections"
    )
    persist: bool = Field(True, description="Persist the evidence record")


class GeneratedReport(BaseModel):
    """Human-readable report block."""

    summary: str
    details: list[str] = Field(default_factory=list)
    violation_type: str


class EvidenceRecord(BaseModel):
    """Output: full record consumed by the Evidence Generator + dashboard."""

    event_id: str
    violation_type: str
    generated_report: GeneratedReport
    reasoning_chain: list[ReasoningStep]
    confidence: float = Field(..., ge=0, le=1, description="Normalized 0-1")
    review_status: ReviewStatus
    requires_human_review: bool

    # Evidence Generator fields.
    vehicle_number: Optional[str] = None
    location: Optional[str] = None
    proof_image_uri: Optional[str] = None
    timestamp: datetime
    raw_output: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
