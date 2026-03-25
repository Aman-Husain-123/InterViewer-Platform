from app.core.celery import celery_app
from app.db.supabase import supabase
from app.services.email_service import send_reminder_email
from datetime import datetime, timedelta
import pytz

@celery_app.task
def send_interview_reminders():
    """
    Checks for all interviews scheduled in the next 24h.
    Sends reminders to candidates who haven't been reminded yet.
    """
    now = datetime.now(pytz.UTC)
    max_remind_time = now + timedelta(hours=24)
    
    # 1. Fetch scheduled interviews in next 24h
    res = supabase.table("interviews").select("*, applications(name, email, job_id)") \
        .eq("status", "scheduled") \
        .gt("scheduled_at", now.isoformat()) \
        .lt("scheduled_at", max_remind_time.isoformat()) \
        .execute()
    
    if not res.data:
        print("No reminders to send.")
        return 0
    
    reminders_sent = 0
    for interview in res.data:
        # 2. Extract applicant details
        applicant = interview.get("applications", {})
        email = applicant.get("email")
        name = applicant.get("name")
        scheduled_at = datetime.fromisoformat(interview["scheduled_at"].replace('Z', '+00:00'))
        
        # 3. Send email via service
        if email:
            send_reminder_email(
                to_email=email,
                name=name,
                interview_datetime=scheduled_at
            )
            reminders_sent += 1
            
    return reminders_sent
