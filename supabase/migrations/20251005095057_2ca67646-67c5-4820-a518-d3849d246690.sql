-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'exit_popup',
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view all subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (has_admin_role(auth.uid()));

-- Create index for faster email lookups
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);