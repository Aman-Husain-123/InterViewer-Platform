import redis
import os
from app.core.config import settings

# Determine Redis URL (Step 1 Enhancement: Docker Aware)
# Use REDIS_URL from env if available (it will be in Docker)
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Step 1: Create Redis connection (Robustly)
redis_client = redis.from_url(
    redis_url,
    decode_responses=True
)
