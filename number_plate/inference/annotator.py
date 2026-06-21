import cv2
from pathlib import Path

from inference.config import OUTPUT_FOLDER


class Annotator:

    def __init__(self):
        OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

    def save_result(self, image_path, results):

        image = cv2.imread(str(image_path))

        if image is None:
            raise Exception(f"Unable to read image: {image_path}")

        for result in results:

            x1, y1, x2, y2 = result["bbox"]

            plate = result["number_plate"]

            confidence = result["detection_confidence"]

            color = (0, 255, 0) if result["valid"] else (0, 0, 255)

            # Draw bounding box
            cv2.rectangle(
                image,
                (x1, y1),
                (x2, y2),
                color,
                2
            )

            # Label
            label = f"{plate} | {confidence:.2f}"

            cv2.putText(
                image,
                label,
                (x1, max(y1 - 10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2
            )

        output_name = Path(image_path).stem + "_result.jpg"

        output_path = OUTPUT_FOLDER / output_name

        cv2.imwrite(str(output_path), image)

        return output_path