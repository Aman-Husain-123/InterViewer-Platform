# ✅ Candidate Login Redirect Fix - Verification Guide

**Status**: 🟢 **READY FOR TESTING**
**Date**: March 26, 2026

---

## 📋 What Was Fixed

### Issue
Candidates were being redirected to the recruiter dashboard instead of the candidate dashboard after logging in through the candidate portal.

### Root Causes Fixed
1. **Silent Profile Query Failure** - Role detection failed without proper error handling
2. **Missing Profile on Initial Login** - No auto-profile creation for first-time logins
3. **Restrictive RLS Policies** - Database policies were blocking profile reads during login
4. **Type Safety Issues** - TypeScript type errors in login logic

---

## 🔧 Frontend Fixes Applied

### ✅ File 1: `src/app/candidate/login/page.tsx`
**Status**: Compiled ✓ No errors

**Key Improvements**:
- Added explicit error handling with try-catch blocks
- Added automatic profile creation if missing (defaults to "candidate")
- Added console logging for debugging
- Added proper TypeScript type casting: `as { data: { role?: string } | null; error: any }`
- Prevents recruiters from accessing candidate portal with error message

**Code Changes**:
```typescript
// Added explicit error handling
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", userId)
  .single() as { data: { role?: string } | null; error: any };

// Auto-create profile if missing
if (profileError || !profile) {
  console.log("Profile not found, creating as candidate...");
  await supabase.from("profiles").upsert({
    id: userId,
    email: data.user.email || email,
    role: "candidate",
  } as any);
}

// Block recruiters from candidate portal
if (profile.role === "recruiter") {
  setError("This portal is for candidates only...");
  await supabase.auth.signOut();
  return;
}
```

### ✅ File 2: `src/app/login/page.tsx`
**Status**: Compiled ✓ No errors (FIXED)

**Key Improvements**:
- Added explicit error handling with try-catch blocks
- Added automatic profile creation as "candidate" if missing
- Added console logging for debugging role assignment
- Fixed TypeScript type casting: `as { data: { role?: string } | null; error: any }`
- Defaults to "candidate" role if no profile exists

**Code Changes**:
```typescript
// Added proper type casting
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", userId)
  .single() as { data: { role?: string } | null; error: any };

// Default to candidate if no profile
let userRole = "candidate";

if (profileError) {
  // Auto-create as candidate
  try {
    await supabase.from("profiles").insert({
      id: userId,
      email: data.user.email || email,
      role: "candidate",
    } as any);
  } catch (insertErr) {
    console.log("Profile already exists or insert failed");
  }
} else if (profile?.role) {
  userRole = profile.role;
}

// Route based on role
const destination = userRole === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
router.push(destination);
```

---

## 🗄️ Database Migration Ready

### File: `migrations/fix_profile_rls.sql`
**Status**: Ready to apply

**Policy Changes**:
1. **Drops**: Old restrictive "Users can view own profile" policy
2. **Creates**: 
   - "Authenticated users can view own profile" (SELECT)
   - "Authenticated users can update own profile" (UPDATE)
   - "Authenticated users can insert own profile" (INSERT)
   - "Service role can insert profiles during signup" (INSERT with no checks)
3. **Defaults**: Sets `role` column to default to `'candidate'`

**Impact**:
- ✓ Authenticated users can read their own profile during login
- ✓ Service role can create profiles during signup
- ✓ All new profiles default to "candidate" role
- ✓ Policies no longer block profile reads

---

## 🧪 Testing Plan

### Before Running Tests
1. **Backup your Supabase database** (optional but recommended)
2. **Apply the database migration** (see instructions below)
3. **Start the frontend dev server**: `npm run dev`

---

### Test Case 1: New Candidate Registration & Login ⭐
**Purpose**: Verify new candidates can register and login correctly

**Steps**:
1. Go to `/apply` (candidate application form)
2. Fill in all application fields
3. Complete the application
4. Navigate to `/candidate/login`
5. Log in with the email/password used in application
6. ✅ **Expected Result**: Redirected to `/candidate/dashboard`
7. ✅ **Verify**: Check browser console for: `"Profile not found, creating as candidate..."`

