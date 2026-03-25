"""
JWT verification utilities.
Uses Supabase Auth API to verify tokens directly (the ultimate source of truth).
"""
from __future__ import annotations
import httpx
from fastapi import HTTPException, status
from app.core.config import settings

def verify_jwt_token(token: str) -> dict:
    """
    Validates the Supabase JWT by calling the Supabase Auth /user endpoint.
    This bypasses local JWT Secret issues and ensures the token is 100% valid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Call Supabase Auth API to verify the token
        # This is the most reliable way as it uses Supabase's own verification logic
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {token}"
        }
        
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"Supabase Auth Verification Failed: {response.status_code} - {response.text}")
            raise credentials_exception
            
        return response.json()
    except Exception as e:
        print(f"JWT Validation Error: {str(e)}")
        raise credentials_exception
