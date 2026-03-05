"""
JWT creation / validation and password hashing.
"""

import os
import uuid
import logging
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────────────

SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_EXPIRE_MIN: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Password helpers ─────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ─── Token helpers ────────────────────────────────────────────────────────────

def _make_token(data: dict, expire_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expire_delta
    payload["jti"] = str(uuid.uuid4())   # unique token ID (enables revocation later)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(uid: str) -> str:
    return _make_token({"sub": uid, "type": "access"}, timedelta(minutes=ACCESS_EXPIRE_MIN))


def create_refresh_token(uid: str) -> str:
    return _make_token({"sub": uid, "type": "refresh"}, timedelta(days=REFRESH_EXPIRE_DAYS))


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT.  Raises JWTError on invalid / expired tokens.
    Returns the full payload dict.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_uid_from_token(token: str) -> str:
    """Extract the user-id from a valid access token, raising JWTError otherwise."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise JWTError("Token is not an access token")
    uid: str | None = payload.get("sub")
    if not uid:
        raise JWTError("Token has no subject")
    return uid
