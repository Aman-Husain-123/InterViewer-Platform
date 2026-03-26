# Quick Start: Interview Scheduling Implementation (Windows PowerShell)
# This script guides you through setting up the new scheduling system

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Interview Scheduling - Implementation Quick Start             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 STEP 1: Database Migration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Run the SQL migration in Supabase SQL Editor:" -ForegroundColor Green

Write-Host ""
Write-Host "   1. Go to: https://app.supabase.com → Your Project → SQL Editor" -ForegroundColor White
Write-Host "   2. Create new query" -ForegroundColor White
Write-Host "   3. Copy & paste contents of:" -ForegroundColor White
Write-Host "      backend/migrations/add_notifications_and_invites.sql" -ForegroundColor Cyan
Write-Host "   4. Click 'Run'" -ForegroundColor White

Write-Host ""
Write-Host "   This creates:" -ForegroundColor Gray
Write-Host "   • interview_invites table" -ForegroundColor Gray
Write-Host "   • notifications table" -ForegroundColor Gray
Write-Host "   • RLS policies" -ForegroundColor Gray
Write-Host "   • Performance indexes" -ForegroundColor Gray

Write-Host ""
Read-Host "Press ENTER after running migration"

Write-Host ""
Write-Host "✅ Verify in Supabase Table Editor:" -ForegroundColor Green
Write-Host "   You should see new tables:" -ForegroundColor Gray
Write-Host "   • public.interview_invites" -ForegroundColor Gray
Write-Host "   • public.notifications" -ForegroundColor Gray

Write-Host ""
Write-Host ""
Write-Host "🚀 STEP 2: Backend - Verify API Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Start backend server:" -ForegroundColor Green

Write-Host ""
Write-Host "   PowerShell:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   python -m uvicorn app.main:app --reload" -ForegroundColor Cyan

Write-Host ""
Write-Host "   Or in new terminal:" -ForegroundColor Gray
Write-Host "   cd backend && python main.py" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Navigate to API docs:" -ForegroundColor Green

Write-Host ""
Write-Host "   Open browser: http://localhost:8000/docs" -ForegroundColor Cyan

Write-Host ""
Write-Host "   You should see new endpoints:" -ForegroundColor Gray
Write-Host "   • POST   /api/v1/invites" -ForegroundColor Gray
Write-Host "   • GET    /api/v1/invites/{invite_id}" -ForegroundColor Gray
Write-Host "   • POST   /api/v1/invites/{invite_id}/respond" -ForegroundColor Gray
Write-Host "   • GET    /api/v1/notifications" -ForegroundColor Gray
Write-Host "   • POST   /api/v1/notifications/{id}/read" -ForegroundColor Gray
Write-Host "   • GET    /api/v1/recruiter/responses" -ForegroundColor Gray

Write-Host ""
Read-Host "Press ENTER after verifying endpoints"

Write-Host ""
Write-Host "📚 STEP 3: Documentation" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Read the following files:" -ForegroundColor Green

Write-Host ""
Write-Host "   📄 IMPLEMENTATION_SUMMARY.md" -ForegroundColor Cyan
Write-Host "      → Overview of what was implemented" -ForegroundColor Gray

Write-Host ""
Write-Host "   📄 API_SCHEDULING_CONTRACT.md" -ForegroundColor Cyan
Write-Host "      → Complete API documentation" -ForegroundColor Gray
Write-Host "      → Request/response examples" -ForegroundColor Gray
Write-Host "      → Error handling" -ForegroundColor Gray

Write-Host ""
Write-Host "   📄 FRONTEND_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host "      → Step-by-step frontend integration" -ForegroundColor Gray
Write-Host "      → Code examples" -ForegroundColor Gray
Write-Host "      → Hook samples" -ForegroundColor Gray

Write-Host ""
Write-Host ""
Write-Host "🎯 STEP 4: Frontend Integration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Follow FRONTEND_INTEGRATION_GUIDE.md:" -ForegroundColor Green

Write-Host ""
Write-Host "   1. Fetch notifications in candidate dashboard" -ForegroundColor White
Write-Host "   2. When user clicks notification:" -ForegroundColor White
Write-Host "      → Extract invite_id from metadata" -ForegroundColor Gray
Write-Host "      → Call GET /api/v1/invites/{invite_id}" -ForegroundColor Gray
Write-Host "      → Display time slots" -ForegroundColor Gray

Write-Host ""
Write-Host "   3. When user selects slot:" -ForegroundColor White
Write-Host "      → Call POST /api/v1/invites/{invite_id}/respond" -ForegroundColor Gray
Write-Host "      → Close modal on success" -ForegroundColor Gray

Write-Host ""
Write-Host "   4. Recruiter dashboard:" -ForegroundColor White
Write-Host "      → Call GET /api/v1/recruiter/responses" -ForegroundColor Gray
Write-Host "      → Display responses section" -ForegroundColor Gray

Write-Host ""
Write-Host ""
Write-Host "🧪 STEP 5: Testing" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Test with PowerShell (need valid auth tokens):" -ForegroundColor Green

