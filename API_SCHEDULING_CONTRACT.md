# Interview Scheduling Integration - API Contract

## Overview

This document describes the backend API for the interview scheduling workflow. The system enables:

1. **Recruiter sends invite** → Creates notification for candidate
2. **Candidate views notification** → Sees pending interview invitations
3. **Candidate clicks invite** → Fetches time slots and opens scheduling UI
4. **Candidate selects slot** → Backend records response, notifies recruiter
5. **Recruiter views responses** → Sees all candidates who accepted invites

---

## Database Schema

### Tables (NEW)

#### `interview_invites`
```
id                    UUID (primary key)
recruiter_id          UUID (references profiles.id)
application_id        UUID (references applications.id)
proposed_time_slots   TIMESTAMPTZ[] (array of available times)
selected_time_slot    TIMESTAMPTZ (time candidate selected)
status                TEXT ('pending', 'accepted', 'rejected', 'cancelled')
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

#### `notifications`
```
id                    UUID (primary key)
user_id               UUID (references profiles.id)
type                  TEXT ('INTERVIEW_INVITE', 'RESPONSE', 'REMINDER', 'ACCEPTED', 'SCHEDULED')
title                 TEXT (e.g., "Interview Invite: Senior Developer")
message               TEXT (notification message)
metadata              JSONB (context data - see metadata schema below)
is_read               BOOLEAN (default: false)
created_at            TIMESTAMPTZ
```

### Notification Metadata Structure
```json
{
  "invite_id": "550e8400-e29b-41d4-a716-446655440000",
  "application_id": "550e8400-e29b-41d4-a716-446655440001",
  "job_title": "Senior Frontend Engineer",
  "candidate_name": "John Doe",
  "selected_time_slot": "2026-03-28T14:00:00Z"
}
```

---

## API Endpoints

### 1. Send Interview Invite (Recruiter Action)

**Endpoint:** `POST /api/v1/invites`

**Authentication:** Required (Recruiter)

**Request Body:**
```json
{
  "application_id": "550e8400-e29b-41d4-a716-446655440001",
  "proposed_time_slots": [
    "2026-03-28T09:00:00Z",
    "2026-03-28T10:00:00Z",
    "2026-03-28T14:00:00Z",
    "2026-03-29T09:00:00Z"
  ]
}
```

**Response (200 OK):**
```json
{
  "invite_id": "550e8400-e29b-41d4-a716-446655440002",
  "message": "Interview invite sent successfully",
  "candidate_email": "john@example.com"
}
```

**Flow:**
1. Creates `interview_invites` record with proposed time slots
2. Creates `INTERVIEW_INVITE` notification for candidate (with `invite_id` in metadata)
3. Sends email invite to candidate
4. Updates application status to "invited"

**Logs:**
```
🔄 Recruiter recruiter@company.com sending invite for application 550e8400-...
✅ Created interview_invites record 550e8400-... with 4 slots
✅ Created INTERVIEW_INVITE notification for candidate@email.com
✅ Sent invite email to candidate@email.com
```

---

### 2. Get Invite Details (Frontend → Load Time Slots)

**Endpoint:** `GET /api/v1/invites/{invite_id}`

**Authentication:** Optional (public or auth-required based on RLS)

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "recruiter_id": "550e8400-e29b-41d4-a716-446655440010",
  "application_id": "550e8400-e29b-41d4-a716-446655440001",
  "proposed_time_slots": [
    "2026-03-28T09:00:00Z",
    "2026-03-28T10:00:00Z",
    "2026-03-28T14:00:00Z",
    "2026-03-29T09:00:00Z"
  ],
  "selected_time_slot": null,
  "status": "pending",
  "created_at": "2026-03-26T10:30:00Z",
  "updated_at": "2026-03-26T10:30:00Z"
}
```

**Frontend Usage:**
```typescript
// When candidate clicks notification
const inviteId = notification.metadata.invite_id;
const response = await fetch(`/api/v1/invites/${inviteId}`);
const invite = await response.json();

// Populate scheduling UI with invite.proposed_time_slots
openSchedulingModal(invite.proposed_time_slots);
```

**Logs:**
```
🔍 Fetching invite details for 550e8400-e29b-41d4-a716-446655440002
✅ Found invite 550e8400-... with status=pending, 4 slots
```

---

### 3. Get Candidate's Notifications

**Endpoint:** `GET /api/v1/notifications`

