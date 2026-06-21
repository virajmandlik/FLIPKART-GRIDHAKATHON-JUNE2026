import cv2
import os
from ultralytics import YOLO

from inference.config import (
    NUMBER_PLATE_MODEL,
    CONFIDENCE_THRESHOLD,
    CROPPED_FOLDER
)


class NumberPlateDetector:

    def __init__(self):
        # Load trained model
        self.model = YOLO(str(NUMBER_PLATE_MODEL))

    def detect(self, image_path):

        # Read image
        image = cv2.imread(str(image_path))

        if image is None:
            raise Exception(f"Unable to read image: {image_path}")

        # Create cropped plates folder if not exists
        CROPPED_FOLDER.mkdir(parents=True, exist_ok=True)

        # Image name without extension
        image_name = os.path.splitext(os.path.basename(str(image_path)))[0]

        # Run inference
        results = self.model.predict(
            source=image,
            conf=CONFIDENCE_THRESHOLD,
            verbose=False
        )

        detections = []
        plate_index = 1

        for result in results:

            for box in result.boxes:

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                confidence = float(box.conf[0])

                # Crop number plate
                crop = image[y1:y2, x1:x2]

                # Save cropped image
                crop_name = f"{image_name}_plate_{plate_index}.jpg"
                crop_path = CROPPED_FOLDER / crop_name

                cv2.imwrite(str(crop_path), crop)

                detections.append({
                    "crop_path": crop_path,      # Path object
                    "bbox": [x1, y1, x2, y2],
                    "confidence": confidence
                })

                plate_index += 1

        return detections