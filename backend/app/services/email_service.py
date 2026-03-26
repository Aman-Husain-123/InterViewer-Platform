"""
Email Service — AWS SES + iCalendar attachment support.

Key design decisions:
  - SES client is initialized LAZILY inside _get_ses_client() so that importing
    this module never crashes when DEBUG=True or AWS creds are not set.
  - In DEBUG mode every function logs to stdout and returns a mock response
    so the rest of the system works without real AWS credentials.
  - generate_ical_attachment uses timedelta for dtend to avoid hour=24 overflow.
"""

import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from icalendar import Calendar, Event
from datetime import datetime, timedelta
import pytz
from typing import Optional
import uuid as _uuid

# ── Lazy SES client ───────────────────────────────────────────────────────────
_ses_client = None


def _get_ses_client():
    """Return a cached SES boto3 client; create it on first call."""
    global _ses_client
    if _ses_client is None:
        _ses_client = boto3.client(
            "ses",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )
    return _ses_client


# ── iCalendar helper ──────────────────────────────────────────────────────────

def generate_ical_attachment(
    interview_datetime: datetime,
    interview_link: str,
    candidate_name: str,
    job_title: str,
) -> bytes:
    """
    Generates a .ics byte buffer for a calendar invite.
    Uses timedelta for dtend to avoid hour overflow (e.g. 23:00 + 1h).
    """
    cal = Calendar()
    cal.add("prodid", "-//AI Interviewer//HireOS//")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")
    cal.add("method", "REQUEST")

    event = Event()
    event.add("uid", str(_uuid.uuid4()))
    event.add("summary", f"Interview for {job_title}")
    event.add("dtstart", interview_datetime)
    event.add("dtend", interview_datetime + timedelta(hours=1))   # ← safe
    event.add(
        "description",
        f"Hello {candidate_name},\n\n"
        f"Your AI-guided interview for {job_title} is scheduled.\n"
        f"Room Link: {interview_link}\n\n"
        "Please join from a quiet place with a stable internet connection.",
    )
    event.add("location", interview_link)
    event.add("status", "CONFIRMED")

    cal.add_component(event)
    return cal.to_ical()


# ── Core SES send ─────────────────────────────────────────────────────────────

def send_email_via_ses(
    to_email: str,
    subject: str,
    html_body: str,
    attachment: Optional[bytes] = None,
    filename: str = "invite.ics",
) -> Optional[dict]:
    """
    General-purpose SES send.  Supports optional .ics attachment.
    Falls back to console output when DEBUG=True.
    """
    if settings.DEBUG:
        print("=" * 60)
        print(f"[EMAIL DEBUG] To      : {to_email}")
        print(f"[EMAIL DEBUG] Subject : {subject}")
        print(f"[EMAIL DEBUG] Body    : {html_body[:200]}...")
        if attachment:
            print(f"[EMAIL DEBUG] Attach  : {filename} ({len(attachment)} bytes)")
        print("=" * 60)
        return {"MessageId": "mock-debug-id"}

    try:
        if not attachment:
            response = _get_ses_client().send_email(
                Source=settings.SES_FROM_EMAIL,
                Destination={"ToAddresses": [to_email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}},
                },
            )
            return response

        # ── Multipart with .ics attachment ────────────────────────────────
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.application import MIMEApplication

        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = settings.SES_FROM_EMAIL
        msg["To"] = to_email

        msg.attach(MIMEText(html_body, "html", "utf-8"))

        part = MIMEApplication(attachment, _subtype="octet-stream")
        part.add_header("Content-Disposition", "attachment", filename=filename)
        part.add_header("Content-Type", "text/calendar; method=REQUEST")
        msg.attach(part)

        response = _get_ses_client().send_raw_email(
            Source=settings.SES_FROM_EMAIL,
            Destinations=[to_email],
            RawMessage={"Data": msg.as_bytes()},
        )
        return response

    except ClientError as exc:
        print(f"[SES ERROR] {exc.response['Error']['Message']}")
        return None
    except Exception as exc:
        print(f"[EMAIL ERROR] Unexpected: {exc}")
        return None