**Authentication:** Required (Candidate or Recruiter)

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "user_id": "550e8400-e29b-41d4-a716-446655440020",
    "type": "INTERVIEW_INVITE",
    "title": "Interview Invite: Senior Frontend Engineer",
    "message": "You've been invited to interview for Senior Frontend Engineer. Select your preferred time slot.",
    "metadata": {
      "invite_id": "550e8400-e29b-41d4-a716-446655440002",
      "application_id": "550e8400-e29b-41d4-a716-446655440001",
      "job_title": "Senior Frontend Engineer"
    },
    "is_read": false,
    "created_at": "2026-03-26T10:30:00Z"
  }
]
```

**Frontend Usage:**
```typescript
// On candidate dashboard load
const notifications = await fetch('/api/v1/notifications');
const data = await notifications.json();

// Display notifications in notification panel
// When user clicks: extract invite_id from metadata
const inviteId = data[0].metadata.invite_id;
```

**Logs:**
```
🔍 Fetching notifications for user candidate@example.com
✅ Found 2 notifications for candidate@example.com
```

---

### 4. Mark Notification as Read

**Endpoint:** `POST /api/v1/notifications/{notification_id}/read`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 5. Candidate Responds to Invite (Submit Selected Time Slot)

**Endpoint:** `POST /api/v1/invites/{invite_id}/respond`

**Authentication:** Required (Candidate)

**Request Body:**
```json
{
  "selected_time_slot": "2026-03-28T14:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Your response has been recorded",
  "invite_id": "550e8400-e29b-41d4-a716-446655440002",
  "selected_time_slot": "2026-03-28T14:00:00Z"
}
```

**Flow:**
1. Validates selected slot is in proposed slots
2. Updates `interview_invites`: sets `selected_time_slot` and `status="accepted"`
3. Creates `RESPONSE` notification for recruiter with candidate's selection
4. Frontend closes modal and shows success message

**Logs:**
```
🔄 Candidate candidate@example.com responding to invite 550e8400-... with slot 2026-03-28T14:00:00Z
✅ Updated interview_invites 550e8400-...: status=accepted, selected_time_slot=2026-03-28T14:00:00Z
✅ Created RESPONSE notification for recruiter (recruiter_id)
```

---

### 6. Get Recruiter's Candidate Responses

**Endpoint:** `GET /api/v1/recruiter/responses`

**Authentication:** Required (Recruiter)

**Response (200 OK):**
```json
[
  {
    "invite_id": "550e8400-e29b-41d4-a716-446655440002",
    "application_id": "550e8400-e29b-41d4-a716-446655440001",
    "candidate_name": "John Doe",
    "candidate_email": "john@example.com",
    "job_title": "Senior Frontend Engineer",
    "selected_time_slot": "2026-03-28T14:00:00Z",
    "status": "accepted",
    "created_at": "2026-03-26T10:30:00Z"
  },
  {
    "invite_id": "550e8400-e29b-41d4-a716-446655440004",
    "application_id": "550e8400-e29b-41d4-a716-446655440005",
    "candidate_name": "Jane Smith",
    "candidate_email": "jane@example.com",
    "job_title": "Senior Frontend Engineer",
    "selected_time_slot": null,
    "status": "pending",
    "created_at": "2026-03-26T11:00:00Z"
  }
]
```

**Frontend Usage (Recruiter Dashboard):**
```typescript
// Display "Candidate Responses" section
const responses = await fetch('/api/v1/recruiter/responses');
const data = await responses.json();

// Group by status
const accepted = data.filter(r => r.status === 'accepted');
const pending = data.filter(r => r.status === 'pending');

// Display: "Jane Smith - Accepted for March 28, 2:00 PM"
// Display: "Jane Smith - Pending (awaiting response)"
```

**Logs:**
```
🔍 Fetching candidate responses for recruiter recruiter@example.com
✅ Found 2 candidate responses for recruiter@example.com
```

---

## Frontend Integration Flow

### Candidate Side: Click Notification → Schedule

```typescript
// 1. Get notifications
const notifications = await fetch('/api/v1/notifications').then(r => r.json());

// 2. User clicks notification (e.g., "Interview Invite: Senior Dev")
const notification = notifications[0];
const inviteId = notification.metadata.invite_id;

// 3. Fetch invite to get time slots
const invite = await fetch(`/api/v1/invites/${inviteId}`).then(r => r.json());

// 4. Open scheduling UI with invite.proposed_time_slots
openSchedulingModal({
  slots: invite.proposed_time_slots,
  jobTitle: notification.metadata.job_title,
});

// 5. User selects slot → Call respond endpoint
const selectedSlot = "2026-03-28T14:00:00Z";
const response = await fetch(`/api/v1/invites/${inviteId}/respond`, {
  method: 'POST',
  body: JSON.stringify({ selected_time_slot: selectedSlot }),
});

