"""API endpoint tests using FastAPI TestClient."""
import pytest
from starlette.testclient import TestClient
from apps.api.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


def test_profile_endpoint():
    resp = client.post(
        "/api/profile",
        json={"payload": [{"id": 1, "name": "Item A"}, {"id": 2, "name": "Item B"}]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "profile" in data
    assert data["profile"]["record_count"] == 2


def test_serialize_endpoint():
    resp = client.post(
        "/api/serialize",
        json={"payload": [{"id": 1, "name": "Test"}], "format": "JSON"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["format_id"] == "JSON"
    assert data["valid"] is True


def test_serialize_all_endpoint():
    resp = client.post(
        "/api/serialize-all",
        json={"payload": [{"id": 1, "name": "Test"}]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "candidates" in data
    assert len(data["candidates"]) == 5


def test_route_endpoint():
    resp = client.post(
        "/api/route",
        json={"payload": [{"id": 1, "val": 10}, {"id": 2, "val": 20}]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "selected_format" in data
    assert "token_savings_vs_json" in data


def test_reliability_adversarial_endpoint():
    resp = client.post(
        "/api/reliability/adversarial",
        json={},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "cases" in data
    assert data["total_cases"] > 0