Write-Host ""
Write-Host "   # Send invite (recruiter)" -ForegroundColor Gray
$inviteCmd = @"
invoke-webrequest -uri http://localhost:8000/api/v1/invites `
  -method POST `
  -headers @{"Authorization"="Bearer `$RECRUITER_TOKEN";"Content-Type"="application/json"} `
  -body '{"application_id":"app-id","proposed_time_slots":["2026-03-28T09:00:00Z"]}'
"@
Write-Host "   $inviteCmd" -ForegroundColor Cyan

Write-Host ""
Write-Host "   # Get notifications (candidate)" -ForegroundColor Gray
Write-Host "   invoke-webrequest -uri http://localhost:8000/api/v1/notifications -headers @{'Authorization'='Bearer `$CANDIDATE_TOKEN'}" -ForegroundColor Cyan

Write-Host ""
Write-Host "   # Respond to invite (candidate)" -ForegroundColor Gray
Write-Host "   invoke-webrequest -uri http://localhost:8000/api/v1/invites/inv-id/respond -method POST -headers @{'Authorization'='Bearer `$CANDIDATE_TOKEN';'Content-Type'='application/json'} -body '{\"selected_time_slot\":\"2026-03-28T09:00:00Z\"}'" -ForegroundColor Cyan

Write-Host ""
Write-Host "   # Get responses (recruiter)" -ForegroundColor Gray
Write-Host "   invoke-webrequest -uri http://localhost:8000/api/v1/recruiter/responses -headers @{'Authorization'='Bearer `$RECRUITER_TOKEN'}" -ForegroundColor Cyan

Write-Host ""
Write-Host ""
Write-Host "✨ STEP 6: Key Files" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Backend Implementation:" -ForegroundColor Green

Write-Host ""
Write-Host "   📄 backend/app/api/endpoints/notifications.py" -ForegroundColor Cyan
Write-Host "      → All new endpoints with full logging" -ForegroundColor Gray

Write-Host ""
Write-Host "   📄 backend/app/schemas/schemas.py" -ForegroundColor Cyan
Write-Host "      → Pydantic models for validation" -ForegroundColor Gray

Write-Host ""
Write-Host "   📄 backend/app/main.py" -ForegroundColor Cyan
Write-Host "      → Registered notifications router" -ForegroundColor Gray

Write-Host ""
Write-Host "   📄 backend/app/api/endpoints/schedule.py" -ForegroundColor Cyan
Write-Host "      → Enhanced with logging" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Database:" -ForegroundColor Green

Write-Host ""
Write-Host "   📄 supabase_schema.sql" -ForegroundColor Cyan
Write-Host "      → Updated with new tables" -ForegroundColor Gray

Write-Host ""
Write-Host "   📄 backend/migrations/add_notifications_and_invites.sql" -ForegroundColor Cyan
Write-Host "      → Migration script with RLS policies" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Documentation:" -ForegroundColor Green

Write-Host ""
Write-Host "   📄 IMPLEMENTATION_SUMMARY.md" -ForegroundColor Cyan
Write-Host "   📄 API_SCHEDULING_CONTRACT.md" -ForegroundColor Cyan
Write-Host "   📄 FRONTEND_INTEGRATION_GUIDE.md" -ForegroundColor Cyan

Write-Host ""
Write-Host ""
Write-Host "📊 Flow Summary" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "   1️⃣  Recruiter sends invite" -ForegroundColor White
Write-Host "       ↓ Calls: POST /api/v1/invites" -ForegroundColor Gray
Write-Host "       ↓ Backend creates interview_invites + notification" -ForegroundColor Gray

Write-Host ""
Write-Host "   2️⃣  Candidate sees notification" -ForegroundColor White
Write-Host "       ↓ Frontend: GET /api/v1/notifications" -ForegroundColor Gray
Write-Host "       ↓ Extract invite_id from metadata" -ForegroundColor Gray

Write-Host ""
Write-Host "   3️⃣  Candidate clicks notification" -ForegroundColor White
Write-Host "       ↓ Frontend: GET /api/v1/invites/{invite_id}" -ForegroundColor Gray
Write-Host "       ↓ Shows time slots in scheduling modal" -ForegroundColor Gray

Write-Host ""
Write-Host "   4️⃣  Candidate selects slot" -ForegroundColor White
Write-Host "       ↓ Frontend: POST /api/v1/invites/{invite_id}/respond" -ForegroundColor Gray
Write-Host "       ↓ Backend updates status, notifies recruiter" -ForegroundColor Gray

Write-Host ""
Write-Host "   5️⃣  Recruiter sees response" -ForegroundColor White
Write-Host "       ↓ Frontend: GET /api/v1/recruiter/responses" -ForegroundColor Gray
Write-Host "       ↓ Shows 'John Doe - Accepted March 28, 2:00 PM'" -ForegroundColor Gray

Write-Host ""
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ All Set! Begin with STEP 1 (Database Migration)             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
