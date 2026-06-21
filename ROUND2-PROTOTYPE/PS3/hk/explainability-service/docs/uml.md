# Explainability Service — UML Diagrams

UML for the **Explainability Service** within the *Violation Detection AI*
platform. Diagrams use [Mermaid](https://mermaid.js.org/) and render on GitHub,
in VS Code (Mermaid extension), or at [mermaid.live](https://mermaid.live).

- [1. Context — Violation Detection AI platform](#1-context-diagram)
- [2. Sequence — HTTP and SQS paths](#2-sequence-diagram)
- [3. Class — data model and engine](#3-class-diagram)
- [4. Activity — processing logic](#4-activity-diagram)
- [5. Component / Deployment — where it runs](#5-component--deployment-diagram)
- [6. State — SQS message lifecycle](#6-state-diagram-sqs-message-lifecycle)

---

## 1. Context Diagram

Where this service sits in the wider platform.

```mermaid
flowchart LR
    IMG[Traffic Image] --> ENH[Image Enhancement Engine]
    ENH --> DET[Multi-Object Detection<br/>YOLO / RT-DETR]
    DET --> VIE[Violation Intelligence Engine]
    DET --> LPR[License Plate Recognition]
    VIE --> EXP[Explainability Service]
    LPR --> EXP
    EXP --> EVG[Evidence Generator]
    EXP --> DASH[(Database + Analytics Dashboard)]

    style EXP fill:#2563eb,color:#fff,stroke:#1e40af
```

---

## 2. Sequence Diagram

The two paths through the service: asynchronous (SQS) and synchronous (HTTP).

```mermaid
sequenceDiagram
    autonumber
    participant VIE as Violation Intelligence Engine
    participant SQS as SQS Queue
    participant ESM as Lambda Event Source Mapping
    participant H as handler() (router)
    participant ENG as ExplanationEngine
    participant DB as MongoDB Atlas
    participant S3 as S3 (proofs)

    alt Asynchronous (queue path)
        VIE->>SQS: SendMessage(ViolationEvent JSON)
        ESM->>SQS: poll messages
        ESM->>H: invoke(event with Records[aws:sqs])
        H->>H: is_sqs_event() == true
        H->>ENG: explain(ViolationEvent)
    else Synchronous (HTTP path)
        VIE->>H: POST /explain (ViolationEvent)
        H->>H: is_sqs_event() == false
        H->>ENG: explain(ViolationEvent)
    end

    ENG->>ENG: normalize confidence
    ENG->>ENG: build reasoning chain
    ENG->>ENG: apply 90% HITL gate
    opt annotate_image
        ENG->>S3: save annotated proof
        S3-->>ENG: proof_image_uri
    end
    ENG-->>H: EvidenceRecord
    opt persist
        H->>DB: save_record(EvidenceRecord)
    end
    H-->>VIE: EvidenceRecord (HTTP) / ack (SQS)
```

---

## 3. Class Diagram

Mirrors `app/schemas.py` and `app/engine.py`.

```mermaid
classDiagram
    class ViolationEvent {
        +ViolationType violation_type
        +float|str confidence
        +Detection[] detections
        +str vehicle_number
        +str location
        +str image_uri
        +dict raw_output
        +str event_id
        +datetime timestamp
        +bool annotate_image
        +bool persist
    }

    class Detection {
        +str label
        +float confidence
        +dict box
    }

    class EvidenceRecord {
        +str event_id
        +str violation_type
        +GeneratedReport generated_report
        +ReasoningStep[] reasoning_chain
        +float confidence
        +ReviewStatus review_status
        +bool requires_human_review
        +str vehicle_number
        +str location
        +str proof_image_uri
        +datetime timestamp
    }

    class GeneratedReport {
        +str summary
        +str[] details
        +str violation_type
    }

    class ReasoningStep {
        +int order
        +str statement
        +float confidence
    }

    class ExplanationEngine {
        +explain(ViolationEvent) EvidenceRecord
        -normalize_confidence()
        -apply_hitl_gate()
    }

    class ViolationType {
        <<enumeration>>
        HELMET
        TRIPLE_RIDING
        SEATBELT
        STOP_LINE
        RED_LIGHT
        WRONG_SIDE
        ILLEGAL_PARKING
    }

    class ReviewStatus {
        <<enumeration>>
        AUTO_APPROVED
        MANUAL_REVIEW
    }

    ViolationEvent "1" *-- "many" Detection
    ViolationEvent --> ViolationType
    EvidenceRecord "1" *-- "1" GeneratedReport
    EvidenceRecord "1" *-- "many" ReasoningStep
    EvidenceRecord --> ReviewStatus
    ExplanationEngine ..> ViolationEvent : consumes
    ExplanationEngine ..> EvidenceRecord : produces
```

---

## 4. Activity Diagram

The processing logic, including the human-in-the-loop gate.

```mermaid
flowchart TD
    A([Receive ViolationEvent]) --> B[Normalize confidence to 0-1]
    B --> C[Select builder by violation_type]
    C --> D[Build summary + reasoning chain]
    D --> E{confidence >= 90%?}
    E -->|Yes| F[review_status = auto_approved]
    E -->|No| G[review_status = manual_review<br/>requires_human_review = true]
    F --> H{annotate_image<br/>and image_uri?}
    G --> H
    H -->|Yes| I[Draw boxes -> save proof to S3]
    H -->|No| J[skip image]
    I --> K[Assemble EvidenceRecord]
    J --> K
    K --> L{persist?}
    L -->|Yes| M[(Save to MongoDB)]
    L -->|No| N[Return only]
    M --> O([Return EvidenceRecord])
    N --> O
```

---

## 5. Component / Deployment Diagram

Where the pieces run.

```mermaid
flowchart LR
    subgraph Upstream["Violation Detection AI (upstream)"]
        VIE[Violation Intelligence Engine]
    end

    subgraph AWS["AWS (ap-south-1)"]
        FURL[Function URL / API Gateway]
        SQS[(SQS: violation-events)]
        DLQ[(DLQ: violation-events-dlq)]
        subgraph Lambda["Lambda: explainability-service (container)"]
            R[handler router]
            ENG[ExplanationEngine]
        end
        S3[(S3: proof images)]
    end

    subgraph Atlas["MongoDB Atlas"]
        DB[(violation_detection.explanation_records)]
    end

    VIE -->|HTTP POST| FURL --> R
    VIE -->|SendMessage| SQS --> R
    SQS -. 3 fails .-> DLQ
    R --> ENG
    ENG --> S3
    ENG --> DB
```

---

## 6. State Diagram (SQS message lifecycle)

How a queued message moves through SQS until it is processed or dead-lettered.

```mermaid
stateDiagram-v2
    [*] --> Visible: producer SendMessage
    Visible --> InFlight: ESM receives (visibility timeout starts)
    InFlight --> Processed: handler success
    Processed --> [*]: SQS deletes message
    InFlight --> Visible: handler failure / timeout (retry)
    Visible --> DeadLetter: receive count > 3
    DeadLetter --> [*]: manual inspection
```
