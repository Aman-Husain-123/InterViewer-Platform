from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    # Use Service Role Key if available for backend operations to bypass RLS/Storage permissions
    key = settings.SUPABASE_SERVICE_ROLE_KEY if settings.SUPABASE_SERVICE_ROLE_KEY != "your-service-role-key-here" else settings.SUPABASE_KEY
    return create_client(settings.SUPABASE_URL, key)

supabase = get_supabase_client()
