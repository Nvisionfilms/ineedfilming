-- Create trigger function to sync deliverable versions to project_files
CREATE OR REPLACE FUNCTION public.sync_deliverable_to_project_files()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert deliverable version into project_files with category 'deliverables'
  INSERT INTO public.project_files (
    project_id,
    file_name,
    file_path,
    file_size_bytes,
    file_type,
    mime_type,
    category,
    description,
    uploaded_by,
    created_at
  )
  SELECT 
    d.project_id,
    NEW.file_name,
    NEW.file_path,
    NEW.file_size_bytes,
    NEW.file_type,
    NEW.mime_type,
    'deliverables',
    'Version ' || NEW.version_number || ' - ' || COALESCE(NEW.notes, ''),
    NEW.uploaded_by,
    NEW.uploaded_at
  FROM public.deliverables d
  WHERE d.id = NEW.deliverable_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync on insert
CREATE TRIGGER sync_deliverable_versions_to_files
AFTER INSERT ON public.deliverable_versions
FOR EACH ROW
EXECUTE FUNCTION public.sync_deliverable_to_project_files();

-- Create trigger function to remove from project_files on delete
CREATE OR REPLACE FUNCTION public.remove_deliverable_from_project_files()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete matching project_file entry
  DELETE FROM public.project_files
  WHERE file_path = OLD.file_path 
    AND category = 'deliverables';
  
  RETURN OLD;
END;
$$;

-- Create trigger to remove on delete
CREATE TRIGGER remove_deliverable_versions_from_files
AFTER DELETE ON public.deliverable_versions
FOR EACH ROW
EXECUTE FUNCTION public.remove_deliverable_from_project_files();

-- Backfill existing deliverable versions into project_files
INSERT INTO public.project_files (
  project_id,
  file_name,
  file_path,
  file_size_bytes,
  file_type,
  mime_type,
  category,
  description,
  uploaded_by,
  created_at
)
SELECT 
  d.project_id,
  dv.file_name,
  dv.file_path,
  dv.file_size_bytes,
  dv.file_type,
  dv.mime_type,
  'deliverables',
  'Version ' || dv.version_number || ' - ' || COALESCE(dv.notes, ''),
  dv.uploaded_by,
  dv.uploaded_at
FROM public.deliverable_versions dv
JOIN public.deliverables d ON d.id = dv.deliverable_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_files pf
  WHERE pf.file_path = dv.file_path 
    AND pf.category = 'deliverables'
);