**What's Being Tested**:
- Auto-profile creation on first login
- Correct role assignment for new candidates
- Proper redirect to candidate dashboard

---

### Test Case 2: Returning Candidate Login
**Purpose**: Verify existing candidates can login and stay on correct dashboard

**Steps**:
1. Go to `/candidate/login`
2. Log in with a previously created candidate account
3. ✅ **Expected Result**: Redirected to `/candidate/dashboard`
4. ✅ **Verify**: Profile should be fetched without errors

**What's Being Tested**:
- Profile query succeeds for existing candidates
- Correct role reading from database
- Proper redirect logic

---

### Test Case 3: Recruiter Cannot Access Candidate Portal
**Purpose**: Verify recruiters are blocked from candidate portal

**Prerequisite**: Must have a recruiter account created
- In Supabase, manually set `profiles.role = 'recruiter'` for a test user

**Steps**:
1. Go to `/candidate/login`
2. Log in with a recruiter account
3. ✅ **Expected Result**: See error: "This portal is for candidates only..."
4. ✅ **Verify**: Automatically signed out and redirected to login
5. ✅ **Verify**: User stays on candidate portal (not redirected to recruiter dashboard)

**What's Being Tested**:
- Candidate portal access control
- Role-based portal blocking
- Automatic sign-out for unauthorized access

---

### Test Case 4: Unified Login - Candidate Route
**Purpose**: Verify unified login redirects candidates correctly

**Steps**:
1. Go to `/login`
2. Tab should default to "Candidate"
3. Log in with a candidate account
4. ✅ **Expected Result**: Redirected to `/candidate/dashboard`
5. ✅ **Verify**: Check console: `"Login successful. User role: candidate, redirecting to: /candidate/dashboard"`

**What's Being Tested**:
- Unified login candidate detection
- Correct dashboard routing for candidates
- Console logging for debugging

---

### Test Case 5: Unified Login - Recruiter Route
**Purpose**: Verify unified login redirects recruiters correctly

**Prerequisite**: Must have a recruiter account

**Steps**:
1. Go to `/login`
2. Click "Recruiter" tab
3. Log in with a recruiter account
4. ✅ **Expected Result**: Redirected to `/recruiter/dashboard`
5. ✅ **Verify**: Check console: `"Login successful. User role: recruiter, redirecting to: /recruiter/dashboard"`

**What's Being Tested**:
- Unified login recruiter detection
- Correct dashboard routing for recruiters
- Tab switching functionality

---

### Test Case 6: Database Default Role Verification
**Purpose**: Verify database defaults new profiles to "candidate"

**Steps**:
1. Create a new Supabase profile manually via SQL console:
   ```sql
   INSERT INTO public.profiles (id, email)
   VALUES ('test-user-id', 'test@example.com');
   ```
2. Query the profile:
   ```sql
   SELECT id, email, role FROM public.profiles WHERE id = 'test-user-id';
   ```
3. ✅ **Expected Result**: `role` column shows `'candidate'`

**What's Being Tested**:
- Database default constraints
- Automatic role assignment at database level

---

## 🚀 How to Apply the Database Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to **Supabase Dashboard** → Your Project
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**
4. Copy contents from `migrations/fix_profile_rls.sql`
5. Paste into the SQL editor
6. Click **"RUN"**
7. ✅ Verify no errors appear

### Option 2: Supabase CLI
```powershell
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase migration up --file migrations/fix_profile_rls.sql
```

### Option 3: Direct SQL (Advanced)
1. Open your database client (pgAdmin, DBeaver, etc.)
2. Connect to your Supabase database
3. Open `migrations/fix_profile_rls.sql`
4. Execute the SQL

---

## 🔍 Debugging Tips

### If Candidates Still Redirect to Recruiter Dashboard

#### Step 1: Check Browser Console
Open **Developer Tools** (F12) and look for:
- ❓ Any JavaScript errors?
- ❓ Check the Network tab for failed requests
- ❓ Are there console.log messages about role detection?

