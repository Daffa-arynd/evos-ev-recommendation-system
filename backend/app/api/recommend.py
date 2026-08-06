"""
EVOS — POST /recommend endpoint
"""
import time
import uuid
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import UserPreferences, RecommendationResponse, RecommendedVehicle, FeedbackRequest, FeedbackResponse
from app.ml.pipeline import EVRecommendationEngine, EVRecord

router = APIRouter()


def ev_record_to_dict(rec: EVRecord) -> dict:
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


@router.post("", response_model=RecommendationResponse)
async def get_recommendations(
    body: UserPreferences,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    POST /recommend
    
    Runs the content-based filtering ML pipeline and returns
    top-K personalized EV recommendations with explainability.
    """
    ml: EVRecommendationEngine = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    t0 = time.perf_counter()

    preferences = {
        "max_price_usd": body.max_price_usd,
        "min_range_km": body.min_range_km,
        "min_battery_kwh": body.min_battery_kwh,
        "max_charge_time_hr": body.max_charge_time_hr,
        "min_safety_rating": body.min_safety_rating,
        "min_autonomy_level": body.min_autonomy_level,
    }

    weights = {}
    if body.weights:
        weights = {
            "price": body.weights.price,
            "range_km": body.weights.range_km,
            "battery": body.weights.battery,
            "charge_time": body.weights.charge_time,
            "safety": body.weights.safety,
            "autonomy": body.weights.autonomy,
        }

    results, meta = ml.recommend(
        preferences=preferences,
        weights=weights,
        cluster_profile=body.cluster_profile or "performance",
        top_k=body.top_k or 5,
    )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    session_token = str(uuid.uuid4())

    recommendations = [
        RecommendedVehicle(
            rank=r.rank,
            similarity_score=r.similarity_score,
            similarity_pct=f"{r.similarity_score * 100:.1f}%",
            explanation=r.explanation,
            explainability=r.explainability,
            vehicle=ev_record_to_dict(r.ev),
        )
        for r in results
    ]

    return RecommendationResponse(
        session_token=session_token,
        cluster_label=meta["cluster_label"],
        cluster_description=meta["cluster_description"],
        user_vector=meta["user_vector"],
        total_vehicles_evaluated=meta["total_evaluated"],
        filtered_pool_size=meta["filtered_pool"],
        recommendations=recommendations,
        processing_time_ms=round(elapsed_ms, 2),
    )


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(body: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    """POST /recommend/feedback — Record user helpfulness signal."""
    # In production: update recommendation_logs table
    return FeedbackResponse(status="ok", message="Feedback recorded. Thank you!")

@router.get("/similar/{vehicle_id}")
async def get_similar(vehicle_id: int, request: Request, top_k: int = 5):
    """GET /recommend/similar/{id} — Cari EV mirip dengan EV tertentu."""
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    ml = request.app.state.ml_engine
    if not ml or not ml.is_ready:
        raise HTTPException(status_code=503, detail="ML engine not ready")

    target = next((r for r in ml.records if r.vehicle_id == vehicle_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    target_idx = ml.records.index(target)
    target_vec = ml.feature_matrix[target_idx].reshape(1, -1)
    sims = cosine_similarity(target_vec, ml.feature_matrix)[0]
    sims[target_idx] = -1  # exclude itself

    top_indices = np.argsort(sims)[::-1][:top_k]

    results = []
    for rank, idx in enumerate(top_indices, 1):
        rec = ml.records[idx]
        results.append({
            "rank": rank,
            "similarity_score": round(float(sims[idx]), 4),
            "similarity_pct": f"{sims[idx]*100:.1f}%",
            "vehicle": ev_record_to_dict(rec),
        })

    return {
        "source_vehicle": ev_record_to_dict(target),
        "similar_vehicles": results,
    }