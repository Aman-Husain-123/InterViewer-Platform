-- Migration: Add Notifications & Interview Invites Tables
-- Created: 2026-03-26
-- Adds support for interview scheduling workflow with notifications

-- 6. Interview Invites Table
CREATE TABLE IF NOT EXISTS public.interview_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  proposed_time_slots TIMESTAMPTZ[] DEFAULT '{}',
  selected_time_slot TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interview_invites ENABLE ROW LEVEL SECURITY;

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('INTERVIEW_INVITE', 'RESPONSE', 'REMINDER', 'ACCEPTED', 'SCHEDULED')) DEFAULT 'INTERVIEW_INVITE',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Interview Invites: Recruiters manage their own, candidates view invites for their applications
CREATE POLICY "Recruiters manage invites" ON public.interview_invites 
  FOR ALL USING (auth.uid() = recruiter_id);

CREATE POLICY "Candidates view invites" ON public.interview_invites 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications 
      WHERE applications.id = interview_invites.application_id 
      AND applications.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Notifications: Users can view their own notifications
CREATE POLICY "Users view own notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users mark own notifications read" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System creates notifications" ON public.notifications 
  FOR INSERT WITH CHECK (TRUE);

-- TRIGGERS

-- Add trigger for interview_invites updated_at column
CREATE TRIGGER update_interview_invites_updated_at 
  BEFORE UPDATE ON public.interview_invites 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- INDEXES (for performance)

-- Index on notifications for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Index on interview_invites for faster queries
CREATE INDEX IF NOT EXISTS idx_interview_invites_recruiter_id ON public.interview_invites(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_invites_application_id ON public.interview_invites(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_invites_status ON public.interview_invites(status);
CREATE INDEX IF NOT EXISTS idx_interview_invites_created_at ON public.interview_invites(created_at DESC);
