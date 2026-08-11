DROP FUNCTION IF EXISTS public.post_likes_skip_round_posts();

CREATE OR REPLACE FUNCTION public.post_is_round(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.posts
     WHERE id = p_post_id AND whs_score_id IS NOT NULL
  )
$function$;

REVOKE ALL ON FUNCTION public.post_is_round(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_is_round(uuid) TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_create_like_notification_aggregated ON public.post_likes;
CREATE TRIGGER trg_create_like_notification_aggregated
AFTER INSERT ON public.post_likes
FOR EACH ROW
WHEN (NOT public.post_is_round(NEW.post_id))
EXECUTE FUNCTION public.create_like_notification_aggregated();