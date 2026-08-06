"""
EVOS — Configuration & Settings
Uses pydantic-settings for environment variable management.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "EVOS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://evos_user:evos_pass@localhost:5432/evos_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://evos.yourdomain.com",
    ]

    # ML
    ML_TOP_K: int = 5
    ML_KMEANS_CLUSTERS: int = 3
    ML_KMEANS_ITERATIONS: int = 300
    ML_KMEANS_RANDOM_STATE: int = 42
    ML_MODEL_PATH: str = "models/evos_pipeline.pkl"
    DATASET_PATH: str = "data/electric_vehicles_dataset.csv"

    # Cache
    CACHE_TTL_SECONDS: int = 3600

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
