"""One-off: initialize the MongoDB database, collection, and indexes.

Usage (PowerShell), from the repo root::

    $env:MONGO_URI = "mongodb+srv://..."
    .venv/Scripts/python.exe scripts/init_mongo.py

Reads MONGO_URI / MONGO_DB / MONGO_COLLECTION from the environment (or .env via
the app settings). Safe to run repeatedly; index creation is idempotent.
"""

from __future__ import annotations

import sys

from pymongo import ASCENDING, DESCENDING, MongoClient

# Allow running from the repo root without installing the package.
sys.path.insert(0, ".")

from app.config import get_settings  # noqa: E402


def main() -> int:
    settings = get_settings()
    print(f"Connecting to MongoDB db='{settings.mongo_db}' "
          f"collection='{settings.mongo_collection}' ...")

    client = MongoClient(settings.mongo_uri, tz_aware=True,
                         serverSelectionTimeoutMS=10000)
    # Force a round-trip so we fail fast on bad credentials / network.
    client.admin.command("ping")
    print("Ping OK — cluster reachable.")

    db = client[settings.mongo_db]
    # Creating the collection materializes the database.
    existing = db.list_collection_names()
    if settings.mongo_collection not in existing:
        db.create_collection(settings.mongo_collection)
        print(f"Created collection '{settings.mongo_collection}'.")
    else:
        print(f"Collection '{settings.mongo_collection}' already exists.")

    collection = db[settings.mongo_collection]
    collection.create_index([("violation_type", ASCENDING)])
    collection.create_index([("review_status", ASCENDING)])
    collection.create_index([("created_at", DESCENDING)])
    collection.create_index([("vehicle_number", ASCENDING)])
    print("Indexes ensured: violation_type, review_status, created_at, "
          "vehicle_number.")

    print("\nDatabases now on cluster:", client.list_database_names())
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
