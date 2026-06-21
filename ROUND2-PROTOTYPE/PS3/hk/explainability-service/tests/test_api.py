"""API smoke test using FastAPI's TestClient (no live server needed).

Uses persist=False so no MongoDB connection is required.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_explain_red_light_endpoint():
    payload = {
        "violation_type": "Red-Light Violation",
        "confidence": "96%",
        "vehicle_number": "MH12AB1234",
        "location": "Junction 7",
        "raw_output": {
            "signal": "red",
            "vehicle_crossed_line": True,
            "distance_crossed": "1.8m",
        },
        "persist": False,
    }
    resp = client.post("/explain", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["review_status"] == "auto_approved"
    assert body["requires_human_review"] is False
    assert body["vehicle_number"] == "MH12AB1234"
    report = body["generated_report"]
    assert report["violation_type"] == "Red-Light Violation"
    assert "Confidence Score: 96%." in report["details"]
    assert len(body["reasoning_chain"]) == 4


def test_explain_below_threshold_flags_review():
    payload = {
        "violation_type": "Helmet Non-Compliance",
        "confidence": 70,
        "persist": False,
    }
    resp = client.post("/explain", json=payload)
    assert resp.status_code == 200
    assert resp.json()["review_status"] == "manual_review"


def test_invalid_violation_type_returns_422():
    payload = {"violation_type": "Jaywalking", "confidence": 0.9,
               "persist": False}
    resp = client.post("/explain", json=payload)
    assert resp.status_code == 422
