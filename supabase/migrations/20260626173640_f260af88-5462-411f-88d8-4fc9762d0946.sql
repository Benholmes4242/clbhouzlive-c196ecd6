DO $mig$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_course_media';
  def := replace(def,
    'EXISTS (
        SELECT 1 FROM user_follows uf3 WHERE uf3.follower_id = v_user_id AND uf3.following_id = dp.p_user_id
      ) AS p_followed_by_me',
    'public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, COALESCE(dp.p_actor_type, ''personal''), COALESCE(dp.p_actor_id, dp.p_user_id), dp.p_user_id) AS p_followed_by_me');
  EXECUTE def;

  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_explore_feed';
  def := replace(def,
    'CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = ''business'' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me',
    'public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, COALESCE(dp.p_actor_type, ''personal''), COALESCE(dp.p_actor_id, dp.p_user_id), dp.p_user_id) AS p_followed_by_me');
  EXECUTE def;

  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_explore_feed_v2';
  def := replace(def,
    'CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = ''business'' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me',
    'public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, COALESCE(dp.p_actor_type, ''personal''), COALESCE(dp.p_actor_id, dp.p_user_id), dp.p_user_id) AS p_followed_by_me');
  EXECUTE def;

  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_profile_posts';
  def := replace(def,
    'CASE
      WHEN p.actor_type = ''business'' THEN EXISTS (
        SELECT 1 FROM business_follows bf
        WHERE bf.business_id = p.actor_id AND bf.follower_id = v_viewer_id
      )
      ELSE EXISTS (
        SELECT 1 FROM user_follows fo
        WHERE fo.following_id = p.user_id AND fo.follower_id = v_viewer_id
      )
    END                                    AS is_followed_by_me',
    'public.is_following_actor_v2(COALESCE(p_viewer_actor_type, ''personal''), COALESCE(p_viewer_actor_id, v_viewer_id), COALESCE(p.actor_type, ''personal''), COALESCE(p.actor_id, p.user_id), p.user_id) AS is_followed_by_me');
  EXECUTE def;

  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_suggested_feed';
  def := replace(def,
    'EXISTS (SELECT 1 FROM user_follows uf
        WHERE uf.follower_id = p_user_id AND uf.following_id = s.p_uid) AS wm_is_followed_by_me',
    'public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, COALESCE(s.actor_type, ''personal''), COALESCE(s.actor_id, s.p_uid), s.p_uid) AS wm_is_followed_by_me');
  EXECUTE def;

  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_suggested_feed_v2';
  def := replace(def,
    '(mf2.following_id IS NOT NULL) AS wm_is_followed_by_me',
    'public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, COALESCE(s.actor_type, ''personal''), COALESCE(s.actor_id, s.p_uid), s.p_uid) AS wm_is_followed_by_me');
  EXECUTE def;

  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_watch_shorts';
  def := replace(def,
    'CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND p.actor_type = ''business'' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me',
    'public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, COALESCE(p.actor_type, ''personal''), COALESCE(p.actor_id, p.user_id), p.user_id) AS p_followed_by_me');
  EXECUTE def;
END
$mig$;