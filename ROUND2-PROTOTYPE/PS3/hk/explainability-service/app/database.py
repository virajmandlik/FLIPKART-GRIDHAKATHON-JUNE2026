"""MongoDB client and collection access.

The MongoClient is created at module scope so warm Lambda containers reuse the
connection across invocations. PyMongo manages its own connection pool, which
is the recommended pattern for Lambda.
"""

from __future__ import annotations

from functools import lru_cache

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection

from app.config import get_settings

settings = get_settings()

# Module-scope client: reused by warm Lambda invocations.
_client: MongoClient = MongoClient(settings.mongo_uri, tz_aware=True)


@lru_cache
def get_collection() -> Collection:
    """Return the explanation records collection, ensuring indexes exist."""
    collection = _client[settings.mongo_db][settings.mongo_collection]
    _ensure_indexes(collection)
    return collection


def _ensure_indexes(collection: Collection) -> None:
    # prediction_id is our logical primary key (stored as _id), so no extra
    # unique index is needed. These support the common query patterns.
    collection.create_index([("violation_type", ASCENDING)])
    collection.create_index([("created_at", DESCENDING)])


def init_db() -> None:
    """Idempotent setup; cheap on warm containers."""
    get_collection()
