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
    """Slim token-derived user object passed to route handlers."""
    id: str
    email: str | None = None
    role: str = "candidate"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
) -> CurrentUser:
    """
    FastAPI dependency that validates the Supabase JWT and returns a CurrentUser.
    Inject this into any protected route with: user: CurrentUser = Depends(get_current_user)
    """
    payload = verify_jwt_token(credentials.credentials)

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )

    email: str | None = payload.get("email")
    # Supabase stores app_metadata.role or user_metadata.role
    app_meta: dict = payload.get("app_metadata", {})
    user_meta: dict = payload.get("user_metadata", {})
    role: str = app_meta.get("role") or user_meta.get("role") or "candidate"

    return CurrentUser(id=user_id, email=email, role=role)
