-- Actor-scoped identity model migration (continued)
-- Constraint already exists, applying remaining changes

-- 4. Indexes for profile feeds and trending
CREATE INDEX IF NOT EXISTS posts_actor_idx
ON posts (actor_type, actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS posts_created_idx
ON posts (created_at DESC);

CREATE INDEX IF NOT EXISTS posts_user_idx
ON posts (user_id, created_at DESC);

-- 5. RLS: Enable
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 6. RLS: Drop existing policies if any (clean slate)
DROP POLICY IF EXISTS "insert_posts_as_valid_actor" ON posts;
DROP POLICY IF EXISTS "public_read_posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "update_own_posts" ON posts;
DROP POLICY IF EXISTS "delete_own_posts" ON posts;

-- 7. RLS: INSERT policy (enforces actor validity)
CREATE POLICY "insert_posts_as_valid_actor"
ON posts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Personal posts: actor_id must be the user
    (actor_type = 'personal' AND actor_id = auth.uid())
    
    -- Business posts: user must be owner/admin/editor of that business
    OR
    (actor_type = 'business' AND EXISTS (
      SELECT 1
      FROM business_members bm
      WHERE bm.business_id = posts.actor_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin', 'editor')
    ))
  )
);

-- 8. RLS: SELECT policy (all posts are public)
CREATE POLICY "public_read_posts"
ON posts
FOR SELECT
TO public
USING (true);

-- 9. RLS: UPDATE policy (only the author can update)
CREATE POLICY "update_own_posts"
ON posts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. RLS: DELETE policy (only the author can delete)
CREATE POLICY "delete_own_posts"
ON posts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());