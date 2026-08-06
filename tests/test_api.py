"""
EVOS — FastAPI Integration Tests
Run: pytest tests/test_api.py -v

Note: These tests mock the ML engine to avoid requiring the full dataset.
"""
import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app
from app.ml.pipeline import EVRecommendationEngine, EVRecord, RecommendationResult


def make_mock_ev(vid=1):
    rec = EVRecord(
        vehicle_id=vid,
        manufacturer="Tesla",
        model="Model S",
        year=2024,
        battery_capacity_kwh=100.0,
        range_km=500,
        charge_time_hr=3.5,
        price_usd=85000.0,
        safety_rating=5.0,
        autonomous_level=3.0,
        warranty_years=4,
        battery_type="Lithium-ion",
        charging_type="NACS",
        color="Midnight Black",
        cluster_id=1,
        cluster_label="performance",
        feature_vector=[0.6, 0.8, 0.7, 0.7, 0.9, 0.7],
    )
    return rec


def make_mock_result(rank=1):
    ev = make_mock_ev(rank)
    return RecommendationResult(
        rank=rank,
        ev=ev,
        similarity_score=0.95 - (rank - 1) * 0.05,
        explanation=f"Recommended because of strong range and battery capacity. Rank {rank}.",
        explainability=[
            {"feature": "Price", "user_value": 90000, "vehicle_value": 85000,
             "normalized_user": 0.6, "normalized_vehicle": 0.55,
             "weight": 1.0, "contribution": 0.89, "match_quality": "excellent"},
            {"feature": "Range", "user_value": 350, "vehicle_value": 500,
             "normalized_user": 0.7, "normalized_vehicle": 0.8,
             "weight": 1.5, "contribution": 0.91, "match_quality": "excellent"},
        ],
    )


def build_mock_engine():
    mock_engine = MagicMock(spec=EVRecommendationEngine)
    mock_engine.is_ready = True
    mock_engine.records = [make_mock_ev(i) for i in range(1, 11)]

    mock_results = [make_mock_result(i) for i in range(1, 6)]
    mock_meta = {
        "user_vector": [0.5, 0.7, 0.6, 0.6, 0.8, 0.7],
        "total_evaluated": 10,
        "filtered_pool": 8,
        "cluster_label": "performance",
        "cluster_description": "High-spec vehicles with advanced autonomy.",
    }
    mock_engine.recommend.return_value = (mock_results, mock_meta)

    mock_stats = [
        {
            "cluster_id": 0, "cluster_label": "budget",
            "description": "Value-focused.", "vehicle_count": 3,
            "avg_price": 45000, "avg_range": 300, "avg_battery": 65,
            "avg_charge_time": 8, "avg_safety": 3.8, "avg_autonomy": 1.5,
            "representative_vehicles": [make_mock_ev(1), make_mock_ev(2), make_mock_ev(3)],
            "centroid": [0.3, 0.5, 0.4, 0.3, 0.7, 0.3],
        },
        {
            "cluster_id": 1, "cluster_label": "performance",
            "description": "High-spec.", "vehicle_count": 4,
            "avg_price": 90000, "avg_range": 420, "avg_battery": 95,
            "avg_charge_time": 5, "avg_safety": 4.5, "avg_autonomy": 3.2,
            "representative_vehicles": [make_mock_ev(4), make_mock_ev(5), make_mock_ev(6)],
            "centroid": [0.6, 0.7, 0.7, 0.6, 0.9, 0.7],
        },
        {
            "cluster_id": 2, "cluster_label": "longrange",
            "description": "Max range.", "vehicle_count": 3,
            "avg_price": 75000, "avg_range": 530, "avg_battery": 120,
            "avg_charge_time": 4, "avg_safety": 4.2, "avg_autonomy": 2.5,
            "representative_vehicles": [make_mock_ev(7), make_mock_ev(8), make_mock_ev(9)],
            "centroid": [0.5, 0.9, 0.8, 0.7, 0.8, 0.5],
        },
    ]
    mock_engine.get_cluster_stats.return_value = mock_stats
    return mock_engine


@pytest.fixture(autouse=True)
def inject_mock_engine():
    """Inject mock ML engine into app state before each test."""
    app.state.ml_engine = build_mock_engine()
    yield
    del app.state.ml_engine


