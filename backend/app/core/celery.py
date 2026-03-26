"""
Celery application factory.

Task name in beat_schedule MUST match the `name=` kwarg on the @celery_app.task
decorator in reminders.py: "app.tasks.reminders.send_interview_reminders"
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_interviewer",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Auto-discover tasks in this list so Beat can schedule them
    include=["app.tasks.reminders"],
    # Prevent tasks from running when the broker is unavailable
    task_always_eager=False,
    # Avoid stale connections on long-running workers
    broker_connection_retry_on_startup=True,
)

# ── Celery Beat schedule ──────────────────────────────────────────────────────
celery_app.conf.beat_schedule = {
    "send-reminders-every-hour": {
        # Must match name= in @celery_app.task decorator
        "task":     "app.tasks.reminders.send_interview_reminders",
        "schedule": 3600.0,   # every 3600 seconds = 1 hour
    },
}
