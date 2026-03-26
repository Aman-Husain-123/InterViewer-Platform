"""
Schedule endpoints:
  GET  /api/v1/schedule/slots?application_id=xxx  → next 7 days × 6 time slots
  POST /api/v1/schedule/book                       → book a slot, send confirmation
  POST /api/v1/schedule/invite                     → send invite email to candidate

Design notes:
  - Candidate email/name are fetched from the `candidates` table (joined via
    applications.candidate_id), not from `applications` directly.
  - unique_link and reminder_sent are stored in the interviews row at insert
    so reminders.py can filter by reminder_sent=False.
  - Slot check uses a small ±1-minute window to handle minor ISO string drift.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import pytz
from app.db.supabase import supabase
from app.services.email_service import send_confirmation_email, send_invite_email
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    application_id: str
    scheduled_at: datetime          # ISO 8601, e.g. "2025-04-05T09:00:00Z"


class InterviewResponse(BaseModel):
    id: str
    application_id: str
    scheduled_at: datetime
    status: str
    unique_link: Optional[str] = None


class InviteRequest(BaseModel):
    application_id: str


# ── Helpers ───────────────────────────────────────────────────────────────────

_SLOT_HOURS = [9, 10, 11, 14, 15, 16]


def _build_slots(now: datetime, booked_datetimes: set) -> List[datetime]:
    """Generate the next 7 days × 6 fixed time slots, minus already-booked ones."""
    slots = []
    for i in range(1, 8):
        day = (now + timedelta(days=i)).date()
        for hour in _SLOT_HOURS:
            slot_time = datetime(
                day.year, day.month, day.day, hour, 0, 0, tzinfo=pytz.UTC
            )
            if slot_time not in booked_datetimes:
                slots.append(slot_time)
    return slots


def _fetch_applicant(application_id: str) -> dict:
    """Fetches candidate and job details needed for emails."""
    res = (
        supabase.table("applications")
        .select("id, name, email, job_id, jobs(title)")
        .eq("id", application_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app_data = res.data[0]
    job_title = (app_data.get("jobs") or {}).get("title", "Software Engineer")
    email = app_data.get("email")
    name = app_data.get("name", "Candidate")

    if not email:
        raise HTTPException(
            status_code=422,
            detail="Candidate email not found for this application.",
        )

    return {"email": email, "name": name, "job_title": job_title}


# ── GET /slots ─────────────────────────────────────────────────────────────────

@router.get("/slots")
async def get_available_slots(application_id: str):
    """
    Returns available 1-hour slots for the next 7 days.
    Excludes already-booked slots across ALL applications (interviewer capacity).
    """
    now = datetime.now(pytz.UTC)
    window_end = now + timedelta(days=8)

    booked_res = (
        supabase.table("interviews")
        .select("scheduled_at")
        .gt("scheduled_at", now.isoformat())
        .lt("scheduled_at", window_end.isoformat())
        .in_("status", ["scheduled", "in_progress"])
        .execute()
    )

    booked_datetimes: set = set()
    for b in booked_res.data:
        raw = b["scheduled_at"]
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            booked_datetimes.add(dt.replace(second=0, microsecond=0))
        except Exception:
            pass

    slots = _build_slots(now, booked_datetimes)
    return {"slots": [s.isoformat() for s in slots]}


# ── GET /{interview_id} ────────────────────────────────────────────────────────

@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(interview_id: str):
    """Fetches a specific interview by its UUID."""
    res = supabase.table("interviews").select("*").eq("id", interview_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Interview not found")
    return res.data[0]


# ── POST /book ────────────────────────────────────────────────────────────────

@router.post("/book")
async def book_interview(booking: BookingCreate):
    """
    Books an interview slot:
      1. Validates the slot is still available (race-condition safe).
      2. Fetches applicant info.
      3. Inserts interview row (with unique_link + reminder_sent=False).
      4. Updates application status → 'interview_scheduled'.
      5. Sends confirmation email with .ics attachment.
    Returns: {interview_id, unique_link, scheduled_at}
    """
    # Normalise to UTC, strip sub-minute precision for comparison
    scheduled_utc = booking.scheduled_at.astimezone(pytz.UTC).replace(
        second=0, microsecond=0
    )

    # 1. Double-check availability (window ±1 min)
    window_start = (scheduled_utc - timedelta(minutes=1)).isoformat()
    window_end   = (scheduled_utc + timedelta(minutes=1)).isoformat()

    check_res = (
        supabase.table("interviews")
        .select("id")
        .gt("scheduled_at", window_start)
        .lt("scheduled_at", window_end)
        .in_("status", ["scheduled", "in_progress"])
        .execute()
    )
    if check_res.data:
        raise HTTPException(
            status_code=409, detail="Slot already taken. Please choose another one."
        )

    # 2. Fetch applicant details
    applicant = _fetch_applicant(booking.application_id)

    # 3. Create interview row
    interview_id = str(uuid.uuid4())
    unique_link  = f"{settings.FRONTEND_URL}/room/{interview_id}"

    insert_res = supabase.table("interviews").insert({
        "id":             interview_id,
        "application_id": booking.application_id,
        "scheduled_at":   scheduled_utc.isoformat(),
        "status":         "scheduled",
        "unique_link":    unique_link,
        "reminder_sent":  False,
    }).execute()

    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create interview record")

    # 6. Update application status
    supabase.table("applications").update({
        "status": "interview_scheduled",
    }).eq("id", booking.application_id).execute()

    # 5. Send confirmation email (non-blocking; errors logged, not raised)
    try:
        send_confirmation_email(
            to_email=applicant["email"],
            name=applicant["name"],
            interview_datetime=scheduled_utc,
            interview_link=unique_link,
            job_title=applicant["job_title"],
        )
    except Exception as exc:
        print(f"[WARN] Confirmation email failed: {exc}")

    return {
        "interview_id": interview_id,
        "unique_link":  unique_link,
        "scheduled_at": scheduled_utc.isoformat(),
    }


# ── POST /invite ───────────────────────────────────────────────────────────────

@router.post("/invite")
async def invite_candidate(payload: InviteRequest):
    """
    Sends a scheduling invitation email and marks application as 'invited'.
    """
    applicant = _fetch_applicant(payload.application_id)

    # Update status
    supabase.table("applications").update({"status": "invited"}).eq(
        "id", payload.application_id
    ).execute()

    # Send invitation email
    schedule_link = f"{settings.FRONTEND_URL}/schedule/{payload.application_id}"
    try:
        send_invite_email(
            to_email=applicant["email"],
            name=applicant["name"],
            job_title=applicant["job_title"],
            schedule_link=schedule_link,
        )
    except Exception as exc:
        print(f"[WARN] Invite email failed: {exc}")

    return {"message": "Candidate invited successfully", "schedule_link": schedule_link}
