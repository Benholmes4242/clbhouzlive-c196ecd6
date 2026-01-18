-- Step 4: Clean up existing duplicate notifications
DELETE FROM notifications
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, type, actor_id, public.immutable_date_trunc_minute(created_at)
        ORDER BY created_at ASC
      ) as rn
    FROM notifications
    WHERE actor_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Add the unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup 
ON notifications(user_id, type, actor_id, public.immutable_date_trunc_minute(created_at))
WHERE actor_id IS NOT NULL;