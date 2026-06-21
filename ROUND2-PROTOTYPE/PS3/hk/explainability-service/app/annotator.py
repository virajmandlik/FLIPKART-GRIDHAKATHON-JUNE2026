"""Annotated proof image generation using Pillow.

Draws labeled bounding boxes onto the source image to produce visual evidence.
Each region is a dict with pixel coordinates and an optional label, e.g.:

    {"label": "No Helmet", "x": 10, "y": 10, "width": 50, "height": 50}
"""

from __future__ import annotations

import io
from typing import Any

from PIL import Image, ImageDraw, ImageFont

# Color cycle for distinct boxes (RGB).
_PALETTE = [
    (220, 38, 38),   # red
    (37, 99, 235),   # blue
    (217, 119, 6),   # amber
    (5, 150, 105),   # green
    (124, 58, 237),  # violet
]


def _load_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()


def annotate(image_bytes: bytes, regions: list[dict[str, Any]]) -> bytes:
    """Return JPEG bytes of the source image with labeled boxes drawn on it."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    draw = ImageDraw.Draw(image)
    font = _load_font(max(14, image.width // 60))

    for idx, region in enumerate(regions):
        try:
            x0 = float(region["x"])
            y0 = float(region["y"])
            x1 = x0 + float(region["width"])
            y1 = y0 + float(region["height"])
        except (KeyError, TypeError, ValueError):
            continue  # skip malformed regions rather than fail the whole proof

        color = _PALETTE[idx % len(_PALETTE)]
        draw.rectangle([x0, y0, x1, y1], outline=color, width=3)

        label = str(region.get("label", "")).strip()
        if not label:
            continue
        text_box = draw.textbbox((0, 0), label, font=font)
        tw, th = text_box[2] - text_box[0], text_box[3] - text_box[1]
        ly = y0 - th - 6 if y0 - th - 6 > 0 else y1 + 2
        draw.rectangle([x0, ly, x0 + tw + 6, ly + th + 6], fill=color)
        draw.text((x0 + 3, ly + 3), label, fill=(255, 255, 255), font=font)

    out = io.BytesIO()
    image.save(out, format="JPEG", quality=90)
    return out.getvalue()
