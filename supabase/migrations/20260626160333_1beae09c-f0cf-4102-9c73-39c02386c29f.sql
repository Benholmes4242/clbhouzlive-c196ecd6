DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;

CREATE POLICY "delete_likes_as_valid_actor" ON public.post_likes
FOR DELETE
USING (
  (actor_type = 'personal' AND actor_id = auth.uid())
  OR
  (actor_type = 'business' AND actor_id IN (SELECT public.get_user_business_ids(auth.uid())))
);