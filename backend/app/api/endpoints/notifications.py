"""
Notifications & Interview Invites Endpoints

Handles the interview scheduling flow:
1. Recruiter sends invite → creates notification for candidate
2. Candidate views notification (with invite_id in metadata)
3. Candidate clicks → fetches invite details (time slots)
4. Candidate selects slot → updates invite, creates recruiter notification
5. Recruiter views responses

Endpoints:
  POST   /invites                    → Send interview invite
  GET    /invites/{invite_id}        → Get invite details + time slots
  POST   /invites/{invite_id}/respond → Candidate accepts/rejects
  GET    /notifications              → Get candidate's notifications
  POST   /notifications/{id}/read    → Mark notification as read
  GET    /recruiter/responses        → Get recruiter's candidate responses
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime
import pytz
import uuid
import logging
from app.db.supabase import supabase
from app.schemas.schemas import (
    InterviewInviteCreate,
    InterviewInviteResponse,
    NotificationResponse,
    CandidateResponseRequest,
    RecruiterResponseData,
)
from app.api.v1.endpoints.auth import get_current_user
from app.core.deps import CurrentUser
from app.services.email_service import send_invite_email

router = APIRouter()
logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────────────────────────────────────
# HELPERS
# ───────────────────────────────────────────────────────────────────────────────


def _get_application_and_candidate(application_id: str) -> dict:
    """Fetch application + candidate details."""
    res = supabase.table("applications").select("*").eq("id", application_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    app = res.data[0]
    
    # Fetch job title
    job_res = supabase.table("jobs").select("title").eq("id", app["job_id"]).execute()
    job_title = (job_res.data[0]["title"] if job_res.data else "Unknown Position")
    
    return {
        "application": app,
        "job_title": job_title,
    }


def _create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    metadata: Optional[dict] = None,
) -> str:
    """Create a notification record and return its ID."""
    notif_id = str(uuid.uuid4())
    
    insert_res = supabase.table("notifications").insert({
        "id": notif_id,
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "metadata": metadata or {},
        "is_read": False,
        "created_at": datetime.now(pytz.UTC).isoformat(),
    }).execute()
    
    if not insert_res.data:
        logger.error(f"Failed to create notification for user {user_id}")
        raise HTTPException(status_code=500, detail="Failed to create notification")
    
    logger.info(f"✅ Created notification {notif_id} for user {user_id} (type={notification_type})")
    return notif_id


# ───────────────────────────────────────────────────────────────────────────────
# POST /invites → Send Interview Invite
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/invites")
async def send_interview_invite(
    payload: InterviewInviteCreate,
    recruiter: CurrentUser = Depends(get_current_user),
):
    """
    Recruiter sends an interview invite to a candidate.
    
    Creates:
    1. interview_invites record with proposed time slots
    2. Notification for candidate with invite_id in metadata
    
    Returns: {invite_id, message}
    """
    logger.info(f"🔄 Recruiter {recruiter.email} sending invite for application {payload.application_id}")
    
    # Get application & candidate info
    app_data = _get_application_and_candidate(payload.application_id)
    application = app_data["application"]
    job_title = app_data["job_title"]
    candidate_name = application["name"]
    candidate_email = application["email"]
    
    # Create interview_invites record
    invite_id = str(uuid.uuid4())
    
    # Convert time slots to TIMESTAMPTZ format
    try:
        slot_datetimes = []
        for slot in payload.proposed_time_slots:
            if isinstance(slot, str):
                dt = datetime.fromisoformat(slot.replace("Z", "+00:00"))
            else:
                dt = slot
            slot_datetimes.append(dt.isoformat())
    except Exception as e:
        logger.error(f"Failed to parse time slots: {e}")
        raise HTTPException(status_code=400, detail="Invalid time slot format")
    
    invite_res = supabase.table("interview_invites").insert({
        "id": invite_id,
        "recruiter_id": recruiter.id,
        "application_id": payload.application_id,
        "proposed_time_slots": slot_datetimes,
        "status": "pending",
        "created_at": datetime.now(pytz.UTC).isoformat(),
        "updated_at": datetime.now(pytz.UTC).isoformat(),
    }).execute()
    
    if not invite_res.data:
        logger.error(f"Failed to create interview invite for application {payload.application_id}")
        raise HTTPException(status_code=500, detail="Failed to create interview invite")
    
    logger.info(f"✅ Created interview_invites record {invite_id} with {len(slot_datetimes)} slots")
    
    # Get or create candidate profile to find their user_id
    # For now, match by email since candidate_id might be None
    candidate_profile_res = (
        supabase.table("profiles")
        .select("id")
        .ilike("email", candidate_email)
        .execute()
    )
    
    candidate_user_id = None
    if candidate_profile_res.data:
        candidate_user_id = candidate_profile_res.data[0]["id"]
    
    if candidate_user_id:
        # Create notification for candidate
        _create_notification(
            user_id=candidate_user_id,
            notification_type="INTERVIEW_INVITE",
            title=f"Interview Invite: {job_title}",
            message=f"You've been invited to interview for {job_title}. Select your preferred time slot.",
            metadata={
                "invite_id": invite_id,
                "application_id": payload.application_id,
                "job_title": job_title,
            },
        )
        logger.info(f"✅ Created INTERVIEW_INVITE notification for {candidate_email}")
    else:
        logger.warning(f"⚠️ Could not find candidate profile for {candidate_email}, skipping notification")
    
    # Send email invite (non-blocking)
    try:
        schedule_link = f"http://localhost:3000/schedule/{payload.application_id}"  # Adjust if needed
        send_invite_email(
            to_email=candidate_email,
            name=candidate_name,
            job_title=job_title,
            schedule_link=schedule_link,
        )
        logger.info(f"✅ Sent invite email to {candidate_email}")
    except Exception as e:
        logger.warning(f"⚠️ Failed to send invite email: {e}")
    
    # Update application status to "invited" if not already
    supabase.table("applications").update({"status": "invited"}).eq("id", payload.application_id).execute()
    
    return {
        "invite_id": invite_id,
        "message": "Interview invite sent successfully",
        "candidate_email": candidate_email,
    }


# ───────────────────────────────────────────────────────────────────────────────
# GET /invites/{invite_id} → Get Invite Details
# ───────────────────────────────────────────────────────────────────────────────

@router.get("/invites/{invite_id}", response_model=InterviewInviteResponse)
async def get_invite_details(invite_id: str):
    """
    Get interview invite details including proposed time slots.
    Used by candidate's scheduling UI to populate available slots.
    
    Returns: {id, proposed_time_slots, status, ...}
    """
    logger.info(f"🔍 Fetching invite details for {invite_id}")
    
    res = supabase.table("interview_invites").select("*").eq("id", invite_id).execute()
    if not res.data:
        logger.warning(f"Invite not found: {invite_id}")
        raise HTTPException(status_code=404, detail="Interview invite not found")
    
    invite = res.data[0]
    logger.info(f"✅ Found invite {invite_id} with status={invite['status']}, {len(invite.get('proposed_time_slots', []))} slots")
    
    return invite


# ───────────────────────────────────────────────────────────────────────────────
# POST /invites/{invite_id}/respond → Candidate Responds to Invite
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/invites/{invite_id}/respond")
async def respond_to_invite(
    invite_id: str,
    payload: CandidateResponseRequest,
    candidate: CurrentUser = Depends(get_current_user),
):
    """
    Candidate accepts invite by selecting a time slot.
    
    Updates:
    1. interview_invites: selected_time_slot + status="accepted"
    2. Creates "RESPONSE" notification for recruiter
    3. Could create interview record here if you prefer
    
    Returns: {success, message, invite_id}
    """
    logger.info(f"🔄 Candidate {candidate.email} responding to invite {invite_id} with slot {payload.selected_time_slot}")
    
    # Get the invite
    invite_res = supabase.table("interview_invites").select("*").eq("id", invite_id).execute()
    if not invite_res.data:
        logger.warning(f"Invite not found: {invite_id}")
        raise HTTPException(status_code=404, detail="Interview invite not found")
    
    invite = invite_res.data[0]
    
    # Validate that selected slot is in proposed slots
    proposed = invite.get("proposed_time_slots", [])
    try:
        selected_dt = datetime.fromisoformat(payload.selected_time_slot.replace("Z", "+00:00"))
        selected_normalized = selected_dt.replace(second=0, microsecond=0).isoformat()
    except Exception as e:
        logger.error(f"Invalid time slot format: {e}")
        raise HTTPException(status_code=400, detail="Invalid time slot format")
    
    # Check if slot is available
    slot_found = False
    for proposed_slot in proposed:
        try:
            prop_dt = datetime.fromisoformat(proposed_slot.replace("Z", "+00:00") if isinstance(proposed_slot, str) else proposed_slot)
            prop_normalized = prop_dt.replace(second=0, microsecond=0).isoformat()
            if prop_normalized == selected_normalized:
                slot_found = True
                break
        except:
            pass
    
    if not slot_found:
        logger.warning(f"Selected slot not in proposed slots for invite {invite_id}")
        raise HTTPException(status_code=400, detail="Selected time slot not available")
    
    # Update invite: set selected_time_slot and status="accepted"
    update_res = supabase.table("interview_invites").update({
        "selected_time_slot": payload.selected_time_slot,
        "status": "accepted",
        "updated_at": datetime.now(pytz.UTC).isoformat(),
    }).eq("id", invite_id).execute()
    
    if not update_res.data:
        logger.error(f"Failed to update invite {invite_id}")
        raise HTTPException(status_code=500, detail="Failed to update invite")
    
    logger.info(f"✅ Updated interview_invites {invite_id}: status=accepted, selected_time_slot={payload.selected_time_slot}")
    
    # Get application and recruiter info for notification
    app_res = supabase.table("applications").select("*, jobs(title)").eq("id", invite["application_id"]).execute()
    if not app_res.data:
        logger.warning(f"Application not found for invite {invite_id}")
        raise HTTPException(status_code=404, detail="Application not found")
    
    app = app_res.data[0]
    candidate_name = app["name"]
    job_title = (app.get("jobs") or {}).get("title", "Position")
    
    # Create notification for recruiter
    _create_notification(
        user_id=invite["recruiter_id"],
        notification_type="RESPONSE",
        title=f"Scheduling Update: {candidate_name}",
        message=f"{candidate_name} has accepted your interview invite for {job_title} on {payload.selected_time_slot}",
        metadata={
            "invite_id": invite_id,
            "application_id": invite["application_id"],
            "candidate_name": candidate_name,
            "selected_time_slot": payload.selected_time_slot,
        },
    )
    logger.info(f"✅ Created RESPONSE notification for recruiter {invite['recruiter_id']}")
    
    # Optionally: Create interview record here
    # (Alternatively, recruiter confirms from dashboard and creates interview)
    
    return {
        "success": True,
        "message": "Your response has been recorded",
        "invite_id": invite_id,
        "selected_time_slot": payload.selected_time_slot,
    }


# ───────────────────────────────────────────────────────────────────────────────
# GET /notifications → Get Candidate's Notifications
# ───────────────────────────────────────────────────────────────────────────────

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    user: CurrentUser = Depends(get_current_user),
):
    """
    Get all notifications for the logged-in user (candidate or recruiter).
    Includes invite_id in metadata so frontend can fetch invite details.
    
    Returns: [{id, type, message, metadata, is_read, created_at}, ...]
    """
    logger.info(f"🔍 Fetching notifications for user {user.email}")
    
    res = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    
    logger.info(f"✅ Found {len(res.data or [])} notifications for {user.email}")
    return res.data or []


# ───────────────────────────────────────────────────────────────────────────────
# POST /notifications/{id}/read → Mark Notification as Read
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """
    Mark a notification as read.
    """
    logger.info(f"📖 Marking notification {notification_id} as read")
    
    # Verify user owns this notification
    notif_res = supabase.table("notifications").select("user_id").eq("id", notification_id).execute()
    if not notif_res.data or notif_res.data[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    update_res = supabase.table("notifications").update({
        "is_read": True,
    }).eq("id", notification_id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to update notification")
    
    logger.info(f"✅ Marked notification {notification_id} as read")
    return {"success": True, "message": "Notification marked as read"}


# ───────────────────────────────────────────────────────────────────────────────
# GET /recruiter/responses → Get Recruiter's Candidate Responses
# ───────────────────────────────────────────────────────────────────────────────

@router.get("/recruiter/responses", response_model=List[RecruiterResponseData])
async def get_recruiter_responses(
    recruiter: CurrentUser = Depends(get_current_user),
):
    """
    Get all candidate responses (accepted invites) for a recruiter.
    Used to populate "Candidate Responses" section on recruiter dashboard.
    
    Returns: [{invite_id, candidate_name, selected_time_slot, status}, ...]
    """
    logger.info(f"🔍 Fetching candidate responses for recruiter {recruiter.email}")
    
    # Get all invites for this recruiter
    invites_res = (
        supabase.table("interview_invites")
        .select("*, applications(name, email, job_id, jobs(title))")
        .eq("recruiter_id", recruiter.id)
        .order("updated_at", desc=True)
        .execute()
    )
    
    responses = []
    for invite in invites_res.data or []:
        app = invite.get("applications") or {}
        job = app.get("jobs") or {}
        
        response_item = {
            "invite_id": invite["id"],
            "application_id": invite["application_id"],
            "candidate_name": app.get("name", "Unknown"),
            "candidate_email": app.get("email", ""),
            "job_title": job.get("title", "Unknown Position"),
            "selected_time_slot": invite.get("selected_time_slot"),
            "status": invite["status"],
            "created_at": invite["created_at"],
        }
        responses.append(response_item)
    
    logger.info(f"✅ Found {len(responses)} candidate responses for recruiter {recruiter.email}")
    return responses
