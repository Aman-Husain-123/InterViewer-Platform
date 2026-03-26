# 🎯 Frontend Integration Checklist

**Backend Status:** ✅ 100% Complete  
**Frontend Status:** ⏳ Ready to Connect  

---

## 📋 What the Frontend Needs to Do

The backend is complete. The frontend just needs to connect to the new API endpoints. Here's what to implement:

---

## 1️⃣ Candidate Dashboard: Show Notifications

### Location
`frontend/src/components/candidate/` - Add notification fetcher

### What to Do
```typescript
// 1. Create a hook or component to fetch notifications
const notifications = await fetch('/api/v1/notifications', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// 2. Display notifications with click handler
// Each notification will have metadata.invite_id

// 3. Show unread count badge
```

### Expected Response
```json
[
  {
    "id": "notif-123",
    "type": "INTERVIEW_INVITE",
    "title": "Interview Invite: Software Engineer",
    "message": "You've been invited to interview...",
    "metadata": {
      "invite_id": "invite-456",      ← EXTRACT THIS
      "application_id": "app-789",
      "job_title": "Software Engineer"
    },
    "is_read": false,
    "created_at": "2026-03-26T10:00:00Z"
  }
]
```

---

## 2️⃣ Notification Click Handler

### Location
`frontend/src/components/candidate/` - Notification component

### What to Do
```typescript
// When user clicks a notification:
// 1. Extract invite_id from metadata
// 2. Mark notification as read
// 3. Navigate to scheduling modal

const handleNotificationClick = async (notification) => {
  const { invite_id } = notification.metadata;
  
  // Mark as read
  await fetch(`/api/v1/notifications/${notification.id}/read`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // Open scheduling modal with invite_id
  openSchedulingModal(invite_id);
};
```

---

## 3️⃣ Scheduling Modal Enhancement

### Location
`frontend/src/components/candidate/` - Scheduling component (already exists!)

### What to Do

#### A) Fetch Time Slots
```typescript
// When modal opens with invite_id:
const invite = await fetch(`/api/v1/invites/${invite_id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response includes proposed_time_slots
const timeSlots = invite.proposed_time_slots;

// Display them in the UI (already built!)
```

#### B) Handle Selection
```typescript
// When candidate selects a time slot:
const response = await fetch(`/api/v1/invites/${invite_id}/respond`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    selected_time_slot: "2026-04-01T09:00:00Z"
  })
});

// Response:
// { success: true, message: "...", invite_id: "...", selected_time_slot: "..." }

// Show success message
// Close modal
```

---

## 4️⃣ Recruiter Dashboard: Add Responses Section

### Location
`frontend/src/components/recruiter/` - New section or page

### What to Do
```typescript
// Fetch candidate responses
const responses = await fetch('/api/v1/recruiter/responses', {
  headers: { 'Authorization': `Bearer ${recruiter_token}` }
});

// Response includes:
// [{
//   invite_id, application_id, candidate_name, candidate_email,
//   job_title, selected_time_slot, status, created_at
// }]

// Display in table/list:
// - Candidate name
// - Job title
// - Selected time slot
// - Status (pending/accepted/rejected)
// - Action buttons (confirm, reschedule, etc.)
```

---

## 📋 Implementation Tasks

| Task | Component | Priority | Est. Time |
|------|-----------|----------|-----------|
| Add notification fetching | Candidate Dashboard | HIGH | 30 min |
| Create notification component | Candidate Dashboard | HIGH | 30 min |
| Wire notification click handlers | Candidate Dashboard | HIGH | 30 min |
| Extract invite_id from metadata | Notification | HIGH | 15 min |
| Update scheduling modal for invites | Schedule Component | HIGH | 45 min |
| Add candidate response API call | Schedule Component | HIGH | 30 min |
| Create recruiter responses section | Recruiter Dashboard | MEDIUM | 60 min |
| Display responses in table/list | Recruiter Dashboard | MEDIUM | 45 min |
| Add response actions (confirm, etc.) | Recruiter Dashboard | MEDIUM | 60 min |
| Test end-to-end flow | Testing | HIGH | 60 min |

---

## 🔧 Code Examples

### Example 1: Fetch and Display Notifications

```typescript
// frontend/src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';

