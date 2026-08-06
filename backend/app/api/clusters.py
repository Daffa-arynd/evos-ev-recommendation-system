"""
EVOS — GET /clusters endpoint
"""
from fastapi import APIRouter, Request, HTTPException
from app.schemas.schemas import ClustersResponse, ClusterStats
from app.ml.pipeline import EVRecommendationEngine

router = APIRouter()


@router.get("", response_model=ClustersResponse)
async def get_clusters(request: Request):
    """GET /clusters — Return K-Means cluster profiles and statistics."""
    ml: EVRecommendationEngine = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    raw_stats = ml.get_cluster_stats()

    clusters = []
    for s in raw_stats:
        reps = [
            {
                "id": r.vehicle_id,
                "vehicle_id": r.vehicle_id,
                "manufacturer": r.manufacturer,
                "model": r.model,
                "year": r.year,
                "battery_type": r.battery_type,
                "battery_capacity_kwh": r.battery_capacity_kwh,
                "range_km": int(r.range_km),
                "charging_type": r.charging_type,
                "charge_time_hr": r.charge_time_hr,
                "price_usd": r.price_usd,
                "color": r.color,
                "autonomous_level": r.autonomous_level,
                "safety_rating": r.safety_rating,
                "warranty_years": int(r.warranty_years),
                "cluster_id": r.cluster_id,
                "cluster_label": r.cluster_label,
                "created_at": None,
            }
            for r in s["representative_vehicles"]
        ]
        clusters.append(
            ClusterStats(
                cluster_id=s["cluster_id"],
                cluster_label=s["cluster_label"],
                description=s["description"],
                vehicle_count=s["vehicle_count"],
                avg_price=s["avg_price"],
                avg_range=s["avg_range"],
                avg_battery=s["avg_battery"],
                avg_charge_time=s["avg_charge_time"],
                avg_safety=s["avg_safety"],
                avg_autonomy=s["avg_autonomy"],
                representative_vehicles=reps,
            )
        )

    return ClustersResponse(total_clusters=len(clusters), clusters=clusters)
