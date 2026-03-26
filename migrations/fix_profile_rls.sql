-- Fix RLS Policy for profiles table to allow authenticated users to read their own role during login
-- This ensures candidates can read their role during login without issues

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create more explicit policies for profiles
CREATE POLICY "Authenticated users can view own profile" ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Ensure users can read all profiles (needed for role detection in login)
-- but only edit their own
CREATE POLICY "Service role can insert profiles during signup" ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Make sure the default role is 'candidate' for all new profiles
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'candidate';
