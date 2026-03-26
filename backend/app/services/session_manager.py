import json
import logging
from typing import Any, Dict, Optional
from redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class SessionManager:
    def __init__(self, redis_url: str = settings.REDIS_URL):
        self.redis: Redis = Redis.from_url(redis_url, decode_responses=True)
        self.ttl = 14400  # 4 hours

    async def get_session(self, interview_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve interview state from Redis."""
        key = f"interview_session:{interview_id}"
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set_session(self, interview_id: str, state: Dict[str, Any]):
        """Store/Update interview state in Redis with 4-hour TTL."""
        key = f"interview_session:{interview_id}"
        await self.redis.setex(key, self.ttl, json.dumps(state))

    async def delete_session(self, interview_id: str):
        """Remove interview state from Redis."""
        key = f"interview_session:{interview_id}"
        await self.redis.delete(key)

session_manager = SessionManager()
