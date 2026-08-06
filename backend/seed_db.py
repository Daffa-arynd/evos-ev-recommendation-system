"""
EVOS — Database Seeder
Loads electric_vehicles_dataset.csv into PostgreSQL
and runs the ML pipeline to populate cluster assignments.

Usage:
    python seed_db.py
"""
import asyncio
import pandas as pd
import numpy as np
import sys
import os

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.ev_models import ElectricVehicle, ClusterProfile
from app.ml.pipeline import EVRecommendationEngine
from app.core.config import settings
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Tables created")


async def seed_vehicles(engine_ml: EVRecommendationEngine):
    """Insert all vehicles from the ML engine's loaded records into PostgreSQL."""
    async with AsyncSessionLocal() as session:
        # Clear existing
        await session.execute(text("DELETE FROM recommendation_logs"))
        await session.execute(text("DELETE FROM electric_vehicles"))
        await session.commit()
        logger.info("🗑️  Cleared existing vehicle records")

        records = engine_ml.records
        batch_size = 200
        inserted = 0

        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            for rec in batch:
                ev = ElectricVehicle(
                    vehicle_id=rec.vehicle_id,
                    manufacturer=rec.manufacturer,
                    model=rec.model,
                    year=rec.year,
                    battery_type=rec.battery_type,
                    battery_capacity_kwh=rec.battery_capacity_kwh,
                    range_km=int(rec.range_km),
                    charging_type=rec.charging_type,
                    charge_time_hr=rec.charge_time_hr,
                    price_usd=rec.price_usd,
                    color=rec.color,
                    autonomous_level=rec.autonomous_level,
                    safety_rating=rec.safety_rating,
                    warranty_years=int(rec.warranty_years),
                    cluster_id=rec.cluster_id,
                    cluster_label=rec.cluster_label,
                    feature_vector=rec.feature_vector,
                )
                session.add(ev)
            await session.commit()
            inserted += len(batch)
            logger.info(f"   Inserted {inserted}/{len(records)} vehicles...")

        logger.info(f"✅ Seeded {inserted} vehicles into PostgreSQL")


async def seed_clusters(engine_ml: EVRecommendationEngine):
    """Insert cluster profile statistics."""
    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM cluster_profiles"))
        await session.commit()

        stats = engine_ml.get_cluster_stats()
        label_map = {"budget": "Value-focused: cost-efficient EVs with solid specs per dollar.",
                     "performance": "High-spec: advanced safety, autonomy, and battery systems.",
                     "longrange": "Maximum driving range per charge with fast-charging capability."}

        for s in stats:
            cp = ClusterProfile(
                cluster_id=s["cluster_id"],
                cluster_label=s["cluster_label"],
                description=label_map.get(s["cluster_label"], ""),
                avg_price=s["avg_price"],
                avg_range=s["avg_range"],
                avg_battery=s["avg_battery"],
                avg_charge_time=s["avg_charge_time"],
                avg_safety=s["avg_safety"],
                avg_autonomy=s["avg_autonomy"],
                vehicle_count=s["vehicle_count"],
                centroid_vector=s["centroid"],
            )
            session.add(cp)
        await session.commit()
        logger.info(f"✅ Seeded {len(stats)} cluster profiles")


async def main():
    logger.info("🚀 Starting EVOS database seeder...")

    # Create tables
    await create_tables()

    # Train ML pipeline
    logger.info("🤖 Training ML pipeline...")
    ml = EVRecommendationEngine()
    await ml.initialize()

    # Seed vehicles
    await seed_vehicles(ml)

    # Seed clusters
    await seed_clusters(ml)

    logger.info("🎉 Database seeding complete!")
    logger.info(f"   Total vehicles: {len(ml.records)}")
    logger.info(f"   Clusters: {settings.ML_KMEANS_CLUSTERS}")

    # Print cluster summary
    for cid, label in ml.cluster_label_map.items():
        count = sum(1 for r in ml.records if r.cluster_id == cid)
        avg_price = np.mean([r.price_usd for r in ml.records if r.cluster_id == cid])
        logger.info(f"   [{label}] cluster {cid}: {count} vehicles, avg ${avg_price:,.0f}")


if __name__ == "__main__":
    asyncio.run(main())
