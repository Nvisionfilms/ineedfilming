-- Fix any meetings with invalid dates
-- Delete meetings with NULL or invalid scheduled_date
DELETE FROM public.meetings 
WHERE scheduled_date IS NULL 
   OR scheduled_date::text = 'Invalid Date'
   OR scheduled_date < '1970-01-01'::timestamptz
   OR scheduled_date > '2100-01-01'::timestamptz;

-- Show remaining meetings to verify
SELECT id, title, scheduled_date, status 
FROM public.meetings 
ORDER BY created_at DESC;
