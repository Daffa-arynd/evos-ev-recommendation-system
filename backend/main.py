"""
EVOS — Electric Vehicle Oracle System
FastAPI Backend Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api import vehicles, recommend, clusters, health, statistics
from app.ml.pipeline import EVRecommendationEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚗 Starting EVOS backend...")
    # Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Train ML model on startup
    engine_instance = EVRecommendationEngine()
    await engine_instance.initialize()
    app.state.ml_engine = engine_instance
    logger.info("✅ ML engine ready. EVOS is live.")
    yield
    logger.info("🛑 Shutting down EVOS backend.")


app = FastAPI(
    title="EVOS — Electric Vehicle Oracle System",
    description="Content-Based Filtering EV Recommendation API with Explainable AI",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommendations"])
app.include_router(clusters.router, prefix="/clusters", tags=["Clusters"])
app.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])


@app.get("/")
async def root():
    return {
        "system": "EVOS — Electric Vehicle Oracle System",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": ["/vehicles", "/recommend", "/clusters", "/health"],
    }
