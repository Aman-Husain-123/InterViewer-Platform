# Frontend Integration Guide - Interview Scheduling

## Overview

This guide explains how to integrate the new interview scheduling functionality into your existing Next.js frontend **WITHOUT rebuilding the UI**.

The system flow:
1. **Notification arrives** → User sees it in notification panel
2. **User clicks notification** → Scheduling modal opens with time slots
3. **User selects slot** → Confirm response, modal closes
4. **Recruiter dashboard** → Shows all candidate responses

---

## Assumptions About Existing UI

Your frontend already has:
- ✅ **Notification panel** – displays notifications in sidebar/modal
- ✅ **Scheduling modal/page** (`/schedule/[applicationId]`) – shows time slots
- ✅ **Recruiter dashboard** – section for candidate responses

**We're connecting backend logic to these existing components.**

---

## Key API Endpoints (Backend)

```
GET    /api/v1/notifications                      → Get user's notifications
GET    /api/v1/invites/{invite_id}                → Get invite + time slots
POST   /api/v1/invites/{invite_id}/respond        → Submit selected time slot
GET    /api/v1/recruiter/responses                → Get recruiter's responses
POST   /api/v1/notifications/{id}/read            → Mark notification as read
```

Full API contract: See `API_SCHEDULING_CONTRACT.md`

---

## Step 1: Fetch Notifications (Candidate Dashboard)

Add this to your candidate dashboard page/component:

**File:** `src/app/candidate/dashboard/page.tsx` (or wherever notifications are displayed)

```typescript
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export default function CandidateDashboard() {
  const supabase = getSupabaseBrowserClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch('/api/v1/notifications', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          console.log('✅ Fetched notifications:', data);
        }
      } catch (err) {
        console.error('❌ Failed to fetch notifications:', err);
      }
    }
    
    fetchNotifications();
  }, [supabase]);
  
  return (
    <div>
      {/* ... existing dashboard ... */}
      
      {/* Notification Panel */}
      <div className="notifications-panel">
        {notifications.map(notif => (
          <div key={notif.id} className="notification-item">
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            
            {notif.type === 'INTERVIEW_INVITE' && (
              <button onClick={() => handleOpenScheduling(notif)}>
                Schedule Interview
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Step 2: Open Scheduling Modal with Time Slots

When candidate clicks the notification:

```typescript
async function handleOpenScheduling(notification: any) {
  // Extract invite_id from notification metadata
  const inviteId = notification.metadata?.invite_id;
  
  if (!inviteId) {
    console.error('❌ No invite_id in notification');
    return;
  }
  
  try {
    // Fetch invite details (includes proposed_time_slots)
    const response = await fetch(`/api/v1/invites/${inviteId}`);
    
    if (response.ok) {
      const invite = await response.json();
      console.log('✅ Fetched invite:', invite);
      
      // Convert ISO strings to Date objects for calendar UI
      const timeSlots = invite.proposed_time_slots.map(slot => new Date(slot));
      
      // Open scheduling modal with slots
      openSchedulingModal({
        inviteId,
        applicationId: invite.application_id,
        timeSlots,
        jobTitle: notification.metadata?.job_title,
      });
      
      // Mark notification as read
      await markNotificationRead(notification.id);
    }
  } catch (err) {
    console.error('❌ Failed to fetch invite:', err);
  }
}

