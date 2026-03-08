"""
Smart Door Lock – FastAPI Backend

Startup:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Environment variables are loaded from .env (see .env.example).
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, credentials, devices, events, media, sensors, settings, profiles, pins
from pathlib import Path

# Routers
from routers import auth, credentials, devices, events, media, sensors, settings, profiles

# WebSocket handlers
from ws.device_ws import device_ws_endpoint
from ws.client_ws import client_ws_endpoint
from ws.manager import manager

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ─── App factory ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Smart Lock backend starting up…")
    yield
    logger.info("Smart Lock backend shutting down…")


app = FastAPI(
    title="Smart Door Lock API",
    description=(
        "REST + WebSocket backend for the Smart Door Lock system.\n\n"
        "## Authentication\n"
        "All protected routes require an `Authorization: Bearer <access_token>` header.\n\n"
        "## WebSocket channels\n"
        "- `ws://<host>/ws/device` – ESP32 device channel\n"
        "- `ws://<host>/ws/client` – Mobile app channel\n"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*", # Bypasses the strict "*" check while allowing all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── REST routers ────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(events.router)
app.include_router(settings.router)
app.include_router(credentials.router)
app.include_router(sensors.router)
app.include_router(media.router)
app.include_router(profiles.router)
app.include_router(pins.router)

# ─── WebSocket endpoints ─────────────────────────────────────────────────────

@app.websocket("/ws/device")
async def ws_device(websocket: WebSocket):
    """
    ESP32 device channel.

    First message must be: {"type": "hello", "deviceId": "smartlock_XXXX"}
    """
    await device_ws_endpoint(websocket)


@app.websocket("/ws/client")
async def ws_client(websocket: WebSocket):
    """
    Mobile app channel.

    First message must be: {"type": "subscribe", "deviceId": "smartlock_XXXX"}
    """
    await client_ws_endpoint(websocket)

# ─── Static file serving for local media uploads ─────────────────────────────

uploads_path = Path("uploads")
uploads_path.mkdir(exist_ok=True)
app.mount("/media/files", StaticFiles(directory=str(uploads_path)), name="media_files")

# ─── Health / diagnostics ────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}


@app.get("/ws/stats", tags=["meta"])
async def ws_stats():
    """Return connected device and client subscription counts."""
    return manager.stats()
