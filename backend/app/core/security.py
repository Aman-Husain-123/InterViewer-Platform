"""
JWT verification utilities using python-jose.
Validates Supabase-issued JWTs for FastAPI dependencies.
"""
from __future__ import annotations

from jose import JWTError, jwt
from fastapi import HTTPException, status
from app.core.config import settings

ALGORITHM = "HS256"


def verify_jwt_token(token: str) -> dict:
    """
    Decode and verify a Supabase JWT.

    Args:
        token: Raw JWT string (without 'Bearer ' prefix).

    Returns:
        Decoded payload dict.

    Raises:
        HTTPException 401 if the token is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},  # Supabase doesn't always include 'aud'
        )
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exception
        return payload
    except JWTError as exc:
        raise credentials_exception from exc