async function markNotificationRead(notificationId: string) {
  try {
    await fetch(`/api/v1/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });
    console.log('✅ Marked notification as read');
  } catch (err) {
    console.error('⚠️ Failed to mark as read:', err);
  }
}
```

---

## Step 3: Update Scheduling Modal to Accept Invite Response

Modify your existing scheduling page to handle `invite_id`:

**File:** `src/app/schedule/[applicationId]/page.tsx`

```typescript
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function SchedulingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  
  const applicationId = params.applicationId as string;
  const inviteId = searchParams.get('inviteId'); // If opened from notification
  
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // If inviteId is provided, fetch from invite endpoint
    if (inviteId) {
      fetchInviteSlots();
    } else {
      // Else use existing slots endpoint
      fetchAvailableSlots();
    }
  }, [inviteId, applicationId]);
  
  async function fetchInviteSlots() {
    try {
      const response = await fetch(`/api/v1/invites/${inviteId}`);
      if (response.ok) {
        const invite = await response.json();
        const slots = invite.proposed_time_slots.map(s => new Date(s));
        setAvailableSlots(slots);
        console.log('✅ Loaded slots from invite');
      }
    } catch (err) {
      console.error('❌ Failed to fetch invite:', err);
    }
  }
  
  async function fetchAvailableSlots() {
    // ... your existing slots fetching logic ...
  }
  
  async function handleSelectSlot(slot: Date) {
    setSelectedSlot(slot);
  }
  
  async function handleConfirmBooking() {
    if (!selectedSlot) return;
    
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (inviteId) {
        // NEW: Respond to invite
        const response = await fetch(`/api/v1/invites/${inviteId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            selected_time_slot: selectedSlot.toISOString(),
          }),
        });
        
        if (response.ok) {
          console.log('✅ Interview scheduled successfully!');
          
          // Show success message
          toast.success('Interview scheduled! Check your email for details.');
          
          // Redirect to dashboard or success page
          router.push('/candidate/dashboard');
        } else {
          const error = await response.json();
          toast.error(error.detail || 'Failed to schedule interview');
        }
      } else {
        // EXISTING: Book interview (direct booking)
        const response = await fetch('/api/v1/schedule/book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            application_id: applicationId,
            scheduled_at: selectedSlot.toISOString(),
          }),
        });
        
        if (response.ok) {
          const { interview_id, unique_link } = await response.json();
          router.push(`/schedule/success?interviewId=${interview_id}&link=${unique_link}`);
        }
      }
    } catch (err) {
      console.error('❌ Error booking interview:', err);
      toast.error('Failed to book interview');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div>
      <h1>Select Interview Time</h1>
      
      {/* Render calendar/time slots UI */}
      <div className="slots-grid">
        {availableSlots?.map(slot => (
          <button
            key={slot.toISOString()}
            className={`slot ${selectedSlot === slot ? 'selected' : ''}`}
            onClick={() => handleSelectSlot(slot)}
          >
            {format(slot, 'MMM dd, HH:mm')}
          </button>
        ))}
      </div>
      
      <button 
        onClick={handleConfirmBooking}
        disabled={!selectedSlot || loading}
      >
        {loading ? 'Confirming...' : 'Confirm Interview'}
      </button>
    </div>
  );
}
```

---

## Step 4: Update Recruiter Dashboard to Show Responses

Add a "Candidate Responses" section:

**File:** `src/app/recruiter/dashboard/RecruiterDashboardClient.tsx`

```typescript
import { useEffect, useState } from 'react';

