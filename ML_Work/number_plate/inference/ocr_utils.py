import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import easyocr
import cv2
import re

from ML_Work.number_plate.inference.config import OCR_LANGUAGE


class OCRReader:

    def __init__(self):
        self.reader = easyocr.Reader(OCR_LANGUAGE)

    def read(self, image_path):

        image = cv2.imread(str(image_path))

        if image is None:
            raise Exception(f"Unable to read image: {image_path}")

        results = self.reader.readtext(image)

        texts = []
        confidences = []

        for result in results:

            text = result[1].upper()

            text = re.sub(r'[^A-Z0-9]', '', text)

            if text.startswith("IND"):
                text = text[3:]

            if text != "":
                texts.append(text)
                confidences.append(result[2])

        final_text = "".join(texts)

        confidence = 0

        if len(confidences) > 0:
            confidence = round(sum(confidences) / len(confidences), 3)

        return {
            "text": final_text,
            "confidence": confidence
        }