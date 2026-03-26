"""
Celery task: send interview reminders.

Runs every hour via Celery Beat (configured in app/core/celery.py).

Strategy:
  - Query interviews scheduled in the next 24 hours whose reminder_sent=False.
  - Send each candidate a reminder email.
  - Mark reminder_sent=True so we never double-send.
"""

from app.core.celery import celery_app
from app.db.supabase import supabase
from app.services.email_service import send_reminder_email
from datetime import datetime, timedelta
import pytz


@celery_app.task(name="app.tasks.reminders.send_interview_reminders", bind=True, max_retries=3)
def send_interview_reminders(self):
    """
    Checks interviews scheduled in the next 24 h that have NOT yet received
    a reminder (reminder_sent=False) and sends them.

    The task name must match the key in celery_app.conf.beat_schedule.
    bind=True lets us call self.retry() on transient failures.
    """
    now          = datetime.now(pytz.UTC)
    remind_until = now + timedelta(hours=24)

    try:
        res = (
            supabase.table("interviews")
            .select("id, scheduled_at, unique_link, applications(candidates(name, email), name, email)")
            .eq("status", "scheduled")
            .eq("reminder_sent", False)
            .gt("scheduled_at", now.isoformat())
            .lt("scheduled_at", remind_until.isoformat())
            .execute()
        )
    except Exception as exc:
        print(f"[REMINDER TASK] DB fetch error: {exc}")
        raise self.retry(exc=exc, countdown=60)

    if not res.data:
        print("[REMINDER TASK] No reminders to send.")
        return 0

    reminders_sent = 0
    ids_to_mark: list[str] = []

    for interview in res.data:
        interview_id = interview["id"]
        scheduled_at_raw = interview["scheduled_at"]

        # ── Resolve candidate details ─────────────────────────────────────
        app_data  = interview.get("applications") or {}
        candidate = (app_data.get("candidates") or {})
        email = candidate.get("email") or app_data.get("email")
        name  = candidate.get("name")  or app_data.get("name", "Candidate")

        if not email:
            print(f"[REMINDER TASK] Skipping {interview_id} — no email found.")
            continue

        # ── Parse datetime ────────────────────────────────────────────────
        try:
            scheduled_at = datetime.fromisoformat(
                scheduled_at_raw.replace("Z", "+00:00")
            )
        except Exception as exc:
            print(f"[REMINDER TASK] Bad datetime for {interview_id}: {exc}")
            continue

        # ── Send reminder ─────────────────────────────────────────────────
        try:
            send_reminder_email(
                to_email=email,
                name=name,
                interview_datetime=scheduled_at,
            )
            ids_to_mark.append(interview_id)
            reminders_sent += 1
            print(f"[REMINDER TASK] Sent reminder to {email} for interview {interview_id}")
        except Exception as exc:
            print(f"[REMINDER TASK] Failed to send reminder to {email}: {exc}")

    # ── Batch-mark as reminded ────────────────────────────────────────────
    if ids_to_mark:
        try:
            supabase.table("interviews").update({"reminder_sent": True}).in_(
                "id", ids_to_mark
            ).execute()
        except Exception as exc:
            print(f"[REMINDER TASK] Failed to mark reminder_sent: {exc}")

    print(f"[REMINDER TASK] Done. {reminders_sent} reminder(s) sent.")
    return reminders_sent
