"""Health check router."""
from fastapi import APIRouter
from apps.api.models.requests import HealthResponse
from apps.api.services.learned_router import learned_router
from apps.api.serializers.registry import ALL_FORMAT_IDS

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        formats_available=len(ALL_FORMAT_IDS),
        validation_enabled=True,
        learned_router_trained=learned_router.is_trained,
    )
