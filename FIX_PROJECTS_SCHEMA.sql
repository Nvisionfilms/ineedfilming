-- Add missing columns to projects table to match AdminProjects code

-- Add project_name column (maps to title)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Add project_type column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type TEXT;

-- Add shoot_date column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS shoot_date DATE;

-- Add delivery_date column  
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Add booking_id column (for linking to bookings)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES custom_booking_requests(id);

-- Add opportunity_id column (for linking to pipeline)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id);

-- Make client_name and client_email nullable (not always required)
ALTER TABLE projects 
ALTER COLUMN client_name DROP NOT NULL,
ALTER COLUMN client_email DROP NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_booking_id ON projects(booking_id);
CREATE INDEX IF NOT EXISTS idx_projects_opportunity_id ON projects(opportunity_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Projects table schema updated successfully';
END $$;
