from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import pytz
from app.db.supabase import supabase
from app.services.email_service import send_confirmation_email, send_invite_email
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()

class BookingCreate(BaseModel):
    application_id: str
    scheduled_at: datetime

class InviteRequest(BaseModel):
    application_id: str


@router.get("/slots")
async def get_available_slots(application_id: str):
    """
    Returns available 1-hour slots for the next 7 days.
    (09:00, 10:00, 11:00, 14:00, 15:00, 16:00)
    Excludes already booked slots.
    """
    # 1. FETCH BOOKED SLOTS
    # Query all interviews in the next 8 days
    now = datetime.now(pytz.UTC)
    booked_res = supabase.table("interviews").select("scheduled_at").gt("scheduled_at", now.isoformat()).execute()
    booked_datetimes = {datetime.fromisoformat(b["scheduled_at"].replace('Z', '+00:00')) for b in booked_res.data}

    # 2. GENERATE POTENTIAL SLOTS
    slots = []
    base_hours = [9, 10, 11, 14, 15, 16]
    
    for i in range(1, 8):  # Next 7 days
        day = (now + timedelta(days=i)).date()
        for hour in base_hours:
            slot_time = datetime.combine(day, datetime.min.time().replace(hour=hour)).replace(tzinfo=pytz.UTC)
            
            # Check if this slot was already booked
            if slot_time not in booked_datetimes:
                slots.append(slot_time)

    return {"slots": slots}


@router.post("/book")
async def book_interview(booking: BookingCreate):
    """
    Books an interview slot.
    - Validates slot availability.
    - Creates interview row.
    - Updates application status.
    - Sends confirmation email.
    """
    try:
        # 1. Validate slot availability (double-check for race conditions)
        check_res = supabase.table("interviews").select("*").eq("scheduled_at", booking.scheduled_at.isoformat()).execute()
        if check_res.data:
            raise HTTPException(status_code=400, detail="Slot already taken. Please choose another one.")

        # 2. Fetch Application & Applicant Info
        app_res = supabase.table("applications").select("*, jobs(title)").eq("id", booking.application_id).execute()
        if not app_res.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        applicant = app_res.data[0]
        job_title = applicant.get("jobs", {}).get("title", "Applied Position")
        email = applicant.get("email")
        name = applicant.get("name")

        # 3. Create Interview Row
        interview_id = str(uuid.uuid4())
        unique_link = f"{settings.FRONTEND_URL}/room/{interview_id}"
        
        insert_res = supabase.table("interviews").insert({
            "id": interview_id,
            "application_id": booking.application_id,
            "scheduled_at": booking.scheduled_at.isoformat(),
            "status": "scheduled"
        }).execute()
        
        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to create interview record")

        # 4. Update Application Status
        supabase.table("applications").update({
            "status": "interview_scheduled",
            "interview_id": interview_id
        }).eq("id", booking.application_id).execute()

        # 5. Send Confirmation Email
        send_confirmation_email(
            to_email=email,
            name=name,
            interview_datetime=booking.scheduled_at,
            interview_link=unique_link,
            job_title=job_title
        )

        return {
            "interview_id": interview_id,
            "unique_link": unique_link,
            "scheduled_at": booking.scheduled_at
        }
    except Exception as e:
        print(f"Booking Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/invite")
async def invite_candidate(payload: InviteRequest):
    """
    Formally invites a candidate to an interview.
    - Updates status to 'invited'
    - Sends invitation email with scheduling link
    """
    try:
        # 1. Fetch Application & Job Title
        app_res = supabase.table("applications").select("*, jobs(title)").eq("id", payload.application_id).execute()
        if not app_res.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        app = app_res.data[0]
        name = app.get("name")
        email = app.get("email")
        job_title = app.get("jobs", {}).get("title", "Role")
        
        # 2. Update status to 'invited'
        supabase.table("applications").update({"status": "invited"}).eq("id", payload.application_id).execute()
        
        # 3. Send Invitation Email
        schedule_link = f"{settings.FRONTEND_URL}/schedule/{payload.application_id}"
        
        send_invite_email(
            to_email=email,
            name=name,
            job_title=job_title,
            schedule_link=schedule_link
        )
        
        return {"message": "Candidate invited successfully"}
        
    except Exception as e:
        print(f"Invite Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
