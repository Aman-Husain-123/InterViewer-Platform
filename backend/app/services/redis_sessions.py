from app.core.redis_client import redis_client

# Step 2: Store Interview Session
def create_session(user_id):
    session_key = f"interview:{user_id}"
    
    redis_client.hset(session_key, mapping={
        "current_question": 1,
        "score": 0,
        "status": "ongoing"
    })
    
    redis_client.expire(session_key, 3600)  # auto-delete after 1 hour

# Step 3: Update Progress
def update_question(user_id, question_no):
    session_key = f"interview:{user_id}"
    redis_client.hset(session_key, "current_question", question_no)

# Step 4: Get Session Data
def get_session(user_id):
    session_key = f"interview:{user_id}"
    return redis_client.hgetall(session_key)

# Step 5: Cache AI Responses (VERY IMPORTANT 💰)
def get_cached_response(question):
    return redis_client.get(f"ai_cache:{question}")

def set_cached_response(question, response):
    redis_client.setex(f"ai_cache:{question}", 3600, response)
