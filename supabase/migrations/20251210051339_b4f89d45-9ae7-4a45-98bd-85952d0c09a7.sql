-- Add actor_type and actor_id columns to posts table
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS actor_type text CHECK (actor_type IN ('personal', 'business')) DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS actor_id uuid;

-- Backfill existing posts as personal
UPDATE posts
SET actor_type = 'personal',
    actor_id = user_id
WHERE actor_type IS NULL OR actor_id IS NULL;

-- Create index for efficient actor-based queries
CREATE INDEX IF NOT EXISTS idx_posts_actor ON posts(actor_type, actor_id);

-- Add comment for documentation
COMMENT ON COLUMN posts.actor_type IS 'Who the post was created as: personal profile or business';
COMMENT ON COLUMN posts.actor_id IS 'The ID of the actor (user_profiles.id for personal, business_accounts.id for business)';