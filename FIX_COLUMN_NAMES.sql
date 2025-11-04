-- Fix column name mismatches between code and database

-- 1. Rename meetings.scheduled_date to scheduled_at (to match code)
-- Only rename if scheduled_date exists and scheduled_at doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='meetings' AND column_name='scheduled_date')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='meetings' AND column_name='scheduled_at') THEN
        ALTER TABLE public.meetings RENAME COLUMN scheduled_date TO scheduled_at;
    END IF;
END $$;

-- 2. Add project_name column to projects table (if it doesn't exist)
-- The projects table has 'title' column, so we'll add project_name as an alias
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='projects' AND column_name='project_name') THEN
        ALTER TABLE public.projects ADD COLUMN project_name TEXT;
        -- Copy data from title to project_name
        UPDATE public.projects SET project_name = title WHERE project_name IS NULL;
    END IF;
END $$;

-- 3. Create client_messages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on client_messages
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.client_messages;
DROP POLICY IF EXISTS "Clients can view their own messages" ON public.client_messages;
DROP POLICY IF EXISTS "Clients can send messages" ON public.client_messages;

-- Create policies for client_messages
CREATE POLICY "Admins can manage all messages"
ON public.client_messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Clients can view their own messages"
ON public.client_messages
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.client_accounts
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can send messages"
ON public.client_messages
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM public.client_accounts
    WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_client_messages_updated_at ON public.client_messages;
CREATE TRIGGER update_client_messages_updated_at
BEFORE UPDATE ON public.client_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_client_messages_client_id ON public.client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_created_at ON public.client_messages(created_at);