@pytest.fixture
def anyio_backend():
    return "asyncio"


# ─── HEALTH TESTS ─────────────────────────────────────────────────

@pytest.mark.anyio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["ml_engine"] == "ready"
    assert data["vehicles_loaded"] == 10


# ─── VEHICLE TESTS ────────────────────────────────────────────────

@pytest.mark.anyio
async def test_list_vehicles_default():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/vehicles")
    assert resp.status_code == 200
    data = resp.json()
    assert "vehicles" in data
    assert "total" in data
    assert data["total"] == 10


@pytest.mark.anyio
async def test_list_vehicles_pagination():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/vehicles?page=1&page_size=5")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["vehicles"]) <= 5


@pytest.mark.anyio
async def test_get_vehicle_by_id():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/vehicles/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["vehicle_id"] == 1
    assert data["manufacturer"] == "Tesla"


@pytest.mark.anyio
async def test_get_vehicle_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/vehicles/99999")
    assert resp.status_code == 404


# ─── RECOMMENDATION TESTS ─────────────────────────────────────────

VALID_PAYLOAD = {
    "max_price_usd": 95000,
    "min_range_km": 350,
    "min_battery_kwh": 80,
    "max_charge_time_hr": 6.0,
    "min_safety_rating": 4,
    "min_autonomy_level": 3,
    "cluster_profile": "performance",
    "top_k": 5,
    "weights": {
        "price": 1.0,
        "range_km": 1.5,
        "battery": 1.0,
        "charge_time": 1.0,
        "safety": 1.0,
        "autonomy": 1.5,
    },
}


@pytest.mark.anyio
async def test_recommend_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/recommend", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) == 5
    assert data["cluster_label"] == "performance"
    assert "session_token" in data
    assert "processing_time_ms" in data


@pytest.mark.anyio
async def test_recommend_has_explainability():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/recommend", json=VALID_PAYLOAD)
    data = resp.json()
    for rec in data["recommendations"]:
        assert "explainability" in rec
        assert len(rec["explainability"]) > 0
        assert "similarity_score" in rec
        assert "explanation" in rec
        assert isinstance(rec["similarity_score"], float)
        assert 0 <= rec["similarity_score"] <= 1


@pytest.mark.anyio
async def test_recommend_ranks_sequential():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/recommend", json=VALID_PAYLOAD)
    data = resp.json()
    ranks = [r["rank"] for r in data["recommendations"]]
    assert ranks == list(range(1, len(ranks) + 1))


@pytest.mark.anyio
async def test_recommend_invalid_price():
    bad = {**VALID_PAYLOAD, "max_price_usd": -500}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/recommend", json=bad)
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_recommend_invalid_cluster():
    bad = {**VALID_PAYLOAD, "cluster_profile": "invalid_cluster"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/recommend", json=bad)
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_recommend_budget_profile():
    budget_payload = {**VALID_PAYLOAD,
                      "max_price_usd": 50000,
                      "cluster_profile": "budget",
                      "weights": {"price": 2.0, "range_km": 1.0, "battery": 0.5,
                                  "charge_time": 0.5, "safety": 1.0, "autonomy": 0.5}}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/recommend", json=budget_payload)
    assert resp.status_code == 200


# ─── CLUSTER TESTS ────────────────────────────────────────────────

@pytest.mark.anyio
async def test_clusters_returns_three():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/clusters")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_clusters"] == 3
    assert len(data["clusters"]) == 3


@pytest.mark.anyio
async def test_clusters_have_required_fields():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/clusters")
    data = resp.json()
    for cluster in data["clusters"]:
        assert "cluster_label" in cluster
        assert "vehicle_count" in cluster
        assert "avg_price" in cluster
        assert "avg_range" in cluster
        assert "representative_vehicles" in cluster
        assert cluster["cluster_label"] in {"budget", "performance", "longrange"}


# ─── FEEDBACK TESTS ───────────────────────────────────────────────

@pytest.mark.anyio
async def test_feedback_success():
    payload = {"session_token": "abc-123", "vehicle_id": 1, "rank": 1, "was_helpful": True}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/recommend/feedback", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


# ─── ROOT TESTS ───────────────────────────────────────────────────

@pytest.mark.anyio
async def test_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "EVOS" in data["system"]
    assert "endpoints" in data
