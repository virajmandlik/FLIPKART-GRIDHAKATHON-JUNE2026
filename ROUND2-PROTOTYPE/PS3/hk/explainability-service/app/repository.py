"""Persistence helpers for evidence records (MongoDB).

Documents use `event_id` as the Mongo `_id`, so writes are idempotent upserts
keyed on the violation event.
"""

from __future__ import annotations

from pymongo import DESCENDING
from pymongo.collection import Collection

from app.schemas import EvidenceRecord


def _to_document(record: EvidenceRecord) -> dict:
    doc = record.model_dump(mode="json")
    doc["_id"] = doc["event_id"]
    return doc


def _to_record(doc: dict) -> EvidenceRecord:
    doc = {k: v for k, v in doc.items() if k != "_id"}
    return EvidenceRecord.model_validate(doc)


def save_record(collection: Collection, record: EvidenceRecord) -> None:
    """Upsert the evidence record, keyed on event_id."""
    doc = _to_document(record)
    collection.replace_one({"_id": doc["_id"]}, doc, upsert=True)


def get_record(collection: Collection, event_id: str) -> EvidenceRecord | None:
    doc = collection.find_one({"_id": event_id})
    return _to_record(doc) if doc else None


def list_records(
    collection: Collection,
    violation_type: str | None = None,
    review_status: str | None = None,
    limit: int = 50,
) -> list[EvidenceRecord]:
    query: dict = {}
    if violation_type:
        query["violation_type"] = violation_type
    if review_status:
        query["review_status"] = review_status
    cursor = collection.find(query).sort("created_at", DESCENDING).limit(limit)
    return [_to_record(doc) for doc in cursor]
