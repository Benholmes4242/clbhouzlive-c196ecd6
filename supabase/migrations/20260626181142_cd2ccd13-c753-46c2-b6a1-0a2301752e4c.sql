CREATE OR REPLACE FUNCTION public.is_following_actor_v2(
  p_viewer_actor_type text,
  p_viewer_actor_id uuid,
  p_target_actor_type text,
  p_target_actor_id uuid,
  p_target_post_user_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.follows f
    WHERE f.follower_actor_type  = p_viewer_actor_type
      AND f.follower_actor_id    = p_viewer_actor_id
      AND f.following_actor_type = p_target_actor_type
      AND f.following_actor_id   = COALESCE(p_target_actor_id, p_target_post_user_id)
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_following_actor(
  p_viewer_user_id uuid,
  p_target_actor_type text,
  p_target_actor_id uuid,
  p_target_post_user_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT public.is_following_actor_v2(
    'personal',
    p_viewer_user_id,
    p_target_actor_type,
    p_target_actor_id,
    p_target_post_user_id
  )
$function$;