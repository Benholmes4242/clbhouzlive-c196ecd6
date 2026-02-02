-- Auto-close completed tournaments based on end_date
-- This fixes the stale 'inprogress' statuses

UPDATE sr_tournaments 
SET status = 'closed' 
WHERE status = 'inprogress' 
AND end_date < CURRENT_DATE;