# ── Public email functions ────────────────────────────────────────────────────

def send_invite_email(
    to_email: str, name: str, job_title: str, schedule_link: str
) -> Optional[dict]:
    """Sends the initial scheduling invitation to a candidate."""
    subject = f"You're Invited — Interview for {job_title}"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 40px;">
        <div style="max-width: 600px; margin: auto; background: #1e1e2e; border-radius: 16px; padding: 40px; border: 1px solid #2d2d3e;">
            <h2 style="color: #818cf8; margin-top: 0;">Congratulations, {name}!</h2>
            <p>You have been invited to an AI-guided interview for the <strong>{job_title}</strong> position.</p>
            <p>Please use the link below to select your preferred time slot:</p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="{schedule_link}"
                   style="padding: 14px 28px; background: #4f46e5; color: white;
                          text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Schedule My Interview
                </a>
            </p>
            <p style="color: #64748b; font-size: 13px;">
                The link above is unique to your application. Please do not share it.
            </p>
            <br/>
            <p>Best regards,<br/><strong>Hiring Team</strong></p>
        </div>
    </body>
    </html>
    """
    return send_email_via_ses(to_email, subject, body)


def send_confirmation_email(
    to_email: str,
    name: str,
    interview_datetime: datetime,
    interview_link: str,
    job_title: str = "Applied Role",
) -> Optional[dict]:
    """Sends booking confirmation with a .ics calendar attachment."""
    subject = f"Interview Confirmed — {job_title}"
    formatted_time = interview_datetime.strftime("%A, %B %d, %Y at %I:%M %p UTC")

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 40px;">
        <div style="max-width: 600px; margin: auto; background: #1e1e2e; border-radius: 16px; padding: 40px; border: 1px solid #2d2d3e;">
            <h2 style="color: #34d399; margin-top: 0;">✅ Interview Confirmed!</h2>
            <p>Hi <strong>{name}</strong>,</p>
            <p>Your AI interview for <strong>{job_title}</strong> is scheduled for:</p>
            <p style="font-size: 20px; font-weight: bold; color: #818cf8;">{formatted_time}</p>
            <p>Join your interview room here:</p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="{interview_link}"
                   style="padding: 14px 28px; background: #4f46e5; color: white;
                          text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Join Interview Room
                </a>
            </p>
            <p>We've attached a .ics calendar file to this email — add it to your calendar to get a reminder.</p>
            <br/>
            <p>Good luck! 🎉<br/><strong>Hiring Team</strong></p>
        </div>
    </body>
    </html>
    """

    ical_data = generate_ical_attachment(
        interview_datetime, interview_link, name, job_title
    )
    return send_email_via_ses(
        to_email, subject, body, attachment=ical_data, filename="interview.ics"
    )


def send_reminder_email(
    to_email: str, name: str, interview_datetime: datetime
) -> Optional[dict]:
    """Sends a 24-hour reminder email to the candidate."""
    subject = "⏰ Reminder: Your Interview is Tomorrow"
    formatted_time = interview_datetime.strftime("%I:%M %p UTC")
    formatted_date = interview_datetime.strftime("%A, %B %d, %Y")

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 40px;">
        <div style="max-width: 600px; margin: auto; background: #1e1e2e; border-radius: 16px; padding: 40px; border: 1px solid #2d2d3e;">
            <h2 style="color: #fbbf24; margin-top: 0;">⏰ Interview Tomorrow</h2>
            <p>Hi <strong>{name}</strong>,</p>
            <p>Just a friendly reminder that you have an AI interview scheduled for:</p>
            <p style="font-size: 20px; font-weight: bold; color: #818cf8;">{formatted_date} at {formatted_time}</p>
            <p>To prepare:</p>
            <ul style="color: #94a3b8;">
                <li>Find a quiet place with a stable internet connection</li>
                <li>Test your camera and microphone beforehand</li>
                <li>Review the job requirements</li>
            </ul>
            <br/>
            <p>See you tomorrow! 🚀<br/><strong>Hiring Team</strong></p>
        </div>
    </body>
    </html>
    """
    return send_email_via_ses(to_email, subject, body)
