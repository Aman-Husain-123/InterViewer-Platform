# 🔗 FRONTEND-BACKEND INTEGRATION GUIDE

## Overview

The frontend is now ready to be integrated with the backend. This document explains what's needed for full integration.

---

## Current State

### Frontend ✅
- Authentication system ready
- All pages created
- Protected routes working
- API endpoint configured
- Ready to make API calls

### Backend ⏳
- API endpoints prepared
- Scheduling system ready
- Authentication ready
- Waiting to start (port 8000)

---

## Integration Points

### 1. Authentication
**Status**: ✅ Frontend ready

Frontend handles:
- User registration
- User login
- Session management
- Role detection

Backend should:
- Verify tokens (already handled by Supabase)
- Return user data on request
- Handle role-based permissions

### 2. Job Management
**Location**: `/apply` page and recruiter dashboard

Frontend expects API endpoints:
```
GET /api/v1/jobs/           - List active jobs
GET /api/v1/jobs/{jobId}    - Get job details
POST /api/v1/jobs/          - Create job (recruiter)
PUT /api/v1/jobs/{jobId}    - Update job (recruiter)
DELETE /api/v1/jobs/{jobId} - Delete job (recruiter)
```

### 3. Applications
**Location**: Candidate and recruiter dashboards

Frontend expects API endpoints:
```
GET /api/v1/applications/my-invites     - Get my invites
GET /api/v1/applications/my-history     - Get my history
GET /api/v1/applications/my-interviews  - Get my interviews
POST /api/v1/applications/              - Apply for job
GET /api/v1/applications/{appId}        - Get application details
```

### 4. Interview Scheduling
**Location**: Schedule pages

Frontend expects API endpoints:
```
GET /api/v1/schedule/slots              - Get available slots
POST /api/v1/schedule/book              - Book interview
POST /api/v1/schedule/invite            - Send invite
GET /api/v1/schedule/my-interviews      - Get my scheduled interviews
```

### 5. Notifications
**Location**: Dashboard notification bells

Frontend expects API endpoints:
```
GET /api/v1/notifications/              - Get notifications
GET /api/v1/notifications/unread-count  - Get unread count
PUT /api/v1/notifications/{id}/read     - Mark as read
```

---

## How Frontend Will Call Backend

### Authentication
All requests include Bearer token:
```javascript
const headers = {
  "Authorization": `Bearer ${session.access_token}`
};
```

### API Base URL
Configured in `.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Example API Call
```javascript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const response = await fetch(
  `${API_BASE}/api/v1/jobs/`,
  {
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    }
  }
);

const data = await response.json();
```

---

## Data Flow

### User Registration Flow
```
Frontend                        Backend
   |                               |
   |-- POST /auth/signup -------->|
   |                      (create user in Supabase)
   |<-- auth token ---------|
   |                               |
   |-- POST /users/profile ------>|
   |                      (create profile record)
   |<-- success ---------|
```

### Login & Access Flow
```
Frontend                        Backend
   |                               |
   |-- POST /auth/signin -------->|
   |                      (verify with Supabase)
   |<-- auth token ---------|
   |                               |
   |-- GET /api/v1/jobs/ -------->|
   |   (with Bearer token)
   |<-- jobs list ---------|
   |                               |
```

### Protected Route Flow
```
Frontend                        Backend
   |                               |
   |-- GET /recruiter/dashboard -->|
   |   (Middleware checks auth)
   |<-- redirect to /login (if not authenticated)
   |   or
   |<-- page content (if authenticated)
   |                               |
```

---

## CORS Configuration

### Frontend
- Running on: `http://localhost:3000`
- Makes requests to: `http://localhost:8000`

### Backend Needs
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Environment Variables

### Frontend (.env)
```
NEXT_PUBLIC_SUPABASE_URL=https://bbkypdeusayywhudtxen.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rlLTAcny1S1Mp0PmnPkrzA_TkMDe_qB
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://bbkypdeusayywhudtxen.supabase.co
SUPABASE_KEY=sb_...
JWT_SECRET=your_secret
FRONTEND_URL=http://localhost:3000
```

---

