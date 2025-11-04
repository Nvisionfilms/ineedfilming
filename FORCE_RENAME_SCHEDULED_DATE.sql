-- Force rename meetings.scheduled_date to scheduled_at
-- This will fail if the column doesn't exist, which is fine

ALTER TABLE public.meetings 
RENAME COLUMN scheduled_date TO scheduled_at;
