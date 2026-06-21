# Explainability Service

The **Explainability Service** (a.k.a. the AWS Lambda Service) in the
*Violation Detection AI* platform. It sits between the Violation Intelligence
Engine and the Evidence Generator:

```
Violation Intelligence Engine ─▶ Explainability Service ─▶ Evidence Generator
                                       │
                                       ├─ generate reasoning chain (no LLM)
                                       ├─ normalize + validate confidence
                                       ├─ apply human-in-the-loop gate (90%)
                                       ├─ annotate proof image
                                       └─ store evidence record (MongoDB)
```

For every violation event it produces an **evidence record** containing the
violation type, a plain-language reasoning chain, confidence, a review decision
(auto-approved vs manual review), vehicle number, location, timestamp, and an
annotated proof image. No LLM is used — reasoning is rule-based per violation
type.

## Supported violations

The seven violation types from the Violation Intelligence Engine:

- Helmet Non-Compliance
- Triple Riding
- Seatbelt Non-Compliance
- Stop-Line Violation
- Red-Light Violation
- Wrong-Side Driving
- Illegal Parking

## Human-in-the-loop

Confidence is normalized to 0–1 (accepts `"96%"`, `0.96`, or `96`). Events at or
above `AUTO_APPROVAL_THRESHOLD` (default **90%**) are `auto_approved`; anything
below is flagged `manual_review` for the HITL stage.

## Architecture

| Concern        | Choice                                                    |
| -------------- | --------------------------------------------------------- |
| API            | FastAPI                                                   |
| Runtime        | AWS Lambda behind API Gateway (HTTP API), via Mangum      |
| Persistence    | MongoDB (`event_id` is the document `_id`)                |
| Proof storage  | S3 on Lambda, local filesystem for development            |
| Imaging        | Pillow                                                    |

### Key modules

- `app/schemas.py` — API contract (`ViolationEvent` in, `EvidenceRecord` out)
- `app/engine.py` — `ExplanationEngine`: per-violation reasoning + HITL gate
- `app/annotator.py` — draws labeled bounding boxes onto proof images
- `app/storage.py` — local / S3 storage backends
- `app/database.py` + `app/repository.py` — MongoDB access
- `app/main.py` — FastAPI app and the Lambda `handler`

## API

| Method | Path                   | Purpose                                       |
| ------ | ---------------------- | --------------------------------------------- |
| GET    | `/health`              | Liveness check                                |
| POST   | `/explain`             | Explain a violation event → evidence record   |
| GET    | `/evidence/{event_id}` | Fetch a stored evidence record                |
| GET    | `/evidence`            | List records (filter by `violation_type`, `review_status`) |

### Example

```bash
curl -X POST http://localhost:8000/explain -H "Content-Type: application/json" -d '{
  "violation_type": "Red-Light Violation",
  "confidence": "96%",
  "vehicle_number": "MH12AB1234",
  "location": "Junction 7, MG Road",
  "detections": [
    {"label": "Traffic Signal", "confidence": 0.98},
    {"label": "Car", "confidence": 0.97, "box": {"x": 120, "y": 80, "width": 200, "height": 150}}
  ],
  "image_uri": "./data/source.jpg",
  "annotate_image": true,
  "raw_output": {"signal": "red", "vehicle_crossed_line": true, "distance_crossed": "1.8m"},
  "persist": true
}'
```

Response (shape):

```json
{
  "event_id": "…",
  "violation_type": "Red-Light Violation",
  "generated_report": {
    "summary": "The vehicle crossed the designated stop line while the traffic signal was red.",
    "details": ["Vehicle crossed the stop line by 1.8m.", "Confidence Score: 96%."],
    "violation_type": "Red-Light Violation"
  },
  "reasoning_chain": [
    {"order": 1, "statement": "The traffic signal was detected as red.", "confidence": 0.96},
    {"order": 2, "statement": "The vehicle crossed the stop line while the signal was red.", "confidence": 0.96},
    {"order": 3, "statement": "Crossing on a red signal is a red-light violation.", "confidence": 0.96},
    {"order": 4, "statement": "Confidence 96% meets the 90% threshold; auto-approved.", "confidence": 0.96}
  ],
  "confidence": 0.96,
  "review_status": "auto_approved",
  "requires_human_review": false,
  "vehicle_number": "MH12AB1234",
  "location": "Junction 7, MG Road",
  "proof_image_uri": "s3://…/<event_id>.jpg",
  "timestamp": "…"
}
```

## Local development

```bash
py -3 -m venv .venv
.venv\Scripts\activate           # Windows
pip install -r requirements.txt
copy .env.example .env           # uses local storage; needs a local MongoDB
uvicorn app.main:app --reload
```

Run tests (no MongoDB or AWS needed — engine tests are self-contained):

```bash
pytest -q
```

## Deploy to AWS Lambda

Packaged with AWS SAM. Pillow needs Linux wheels, so build in a container.

```bash
sam build --use-container
sam deploy --guided \
  --parameter-overrides \
    MongoUri="<your-mongodb-uri>" \
    ProofBucketName="<unique-bucket-name>"
```

The Lambda handler is `app.main.handler`. Environment variables (`MONGO_URI`,
`STORAGE_BACKEND=s3`, `S3_BUCKET`, `AUTO_APPROVAL_THRESHOLD`, …) are set by
`template.yaml`.

### Production notes

- **MongoDB**: use Atlas or a VPC-reachable cluster. The client is created at
  module scope so warm Lambda containers reuse the connection pool.
- **Proof images** go to S3; only `/tmp` is writable on Lambda, so the `local`
  backend is for development only.
- **Auth**: the HTTP API currently has no authorizer. Add one (IAM / Cognito /
  Lambda authorizer) before production, since this handles enforcement evidence.
