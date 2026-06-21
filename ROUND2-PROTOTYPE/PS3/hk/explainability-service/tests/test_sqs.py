"""Tests for the SQS consumer path (no AWS or DB required).

The collection and save are monkeypatched so the engine logic runs offline.
"""

import json

import pytest

from app.config import Settings
from app.engine import ExplanationEngine
from app.storage import LocalStorage
import app.sqs_consumer as sqs_consumer


@pytest.fixture
def engine(tmp_path):
    settings = Settings(
        storage_backend="local",
        local_storage_dir=str(tmp_path / "proofs"),
        auto_approval_threshold=90.0,
    )
    return ExplanationEngine(settings, LocalStorage(str(tmp_path / "proofs")))


@pytest.fixture(autouse=True)
def _patch_db(monkeypatch):
    """Capture saved records instead of writing to MongoDB."""
    saved = []
    monkeypatch.setattr(sqs_consumer, "get_collection", lambda: object())
    monkeypatch.setattr(sqs_consumer, "save_record",
                        lambda coll, rec: saved.append(rec))
    return saved


def _sqs_event(*bodies: dict) -> dict:
    return {
        "Records": [
            {
                "eventSource": "aws:sqs",
                "messageId": f"msg-{i}",
                "body": json.dumps(body),
            }
            for i, body in enumerate(bodies)
        ]
    }


def test_is_sqs_event_detection():
    assert sqs_consumer.is_sqs_event(_sqs_event({"a": 1})) is True
    # HTTP event (API Gateway) is not SQS.
    assert sqs_consumer.is_sqs_event({"requestContext": {"http": {}}}) is False
    assert sqs_consumer.is_sqs_event({}) is False


def test_valid_messages_are_processed(engine, _patch_db):
    event = _sqs_event(
        {"violation_type": "Red-Light Violation", "confidence": "96%",
         "persist": True},
        {"violation_type": "Helmet Non-Compliance", "confidence": 0.93,
         "persist": True},
    )
    result = sqs_consumer.process_sqs_event(event, engine)
    assert result["batchItemFailures"] == []
    assert len(_patch_db) == 2
    assert _patch_db[0].violation_type == "Red-Light Violation"


def test_invalid_message_is_dropped_not_retried(engine, _patch_db):
    # Bad violation_type can never succeed -> dropped, not a batch failure.
    event = _sqs_event({"violation_type": "Jaywalking", "confidence": 0.9})
    result = sqs_consumer.process_sqs_event(event, engine)
    assert result["batchItemFailures"] == []
    assert len(_patch_db) == 0


def test_unparseable_body_is_dropped(engine, _patch_db):
    event = {
        "Records": [
            {"eventSource": "aws:sqs", "messageId": "bad",
             "body": "not-json{{{"}
        ]
    }
    result = sqs_consumer.process_sqs_event(event, engine)
    assert result["batchItemFailures"] == []
    assert len(_patch_db) == 0


def test_transient_failure_is_reported_for_retry(engine, monkeypatch):
    # Make save_record raise to simulate a DB blip -> message should be retried.
    def boom(coll, rec):
        raise RuntimeError("db down")

    monkeypatch.setattr(sqs_consumer, "get_collection", lambda: object())
    monkeypatch.setattr(sqs_consumer, "save_record", boom)

    event = _sqs_event({"violation_type": "Red-Light Violation",
                        "confidence": "96%", "persist": True})
    result = sqs_consumer.process_sqs_event(event, engine)
    assert result["batchItemFailures"] == [{"itemIdentifier": "msg-0"}]


def test_persist_false_skips_save(engine, _patch_db):
    event = _sqs_event({"violation_type": "Red-Light Violation",
                        "confidence": "96%", "persist": False})
    result = sqs_consumer.process_sqs_event(event, engine)
    assert result["batchItemFailures"] == []
    assert len(_patch_db) == 0  # processed but not saved
