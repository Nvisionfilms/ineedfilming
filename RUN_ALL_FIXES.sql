-- ========================================
-- COMPLETE SYSTEM SETUP - RUN ALL FIXES
-- Run this single script to set up everything
-- ========================================

-- 1. Add booking_id column to client_accounts
ALTER TABLE client_accounts 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES custom_booking_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_accounts_booking_id ON client_accounts(booking_id);

-- 2. Fix client_accounts RLS policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'client_accounts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON client_accounts';
    END LOOP;
END $$;

CREATE POLICY "Admins can view all client accounts"
ON client_accounts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert client accounts"
ON client_accounts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update client accounts"
ON client_accounts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete client accounts"
ON client_accounts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Clients can view their own account"
ON client_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-deliverables', 'project-deliverables', false, 524288000, 
  ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/*', 'audio/*'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-shared-files', 'project-shared-files', false, 524288000, 
  ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-private-files', 'project-private-files', false, 524288000, 
  ARRAY['image/*', 'video/*', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

-- 4. Fix storage RLS policies
DROP POLICY IF EXISTS "Admins can upload deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their project deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all storage files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update storage files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete storage files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their project files" ON storage.objects;

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

-- 5. Fix client_messages table
DROP TABLE IF EXISTS public.client_messages CASCADE;

CREATE TABLE public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all messages"
ON public.client_messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Clients can view their messages"
ON public.client_messages FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "Clients can send messages"
ON public.client_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark their messages as read"
ON public.client_messages FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE INDEX idx_client_messages_sender ON public.client_messages(sender_id);
CREATE INDEX idx_client_messages_recipient ON public.client_messages(recipient_id);
CREATE INDEX idx_client_messages_project ON public.client_messages(project_id);
CREATE INDEX idx_client_messages_created_at ON public.client_messages(created_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All system fixes applied successfully!';
  RAISE NOTICE '✅ Storage buckets created';
  RAISE NOTICE '✅ RLS policies updated';
  RAISE NOTICE '✅ client_messages table fixed';
  RAISE NOTICE '✅ client_accounts updated';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 System is ready for testing!';
END $$;
