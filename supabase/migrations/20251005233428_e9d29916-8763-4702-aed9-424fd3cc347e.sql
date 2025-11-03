-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_link TEXT,
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all meetings"
  ON public.meetings
  FOR ALL
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Clients can view their meetings"
  ON public.meetings
  FOR SELECT
  USING (
    is_client(auth.uid()) AND 
    client_id IN (
      SELECT id FROM public.client_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- Update trigger
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();