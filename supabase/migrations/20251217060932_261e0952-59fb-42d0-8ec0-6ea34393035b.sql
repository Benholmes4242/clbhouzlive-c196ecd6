-- Enforce NOT NULL on actor_type and actor_id
ALTER TABLE posts
  ALTER COLUMN actor_type SET NOT NULL,
  ALTER COLUMN actor_id SET NOT NULL;