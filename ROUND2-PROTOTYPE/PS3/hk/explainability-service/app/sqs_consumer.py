"""SQS event processing for the Explainability Service.

When the Lambda is triggered by SQS, each message body is a JSON-encoded
ViolationEvent. We explain it with the same engine used by the HTTP path and
persist the evidence record.

Partial batch failures: we return the set of message IDs that failed so SQS
only redelivers those, not the whole batch. The Lambda event source mapping
must have "ReportBatchItemFailures" enabled for this to take effect.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import ValidationError

from app.database import get_collection
from app.engine import ExplanationEngine
from app.repository import save_record
from app.schemas import ViolationEvent

logger = logging.getLogger("explainability.sqs")


def is_sqs_event(event: Any) -> bool:
    """True if this Lambda event looks like an SQS batch."""
    if not isinstance(event, dict):
        return False
    records = event.get("Records")
    if not isinstance(records, list) or not records:
        return False
    return records[0].get("eventSource") == "aws:sqs"


def process_sqs_event(event: dict, engine: ExplanationEngine) -> dict:
    """Process an SQS batch and return a partial-batch-failure response.

    Returns {"batchItemFailures": [{"itemIdentifier": <messageId>}, ...]}.
    A message is failed (and redelivered) only if processing raised; malformed
    messages that can never succeed are logged and dropped (not retried).
    """
    collection = get_collection()
    failures: list[dict[str, str]] = []

    for record in event.get("Records", []):
        message_id = record.get("messageId", "unknown")
        body = record.get("body", "")
        try:
            payload = json.loads(body)
        except (json.JSONDecodeError, TypeError):
            # Unparseable JSON will never succeed on retry: drop it.
            logger.error("Dropping unparseable SQS message %s", message_id)
            continue

        try:
            violation = ViolationEvent.model_validate(payload)
        except ValidationError as exc:
            # Schema-invalid messages will never succeed on retry: drop them.
            logger.error("Dropping invalid ViolationEvent %s: %s",
                         message_id, exc)
            continue

        try:
            evidence = engine.explain(violation)
            if violation.persist:
                save_record(collection, evidence)
            logger.info("Processed event %s (%s) from message %s",
                        evidence.event_id, evidence.violation_type, message_id)
        except Exception:
            # Transient failure (e.g. DB blip): let SQS redeliver this message.
            logger.exception("Failed processing message %s; will retry",
                             message_id)
            failures.append({"itemIdentifier": message_id})

    return {"batchItemFailures": failures}
