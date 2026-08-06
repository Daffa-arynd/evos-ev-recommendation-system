"""EVOS — Health Check Router"""
from fastapi import APIRouter, Request
from datetime import datetime

router = APIRouter()


@router.get("")
async def health(request: Request):
    ml = getattr(request.app.state, "ml_engine", None)
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "ml_engine": "ready" if (ml and ml.is_ready) else "initializing",
        "vehicles_loaded": len(ml.records) if ml else 0,
        "version": "1.0.0",
    }
