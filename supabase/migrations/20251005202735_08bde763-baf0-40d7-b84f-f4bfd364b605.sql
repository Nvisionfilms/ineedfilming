-- Create storage_upgrades table
CREATE TABLE public.storage_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_accounts(id) ON DELETE CASCADE NOT NULL,
  amount_gb INTEGER NOT NULL,
  price_paid NUMERIC(10,2) NOT NULL,
  stripe_session_id TEXT,
  stripe_price_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.storage_upgrades ENABLE ROW LEVEL SECURITY;

-- Admins can manage all storage upgrades
CREATE POLICY "Admins can manage all storage upgrades"
ON public.storage_upgrades
FOR ALL
USING (has_admin_role(auth.uid()));

-- Clients can view their own storage upgrades
CREATE POLICY "Clients can view their own storage upgrades"
ON public.storage_upgrades
FOR SELECT
USING (
  is_client(auth.uid()) AND 
  client_id IN (
    SELECT id FROM public.client_accounts 
    WHERE user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_storage_upgrades_client_id ON public.storage_upgrades(client_id);
CREATE INDEX idx_storage_upgrades_stripe_session_id ON public.storage_upgrades(stripe_session_id);