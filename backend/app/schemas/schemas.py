"""
EVOS — Pydantic Schemas (Request & Response Models)
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── VEHICLE SCHEMAS ────────────────────────────────────────────────────────

class VehicleBase(BaseModel):
    vehicle_id: int
    manufacturer: str
    model: str
    year: int
    battery_type: Optional[str]
    battery_capacity_kwh: float
    range_km: int
    charging_type: Optional[str]
    charge_time_hr: float
    price_usd: float
    color: Optional[str]
    autonomous_level: float
    safety_rating: Optional[float]
    warranty_years: Optional[int]
    cluster_id: Optional[int]
    cluster_label: Optional[str]


class VehicleOut(VehicleBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    vehicles: List[VehicleOut]


# ─── RECOMMENDATION SCHEMAS ──────────────────────────────────────────────────

class FeatureWeights(BaseModel):
    price: float = Field(default=1.0, ge=0.1, le=3.0, description="Weight for price feature")
    range_km: float = Field(default=1.5, ge=0.1, le=3.0, description="Weight for range feature")
    battery: float = Field(default=1.0, ge=0.1, le=3.0, description="Weight for battery capacity")
    charge_time: float = Field(default=1.0, ge=0.1, le=3.0, description="Weight for charge time")
    safety: float = Field(default=1.0, ge=0.1, le=3.0, description="Weight for safety rating")
    autonomy: float = Field(default=1.5, ge=0.1, le=3.0, description="Weight for autonomy level")


class UserPreferences(BaseModel):
    max_price_usd: float = Field(..., ge=10000, le=300000, description="Maximum budget in USD")
    min_range_km: float = Field(..., ge=50, le=1000, description="Minimum driving range in km")
    min_battery_kwh: float = Field(..., ge=10, le=200, description="Minimum battery capacity kWh")
    max_charge_time_hr: float = Field(..., ge=0.5, le=24, description="Maximum acceptable charge time")
    min_safety_rating: float = Field(..., ge=1, le=5, description="Minimum safety rating 1-5")
    min_autonomy_level: float = Field(..., ge=0, le=5, description="Minimum autonomy level 0-5")
    cluster_profile: Optional[str] = Field(default="performance", description="budget | performance | longrange")
    weights: Optional[FeatureWeights] = Field(default_factory=FeatureWeights)
    top_k: Optional[int] = Field(default=5, ge=1, le=20)

    @validator("cluster_profile")
    def validate_cluster(cls, v):
        allowed = {"budget", "performance", "longrange"}
        if v not in allowed:
            raise ValueError(f"cluster_profile must be one of {allowed}")
        return v


class ExplainabilityDetail(BaseModel):
    feature: str
    user_value: float
    vehicle_value: float
    normalized_user: float
    normalized_vehicle: float
    weight: float
    contribution: float
    match_quality: str  # "excellent" | "good" | "partial" | "weak"


class RecommendedVehicle(BaseModel):
    rank: int
    similarity_score: float
    similarity_pct: str
    explanation: str
    explainability: List[ExplainabilityDetail]
    vehicle: VehicleOut


class RecommendationResponse(BaseModel):
    session_token: str
    cluster_label: str
    cluster_description: str
    user_vector: List[float]
    total_vehicles_evaluated: int
    filtered_pool_size: int
    recommendations: List[RecommendedVehicle]
    processing_time_ms: float
    model_version: str = "1.0.0"


# ─── CLUSTER SCHEMAS ─────────────────────────────────────────────────────────

class ClusterStats(BaseModel):
    cluster_id: int
    cluster_label: str
    description: str
    vehicle_count: int
    avg_price: float
    avg_range: float
    avg_battery: float
    avg_charge_time: float
    avg_safety: float
    avg_autonomy: float
    representative_vehicles: List[VehicleOut]


class ClustersResponse(BaseModel):
    total_clusters: int
    algorithm: str = "K-Means (k=3, cosine similarity)"
    clusters: List[ClusterStats]


# ─── FEEDBACK SCHEMA ─────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    session_token: str
    vehicle_id: int
    rank: int
    was_helpful: bool


class FeedbackResponse(BaseModel):
    status: str
    message: str
