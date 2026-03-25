from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    include=["app.tasks.reminders"]
)

# Optional: Celery Beat Schedule
celery_app.conf.beat_schedule = {
    "send-reminders-every-hour": {
        "task": "app.tasks.reminders.send_interview_reminders",
        "schedule": 3600.0,  # 1 hour
    },
}