export function useNotifications(token: string) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch('/api/v1/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setNotifications(data))
      .finally(() => setLoading(false));
  }, [token]);

  return { notifications, loading };
}
```

### Example 2: Handle Notification Click

```typescript
// frontend/src/components/candidate/NotificationItem.tsx
const handleClick = async () => {
  const { invite_id } = notification.metadata;

  // Mark as read
  await fetch(`/api/v1/notifications/${notification.id}/read`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Navigate or open modal
  openSchedulingModal({ invite_id });
};
```

### Example 3: Respond to Invite

```typescript
// frontend/src/components/candidate/SchedulingModal.tsx
const handleSelectTimeSlot = async (timeSlot: string) => {
  const response = await fetch(
    `/api/v1/invites/${invite_id}/respond`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ selected_time_slot: timeSlot })
    }
  );

  if (response.ok) {
    showSuccessMessage('Time slot confirmed!');
    closeModal();
  } else {
    showErrorMessage('Failed to confirm time slot');
  }
};
```

### Example 4: Show Recruiter Responses

```typescript
// frontend/src/components/recruiter/CandidateResponses.tsx
useEffect(() => {
  fetch('/api/v1/recruiter/responses', {
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  })
    .then(r => r.json())
    .then(data => setResponses(data))
    .catch(err => console.error('Failed to fetch responses', err));
}, [recruiterToken]);

return (
  <table>
    <tbody>
      {responses.map(response => (
        <tr key={response.invite_id}>
          <td>{response.candidate_name}</td>
          <td>{response.job_title}</td>
          <td>{response.selected_time_slot}</td>
          <td>{response.status}</td>
          <td>
            <button>Confirm</button>
            <button>Reschedule</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
```

---

## 🧪 Testing Checklist

### Backend Testing (Optional - Backend is Already Complete)
- [x] Endpoints can be called with proper auth
- [x] Error handling works (invalid invites, wrong slots, etc.)
- [x] Notifications are created correctly
- [x] RLS policies work

### Frontend Testing (Next Step)
- [ ] Notifications display in candidate dashboard
- [ ] Clicking notification opens scheduling modal
- [ ] Time slots display correctly from invite
- [ ] Selecting time slot sends response to backend
- [ ] Recruiter sees response in responses section
- [ ] End-to-end: Recruiter → Candidate → Response → Display

---

## 🚀 Deployment Order

1. **Run Database Migration** (if not done)
   - Supabase SQL Editor → Run migration

2. **Deploy Backend** (if not done)
   - Deploy updated `app/api/endpoints/notifications.py`
   - Deploy updated `app/schemas/schemas.py`
   - Deploy updated `app/main.py`

3. **Develop Frontend** (in progress)
   - Implement all tasks above
   - Test with staging backend

4. **Deploy Frontend**
   - Deploy to production

5. **Full Testing**
   - Test complete end-to-end flow in production

---

## 📚 Reference Documentation

All necessary API documentation is in:
- `API_SCHEDULING_CONTRACT.md` - Full API spec with examples
- `QUICK_REFERENCE.md` - Quick lookup
- `INTEGRATION_COMPLETE.md` - Complete status

---

## ✨ Timeline Estimate

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Notifications | 3 tasks | 1.5 hours |
| Scheduling | 3 tasks | 1.75 hours |
| Recruiter Section | 3 tasks | 2.75 hours |
| Testing | 1 task | 1 hour |
| **TOTAL** | **10 tasks** | **~7 hours** |

---

## 🎯 Success Criteria

✅ Candidate receives notification when recruiter sends invite  
✅ Clicking notification opens scheduling UI with time slots  
✅ Candidate can select time slot and submit response  
✅ Recruiter sees all candidate responses in dashboard  
✅ No errors in console or API logs  
✅ End-to-end flow works smoothly  

---

## 💡 Tips

1. **Use the API examples provided** - Copy-paste the exact endpoints and formats
2. **Test one task at a time** - Don't build everything before testing
3. **Check network tab** - Watch API calls to debug issues
4. **Review error responses** - Backend provides clear error messages
5. **Use notification metadata** - The `invite_id` is in `metadata`, not root level

---

**Backend is ready. Frontend integration can start immediately!**
