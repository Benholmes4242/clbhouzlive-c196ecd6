-- Add last_notifications_seen_at to track when user last viewed notifications
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS last_notifications_seen_at timestamptz;