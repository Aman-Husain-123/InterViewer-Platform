"""
Auth endpoints: /api/v1/auth/me
"""
from fastapi import APIRouter, Depends
from app.core.deps import CurrentUser, get_current_user

router = APIRouter()


@router.get("/me", response_model=CurrentUser, summary="Get current authenticated user")
def get_me(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """
    Returns the authenticated user derived from the Supabase JWT.
    Requires Authorization: Bearer <token> header.
    """
    return current_user
