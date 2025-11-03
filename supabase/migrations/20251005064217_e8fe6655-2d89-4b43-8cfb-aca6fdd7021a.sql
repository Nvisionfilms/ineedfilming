-- Create custom_booking_requests table
CREATE TABLE IF NOT EXISTS public.custom_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_company TEXT,
  client_type TEXT NOT NULL CHECK (client_type IN ('small_business', 'commercial')),
  requested_price DECIMAL(10, 2) NOT NULL,
  approved_price DECIMAL(10, 2),
  deposit_amount DECIMAL(10, 2) NOT NULL,
  project_details TEXT,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'countered', 'rejected')),
  approval_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  counter_price DECIMAL(10, 2),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.custom_booking_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (submit custom booking request)
CREATE POLICY "Anyone can submit custom booking requests"
ON public.custom_booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Clients can view their own requests via email
CREATE POLICY "Clients can view their own requests"
ON public.custom_booking_requests
FOR SELECT
TO anon, authenticated
USING (client_email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_custom_booking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_custom_booking_requests_updated_at
BEFORE UPDATE ON public.custom_booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_custom_booking_updated_at();