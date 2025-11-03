-- Backfill opportunities for existing bookings that don't have them yet
INSERT INTO opportunities (
  contact_name,
  contact_email,
  contact_phone,
  company,
  service_type,
  budget_min,
  budget_max,
  notes,
  stage,
  source,
  created_at
)
SELECT 
  cbr.client_name,
  cbr.client_email,
  cbr.client_phone,
  cbr.client_company,
  COALESCE(cbr.client_type, 'Custom Booking'),
  cbr.requested_price,
  cbr.requested_price,
  CONCAT(
    'Booking Date: ', cbr.booking_date, E'\n',
    'Time: ', cbr.booking_time, E'\n',
    CASE 
      WHEN cbr.project_details IS NOT NULL THEN CONCAT('Project Details: ', cbr.project_details, E'\n')
      ELSE ''
    END,
    'Status: ', cbr.status
  ),
  CASE 
    WHEN cbr.status = 'approved' THEN 'won'
    WHEN cbr.status = 'rejected' THEN 'lost'
    WHEN cbr.status = 'countered' THEN 'negotiation'
    ELSE 'new_lead'
  END,
  'booking_portal',
  cbr.created_at
FROM custom_booking_requests cbr
WHERE cbr.deleted_permanently = false
  AND cbr.archived_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM opportunities o 
    WHERE o.contact_email = cbr.client_email 
    AND o.created_at >= cbr.created_at - INTERVAL '1 minute'
    AND o.created_at <= cbr.created_at + INTERVAL '1 minute'
  );