## Error Handling

### Frontend Error Handling
```javascript
try {
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      router.push("/login");
    } else if (response.status === 403) {
      // Forbidden - show error
      setError("Permission denied");
    } else {
      // Other errors
      setError(response.statusText);
    }
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  setError("Network error");
}
```

### Backend Error Responses
Frontend expects:
```json
{
  "detail": "Error message",
  "status": 400
}
```

---

## Type Safety for API Responses

### Define Response Types
```typescript
// src/types/api.ts
export interface Job {
  id: string;
  title: string;
  description: string;
  recruiter_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: "pending" | "invited" | "interview_scheduled" | "completed" | "rejected";
  created_at: string;
}
```

### Use in Components
```typescript
import type { Job } from "@/types/api";

const response = await fetch(url);
const jobs: Job[] = await response.json();
```

---

## Testing Integration

### 1. Test Backend Startup
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Verify API is Running
```
GET http://localhost:8000/docs
```
Should show Swagger UI

### 3. Test from Frontend
Frontend dev server will automatically try to connect once backend is running

### 4. Check Browser Console
Look for any CORS errors or failed API requests

---

## Common Integration Issues & Fixes

### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix**: Enable CORS on backend with correct origin

### Issue: 401 Unauthorized
```
Frontend sends request but gets 401
```
**Fix**: Verify Bearer token is in headers

### Issue: 404 Not Found
```
API endpoint doesn't exist
```
**Fix**: Check endpoint URL matches backend routes

### Issue: Network Timeout
```
Request takes too long
```
**Fix**: Increase timeout or optimize backend query

---

## Deployment Considerations

### Frontend
- Build: `npm run build`
- Deploy to: Vercel, Netlify, or any static host
- Environment: Set variables in deployment platform

### Backend
- Build: See backend README
- Deploy to: Heroku, AWS, Google Cloud, or VPS
- Environment: Set database and auth credentials

### API URL for Production
```
Development: http://localhost:8000
Staging: https://api-staging.example.com
Production: https://api.example.com
```

---

## Real-Time Features (Optional Future)

If you want real-time updates:

### WebSocket for Notifications
```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: session.access_token
  }
});

socket.on('notification', (data) => {
  // Handle notification
});
```

### Server-Sent Events
```javascript
const eventSource = new EventSource(
  'http://localhost:8000/api/v1/notifications/stream',
  {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  }
);

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Handle notification
};
```

---

## Database Synchronization

### Tables Frontend Uses
- `profiles` - User profiles with role
- `jobs` - Job postings
- `applications` - Job applications
- `interview_sessions` - Scheduled interviews
- `notifications` - Notifications

### Ensure Exists in Supabase
Run migrations or ensure tables exist with proper RLS policies

---

## Authentication Verification

### How Frontend Verifies User
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Not authenticated
  router.push("/login");
}
```

### Backend Should Verify
```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_token(token: str):
    user = supabase.auth.get_user(token)
    return user
```

---

## Testing Checklist Before Deployment

- [ ] Backend starts without errors
- [ ] API endpoints respond correctly
- [ ] CORS configured for frontend URL
- [ ] Authentication tokens work
- [ ] Protected endpoints verify tokens
- [ ] Database connections established
- [ ] Notifications working
- [ ] File uploads working (if applicable)
- [ ] Email sending working (if applicable)
- [ ] All endpoints tested with Postman

---

## Support Documents

- **Frontend**: FRONTEND_QUICK_START.md
- **Backend**: backend/README.md (check if exists)
- **Integration**: This document
- **Testing**: FRONTEND_TESTING.md

---

## Summary

Frontend and Backend integration is straightforward:

1. **Frontend** sends authenticated requests to Backend
2. **Backend** verifies tokens and returns data
3. **Both** use same Supabase instance for auth
4. **CORS** must be configured for localhost:3000
5. **Environment** variables configure the URL

Once backend is running on port 8000, frontend will automatically attempt to fetch data and populate dashboards.

---

**Status**: ✅ Frontend ready for integration
**Next**: Start backend and test endpoints
**Estimated Time**: 15-30 minutes for full integration
