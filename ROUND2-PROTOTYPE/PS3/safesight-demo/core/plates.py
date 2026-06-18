"""Indian license-plate validation.

Real, production-grade logic (no mock): validates OCR output against the
Bharat (BH) series and the classic state RTO format, and normalises common
OCR confusions (O<->0, I<->1, etc.). This is the kind of post-processing that
lifts raw OCR accuracy in the Indian context.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Classic format: KA 01 AB 1234  (state[2] district[1-2] series[1-3 alpha] number[1-4])
CLASSIC_RE = re.compile(r"^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$")
# Bharat series: 22 BH 1234 AA  (year[2] 'BH' number[4] series[1-2 alpha])
BH_RE = re.compile(r"^\d{2}BH\d{4}[A-Z]{1,2}$")

VALID_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ", "HP",
    "HR", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP", "MZ",
    "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB",
}

# Common OCR confusions, applied position-aware in normalise().
_ALPHA_FIX = {"0": "O", "1": "I", "8": "B", "5": "S", "2": "Z", "6": "G"}
_DIGIT_FIX = {"O": "0", "I": "1", "B": "8", "S": "5", "Z": "2", "G": "6", "Q": "0"}


@dataclass
class PlateResult:
    raw: str
    normalised: str
    is_valid: bool
    plate_type: str  # "classic" | "bharat" | "unknown"
    state_code: str | None
    notes: str


def _clean(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (text or "").upper())


def _to_alpha(ch: str) -> str:
    return _ALPHA_FIX.get(ch, ch) if ch.isdigit() else ch


def _to_digit(ch: str) -> str:
    return _DIGIT_FIX.get(ch, ch) if not ch.isdigit() else ch


def _normalise_bh(s: str) -> str:
    """Coerce a likely Bharat plate (YY 'BH' NNNN AA) by position."""
    chars = list(s)
    n = len(chars)
    for i in (0, 1):                       # year -> digits
        if i < n:
            chars[i] = _to_digit(chars[i])
    for i in (4, 5, 6, 7):                 # serial -> digits
        if i < n:
            chars[i] = _to_digit(chars[i])
    for i in range(8, n):                  # suffix -> alpha
        chars[i] = _to_alpha(chars[i])
    return "".join(chars)


def normalise(text: str) -> str:
    """Structure-aware OCR fix for the classic format: SS DD L(1-3) N(1-4).

    Coerces state to alpha, district to digits, series to alpha, and the
    trailing registration number to digits, using position, not blind replace.
    """
    s = _clean(text)
    n = len(s)
    if n < 6 or n > 11:
        return s
    chars = list(s)
    chars[0], chars[1] = _to_alpha(chars[0]), _to_alpha(chars[1])

    # trailing registration number: up to 4 digit-like chars from the end
    i, count = n - 1, 0
    while i >= 2 and count < 4 and (chars[i].isdigit() or chars[i] in _DIGIT_FIX):
        chars[i] = _to_digit(chars[i])
        i -= 1
        count += 1
    number_start = i + 1

    # district: 1-2 digit-like chars right after the state code
    j, dcount = 2, 0
    while j < number_start and dcount < 2 and (chars[j].isdigit() or chars[j] in _DIGIT_FIX):
        chars[j] = _to_digit(chars[j])
        j += 1
        dcount += 1

    # series: everything between district and number -> alpha
    for k in range(j, number_start):
        chars[k] = _to_alpha(chars[k])
    return "".join(chars)


def validate(text: str) -> PlateResult:
    raw = _clean(text)

    # Bharat series is detected by the 'BH' marker at positions 3-4.
    if len(raw) >= 4 and raw[2:4] == "BH":
        bh = _normalise_bh(raw)
        if BH_RE.match(bh):
            return PlateResult(raw, bh, True, "bharat", None, "Valid Bharat (BH) series.")

    norm = normalise(raw)
    if CLASSIC_RE.match(norm):
        state = norm[:2]
        if state in VALID_STATE_CODES:
            return PlateResult(raw, norm, True, "classic", state,
                               f"Valid format; state={state}.")
        return PlateResult(raw, norm, False, "classic", state,
                           f"Format OK but '{state}' is not a known RTO state code.")

    return PlateResult(raw, norm, False, "unknown", None,
                       "Does not match classic or Bharat plate formats.")


def format_pretty(norm: str) -> str:
    """KA01AB1234 -> 'KA 01 AB 1234' for display."""
    m = re.match(r"^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$", norm)
    if m:
        return " ".join(m.groups())
    return norm