#### Step 2: Verify Database Migration Applied
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```
✅ Should show policies created by the migration

#### Step 3: Check Profile Existence
```sql
-- Run in Supabase SQL Editor
SELECT id, email, role, created_at FROM public.profiles WHERE id = '<USER_ID>';
```
✅ Should show your user with `role = 'candidate'` or `'recruiter'`

#### Step 4: Check RLS Status
```sql
-- Run in Supabase SQL Editor
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
```
✅ Should show `rowsecurity = true`

#### Step 5: Test Role Query Manually
```sql
-- Run in Supabase SQL Editor as authenticated user
SELECT role FROM public.profiles WHERE id = auth.uid();
```
✅ Should return your role without errors

---

## 📊 Verification Checklist

### Code Changes
- [ ] `src/app/candidate/login/page.tsx` compiles without errors
- [ ] `src/app/login/page.tsx` compiles without errors
- [ ] No TypeScript type errors in either file
- [ ] Console logging appears when expected

### Database Migration
- [ ] Migration file exists: `migrations/fix_profile_rls.sql`
- [ ] Migration has been applied to Supabase
- [ ] RLS policies updated correctly
- [ ] Default role set to "candidate"

### Test Results
- [ ] **Test 1**: New candidate registration → correct redirect ✓
- [ ] **Test 2**: Returning candidate login → correct redirect ✓
- [ ] **Test 3**: Recruiter blocked from candidate portal ✓
- [ ] **Test 4**: Unified login - candidate redirect ✓
- [ ] **Test 5**: Unified login - recruiter redirect ✓
- [ ] **Test 6**: Database defaults verify ✓

### Production Ready
- [ ] All tests passed
- [ ] No console errors
- [ ] Role detection working correctly
- [ ] Redirects going to correct dashboards
- [ ] Both login pages working

---

## 💾 Files Changed Summary

```
frontend/src/app/candidate/login/page.tsx
├── ✅ Added error handling
├── ✅ Added auto-profile creation
├── ✅ Added type casting
└── Status: Ready

frontend/src/app/login/page.tsx
├── ✅ Added error handling
├── ✅ Added auto-profile creation
├── ✅ Added type casting (JUST FIXED)
└── Status: Ready

migrations/fix_profile_rls.sql
├── ✅ Drops restrictive policies
├── ✅ Creates improved policies
├── ✅ Sets default role
└── Status: Ready to apply
```

---

## 🎯 Expected Behavior After Fix

### Scenario 1: First-Time Candidate Login
```
1. Candidate registers via /apply
2. Candidate goes to /candidate/login
3. Enters email/password
4. Backend queries profile (might not exist yet)
5. If missing: Backend auto-creates with role="candidate"
6. Redirect to /candidate/dashboard ✓
```

### Scenario 2: Returning Candidate Login
```
1. Candidate goes to /candidate/login
2. Enters email/password
3. Backend queries profile (exists)
4. Reads role="candidate" from database
5. Redirect to /candidate/dashboard ✓
```

### Scenario 3: Recruiter Attempting Candidate Portal
```
1. Recruiter goes to /candidate/login
2. Enters email/password
3. Backend queries profile
4. Reads role="recruiter"
5. Show error: "This portal is for candidates only"
6. Auto sign-out
7. Prevent redirect to recruiter dashboard ✗
```

---

## 📞 Need Help?

### Common Issues

**Q: Candidates still going to recruiter dashboard**
A: Check that the migration has been applied. Look for console errors. Verify the profile role in the database.

**Q: Getting "Profile not found" errors**
A: This is expected for first-time logins. The auto-create should handle it. Check browser console for the actual error message.

**Q: RLS policy errors in console**
A: The migration might not have been applied. Check Supabase SQL Editor for policy status.

**Q: TypeScript compilation errors**
A: All should be fixed now. Run `npm run build` in the frontend directory to verify.

---

## 🎉 Success Criteria

✅ All 6 test cases pass
✅ No console errors during login
✅ Candidates redirect to candidate dashboard
✅ Recruiters redirect to recruiter dashboard
✅ Recruiters cannot access candidate portal
✅ Database migration applied without errors

---

**Next Steps:**
1. Apply the database migration
2. Run the frontend dev server
3. Run through all 6 test cases
4. Check console for any errors
5. Verify redirects are working correctly
6. Deploy to production when all tests pass
