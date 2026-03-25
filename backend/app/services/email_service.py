import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from icalendar import Calendar, Event
from datetime import datetime
import pytz
from typing import Optional
import os

# Initialize SES Client
ses_client = boto3.client(
    "ses",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)


def generate_ical_attachment(
    interview_datetime: datetime,
    interview_link: str,
    candidate_name: str,
    job_title: str
) -> bytes:
    """
    Generates a .ics byte buffer for a calendar invite.
    """
    cal = Calendar()
    cal.add('prodid', '-//AI Interviewer//HireOS//')
    cal.add('version', '2.0')

    event = Event()
    event.add('summary', f'Interview for {job_title}')
    event.add('dtstart', interview_datetime)
    event.add('dtend', interview_datetime.replace(hour=interview_datetime.hour + 1))
    event.add('description', f'Hello {candidate_name},\n\nYour interview for {job_title} is scheduled.\nRoom Link: {interview_link}')
    event.add('location', interview_link)
    
    cal.add_component(event)
    return cal.to_ical()


def send_email_via_ses(to_email: str, subject: str, html_body: str, attachment: Optional[bytes] = None, filename: str = "invite.ics"):
    """
    General purpose SES send function that supports attachments.
    """
    if settings.DEBUG:
        print(f"DEBUG: Sending email to {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {html_body[:100]}...")
        return {"MessageId": "mock-id"}

    try:
        # If no attachment, use simple send_email
        if not attachment:
            response = ses_client.send_email(
                Source=settings.SES_FROM_EMAIL,
                Destination={"ToAddresses": [to_email]},
                Message={
                    "Subject": {"Data": subject},
                    "Body": {"Html": {"Data": html_body}}
                }
            )
            return response

        # For attachment, use send_raw_email
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.application import MIMEApplication

        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = settings.SES_FROM_EMAIL
        msg["To"] = to_email

        # HTML body
        msg.attach(MIMEText(html_body, "html"))

        # Attachment
        part = MIMEApplication(attachment)
        part.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(part)

        response = ses_client.send_raw_email(
            Source=settings.SES_FROM_EMAIL,
            Destinations=[to_email],
            RawMessage={"Data": msg.as_string()}
        )
        return response

    except ClientError as e:
        print(f"AWS SES ERROR: {e.response['Error']['Message']}")
        return None


def send_invite_email(to_email: str, name: str, job_title: str, schedule_link: str):
    subject = f"Interview Invite: {job_title}"
    body = f"""
    <html>
    <body>
        <h2>Congratulations {name}!</h2>
        <p>You have been invited to an AI interview for the <b>{job_title}</b> position.</p>
        <p>Please use the link below to select your preferred time slot:</p>
        <p><a href="{schedule_link}" style="padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Schedule Interview</a></p>
        <br/>
        <p>Best regards,<br/>Hiring Team</p>
    </body>
    </html>
    """
    return send_email_via_ses(to_email, subject, body)


def send_confirmation_email(to_email: str, name: str, interview_datetime: datetime, interview_link: str, job_title: str = "Applied Role"):
    subject = "Interview Confirmed"
    formatted_time = interview_datetime.strftime("%A, %B %d, %Y at %H:%M %p")
    
    body = f"""
    <html>
    <body>
        <h2>Interview Confirmed!</h2>
        <p>Hi {name},</p>
        <p>Your interview for <b>{job_title}</b> is scheduled for:</p>
        <p><b>{formatted_time}</b></p>
        <p>You can join the interview room here:</p>
        <p><a href="{interview_link}">{interview_link}</a></p>
        <p>We've attached a calendar invite to this email.</p>
        <br/>
        <p>Good luck!</p>
    </body>
    </html>
    """
    
    ical_data = generate_ical_attachment(interview_datetime, interview_link, name, job_title)
    return send_email_via_ses(to_email, subject, body, attachment=ical_data, filename="interview.ics")


def send_reminder_email(to_email: str, name: str, interview_datetime: datetime):
    subject = "Reminder: Interview Tomorrow"
    formatted_time = interview_datetime.strftime("%H:%M %p")
    
    body = f"""
    <html>
    <body>
        <h2>Just a reminder...</h2>
        <p>Hi {name},</p>
        <p>You have an interview scheduled for tomorrow at <b>{formatted_time}</b>.</p>
        <p>Make sure you are in a quiet place with a stable internet connection.</p>
        <br/>
        <p>See you then!</p>
    </body>
    </html>
    """
    return send_email_via_ses(to_email, subject, body)
