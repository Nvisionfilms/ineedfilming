-- Remove old check constraint and add correct one
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('pre_production', 'in_production', 'post_production', 'completed', 'on_hold'));