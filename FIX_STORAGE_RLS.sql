-- Fix storage RLS policies for project-deliverables bucket

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can upload deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their project deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete deliverables" ON storage.objects;

-- Allow admins to upload to any bucket
CREATE POLICY "Admins can upload to storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to view all files
CREATE POLICY "Admins can view all storage files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to update files
CREATE POLICY "Admins can update storage files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete storage files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow clients to view their own project files
CREATE POLICY "Clients can view their project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('project-deliverables', 'project-shared-files') AND
  EXISTS (
    SELECT 1 FROM client_accounts ca
    JOIN projects p ON p.id = ca.project_id
    WHERE ca.user_id = auth.uid()
    AND (storage.foldername(name))[1] = p.id::text
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Storage RLS policies fixed successfully';
END $$;
