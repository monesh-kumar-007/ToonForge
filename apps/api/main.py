"""TOONFORGE FastAPI Application — Main Entry Point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from apps.api.config.settings import settings
from apps.api.routers.health import router as health_router
from apps.api.routers.serialize import router as serialize_router
from apps.api.routers.route import router as route_router
from apps.api.routers.benchmark import benchmark_router, learned_router_router
from apps.api.routers.reliability import router as reliability_router

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("toonforge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TOONFORGE API starting up.")
    logger.info(f"Token proxy: {__import__('apps.api.services.tokenizer', fromlist=['token_estimator']).token_estimator.proxy_label}")
    yield
    logger.info("TOONFORGE API shutting down.")


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global Error Handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred. Python stack traces are not exposed.",
        },
    )

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(serialize_router)
app.include_router(route_router)
app.include_router(benchmark_router)
app.include_router(learned_router_router)
app.include_router(reliability_router)

# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "project": "TOONFORGE",
        "title": settings.APP_DESCRIPTION,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
