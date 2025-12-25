-- Phase 3: Create hidden_comments table for soft-hiding reported comments
CREATE TABLE public.hidden_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  post_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.hidden_comments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own hidden comments
CREATE POLICY "Users can view their own hidden comments"
ON public.hidden_comments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can hide comments for themselves
CREATE POLICY "Users can hide comments"
ON public.hidden_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unhide comments they hid
CREATE POLICY "Users can unhide their hidden comments"
ON public.hidden_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX idx_hidden_comments_user_post ON public.hidden_comments(user_id, post_id);
CREATE INDEX idx_hidden_comments_comment ON public.hidden_comments(comment_id);

-- Phase 5: Create notifications table for comment/reply notifications
CREATE TABLE public.comment_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reply', 'mention')),
  post_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  parent_comment_id UUID,
  actor_user_id UUID NOT NULL,
  recipient_user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comment_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.comment_notifications
FOR SELECT
USING (auth.uid() = recipient_user_id);

-- System can insert notifications (using service role or trigger)
-- For now allow actors to create notifications for others
CREATE POLICY "Users can create notifications they sent"
ON public.comment_notifications
FOR INSERT
WITH CHECK (auth.uid() = actor_user_id);

-- Users can mark their notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.comment_notifications
FOR UPDATE
USING (auth.uid() = recipient_user_id);

-- Create indexes for efficient lookups
CREATE INDEX idx_notifications_recipient ON public.comment_notifications(recipient_user_id, read_at);
CREATE INDEX idx_notifications_post ON public.comment_notifications(post_id);
CREATE INDEX idx_notifications_created ON public.comment_notifications(created_at DESC);