-- Update projects status constraint to match AdminProjects UI

-- Drop the old constraint
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add new constraint with the correct status values
ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('pre_production', 'in_production', 'post_production', 'completed', 'on_hold', 'planning', 'active', 'cancelled'));

-- Update existing records to use new status values
UPDATE projects 
SET status = 'pre_production' 
WHERE status = 'planning';

UPDATE projects 
SET status = 'in_production' 
WHERE status = 'active';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Project status constraint updated to match UI';
END $$;
