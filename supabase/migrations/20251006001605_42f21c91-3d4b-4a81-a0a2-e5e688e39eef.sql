-- Add google_calendar_event_id to meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS google_calendar_event_id text;

-- Create table for storing Google OAuth tokens
CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamp with time zone NOT NULL,
  scope text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can manage OAuth tokens
CREATE POLICY "Admins can manage OAuth tokens"
  ON public.google_oauth_tokens
  FOR ALL
  USING (has_admin_role(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id 
  ON public.google_oauth_tokens(user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_google_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_google_oauth_tokens_updated_at
  BEFORE UPDATE ON public.google_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_oauth_tokens_updated_at();