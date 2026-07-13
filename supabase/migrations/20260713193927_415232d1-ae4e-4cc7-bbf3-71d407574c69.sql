DROP FUNCTION IF EXISTS public.get_user_achievements_for_viewer(uuid);

CREATE OR REPLACE FUNCTION public.get_user_achievements_for_viewer(p_user_id uuid)
 RETURNS TABLE(badge_id text, title text, description text, category text, rarity text, icon_name text, color_token text, kind text, counter_metric text, counter_tiers jsonb, counter_value integer, counter_tier integer, earned_at timestamp with time zone, is_earned boolean, display_order integer, first_seen_at timestamp with time zone, seen_by_user boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    bc.id              AS badge_id,
    bc.title,
    bc.description,
    bc.category,
    bc.rarity,
    bc.icon_name,
    bc.color_token,
    bc.kind,
    bc.counter_metric,
    bc.counter_tiers,
    COALESCE(m.count, ub.counter_value) AS counter_value,
    ub.counter_tier,
    ub.earned_at,
    (ub.id IS NOT NULL) AS is_earned,
    bc.display_order,
    ub.first_seen_at,
    COALESCE(ub.seen_by_user, TRUE) AS seen_by_user
  FROM public.gam_badge_catalogue bc
  LEFT JOIN public.gam_user_badges ub
    ON ub.badge_id = bc.id
    AND ub.user_id = p_user_id
    AND ub.is_visible = true
  LEFT JOIN public.gam_user_milestones m
    ON bc.counter_metric IS NOT NULL
    AND m.user_id = p_user_id
    AND m.metric = bc.counter_metric
  WHERE bc.is_active = true
  ORDER BY bc.display_order, bc.category, bc.id;
$function$;