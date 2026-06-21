"""FastAPI application + AWS Lambda handler (via Mangum).

The Explainability Service in the Violation Detection AI pipeline. A single
Lambda serves two entry points:

- HTTP (API Gateway / Function URL) -> handled by Mangum + FastAPI.
- SQS queue trigger -> handled by app.sqs_consumer.

The `handler` below inspects the incoming event and routes accordingly, so one
function and one container image cover both the synchronous API and the
asynchronous queue.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from mangum import Mangum

from app.config import get_settings
from app.database import get_collection, init_db
from app.engine import ExplanationEngine
from app.repository import get_record, list_records, save_record
from app.schemas import EvidenceRecord, ViolationEvent
from app.sqs_consumer import is_sqs_event, process_sqs_event
from app.storage import get_storage

settings = get_settings()
storage = get_storage(settings)
engine = ExplanationEngine(settings, storage)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Idempotent; cheap on warm Lambda containers.
    init_db()
    yield


app = FastAPI(
    title="Explainability Service",
    description=(
        "Explainable AI for traffic violations: generates reasoning chains, "
        "validates confidence thresholds, flags human-in-the-loop cases, and "
        "stores evidence records for the Evidence Generator and dashboard."
    ),
    version="0.3.0",
    lifespan=lifespan,
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.service_name}


@app.post("/explain", response_model=EvidenceRecord)
def explain(event: ViolationEvent) -> EvidenceRecord:
    record = engine.explain(event)
    if event.persist:
        save_record(get_collection(), record)
    return record


@app.get("/evidence/{event_id}", response_model=EvidenceRecord)
def fetch(event_id: str) -> EvidenceRecord:
    record = get_record(get_collection(), event_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    return record


@app.get("/evidence", response_model=list[EvidenceRecord])
def query(
    violation_type: str | None = None,
    review_status: str | None = None,
    limit: int = 50,
) -> list[EvidenceRecord]:
    return list_records(
        get_collection(),
        violation_type=violation_type,
        review_status=review_status,
        limit=limit,
    )


# Mangum adapts API Gateway / Function URL events to the ASGI app.
_http_handler = Mangum(app)


def handler(event: Any, context: Any = None):
    """AWS Lambda entry point. Routes SQS batches to the queue consumer and
    everything else (HTTP) to FastAPI via Mangum.

    Configure the Lambda handler as `app.main.handler`.
    """
    if is_sqs_event(event):
        return process_sqs_event(event, engine)
    return _http_handler(event, context)
