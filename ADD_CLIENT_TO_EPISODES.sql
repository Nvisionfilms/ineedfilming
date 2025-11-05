-- Add client_id to episodes table for per-episode client assignment

-- Add client_id column to episodes
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES client_accounts(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_episodes_client_id ON episodes(client_id);

-- Optionally, populate existing episodes with their project's client
UPDATE episodes e
SET client_id = p.client_id
FROM projects p
WHERE e.project_id = p.id
AND e.client_id IS NULL
AND p.client_id IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'client_id column added to episodes table';
END $$;
