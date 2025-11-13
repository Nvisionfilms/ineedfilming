-- Create storage buckets for file uploads

-- Create project-deliverables bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-deliverables', 'project-deliverables', false, 524288000, 
  ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/*', 'audio/*'])
ON CONFLICT (id) DO NOTHING;

-- Create project-shared-files bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-shared-files', 'project-shared-files', false, 524288000, 
  ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

-- Create project-private-files bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-private-files', 'project-private-files', false, 524288000, 
  ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for project-deliverables bucket

-- Allow admins to upload
CREATE POLICY "Admins can upload deliverables"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-deliverables' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to view all deliverables
CREATE POLICY "Admins can view all deliverables"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-deliverables' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow clients to view their own project deliverables
CREATE POLICY "Clients can view their project deliverables"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-deliverables' AND
  EXISTS (
    SELECT 1 FROM client_accounts ca
    JOIN projects p ON p.id = ca.project_id
    WHERE ca.user_id = auth.uid()
    AND (storage.foldername(name))[1] = p.id::text
  )
);

-- Allow admins to delete deliverables
CREATE POLICY "Admins can delete deliverables"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-deliverables' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Storage buckets and policies created successfully';
END $$;
