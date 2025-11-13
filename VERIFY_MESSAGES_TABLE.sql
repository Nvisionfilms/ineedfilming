-- Verify and fix client_messages table structure

-- Check if table exists and show its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'client_messages'
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong columns, recreate it
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

-- Enable RLS
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.client_messages;
DROP POLICY IF EXISTS "Clients can view their messages" ON public.client_messages;
DROP POLICY IF EXISTS "Clients can send messages" ON public.client_messages;
DROP POLICY IF EXISTS "Users can mark their messages as read" ON public.client_messages;

-- Create RLS policies
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_messages_sender ON public.client_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_recipient ON public.client_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_project ON public.client_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_created_at ON public.client_messages(created_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'client_messages table verified and fixed successfully';
END $$;
