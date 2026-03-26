from pydantic import BaseModel
from typing import List, Optional

class JobBase(BaseModel):
    title: str
    description: str
    requirements: List[str]
    department: str

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str
    recruiter_id: str
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ApplicationBase(BaseModel):
    job_id: str
    name: str
    email: str
    phone: str
    resume_text: str

class ApplicationCreate(ApplicationBase):
    pass

class AssessmentBase(BaseModel):
    application_id: str
    behavioral_score: Optional[int] = None
    technical_score: Optional[int] = None
    core_skills_score: Optional[int] = None
    overall_score: Optional[int] = None
    feedback: Optional[str] = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    id: str


class SlotResponse(BaseModel):
    slot_id: str
    start: str
    end: str
    date: str


class BookSlotRequest(BaseModel):
    application_id: str
    slot_id: str


class BookSlotResponse(BaseModel):
    interview_id: str
    unique_link: str
    scheduled_at: str


class InterviewState(BaseModel):
    round: str
    transcript: List[str] = []


class ApplicationResponse(ApplicationBase):
    id: str
    status: str
    match_score: Optional[float] = None
    parsed_data: Optional[dict] = None
    interview_id: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Notification & Interview Invite Schemas
# ─────────────────────────────────────────────────────────────────────────────

class NotificationMetadata(BaseModel):
    """Metadata stored in notifications.metadata JSONB field"""
    invite_id: Optional[str] = None
    interview_id: Optional[str] = None
    application_id: Optional[str] = None
    timestamp: Optional[str] = None


class NotificationResponse(BaseModel):
    """Response model for notifications"""
    id: str
    user_id: str
    type: str  # "INTERVIEW_INVITE", "RESPONSE", "REMINDER", etc.
    title: str
    message: str
    metadata: Optional[dict] = None
    is_read: bool
    created_at: str


class InterviewInviteCreate(BaseModel):
    """Request to send interview invite"""
    application_id: str
    proposed_time_slots: List[str]  # ISO 8601 datetime strings


class InterviewInviteResponse(BaseModel):
    """Response model for interview invites"""
    id: str
    recruiter_id: str
    application_id: str
    proposed_time_slots: List[str]  # ISO 8601 datetime strings
    selected_time_slot: Optional[str] = None
    status: str  # "pending", "accepted", "rejected", "cancelled"
    created_at: str
    updated_at: str


class CandidateResponseRequest(BaseModel):
    """Request from candidate responding to invite"""
    selected_time_slot: str  # ISO 8601 datetime string


class RecruiterResponseData(BaseModel):
    """Response data for recruiter's candidate responses"""
    invite_id: str
    application_id: str
    candidate_name: str
    candidate_email: str
    job_title: str
    selected_time_slot: Optional[str]
    status: str
    created_at: str
