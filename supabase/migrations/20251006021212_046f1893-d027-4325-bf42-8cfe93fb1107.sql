-- Fix foreign key constraint to allow opportunity deletion
-- Drop the existing foreign key constraint
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_opportunity_id_fkey;

-- Recreate the foreign key with ON DELETE SET NULL
ALTER TABLE public.projects 
ADD CONSTRAINT projects_opportunity_id_fkey 
FOREIGN KEY (opportunity_id) 
REFERENCES public.opportunities(id) 
ON DELETE SET NULL;