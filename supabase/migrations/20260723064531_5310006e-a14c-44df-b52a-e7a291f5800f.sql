-- Rate-a-course prompt: partial unique index enforces one prompt per (user, course) ever.
-- The existing idx_notifications_dedup only applies when actor_id IS NOT NULL; system-authored
-- rate_course_prompt rows carry actor_id = NULL, so we need a dedicated guard.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_rate_course_prompt_unique
  ON public.notifications (user_id, entity_id)
  WHERE type = 'rate_course_prompt';

-- Support the 7-day weekly-cap check without a full scan.
CREATE INDEX IF NOT EXISTS idx_notifications_rate_course_prompt_recent
  ON public.notifications (user_id, created_at DESC)
  WHERE type = 'rate_course_prompt';