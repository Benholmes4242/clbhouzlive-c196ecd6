
-- =====================================================
-- PHASE 1: Multi-Profile Schema Migrations
-- Extends actor pattern to comments, likes, notifications, follows
-- =====================================================

-- =====================================================
-- 1.1 Add actor columns to post_comments
-- =====================================================
ALTER TABLE post_comments 
ADD COLUMN actor_type TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN actor_id UUID;

-- Backfill existing comments (set actor_id to user_id for all existing rows)
UPDATE post_comments SET actor_id = user_id WHERE actor_id IS NULL;

-- Make actor_id NOT NULL after backfill
ALTER TABLE post_comments ALTER COLUMN actor_id SET NOT NULL;

-- Add index for efficient queries
CREATE INDEX idx_post_comments_actor ON post_comments(actor_type, actor_id);

-- =====================================================
-- 1.2 Add actor columns to post_likes
-- =====================================================
ALTER TABLE post_likes
ADD COLUMN actor_type TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN actor_id UUID;

-- Backfill existing likes
UPDATE post_likes SET actor_id = user_id WHERE actor_id IS NULL;

-- Make actor_id NOT NULL after backfill
ALTER TABLE post_likes ALTER COLUMN actor_id SET NOT NULL;

-- Add index for efficient queries
CREATE INDEX idx_post_likes_actor ON post_likes(actor_type, actor_id);

-- Update unique constraint to allow same user to like as different actors
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_user_id_key;
ALTER TABLE post_likes ADD CONSTRAINT post_likes_unique_actor UNIQUE(post_id, actor_type, actor_id);

-- =====================================================
-- 1.3 Add recipient actor columns to notifications
-- =====================================================
ALTER TABLE notifications
ADD COLUMN recipient_actor_type TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN recipient_actor_id UUID;

-- Backfill existing notifications
UPDATE notifications SET recipient_actor_id = user_id WHERE recipient_actor_id IS NULL;

-- Make recipient_actor_id NOT NULL after backfill
ALTER TABLE notifications ALTER COLUMN recipient_actor_id SET NOT NULL;

-- Add index for efficient queries
CREATE INDEX idx_notifications_recipient_actor ON notifications(recipient_actor_type, recipient_actor_id);

-- =====================================================
-- 1.4 Create business outbound follows table
-- =====================================================
CREATE TABLE business_outbound_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_business_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  following_type TEXT NOT NULL CHECK (following_type IN ('personal', 'business')),
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_business_id, following_type, following_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_business_outbound_follows_follower ON business_outbound_follows(follower_business_id);
CREATE INDEX idx_business_outbound_follows_following ON business_outbound_follows(following_type, following_id);

-- =====================================================
-- 1.5 Enable RLS and add policies for business_outbound_follows
-- =====================================================
ALTER TABLE business_outbound_follows ENABLE ROW LEVEL SECURITY;

-- Users can view follows for businesses they manage
CREATE POLICY "select_business_outbound_follows" ON business_outbound_follows
FOR SELECT USING (
  follower_business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- Users can insert follows for businesses they manage
CREATE POLICY "insert_business_outbound_follows" ON business_outbound_follows
FOR INSERT WITH CHECK (
  follower_business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- Users can delete follows for businesses they manage
CREATE POLICY "delete_business_outbound_follows" ON business_outbound_follows
FOR DELETE USING (
  follower_business_id IN (SELECT get_user_business_ids(auth.uid()))
);

-- =====================================================
-- 1.6 Update RLS policies for post_comments
-- =====================================================
DROP POLICY IF EXISTS "Users can insert comments" ON post_comments;
DROP POLICY IF EXISTS "insert_post_comments" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments on posts" ON post_comments;

-- Create new policy that validates actor ownership
CREATE POLICY "insert_comments_as_valid_actor" ON post_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  (
    (actor_type = 'personal' AND actor_id = auth.uid()) OR
    (actor_type = 'business' AND actor_id IN (SELECT get_user_business_ids(auth.uid())))
  )
);

-- =====================================================
-- 1.7 Update RLS policies for post_likes
-- =====================================================
DROP POLICY IF EXISTS "Users can insert likes" ON post_likes;
DROP POLICY IF EXISTS "insert_post_likes" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;

-- Create new policy that validates actor ownership
CREATE POLICY "insert_likes_as_valid_actor" ON post_likes
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  (
    (actor_type = 'personal' AND actor_id = auth.uid()) OR
    (actor_type = 'business' AND actor_id IN (SELECT get_user_business_ids(auth.uid())))
  )
);
