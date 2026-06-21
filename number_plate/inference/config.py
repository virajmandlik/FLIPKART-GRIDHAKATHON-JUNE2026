from pathlib import Path

# =====================================================
# Project Root
# =====================================================

ROOT = Path(__file__).resolve().parent.parent

# =====================================================
# Model
# =====================================================

NUMBER_PLATE_MODEL = ROOT / "models" / "best.pt"

# =====================================================
# Thresholds
# =====================================================

CONFIDENCE_THRESHOLD = 0.30

# =====================================================
# Folders
# =====================================================

INPUT_FOLDER = ROOT / "input_images"

CROPPED_FOLDER = ROOT / "cropped_plates"

OUTPUT_FOLDER = ROOT / "output"

# =====================================================
# Create Required Folders
# =====================================================

CROPPED_FOLDER.mkdir(parents=True, exist_ok=True)

OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

# =====================================================
# OCR Configuration
# =====================================================

OCR_LANGUAGE = ["en"]

# =====================================================
# Thresholds
# =====================================================

CONFIDENCE_THRESHOLD = 0.30