export function RecruiterDashboardClient() {
  const supabase = getSupabaseBrowserClient();
  const [responses, setResponses] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchResponses() {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        
        const response = await fetch('/api/v1/recruiter/responses', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setResponses(data);
          console.log('✅ Fetched candidate responses:', data);
        }
      } catch (err) {
        console.error('❌ Failed to fetch responses:', err);
      }
    }
    
    fetchResponses();
  }, [supabase]);
  
  return (
    <div className="recruiter-dashboard">
      {/* ... existing dashboard ... */}
      
      {/* NEW: Candidate Responses Section */}
      <section className="candidate-responses mt-8">
        <h2 className="text-2xl font-bold mb-6">Candidate Responses</h2>
        
        <div className="space-y-4">
          {responses.length === 0 ? (
            <p className="text-slate-500">No candidate responses yet.</p>
          ) : (
            responses.map(response => (
              <div 
                key={response.invite_id}
                className="border border-white/10 rounded-lg p-6 bg-slate-900/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{response.candidate_name}</h3>
                    <p className="text-slate-400">{response.candidate_email}</p>
                    <p className="text-sm mt-2">{response.job_title}</p>
                  </div>
                  
                  <div className="text-right">
                    {response.status === 'accepted' && response.selected_time_slot ? (
                      <div>
                        <p className="text-green-400 font-bold">✓ Accepted</p>
                        <p className="text-sm text-slate-400">
                          {new Date(response.selected_time_slot).toLocaleString()}
                        </p>
                        <button 
                          className="mt-3 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500"
                          onClick={() => handleConfirmInterview(response)}
                        >
                          Confirm & Create Interview
                        </button>
                      </div>
                    ) : (
                      <p className="text-amber-400 font-bold">⏳ Pending Response</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

async function handleConfirmInterview(response: any) {
  // Recruiter clicks to officially create interview from accepted invite
  try {
    const supabase = getSupabaseBrowserClient();
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    // Call existing /api/v1/schedule/book endpoint
    const bookResponse = await fetch('/api/v1/schedule/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        application_id: response.application_id,
        scheduled_at: response.selected_time_slot,
      }),
    });
    
    if (bookResponse.ok) {
      console.log('✅ Interview confirmed');
      toast.success(`Interview confirmed for ${response.candidate_name}`);
      // Refresh responses list
      // ... refetch responses ...
    } else {
      toast.error('Failed to confirm interview');
    }
  } catch (err) {
    console.error('❌ Error confirming interview:', err);
  }
}
```

---

## Step 5: Create Helper Hook (Optional)

Create a reusable hook for notifications:

**File:** `src/hooks/useNotifications.ts`

```typescript
import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export function useNotifications() {
  const supabase = getSupabaseBrowserClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchNotifications = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const response = await fetch('/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [supabase]);
  
  useEffect(() => {
    fetchNotifications();
    // Optional: Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);
  
  return { notifications, loading, fetchNotifications, markAsRead };
}
```

Usage:
```typescript
import { useNotifications } from '@/hooks/useNotifications';

export default function DashboardPage() {
  const { notifications, markAsRead } = useNotifications();
  
  return (
    <div>
      {notifications.map(notif => (
        <NotificationCard
          key={notif.id}
          notification={notif}
          onRead={() => markAsRead(notif.id)}
        />
      ))}
    </div>
  );
}
```

---

## Authentication Header

All requests need the user's auth token:

```typescript
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};
```

---

## Error Handling

```typescript
try {
  const response = await fetch('/api/v1/invites/{inviteId}/respond', {
    method: 'POST',
    headers,
    body: JSON.stringify({ selected_time_slot: slot.toISOString() }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 400) {
      // Invalid slot or malformed request
      console.error('Invalid selection:', error.detail);
    } else if (response.status === 404) {
      // Invite not found
      console.error('Invite expired or deleted');
    } else if (response.status === 409) {
      // Slot already taken
      console.error('Slot taken by another candidate');
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
```

---

## Testing Endpoints

Test with curl:

```bash
# Get notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/notifications

# Get invite details
curl http://localhost:8000/api/v1/invites/inv-123

# Respond to invite
curl -X POST http://localhost:8000/api/v1/invites/inv-123/respond \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"selected_time_slot":"2026-03-28T14:00:00Z"}'

# Get recruiter responses
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/recruiter/responses
```

---

## UI/UX Tips

### Notification Panel
- Show unread badge count
- Group by type (INTERVIEW_INVITE, RESPONSE, etc.)
- Display job title and company
- Add "Open Scheduling" CTA button

### Scheduling Modal
- Show "Time slot requested by..." message
- Display all proposed slots
- Confirm before submitting
- Show loading state

### Recruiter Dashboard
- Show "Pending" vs "Accepted" tabs
- Sort by date (newest first)
- Add "Confirm & Create Interview" button
- Show candidate contact info

---

## Summary

| Component | Change |
|-----------|--------|
| Candidate Dashboard | Add notification fetch & display |
| Notification Item | Extract `invite_id`, open scheduling |
| Scheduling Page | Check `inviteId` param, call `/respond` endpoint |
| Recruiter Dashboard | Add "Candidate Responses" section with responses list |
| Helper Hook | Optional `useNotifications` for cleaner code |

No UI structure changes needed – just wire up the backend endpoints!
