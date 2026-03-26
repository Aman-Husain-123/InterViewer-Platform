# Frontend Diagnostic & Startup Guide

## Current Status
✅ All TypeScript compilation errors fixed (0 errors)
✅ All authentication components created
✅ All protected routes implemented
✅ All UI components in place

## What's Implemented

### Authentication System
- ✅ `authContext.tsx` - Global auth state with useAuth hook
- ✅ `supabaseClient.ts` - Browser client for auth
- ✅ `supabaseServer.ts` - Server client for protected pages
- ✅ `middleware.ts` - Server-side route protection
- ✅ `ProtectedRoute.tsx` - Client-side route wrapper

### Pages (All Complete)
- ✅ `/` - Home/Landing page with Navbar & HeroSection
- ✅ `/login` - Unified login for candidates & recruiters
- ✅ `/register` - Registration with role selection
- ✅ `/candidate/login` - Candidate-specific login
- ✅ `/candidate/dashboard` - Candidate dashboard (protected)
- ✅ `/recruiter/dashboard` - Recruiter dashboard (protected, server-side auth)

### Components (All Present)
- ✅ Landing components (Navbar, HeroSection)
- ✅ Dashboard components (CandidateNav, RecruiterDashboardClient)
- ✅ UI components (Button, Card, Badge)
- ✅ Protected route wrapper

## How to Start

### 1. Install Dependencies (First Time Only)
```powershell
cd C:\Users\user\OneDrive\Documents\Data_Scientist\Internship_Projects\AI-Interviewer-Skill-assessment\frontend
npm install
```

### 2. Verify Environment
The `.env` file should contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://bbkypdeusayywhudtxen.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rlLTAcny1S1Mp0PmnPkrzA_TkMDe_qB
```

### 3. Start Development Server
```powershell
cd C:\Users\user\OneDrive\Documents\Data_Scientist\Internship_Projects\AI-Interviewer-Skill-assessment\frontend
npm run dev
```

The app will be available at: **http://localhost:3000**

## Testing Routes

### Public Routes (No Login Required)
- `http://localhost:3000/` - Home page
- `http://localhost:3000/login` - Login page (unified)
- `http://localhost:3000/register` - Registration page
- `http://localhost:3000/candidate/login` - Candidate login
- `http://localhost:3000/apply` - Job applications (if implemented)

### Protected Routes (Require Login)
- `http://localhost:3000/candidate/dashboard` - Candidate only
- `http://localhost:3000/recruiter/dashboard` - Recruiter only
- `http://localhost:3000/dashboard` - Redirects based on role

### Test Accounts
You need to create accounts via the registration page, or use existing accounts in your Supabase database.

## Common Issues & Fixes

### Issue: "Cannot find module '@/...' "
**Solution**: TypeScript paths are configured in `tsconfig.json`:
```json
"paths": {
  "@/*": ["./src/*"]
}
```
Make sure you're using the `@/` prefix in imports.

### Issue: "Hydration mismatch" errors
**Solution**: Fixed in `layout.tsx` with:
```tsx
<html lang="en" suppressHydrationWarning>
  <body suppressHydrationWarning>
```

### Issue: "useAuth must be used within AuthProvider"
**Solution**: Make sure the component has `"use client"` directive and is wrapped by AuthProvider in layout.tsx.

### Issue: Supabase client errors
**Solution**: 
1. Check `.env` file has correct Supabase keys
2. Browser client uses: `getSupabaseBrowserClient()`
3. Server client uses: `getSupabaseServerClient()` (in Server Components only)
4. Middleware uses: `createServerClient()` from @supabase/ssr

## Architecture Overview

```
Frontend (Next.js 16 with React 19)
├── App Router
├── Authentication (Supabase)
├── Protected Routes (Middleware + ProtectedRoute wrapper)
├── Tailwind CSS (v4) + shadcn/ui components
└── TypeScript with type safety

Key Dependencies:
- @supabase/ssr - For auth & session management
- @supabase/supabase-js - Supabase client
- next - React framework
- tailwindcss v4 - Styling
- lucide-react - Icons
```

## Build Commands

```powershell
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## What's Working Now

1. **Authentication Flow**
   - Sign up new users (creates profiles table entry with role)
   - Sign in existing users
   - Role detection from profiles.role
   - Protected routes redirect based on role

2. **User Navigation**
   - Navbar shows Login/Register for guests
   - Navbar shows Dashboard link for logged-in users
   - Role-aware dashboard links

3. **Dashboard Access**
   - Candidates see candidate dashboard
   - Recruiters see recruiter dashboard
   - Wrong role redirects to correct dashboard
   - Not authenticated redirects to login

4. **Styling**
   - Dark theme with Tailwind CSS v4
   - Responsive design
   - Modern gradients & animations
   - Lucide icons throughout

## Next Steps (If Issues Occur)

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for API calls

2. **Check Terminal Output**
   - Look for build warnings
   - Check for Next.js compilation errors
   - Verify Supabase connection

3. **Verify Supabase**
   - Go to https://app.supabase.co
   - Check if profiles table exists
   - Ensure RLS policies allow reads
   - Check if users are being created

4. **Test Each Route Manually**
   - Try registering as candidate
   - Try registering as recruiter
   - Try logging in
   - Try accessing protected routes

## Database Requirements

The following Supabase tables must exist:
- `profiles` - User profiles with role (candidate/recruiter)
- `recruiters` - Recruiter-specific data (optional, for backward compatibility)
- `candidates` - Candidate-specific data (optional, for backward compatibility)
- `jobs` - Job postings
- `applications` - Job applications
- `interview_sessions` - Interview bookings

## Performance Notes

- Images are optimized with Next.js Image component
- Code splitting enabled by default
- Tailwind CSS v4 with optimal bundling
- TypeScript strict mode enabled for safety

## Security

- ✅ Server-side auth checks in middleware
- ✅ Client-side route protection
- ✅ Type-safe database queries
- ✅ Supabase RLS policies enforced
- ✅ No sensitive data in browser storage

---

**Last Updated**: March 26, 2026
**Frontend Version**: Next.js 16, React 19
**Status**: Ready for Testing
