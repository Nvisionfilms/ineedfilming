-- Drop the old check constraint
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_stage_check;

-- Add new check constraint with all valid stage values
ALTER TABLE opportunities ADD CONSTRAINT opportunities_stage_check 
CHECK (stage IN ('new_lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'));