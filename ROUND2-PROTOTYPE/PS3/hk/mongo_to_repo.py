"""Restore the repository from MongoDB onto this machine.

Reads documents from the `repo_files` collection (written by
scripts/repo_to_mongo.py) and recreates the files under --dest, verifying each
file's SHA-256.

Usage (PowerShell)::

    $env:MONGO_URI = "mongodb+srv://..."
    $env:MONGO_DB  = "violation_detection"
    python scripts/mongo_to_repo.py --dest ./explainability-service

Note: this script only needs `pymongo` (and the MONGO_URI). It does not import
the app, so it runs before you set up the virtualenv. Install pymongo first:
    pip install pymongo
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import os

from pymongo import MongoClient

REPO_FILES_COLLECTION = "repo_files"


def main() -> int:
    parser = argparse.ArgumentParser(description="Restore repo from MongoDB.")
    parser.add_argument("--dest", default="explainability-service",
                        help="Destination folder (default: ./explainability-service)")
    parser.add_argument("--mongo-uri", default=os.environ.get("MONGO_URI"),
                        help="MongoDB URI (or set MONGO_URI env var)")
    parser.add_argument("--mongo-db", default=os.environ.get("MONGO_DB",
                        "violation_detection"), help="Database name")
    args = parser.parse_args()

    if not args.mongo_uri:
        print("ERROR: provide --mongo-uri or set the MONGO_URI env var.")
        return 1

    dest = os.path.abspath(args.dest)
    print(f"Restoring into: {dest}")
    print(f"<- MongoDB db='{args.mongo_db}' "
          f"collection='{REPO_FILES_COLLECTION}'")

    client = MongoClient(args.mongo_uri, tz_aware=True,
                         serverSelectionTimeoutMS=10000)
    client.admin.command("ping")
    collection = client[args.mongo_db][REPO_FILES_COLLECTION]

    total = collection.count_documents({})
    if total == 0:
        print("No files found in repo_files. Did you run repo_to_mongo.py?")
        return 1

    restored = 0
    failed = 0
    for doc in collection.find({}):
        rel_path = doc["_id"]
        raw = base64.b64decode(doc["content_b64"])

        # Integrity check.
        digest = hashlib.sha256(raw).hexdigest()
        if digest != doc.get("sha256"):
            print(f"  ! CHECKSUM MISMATCH: {rel_path} (skipped)")
            failed += 1
            continue

        out_path = os.path.join(dest, rel_path.replace("/", os.sep))
        os.makedirs(os.path.dirname(out_path) or dest, exist_ok=True)
        with open(out_path, "wb") as fh:
            fh.write(raw)
        restored += 1
        print(f"  + {rel_path} ({len(raw)} bytes)")

    print(f"\nRestored {restored} file(s); {failed} failed.")
    if restored:
        print("\nNext steps on this machine:")
        print("  cd " + args.dest)
        print("  py -3 -m venv .venv")
        print("  .venv\\Scripts\\activate")
        print("  pip install -r requirements.txt")
        print("  copy .env.example .env   # then add MONGO_URI + MONGO_DB")
        print("  pytest -q")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
