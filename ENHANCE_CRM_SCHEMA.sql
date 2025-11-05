-- Enhanced CRM Schema for Sales Pipeline
-- Run this in Supabase SQL Editor

-- 1. Add qualification and scoring columns to opportunities
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS qualification_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS qualification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qualified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_grade TEXT CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS days_in_stage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT now();

-- 2. Create activity timeline table
CREATE TABLE IF NOT EXISTS opportunity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('email', 'call', 'meeting', 'note', 'stage_change', 'proposal', 'task', 'payment')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_opportunity ON opportunity_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON opportunity_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON opportunity_activities(activity_type);

-- 3. Create follow-up reminders table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('follow_up', 'proposal', 'meeting', 'payment', 'custom')),
  due_date TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_opportunity ON follow_up_reminders(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON follow_up_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON follow_up_reminders(status);

-- 4. Enable RLS on new tables
ALTER TABLE opportunity_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for activities
CREATE POLICY "Admins can view all activities"
ON opportunity_activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can create activities"
ON opportunity_activities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 6. RLS Policies for reminders
CREATE POLICY "Admins can view all reminders"
ON follow_up_reminders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage reminders"
ON follow_up_reminders FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 7. Function to auto-update last_activity_at
CREATE OR REPLACE FUNCTION update_opportunity_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE opportunities
  SET last_activity_at = now()
  WHERE id = NEW.opportunity_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_activity
AFTER INSERT ON opportunity_activities
FOR EACH ROW
EXECUTE FUNCTION update_opportunity_last_activity();

-- 8. Function to calculate days in stage
CREATE OR REPLACE FUNCTION calculate_days_in_stage()
RETURNS void AS $$
BEGIN
  UPDATE opportunities
  SET days_in_stage = EXTRACT(DAY FROM (now() - stage_changed_at))::INTEGER
  WHERE stage NOT IN ('won', 'lost');
END;
$$ LANGUAGE plpgsql;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_last_activity ON opportunities(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_days_in_stage ON opportunities(days_in_stage DESC);

-- 10. Initial data migration - set stage_changed_at for existing records
UPDATE opportunities
SET stage_changed_at = updated_at
WHERE stage_changed_at IS NULL;

UPDATE opportunities
SET last_activity_at = updated_at
WHERE last_activity_at IS NULL;

-- 11. Calculate initial days in stage
SELECT calculate_days_in_stage();

COMMENT ON TABLE opportunity_activities IS 'Timeline of all activities for each opportunity';
COMMENT ON TABLE follow_up_reminders IS 'Automated and manual follow-up reminders for opportunities';
COMMENT ON COLUMN opportunities.qualification_data IS 'JSON object storing BANT qualification criteria';
COMMENT ON COLUMN opportunities.lead_score IS 'Calculated score 0-100 based on engagement and demographics';
COMMENT ON COLUMN opportunities.lead_grade IS 'Letter grade A-D based on lead_score';
