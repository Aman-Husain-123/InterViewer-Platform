# Frontend Testing Checklist

## Environment Setup ✅
- [x] `.env` file exists with Supabase credentials
- [x] `.env` file has `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [x] TypeScript has 0 compilation errors
- [x] All imports resolve correctly (@/ paths working)

## Installation & Build ✅
- [x] `npm install` completes without errors
- [x] `npm run build` completes successfully
- [x] No critical warnings during build
- [x] `node_modules` folder exists with all dependencies

## Development Server
### To Test:
1. Run `npm run dev` in frontend folder
2. Check if server starts on port 3000
3. No errors in terminal
4. App is responsive to code changes (HMR working)

## Public Routes (No Auth Required)

### Home Page - `http://localhost:3000/`
- [ ] Page loads without errors
- [ ] Navbar displays correctly
- [ ] Hero section is visible
- [ ] Links to login/register work
- [ ] Dark theme applies correctly
- [ ] Responsive on mobile/tablet

### Login Page - `http://localhost:3000/login`
- [ ] Unified login form appears
- [ ] Tab switcher for candidate/recruiter works
- [ ] Email/password inputs functional
- [ ] Show/hide password toggle works
- [ ] Form validation works
- [ ] Error messages display
- [ ] Successful login redirects to dashboard

### Candidate Login - `http://localhost:3000/candidate/login`
- [ ] Candidate-specific login page loads
- [ ] Login form works
- [ ] Prevents recruiters from logging in
- [ ] Successful login redirects to candidate dashboard

### Registration Page - `http://localhost:3000/register`
- [ ] Registration form loads
- [ ] Role selection (Candidate/Recruiter) works
- [ ] Form validation active (min 8 char password)
- [ ] Can create candidate account
- [ ] Can create recruiter account
- [ ] Email appears in Supabase auth after signup

### Job Browse Page - `http://localhost:3000/apply`
- [ ] Page loads
- [ ] Shows available jobs (if any exist)
- [ ] Loading state appears initially
- [ ] Job cards display correctly

## Protected Routes (Require Authentication)

### Candidate Dashboard - `http://localhost:3000/candidate/dashboard`
- [ ] Anonymous redirect to login
- [ ] After login, candidate can access
- [ ] Recruiters are redirected to recruiter dashboard
- [ ] Dashboard shows candidate-specific content
- [ ] Sidebar navigation visible
- [ ] Profile information displays
- [ ] My Applications section exists

### Candidate Dashboard - `http://localhost:3000/dashboard`
- [ ] Anonymous redirect to login
- [ ] Candidates redirected to /candidate/dashboard
- [ ] Recruiters redirected to /recruiter/dashboard

### Recruiter Dashboard - `http://localhost:3000/recruiter/dashboard`
- [ ] Anonymous redirect to /login?role=recruiter
- [ ] After recruiter login, can access
- [ ] Candidates are redirected to /candidate/dashboard
- [ ] Dashboard shows recruiter-specific content
- [ ] Shows active jobs count
- [ ] Shows candidate count
- [ ] Shows upcoming interviews
- [ ] Create new job button visible
- [ ] Sidebar navigation functional

## Authentication Flow Testing

### Test 1: Create Candidate Account
1. Go to `/register`
2. Select "Candidate" role
3. Fill in form and submit
4. Check Supabase auth for new user
5. Check profiles table for role="candidate"
6. Login with new account
7. Should redirect to candidate dashboard

### Test 2: Create Recruiter Account
1. Go to `/register`
2. Select "Recruiter" role
3. Fill in form and submit
4. Check Supabase auth for new user
5. Check profiles table for role="recruiter"
6. Login with new account
7. Should redirect to recruiter dashboard

### Test 3: Wrong Role Protection
1. Create/login as candidate
2. Try accessing `/recruiter/dashboard` directly
3. Should redirect to `/candidate/dashboard`
4. Create/login as recruiter
5. Try accessing `/candidate/dashboard` directly
6. Should redirect to `/recruiter/dashboard`

### Test 4: Logout
1. Login as either role
2. Click logout button
3. Should redirect to login page
4. Try accessing protected route
5. Should redirect to login

## UI/UX Testing

### Navbar (Public)
- [ ] Logo/branding clickable
- [ ] Login link visible for guests
- [ ] Register button visible for guests
- [ ] Dashboard link visible for logged-in users
- [ ] Logout button visible for logged-in users
- [ ] Links navigate correctly

