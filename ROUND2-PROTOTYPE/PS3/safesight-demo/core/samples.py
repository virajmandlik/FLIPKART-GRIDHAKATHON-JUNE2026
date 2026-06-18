"""Self-contained synthetic 'CCTV scene' generator (Pillow).

We do NOT ship real traffic photos (copyright/privacy). Instead we render
schematic junction scenes so the demo is fully reproducible and legally clean.
Each sample maps to a fixed SceneResult so the workflow is deterministic.
"""
from __future__ import annotations

import io
from PIL import Image, ImageDraw, ImageFont

from .detection import (
    SceneResult, Detection, Face,
)

W, H = 960, 540


def _font(size: int):
    for name in ("arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _base_scene(title: str) -> Image.Image:
    img = Image.new("RGB", (W, H), (38, 42, 54))
    d = ImageDraw.Draw(img)
    # sky / background gradient-ish
    d.rectangle([0, 0, W, int(H * 0.45)], fill=(58, 64, 82))
    # road
    d.polygon([(0, H), (W, H), (int(W * 0.72), int(H * 0.45)),
               (int(W * 0.28), int(H * 0.45))], fill=(30, 32, 40))
    # lane dashes
    for i in range(6):
        y = int(H * 0.5) + i * 16
        cx = W // 2
        d.line([(cx, y), (cx, y + 9)], fill=(220, 220, 120), width=3)
    # stop line
    d.line([(int(W * 0.30), int(H * 0.52)), (int(W * 0.70), int(H * 0.52))],
           fill=(235, 235, 235), width=4)
    # header bar
    d.rectangle([0, 0, W, 26], fill=(14, 17, 23))
    d.text((8, 6), f"CAM {title}  |  SIMULATED FEED (prototype)", fill=(255, 194, 0),
           font=_font(14))
    return img


def _draw_vehicle(d: ImageDraw.ImageDraw, bbox, color, kind="car"):
    x1 = int(bbox[0] * W); y1 = int(bbox[1] * H)
    x2 = int((bbox[0] + bbox[2]) * W); y2 = int((bbox[1] + bbox[3]) * H)
    if kind == "2W":
        # two wheels + rider blob
        r = (y2 - y1) // 6
        d.ellipse([x1, y2 - 2 * r, x1 + 2 * r, y2], fill=(20, 20, 20))
        d.ellipse([x2 - 2 * r, y2 - 2 * r, x2, y2], fill=(20, 20, 20))
        d.rectangle([x1 + r, y1 + (y2 - y1) // 3, x2 - r, y2 - r], fill=color)
        d.ellipse([(x1 + x2) // 2 - r, y1, (x1 + x2) // 2 + r, y1 + 2 * r],
                  fill=(225, 190, 160))  # head
    else:
        d.rounded_rectangle([x1, y1, x2, y2], radius=10, fill=color)
        d.rectangle([x1 + (x2 - x1) // 5, y1 + (y2 - y1) // 6,
                     x2 - (x2 - x1) // 5, y1 + (y2 - y1) // 2],
                    fill=(120, 170, 210))  # windshield
        # plate strip
        d.rectangle([(x1 + x2) // 2 - 26, y2 - 14, (x1 + x2) // 2 + 26, y2 - 2],
                    fill=(245, 245, 245))


# Fixed scenes (image + ground-truth-ish SceneResult) -------------------------

def _scene_helmet() -> tuple[Image.Image, SceneResult]:
    img = _base_scene("KA-MGRoad-07")
    d = ImageDraw.Draw(img)
    _draw_vehicle(d, (0.34, 0.40, 0.20, 0.40), (210, 80, 70), "2W")
    _draw_vehicle(d, (0.62, 0.45, 0.30, 0.30), (70, 110, 180), "car")
    scene = SceneResult(
        detections=[
            Detection("d1", "2W", (0.34, 0.40, 0.20, 0.40), "NO_HELMET", 0.91, True,
                      plate_text="KA01AB1234", plate_conf=0.88,
                      head_bbox=(0.42, 0.40, 0.06, 0.10), headwear="None"),
            Detection("d2", "car", (0.62, 0.45, 0.30, 0.30), "NONE", 0.84, False,
                      plate_text="KA05MJ4521", plate_conf=0.81),
        ],
        faces=[Face((0.42, 0.40, 0.06, 0.08)), Face((0.70, 0.50, 0.05, 0.07))],
    )
    return img, scene


def _scene_triple() -> tuple[Image.Image, SceneResult]:
    img = _base_scene("KA-Silk-12")
    d = ImageDraw.Draw(img)
    _draw_vehicle(d, (0.30, 0.38, 0.26, 0.46), (200, 120, 60), "2W")
    scene = SceneResult(
        detections=[
            Detection("d1", "2W", (0.30, 0.38, 0.26, 0.46), "TRIPLE_RIDING", 0.87, True,
                      plate_text="KA03CD5678", plate_conf=0.79,
                      head_bbox=(0.40, 0.38, 0.06, 0.10), headwear="Helmet"),
        ],
        faces=[Face((0.40, 0.39, 0.05, 0.07)), Face((0.46, 0.42, 0.05, 0.07))],
    )
    return img, scene


def _scene_seatbelt() -> tuple[Image.Image, SceneResult]:
    img = _base_scene("KA-KRPuram-03")
    d = ImageDraw.Draw(img)
    _draw_vehicle(d, (0.28, 0.42, 0.34, 0.34), (90, 90, 100), "car")
    _draw_vehicle(d, (0.66, 0.50, 0.24, 0.30), (210, 200, 70), "auto")
    scene = SceneResult(
        detections=[
            Detection("d1", "car", (0.28, 0.42, 0.34, 0.34), "NO_SEATBELT", 0.82, True,
                      plate_text="22BH1234AA", plate_conf=0.90),
            Detection("d2", "auto", (0.66, 0.50, 0.24, 0.30), "NONE", 0.77, False,
                      plate_text="KA02EF9012", plate_conf=0.74),
        ],
        faces=[Face((0.40, 0.47, 0.05, 0.07))],
    )
    return img, scene


SAMPLES = {
    "Helmet non-compliance (M.G. Road)": ("KA-MGRoad-07", "M.G. Road Jn", _scene_helmet),
    "Triple riding (Silk Board)": ("KA-Silk-12", "Silk Board Jn", _scene_triple),
    "No seatbelt + Bharat plate (KR Puram)": ("KA-KRPuram-03", "KR Puram Jn", _scene_seatbelt),
}


def get_sample(name: str) -> tuple[Image.Image, SceneResult, str, str]:
    cam, loc, fn = SAMPLES[name]
    img, scene = fn()
    return img, scene, cam, loc


def image_to_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
