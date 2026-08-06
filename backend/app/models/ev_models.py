"""
EVOS — Database ORM Models
Tables: electric_vehicles, user_sessions, recommendation_logs, cluster_assignments
"""
from sqlalchemy import (
    Column, Integer, Float, String, Boolean, DateTime,
    ForeignKey, JSON, Text, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ElectricVehicle(Base):
    __tablename__ = "electric_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, unique=True, nullable=False, index=True)
    manufacturer = Column(String(100), nullable=False, index=True)
    model = Column(String(200), nullable=False)
    year = Column(Integer, nullable=False)
    battery_type = Column(String(100))
    battery_capacity_kwh = Column(Float, nullable=False)
    range_km = Column(Integer, nullable=False)
    charging_type = Column(String(100))
    charge_time_hr = Column(Float, nullable=False)
    price_usd = Column(Float, nullable=False)
    color = Column(String(100))
    country_of_manufacture = Column(String(100))
    autonomous_level = Column(Float, default=0)
    co2_emissions_g_per_km = Column(Float, default=0)
    safety_rating = Column(Float)
    units_sold_2024 = Column(Integer, default=0)
    warranty_years = Column(Integer, default=0)

    # Computed cluster assignment
    cluster_id = Column(Integer, nullable=True)
    cluster_label = Column(String(50), nullable=True)

    # Feature vector (stored as JSON for quick lookup)
    feature_vector = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recommendation_logs = relationship("RecommendationLog", back_populates="vehicle")

    __table_args__ = (
        Index("ix_ev_price", "price_usd"),
        Index("ix_ev_range", "range_km"),
        Index("ix_ev_battery", "battery_capacity_kwh"),
        Index("ix_ev_cluster", "cluster_id"),
    )

    def __repr__(self):
        return f"<EV {self.manufacturer} {self.model} ({self.year})>"


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String(64), unique=True, nullable=False, index=True)
    cluster_label = Column(String(50), nullable=True)   # budget | performance | longrange

    # Stored preferences
    pref_max_price = Column(Float, nullable=True)
    pref_min_range = Column(Float, nullable=True)
    pref_min_battery = Column(Float, nullable=True)
    pref_max_charge_time = Column(Float, nullable=True)
    pref_min_safety = Column(Float, nullable=True)
    pref_min_autonomy = Column(Float, nullable=True)
    feature_weights = Column(JSON, nullable=True)

    # Metadata
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    recommendation_logs = relationship("RecommendationLog", back_populates="session")


class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("user_sessions.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("electric_vehicles.id"), nullable=True)

    rank = Column(Integer, nullable=False)           # 1–5
    similarity_score = Column(Float, nullable=False)
    explanation_text = Column(Text, nullable=True)

    # Snapshot of user preferences at time of recommendation
    user_preferences = Column(JSON, nullable=True)
    feature_weights = Column(JSON, nullable=True)
    cluster_label = Column(String(50), nullable=True)

    # User feedback (optional)
    was_clicked = Column(Boolean, default=False)
    was_helpful = Column(Boolean, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("UserSession", back_populates="recommendation_logs")
    vehicle = relationship("ElectricVehicle", back_populates="recommendation_logs")

    __table_args__ = (
        Index("ix_rec_session", "session_id"),
        Index("ix_rec_created", "created_at"),
    )


class ClusterProfile(Base):
    __tablename__ = "cluster_profiles"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, unique=True, nullable=False)
    cluster_label = Column(String(50), nullable=False)   # budget | performance | longrange
    description = Column(Text, nullable=True)

    # Centroid statistics
    avg_price = Column(Float)
    avg_range = Column(Float)
    avg_battery = Column(Float)
    avg_charge_time = Column(Float)
    avg_safety = Column(Float)
    avg_autonomy = Column(Float)
    vehicle_count = Column(Integer)

    centroid_vector = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
