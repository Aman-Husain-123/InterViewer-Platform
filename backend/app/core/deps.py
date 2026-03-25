"""
FastAPI dependency: get_current_user
Extracts and validates the Bearer JWT from the Authorization header.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.core.security import verify_jwt_token

http_bearer = HTTPBearer(auto_error=True)


class CurrentUser(BaseModel):
    """Slim user object passed to route handlers."""
    id: str
    email: str | None = None
    role: str = "candidate"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
) -> CurrentUser:
    """
    FastAPI dependency that validates the Supabase session token.
    Uses the direct Auth API for 100% reliable verification.
    """
    # The return from verify_jwt_token is now the Supabase user object from /auth/v1/user
    user_data = verify_jwt_token(credentials.credentials)

    user_id: str | None = user_data.get("id") # /user endpoint returns id, not sub
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )

    email: str | None = user_data.get("email")
    app_meta: dict = user_data.get("app_metadata", {})
    user_meta: dict = user_data.get("user_metadata", {})
    
    # Supabase profile roles are often stored in app_metadata
    role: str = app_meta.get("role") or user_meta.get("role") or "candidate"

    return CurrentUser(id=user_id, email=email, role=role)