if (response.ok) {
  // 6. Close modal, mark notification as read
  await fetch(`/api/v1/notifications/${notification.id}/read`, { method: 'POST' });
  closeSchedulingModal();
  showSuccessMessage("Interview scheduled successfully!");
}
```

### Recruiter Side: View Responses

```typescript
// 1. On recruiter dashboard load
const responses = await fetch('/api/v1/recruiter/responses').then(r => r.json());

// 2. Display in "Candidate Responses" section
const accepted = responses.filter(r => r.status === 'accepted');
const pending = responses.filter(r => r.status === 'pending');

// 3. Show:
// - "John Doe - Accepted for March 28, 2:00 PM" (with "Confirm" button)
// - "Jane Smith - Pending response"
```

---

## Error Handling

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 404 | "Interview invite not found" | Invalid `invite_id` | Verify invite was created |
| 400 | "Invalid time slot format" | Malformed datetime | Use ISO 8601 format |
| 400 | "Selected time slot not available" | Slot not in proposed list | Fetch fresh invite to get current slots |
| 409 | "Slot already taken" | Concurrent booking | Retry with different slot |
| 500 | "Failed to create notification" | Database error | Check database connection |

---

## Status Codes Reference

- **200 OK** – Success
- **201 Created** – Resource created
- **400 Bad Request** – Invalid input
- **403 Forbidden** – Unauthorized (wrong user)
- **404 Not Found** – Resource doesn't exist
- **409 Conflict** – Resource conflict (e.g., slot taken)
- **500 Internal Server Error** – Backend error

---

## Example: Complete End-to-End Flow

### 1. Recruiter sends invite
```bash
curl -X POST http://localhost:8000/api/v1/invites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "app-123",
    "proposed_time_slots": ["2026-03-28T09:00:00Z", "2026-03-28T14:00:00Z"]
  }'
```
Response: `{"invite_id": "inv-456", "message": "Interview invite sent successfully"}`

### 2. Candidate gets notifications
```bash
curl http://localhost:8000/api/v1/notifications \
  -H "Authorization: Bearer $CANDIDATE_TOKEN"
```
Response: `[{"id": "notif-789", "type": "INTERVIEW_INVITE", "metadata": {"invite_id": "inv-456"}}]`

### 3. Candidate fetches invite details
```bash
curl http://localhost:8000/api/v1/invites/inv-456
```
Response: `{"id": "inv-456", "proposed_time_slots": ["2026-03-28T09:00:00Z", "2026-03-28T14:00:00Z"]}`

### 4. Candidate responds
```bash
curl -X POST http://localhost:8000/api/v1/invites/inv-456/respond \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"selected_time_slot": "2026-03-28T14:00:00Z"}'
```
Response: `{"success": true, "message": "Your response has been recorded"}`

### 5. Recruiter views responses
```bash
curl http://localhost:8000/api/v1/recruiter/responses \
  -H "Authorization: Bearer $RECRUITER_TOKEN"
```
Response: `[{"candidate_name": "John Doe", "selected_time_slot": "2026-03-28T14:00:00Z", "status": "accepted"}]`

---

## Debugging

### Enable Debug Logging
Set `DEBUG=True` in `.env` to see detailed logs:

```
🔄 Recruiter recruiter@company.com sending invite for application app-123
✅ Created interview_invites record inv-456 with 2 slots
✅ Created INTERVIEW_INVITE notification for john@example.com
📖 Marking notification notif-789 as read
🔍 Fetching candidate responses for recruiter@company.com
✅ Found 1 candidate responses
```

### Common Issues

**Issue: Notification doesn't have invite_id**
- Check that `interview_invites` record was created
- Verify metadata in `notifications` table includes `invite_id`

**Issue: Scheduling modal doesn't open**
- Ensure frontend extracts `invite_id` from `notification.metadata`
- Check that `GET /api/v1/invites/{invite_id}` returns valid slots
- Verify invitation was successfully sent with proposed slots

**Issue: Candidate response not reflected on recruiter dashboard**
- Check that `POST /api/v1/invites/{invite_id}/respond` returned 200
- Verify `interview_invites` status was updated to "accepted"
- Check recruiter dashboard calls `GET /api/v1/recruiter/responses`

---

## Notes

- All timestamps are in **UTC (ISO 8601)** format
- `proposed_time_slots` is an array to allow multiple options
- `selected_time_slot` is null until candidate responds
- Notifications are created for **both** candidate and recruiter
- Database RLS policies ensure candidates only see their own invites
- Recruiters can only see invites and responses for their own applications
