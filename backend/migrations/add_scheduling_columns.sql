-- Migration: Add scheduling support columns to interviews table
-- Run this in your Supabase SQL editor or via supabase db push

-- 1. unique_link: the room URL stored at booking time
ALTER TABLE interviews
    ADD COLUMN IF NOT EXISTS unique_link TEXT;

-- 2. reminder_sent: prevents double-sending Celery reminders
ALTER TABLE interviews
    ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Index for fast reminder task queries
CREATE INDEX IF NOT EXISTS idx_interviews_reminder
    ON interviews (status, reminder_sent, scheduled_at);

-- 4. Ensure application status can hold 'interview_scheduled'
-- (no-op if the column is TEXT / VARCHAR without a CHECK constraint)
-- ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
-- Re-add with the new value if you have an enum constraint. Example:
-- ALTER TABLE applications ADD CONSTRAINT applications_status_check
--   CHECK (status IN ('pending','reviewed','shortlisted','invited','interview_scheduled','hired','rejected'));
