"""Evidence annotation + DPDP-style privacy masking using Pillow only.

No OpenCV dependency (keeps the demo installable on any Python, incl. 3.14,
and deployable on Streamlit Community Cloud with no system libs).
"""
from __future__ import annotations

from PIL import Image, ImageDraw, ImageFont, ImageFilter

from .detection import SceneResult, Detection, Face, VIOLATION_LABELS

# Colour per violator state
_VIOLATOR_COLOR = (255, 71, 87)     # red
_OK_COLOR = (46, 213, 115)          # green
_PLATE_COLOR = (255, 194, 0)        # amber
_FACE_BLUR_BORDER = (90, 200, 250)  # cyan


def _abs(bbox, w, h):
    x, y, bw, bh = bbox
    return int(x * w), int(y * h), int((x + bw) * w), int((y + bh) * h)


def _load_font(size: int):
    for name in ("arial.ttf", "DejaVuSans-Bold.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _text_size(draw, text, font):
    try:
        l, t, r, b = draw.textbbox((0, 0), text, font=font)
        return r - l, b - t
    except Exception:
        return draw.textlength(text, font=font), size_fallback(font)


def size_fallback(font):
    try:
        return font.size
    except Exception:
        return 12


def _label(draw, xy, text, font, bg):
    x, y = xy
    tw, th = _text_size(draw, text, font)
    pad = 4
    y_box = max(0, y - th - 2 * pad)
    draw.rectangle([x, y_box, x + tw + 2 * pad, y_box + th + 2 * pad], fill=bg)
    draw.text((x + pad, y_box + pad), text, fill=(0, 0, 0), font=font)


def apply_privacy_blur(img: Image.Image, scene: SceneResult,
                       blur_faces: bool = True,
                       blur_nonviolator_plates: bool = True) -> tuple[Image.Image, int, int]:
    """Blur faces and non-violator plates (data minimisation, DPDP Rule 6).

    Returns (image, faces_blurred, plates_blurred).
    """
    out = img.convert("RGB").copy()
    w, h = out.size
    faces_blurred = 0
    plates_blurred = 0

    def blur_region(box):
        x1, y1, x2, y2 = box
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        if x2 <= x1 or y2 <= y1:
            return False
        region = out.crop((x1, y1, x2, y2))
        radius = max(6, (x2 - x1) // 4)
        region = region.filter(ImageFilter.GaussianBlur(radius))
        out.paste(region, (x1, y1))
        return True

    if blur_faces:
        for f in scene.faces:
            if blur_region(_abs(f.bbox, w, h)):
                faces_blurred += 1

    if blur_nonviolator_plates:
        for d in scene.detections:
            if (not d.is_violator) and d.plate_text:
                # approximate plate region at lower-centre of the vehicle bbox
                x, y, bw, bh = d.bbox
                pbox = (x + bw * 0.25, y + bh * 0.72, bw * 0.5, bh * 0.18)
                if blur_region(_abs(pbox, w, h)):
                    plates_blurred += 1

    return out, faces_blurred, plates_blurred


def annotate(img: Image.Image, scene: SceneResult, show_labels: bool = True) -> Image.Image:
    """Draw detection boxes, violation labels, and violator plate boxes."""
    out = img.convert("RGB").copy()
    w, h = out.size
    draw = ImageDraw.Draw(out)
    font = _load_font(max(14, w // 55))
    small = _load_font(max(11, w // 75))

    for d in scene.detections:
        x1, y1, x2, y2 = _abs(d.bbox, w, h)
        color = _VIOLATOR_COLOR if d.is_violator else _OK_COLOR
        draw.rectangle([x1, y1, x2, y2], outline=color, width=max(2, w // 320))
        if show_labels:
            tag = f"{d.obj_class}"
            if d.is_violator:
                tag = f"{VIOLATION_LABELS.get(d.violation, d.violation)}  {d.confidence:.0%}"
            _label(draw, (x1, y1), tag, font, color)

        # violator plate box
        if d.is_violator and d.plate_text:
            px, py, pw, ph = (d.bbox[0] + d.bbox[2] * 0.25, d.bbox[1] + d.bbox[3] * 0.72,
                              d.bbox[2] * 0.5, d.bbox[3] * 0.18)
            pb = _abs((px, py, pw, ph), w, h)
            draw.rectangle(pb, outline=_PLATE_COLOR, width=max(2, w // 360))
            if show_labels:
                _label(draw, (pb[0], pb[1]), d.plate_text, small, _PLATE_COLOR)

        # headwear marker (helmet / pagdi)
        if d.head_bbox and show_labels:
            hb = _abs(d.head_bbox, w, h)
            hw = d.headwear or "?"
            hcolor = _OK_COLOR if hw in ("Helmet", "Pagdi") else _VIOLATOR_COLOR
            draw.rectangle(hb, outline=hcolor, width=max(1, w // 480))

    return out
