from inference.detector import NumberPlateDetector
from inference.ocr_utils import OCRReader
from inference.validator import PlateValidator
from inference.annotator import Annotator


class NumberPlatePipeline:

    def __init__(self):

        self.detector = NumberPlateDetector()

        self.ocr = OCRReader()

        self.validator = PlateValidator()

        self.annotator = Annotator()   # <-- Missing

    def process(self, image_path):

        detections = self.detector.detect(image_path)

        results = []

        for detection in detections:

            crop_path = detection["crop_path"]

            ocr = self.ocr.read(crop_path)

            validation = self.validator.validate(
                ocr["text"]
            )

            results.append({

                "crop_path": str(crop_path),

                "bbox": detection["bbox"],

                "detection_confidence": round(
                    detection["confidence"], 3
                ),

                "ocr_confidence": ocr["confidence"],

                "number_plate": validation["plate"],

                "valid": validation["valid"],

                "state": validation["state"]

            })

        annotated_path = self.annotator.save_result(
            image_path,
            results
        )

        print(f"Annotated Image Saved : {annotated_path}")

        return results