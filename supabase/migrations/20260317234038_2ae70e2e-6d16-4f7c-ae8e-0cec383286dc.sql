-- ============================================================================
-- FIX 1: Self-friend CHECK constraint
-- ============================================================================
ALTER TABLE user_friends
ADD CONSTRAINT user_friends_not_self
CHECK (user_id <> friend_id);

-- ============================================================================
-- FIX 2: Foreign keys with CASCADE — first clean orphaned rows
-- ============================================================================

-- Clean orphaned user_follows
DELETE FROM user_follows
WHERE follower_id NOT IN (SELECT id FROM user_profiles)
   OR following_id NOT IN (SELECT id FROM user_profiles);

-- Clean orphaned user_friends
DELETE FROM user_friends
WHERE user_id NOT IN (SELECT id FROM user_profiles)
   OR friend_id NOT IN (SELECT id FROM user_profiles);

-- Clean orphaned notifications (recipient gone)
DELETE FROM notifications
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Null out actor_id where actor profile is gone
UPDATE notifications
SET actor_id = NULL
WHERE actor_id IS NOT NULL
  AND actor_id NOT IN (SELECT id FROM user_profiles);

-- Now add foreign keys
ALTER TABLE user_follows
ADD CONSTRAINT user_follows_follower_fk
  FOREIGN KEY (follower_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT user_follows_following_fk
  FOREIGN KEY (following_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_friends
ADD CONSTRAINT user_friends_user_fk
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT user_friends_friend_fk
  FOREIGN KEY (friend_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT notifications_user_fk
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT notifications_actor_fk
  FOREIGN KEY (actor_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- FIX 3: Tighten user_friends UPDATE RLS
-- Drop overlapping permissive policies, replace with recipient-only UPDATE
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their friend relationships" ON user_friends;
DROP POLICY IF EXISTS "Users can manage their friendships" ON user_friends;

-- Only the recipient (friend_id) can accept/decline
CREATE POLICY "Recipient can respond to friend request"
ON user_friends FOR UPDATE
TO authenticated
USING (auth.uid() = friend_id)
WITH CHECK (auth.uid() = friend_id);

-- ============================================================================
-- FIX 4: Drop redundant indexes/constraints
-- ============================================================================

-- user_follows: drop duplicate unique constraint and redundant composite index
ALTER TABLE user_follows DROP CONSTRAINT IF EXISTS user_follows_unique_pair;
DROP INDEX IF EXISTS idx_user_follows_follower_following;

-- user_friends: drop duplicate unique constraint
ALTER TABLE user_friends DROP CONSTRAINT IF EXISTS user_friends_user_id_friend_id_key;