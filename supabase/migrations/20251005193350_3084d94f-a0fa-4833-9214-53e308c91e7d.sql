-- Create client_accounts table (linked to auth.users via profiles)
CREATE TABLE public.client_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.custom_booking_requests(id) ON DELETE SET NULL,
  company_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  storage_limit_gb integer NOT NULL DEFAULT 5,
  storage_used_gb numeric DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_storage CHECK (storage_used_gb <= storage_limit_gb)
);

-- Create client_messages table
CREATE TABLE public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  subject text,
  message text NOT NULL,
  read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create project_files table
CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text,
  category text NOT NULL CHECK (category IN ('shared', 'private', 'deliverables')),
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a client
CREATE OR REPLACE FUNCTION public.is_client(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_accounts
    WHERE user_id = p_user_id AND status = 'active'
  );
$$;

-- Helper function to get client's project
CREATE OR REPLACE FUNCTION public.get_client_project_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id FROM public.client_accounts
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
$$;

-- RLS Policies for client_accounts
CREATE POLICY "Admins can manage all client accounts"
ON public.client_accounts FOR ALL
USING (has_admin_role(auth.uid()));

CREATE POLICY "Clients can view their own account"
ON public.client_accounts FOR SELECT
USING (auth.uid() = user_id AND is_client(auth.uid()));

-- RLS Policies for client_messages
CREATE POLICY "Admins can manage all messages"
ON public.client_messages FOR ALL
USING (has_admin_role(auth.uid()));

CREATE POLICY "Clients can view their messages"
ON public.client_messages FOR SELECT
USING (
  is_client(auth.uid()) AND 
  (sender_id = auth.uid() OR recipient_id = auth.uid())
);

CREATE POLICY "Clients can send messages"
ON public.client_messages FOR INSERT
WITH CHECK (
  is_client(auth.uid()) AND 
  sender_id = auth.uid()
);

CREATE POLICY "Users can mark their messages as read"
ON public.client_messages FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- RLS Policies for project_files
CREATE POLICY "Admins can manage all files"
ON public.project_files FOR ALL
USING (has_admin_role(auth.uid()));

CREATE POLICY "Clients can view their project files"
ON public.project_files FOR SELECT
USING (
  is_client(auth.uid()) AND 
  project_id = get_client_project_id(auth.uid()) AND
  (category = 'shared' OR category = 'deliverables' OR 
   (category = 'private' AND uploaded_by = auth.uid()))
);

CREATE POLICY "Clients can upload shared and private files"
ON public.project_files FOR INSERT
WITH CHECK (
  is_client(auth.uid()) AND 
  project_id = get_client_project_id(auth.uid()) AND
  uploaded_by = auth.uid() AND
  category IN ('shared', 'private')
);

CREATE POLICY "Clients can update their own files"
ON public.project_files FOR UPDATE
USING (
  is_client(auth.uid()) AND 
  uploaded_by = auth.uid() AND
  category IN ('shared', 'private')
);

CREATE POLICY "Clients can delete their own files"
ON public.project_files FOR DELETE
USING (
  is_client(auth.uid()) AND 
  uploaded_by = auth.uid() AND
  category IN ('shared', 'private')
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('project-shared-files', 'project-shared-files', false, 524288000, ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('project-private-files', 'project-private-files', false, 524288000, ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('project-deliverables', 'project-deliverables', false, 2147483648, ARRAY['video/*', 'application/zip', 'application/x-zip-compressed'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for shared files
CREATE POLICY "Admins can manage all shared files"
ON storage.objects FOR ALL
USING (bucket_id = 'project-shared-files' AND has_admin_role(auth.uid()));

CREATE POLICY "Clients can view shared files for their project"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-shared-files' AND
  is_client(auth.uid())
);

CREATE POLICY "Clients can upload shared files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-shared-files' AND
  is_client(auth.uid())
);

-- Storage policies for private files
CREATE POLICY "Admins can manage all private files"
ON storage.objects FOR ALL
USING (bucket_id = 'project-private-files' AND has_admin_role(auth.uid()));

CREATE POLICY "Clients can view their private files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-private-files' AND
  is_client(auth.uid())
);

CREATE POLICY "Clients can upload private files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-private-files' AND
  is_client(auth.uid())
);

-- Storage policies for deliverables (admin only uploads)
CREATE POLICY "Admins can manage deliverables"
ON storage.objects FOR ALL
USING (bucket_id = 'project-deliverables' AND has_admin_role(auth.uid()));

CREATE POLICY "Clients can view their deliverables"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-deliverables' AND
  is_client(auth.uid())
);

-- Add client role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'client');
  ELSE
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
  END IF;
END $$;

-- Triggers for updated_at
CREATE TRIGGER update_client_accounts_updated_at
  BEFORE UPDATE ON public.client_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

CREATE TRIGGER update_client_messages_updated_at
  BEFORE UPDATE ON public.client_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- Create indexes for performance
CREATE INDEX idx_client_accounts_user_id ON public.client_accounts(user_id);
CREATE INDEX idx_client_accounts_project_id ON public.client_accounts(project_id);
CREATE INDEX idx_client_messages_sender ON public.client_messages(sender_id);
CREATE INDEX idx_client_messages_recipient ON public.client_messages(recipient_id);
CREATE INDEX idx_client_messages_project ON public.client_messages(project_id);
CREATE INDEX idx_project_files_project ON public.project_files(project_id);
CREATE INDEX idx_project_files_category ON public.project_files(category);
CREATE INDEX idx_project_files_uploaded_by ON public.project_files(uploaded_by);