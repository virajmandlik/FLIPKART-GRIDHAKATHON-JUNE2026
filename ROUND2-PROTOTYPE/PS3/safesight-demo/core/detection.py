"""Simulated detection layer (PROTOTYPE).

In production this is RT-DETRv2-S (Apache-2.0) fine-tuned on UVH-26, followed by
BoT-SORT tracking and rule/geometry violation logic. For the hackathon demo we
return deterministic, pre-defined detections so the workflow is bulletproof and
runs with zero GPU / zero model weights.

Detections use RELATIVE coordinates (0..1) so they scale to any image size.
bbox = (x, y, w, h) as fractions of width/height.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field, asdict
from typing import Literal

ViolationType = Literal[
    "NO_HELMET", "TRIPLE_RIDING", "NO_SEATBELT", "WRONG_SIDE",
    "STOP_LINE", "RED_LIGHT", "ILLEGAL_PARKING", "NONE",
]

VIOLATION_LABELS: dict[str, str] = {
    "NO_HELMET": "Helmet non-compliance",
    "TRIPLE_RIDING": "Triple riding",
    "NO_SEATBELT": "Seatbelt non-compliance",
    "WRONG_SIDE": "Wrong-side driving",
    "STOP_LINE": "Stop-line violation",
    "RED_LIGHT": "Red-light violation",
    "ILLEGAL_PARKING": "Illegal parking",
    "NONE": "No violation",
}


@dataclass
class Detection:
    det_id: str
    obj_class: str                      # 2W, auto, car, bus, truck, person
    bbox: tuple[float, float, float, float]
    violation: ViolationType
    confidence: float
    is_violator: bool
    plate_text: str | None = None
    plate_conf: float | None = None
    head_bbox: tuple[float, float, float, float] | None = None  # for helmet/pagdi
    headwear: str | None = None         # "Helmet" | "Pagdi" | "None"


@dataclass
class Face:
    bbox: tuple[float, float, float, float]


@dataclass
class SceneResult:
    detections: list[Detection] = field(default_factory=list)
    faces: list[Face] = field(default_factory=list)

    def violators(self) -> list[Detection]:
        return [d for d in self.detections if d.is_violator]


def _stable_rng(seed_text: str) -> float:
    """Deterministic 0..1 float from text (so uploaded images get stable mock output)."""
    h = hashlib.sha256(seed_text.encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def detect_uploaded(image_bytes: bytes) -> SceneResult:
    """Deterministic mock detection for an arbitrary uploaded image.

    Same image -> same detections (golden-path stability). We synthesise 1-2
    plausible violations positioned in the frame.
    """
    r = _stable_rng(hashlib.sha256(image_bytes).hexdigest())

    scenarios: list[SceneResult] = [
        SceneResult(
            detections=[
                Detection("d1", "2W", (0.34, 0.40, 0.20, 0.40), "NO_HELMET", 0.91, True,
                          plate_text="KA01AB1234", plate_conf=0.88,
                          head_bbox=(0.39, 0.40, 0.07, 0.10), headwear="None"),
                Detection("d2", "car", (0.62, 0.45, 0.30, 0.30), "NONE", 0.84, False,
                          plate_text="KA05MJ4521", plate_conf=0.81),
            ],
            faces=[Face((0.40, 0.41, 0.05, 0.07)), Face((0.70, 0.50, 0.05, 0.07))],
        ),
        SceneResult(
            detections=[
                Detection("d1", "2W", (0.30, 0.38, 0.26, 0.46), "TRIPLE_RIDING", 0.87, True,
                          plate_text="KA03CD5678", plate_conf=0.79,
                          head_bbox=(0.35, 0.38, 0.07, 0.10), headwear="Helmet"),
            ],
            faces=[Face((0.36, 0.39, 0.05, 0.07)), Face((0.44, 0.42, 0.05, 0.07)),
                   Face((0.50, 0.45, 0.05, 0.07))],
        ),
        SceneResult(
            detections=[
                Detection("d1", "car", (0.28, 0.42, 0.34, 0.34), "NO_SEATBELT", 0.82, True,
                          plate_text="22BH1234AA", plate_conf=0.90),
                Detection("d2", "auto", (0.66, 0.50, 0.24, 0.30), "NONE", 0.77, False,
                          plate_text="KA02EF9012", plate_conf=0.74),
            ],
            faces=[Face((0.38, 0.47, 0.05, 0.07))],
        ),
    ]
    return scenarios[int(r * len(scenarios)) % len(scenarios)]
