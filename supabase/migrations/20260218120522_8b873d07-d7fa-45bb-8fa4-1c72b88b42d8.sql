
-- Drop the overly-restrictive combined policy and replace with two clear policies:
-- 1. Users insert notifications for themselves
-- 2. Users insert notifications as the actor (e.g. mention notifications for other users)

DROP POLICY IF EXISTS "Users can create notifications for themselves or as actor" ON public.notifications;

-- Policy 1: A user can insert a notification where they are the recipient
CREATE POLICY "Users can insert notifications for themselves"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 2: A user can insert a notification where they are the actor (sender)
-- This covers mention notifications: user_id = recipient, actor_id = sender (auth.uid())
CREATE POLICY "Users can insert notifications as actor"
ON public.notifications
FOR INSERT
WITH CHECK (actor_id IS NOT NULL AND auth.uid() = actor_id);