### Sidebar (Protected Dashboards)
- [ ] Navigation links work
- [ ] Active link highlighted
- [ ] User profile shown in sidebar
- [ ] Logout button accessible

### Forms
- [ ] Input fields accept text
- [ ] Email validation works
- [ ] Password meets requirements
- [ ] Error messages appear on failure
- [ ] Submit button disables during loading
- [ ] Loading spinner appears

### Responsiveness
- [ ] Mobile layout (< 640px) works
- [ ] Tablet layout (640px - 1024px) works
- [ ] Desktop layout (> 1024px) works
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets are large enough

## Performance Testing

### First Paint
- [ ] Page interactive within 3 seconds
- [ ] No blank white screen
- [ ] Proper loading states shown

### CSS/Styling
- [ ] Dark theme consistent
- [ ] No layout shifts
- [ ] Animations smooth (60fps)
- [ ] Gradient effects render correctly

### JavaScript
- [ ] No console errors
- [ ] No console warnings
- [ ] Auth context initializes
- [ ] Protected routes check auth immediately

## Error Handling

### Network Errors
- [ ] App handles offline gracefully
- [ ] API errors display user-friendly messages
- [ ] Retry logic works if implemented
- [ ] No infinite loops on error

### Auth Errors
- [ ] Invalid credentials show error
- [ ] Expired sessions redirect to login
- [ ] Wrong role shows redirect message
- [ ] Permission errors handled

## Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## Accessibility

### Keyboard Navigation
- [ ] Tab through form fields
- [ ] Enter to submit forms
- [ ] Escape to close modals

### Screen Reader
- [ ] Form labels associated with inputs
- [ ] Buttons have descriptive text
- [ ] Images have alt text
- [ ] Color not only indicator of status

## Integration Testing (Once Backend is Running)

### API Connections
- [ ] Candidate dashboard fetches from API
- [ ] Recruiter dashboard fetches from API
- [ ] Job listings load
- [ ] Interview schedule works
- [ ] CORS is not blocking requests

### Supabase Integration
- [ ] Can read profiles table
- [ ] Can write to profiles table
- [ ] Auth sessions persist
- [ ] RLS policies working

## Quick Regression Tests

### After Any Code Change:
1. [ ] `npm run build` succeeds
2. [ ] `npm run dev` starts without errors
3. [ ] Home page loads
4. [ ] Can register account
5. [ ] Can login
6. [ ] Dashboard shows after login
7. [ ] Logout works

---

## Known Issues & Workarounds

### Issue: Hydration Mismatch Warnings
- **Status**: Fixed with `suppressHydrationWarning`
- **If still occurring**: Check browser console for which component

### Issue: Supabase Client Errors
- **Check**: 
  1. NEXT_PUBLIC_SUPABASE_URL in .env
  2. NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
  3. Browser has Supabase account connection

### Issue: Protected Routes Not Redirecting
- **Check**:
  1. AuthProvider is wrapping the app
  2. `suppressHydrationWarning` on html and body tags
  3. Browser cookies enabled
  4. No middleware issues

### Issue: API Not Found (404)
- **Check**:
  1. Backend running on port 8000
  2. NEXT_PUBLIC_API_URL set correctly
  3. CORS enabled on backend

---

## Test Results Log

| Test | Status | Notes | Date |
|------|--------|-------|------|
| TypeScript Compilation | ✅ PASS | 0 errors | 2026-03-26 |
| Dependency Installation | 🔄 PENDING | Manual test needed | 2026-03-26 |
| Dev Server Start | 🔄 PENDING | Manual test needed | 2026-03-26 |
| Home Page Load | 🔄 PENDING | Manual test needed | 2026-03-26 |
| Create Candidate Account | 🔄 PENDING | Manual test needed | 2026-03-26 |
| Create Recruiter Account | 🔄 PENDING | Manual test needed | 2026-03-26 |
| Role-based Routing | 🔄 PENDING | Manual test needed | 2026-03-26 |
| Protected Route Access | 🔄 PENDING | Manual test needed | 2026-03-26 |

---

## Contact & Support

For issues during testing, check:
1. Browser console (F12)
2. Terminal output from `npm run dev`
3. Supabase dashboard for data state
4. Network tab for API/auth calls
5. FRONTEND_DIAGNOSTIC.md for configuration help
