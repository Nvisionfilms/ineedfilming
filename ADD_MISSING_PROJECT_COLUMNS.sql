-- Add missing columns to projects table

-- Add booking_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='projects' AND column_name='booking_id') THEN
        ALTER TABLE public.projects 
        ADD COLUMN booking_id UUID REFERENCES public.custom_booking_requests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_projects_booking_id ON public.projects(booking_id);
    END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
