-- Update RLS policy for clients to view meetings linked to their bookings/projects
DROP POLICY IF EXISTS "Clients can view their meetings" ON public.meetings;

CREATE POLICY "Clients can view their meetings" ON public.meetings
FOR SELECT
USING (
  is_client(auth.uid()) AND (
    client_id IN (
      SELECT id FROM client_accounts WHERE user_id = auth.uid()
    )
    OR
    booking_id IN (
      SELECT booking_id FROM client_accounts WHERE user_id = auth.uid() AND booking_id IS NOT NULL
    )
    OR
    project_id IN (
      SELECT project_id FROM client_accounts WHERE user_id = auth.uid() AND project_id IS NOT NULL
    )
  )
);