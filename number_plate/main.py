import json

from inference.pipeline import NumberPlatePipeline
from inference.config import INPUT_FOLDER, OUTPUT_FOLDER


def main():

    pipeline = NumberPlatePipeline()

    images = sorted([
        file for file in INPUT_FOLDER.iterdir()
        if file.suffix.lower() in [".jpg", ".jpeg", ".png"]
    ])

    if not images:
        print("No images found in input_images folder.")
        return

    for image_path in images:

        print("=" * 70)
        print(f"Processing : {image_path.name}")

        result = pipeline.process(image_path)

        print(json.dumps(result, indent=4))

        json_path = OUTPUT_FOLDER / f"{image_path.stem}.json"

        with open(json_path, "w") as file:
            json.dump(result, file, indent=4)

        print(f"JSON Saved : {json_path}")

    print("\n✅ All Images Processed Successfully.")


if __name__ == "__main__":
    main()