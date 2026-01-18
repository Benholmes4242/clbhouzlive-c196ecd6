-- Step 1: Remove duplicate trigger (keep only follow_notification_trigger)
DROP TRIGGER IF EXISTS trg_create_follow_notification ON user_follows;

-- Step 2: Create immutable wrapper for date_trunc to use in index
CREATE OR REPLACE FUNCTION notifications_minute_bucket(ts timestamptz) 
RETURNS timestamptz 
LANGUAGE sql 
IMMUTABLE 
AS $$
  SELECT date_trunc('minute', ts AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
$$;

-- Step 3: Add deduplication constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup 
ON notifications(user_id, type, actor_id, notifications_minute_bucket(created_at))
WHERE actor_id IS NOT NULL;

-- Step 4: Clean up existing duplicate notifications
DELETE FROM notifications a
USING notifications b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.type = b.type
  AND a.actor_id = b.actor_id
  AND notifications_minute_bucket(a.created_at) = notifications_minute_bucket(b.created_at);