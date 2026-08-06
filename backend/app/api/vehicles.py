"""
EVOS — GET /vehicles endpoint
"""
from fastapi import APIRouter, Request, Query, HTTPException
from app.schemas.schemas import VehicleListResponse
from app.ml.pipeline import EVRecommendationEngine, EVRecord
from typing import Optional

router = APIRouter()


def ev_to_dict(rec: EVRecord) -> dict:
    return {
        "id": rec.vehicle_id,
        "vehicle_id": rec.vehicle_id,
        "manufacturer": rec.manufacturer,
        "model": rec.model,
        "year": rec.year,
        "battery_type": rec.battery_type,
        "battery_capacity_kwh": rec.battery_capacity_kwh,
        "range_km": int(rec.range_km),
        "charging_type": rec.charging_type,
        "charge_time_hr": rec.charge_time_hr,
        "price_usd": rec.price_usd,
        "color": rec.color,
        "autonomous_level": rec.autonomous_level,
        "safety_rating": rec.safety_rating,
        "warranty_years": int(rec.warranty_years),
        "cluster_id": rec.cluster_id,
        "cluster_label": rec.cluster_label,
        "created_at": None,
    }


@router.get("", response_model=VehicleListResponse)
async def list_vehicles(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    manufacturer: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_range: Optional[int] = Query(None),
    cluster: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("price_usd"),
    sort_dir: Optional[str] = Query("asc"),
):
    """GET /vehicles — Paginated, filtered vehicle listing."""
    ml: EVRecommendationEngine = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    records = ml.records

    # Filters
    if manufacturer:
        records = [r for r in records if manufacturer.lower() in r.manufacturer.lower()]
    if min_price is not None:
        records = [r for r in records if r.price_usd >= min_price]
    if max_price is not None:
        records = [r for r in records if r.price_usd <= max_price]
    if min_range is not None:
        records = [r for r in records if r.range_km >= min_range]
    if cluster:
        records = [r for r in records if r.cluster_label == cluster]

    # Sort
    sort_key_map = {
        "price_usd": lambda r: r.price_usd,
        "range_km": lambda r: r.range_km,
        "battery_capacity_kwh": lambda r: r.battery_capacity_kwh,
        "safety_rating": lambda r: r.safety_rating,
        "year": lambda r: r.year,
    }
    key_fn = sort_key_map.get(sort_by, lambda r: r.price_usd)
    records = sorted(records, key=key_fn, reverse=(sort_dir == "desc"))

    total = len(records)
    start = (page - 1) * page_size
    end = start + page_size
    page_records = records[start:end]

    return VehicleListResponse(
        total=total,
        page=page,
        page_size=page_size,
        vehicles=[ev_to_dict(r) for r in page_records],
    )


@router.get("/{vehicle_id}")
async def get_vehicle(vehicle_id: int, request: Request):
    """GET /vehicles/{id} — Single vehicle detail."""
    ml: EVRecommendationEngine = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")
    match = next((r for r in ml.records if r.vehicle_id == vehicle_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return ev_to_dict(match)

@router.get("/search")
async def search_vehicles(
    request: Request,
    q: str = "",
    limit: int = 10,
):
    """GET /vehicles/search?q=tesla — Search by name."""
    ml = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    q_lower = q.lower()
    matches = [
        r for r in ml.records
        if q_lower in r.manufacturer.lower() or q_lower in r.model.lower()
    ][:limit]

    return {"results": [ev_to_dict(r) for r in matches], "total": len(matches)}