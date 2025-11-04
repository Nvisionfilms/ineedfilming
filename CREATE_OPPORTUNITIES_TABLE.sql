-- Create opportunities table for pipeline/CRM
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.custom_booking_requests(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company TEXT,
  service_type TEXT,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  notes TEXT,
  stage TEXT NOT NULL DEFAULT 'new_lead' CHECK (stage IN ('new_lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'booking_portal', 'referral', 'website', 'social_media', 'other')),
  expected_close_date DATE,
  closed_date DATE,
  lost_reason TEXT,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_booking_id ON public.opportunities(booking_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON public.opportunities(created_at);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all opportunities" ON public.opportunities;

-- Create policy for admins
CREATE POLICY "Admins can manage all opportunities"
ON public.opportunities
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
