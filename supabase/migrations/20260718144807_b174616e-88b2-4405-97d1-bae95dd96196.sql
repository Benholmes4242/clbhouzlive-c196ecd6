
CREATE OR REPLACE FUNCTION public.get_home_clubs_for_user(
  p_user_profile_id uuid,
  p_viewer_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH t AS (
  SELECT
    up.id,
    COALESCE(up.primary_club_id, up.home_club_id) AS prim_club_id,
    up.home_club_visibility,
    up.additional_clubs_visibility
  FROM public.user_profiles up
  WHERE up.id = p_user_profile_id
),

vf AS (
  SELECT 1 AS ok
  FROM public.user_follows
  WHERE follower_id = p_viewer_id
    AND following_id = p_user_profile_id
  LIMIT 1
),

fr AS (
  SELECT 1 AS ok
  FROM public.user_friends uf
  WHERE uf.status = 'accepted'
    AND (
      (uf.user_id = p_viewer_id AND uf.friend_id = p_user_profile_id)
      OR
      (uf.friend_id = p_viewer_id AND uf.user_id = p_user_profile_id)
    )
  LIMIT 1
),

elig AS (
  SELECT
    (p_user_profile_id = p_viewer_id) AS is_self,
    EXISTS (SELECT 1 FROM vf) AS is_follower,
    EXISTS (SELECT 1 FROM fr) AS is_friend,

    CASE (SELECT home_club_visibility FROM t)
      WHEN 'public' THEN true
      WHEN 'followers' THEN
        (p_user_profile_id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM vf)
        OR EXISTS (SELECT 1 FROM fr)
      WHEN 'friends' THEN
        (p_user_profile_id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM fr)
      WHEN 'private' THEN
        (p_user_profile_id = p_viewer_id)
      ELSE false
    END AS can_see_primary,

    CASE (SELECT additional_clubs_visibility FROM t)
      WHEN 'public' THEN true
      WHEN 'followers' THEN
        (p_user_profile_id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM vf)
        OR EXISTS (SELECT 1 FROM fr)
      WHEN 'friends' THEN
        (p_user_profile_id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM fr)
      WHEN 'private' THEN
        (p_user_profile_id = p_viewer_id)
      ELSE false
    END AS can_see_additional
),

primary_payload AS (
  SELECT
    CASE
      WHEN (SELECT can_see_primary FROM elig) = true THEN
        (
          SELECT jsonb_build_object('id', gc.id, 'name', gc.name)
          FROM t
          LEFT JOIN public.golf_clubs gc ON gc.id = t.prim_club_id
        )
      ELSE null::jsonb
    END AS prim_club
),

additional_payload AS (
  SELECT
    CASE
      WHEN (SELECT can_see_additional FROM elig) = true THEN
        (
          SELECT jsonb_build_object(
            'count', count(*),
            'preview',
              COALESCE(
                (
                  SELECT jsonb_agg(jsonb_build_object('id', gc.id, 'name', gc.name) ORDER BY gc.name)
                  FROM (
                    SELECT uhc.club_id
                    FROM public.user_home_clubs uhc, t
                    WHERE uhc.user_profile_id = p_user_profile_id
                      AND uhc.club_id IS NOT NULL
                      AND uhc.club_id IS DISTINCT FROM t.prim_club_id
                    LIMIT 3
                  ) x
                  JOIN public.golf_clubs gc ON gc.id = x.club_id
                ),
                '[]'::jsonb
              )
          )
          FROM public.user_home_clubs uhc, t
          WHERE uhc.user_profile_id = p_user_profile_id
            AND uhc.club_id IS NOT NULL
            AND uhc.club_id IS DISTINCT FROM t.prim_club_id
        )
      ELSE jsonb_build_object('count', 0, 'preview', '[]'::jsonb)
    END AS additional
)

SELECT jsonb_build_object(
  'user_id', p_user_profile_id,
  'primary_club', (SELECT prim_club FROM primary_payload),
  'additional_count', COALESCE((SELECT (additional->>'count')::int FROM additional_payload), 0),
  'additional_preview', COALESCE((SELECT additional->'preview' FROM additional_payload), '[]'::jsonb)
);
$$;

GRANT EXECUTE ON FUNCTION public.get_home_clubs_for_user(uuid, uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.get_home_clubs_for_users(
  p_user_profile_ids uuid[],
  p_viewer_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH target AS (
  SELECT
    up.id,
    COALESCE(up.primary_club_id, up.home_club_id) AS prim_club_id,
    up.home_club_visibility,
    up.additional_clubs_visibility
  FROM public.user_profiles up
  WHERE up.id = ANY(p_user_profile_ids)
),

viewer_follows AS (
  SELECT following_id AS user_id
  FROM public.user_follows
  WHERE follower_id = p_viewer_id
),

viewer_friends AS (
  SELECT
    CASE
      WHEN uf.user_id = p_viewer_id THEN uf.friend_id
      ELSE uf.user_id
    END AS user_id
  FROM public.user_friends uf
  WHERE uf.status = 'accepted'
    AND (uf.user_id = p_viewer_id OR uf.friend_id = p_viewer_id)
),

eligibility AS (
  SELECT
    t.id AS user_id,

    (t.id = p_viewer_id) AS is_self,
    EXISTS (SELECT 1 FROM viewer_follows vf WHERE vf.user_id = t.id) AS is_follower,
    EXISTS (SELECT 1 FROM viewer_friends fr WHERE fr.user_id = t.id) AS is_friend,

    CASE t.home_club_visibility
      WHEN 'public' THEN true
      WHEN 'followers' THEN
        (t.id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM viewer_follows vf WHERE vf.user_id = t.id)
        OR EXISTS (SELECT 1 FROM viewer_friends fr WHERE fr.user_id = t.id)
      WHEN 'friends' THEN
        (t.id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM viewer_friends fr WHERE fr.user_id = t.id)
      WHEN 'private' THEN
        (t.id = p_viewer_id)
      ELSE false
    END AS can_see_primary,

    CASE t.additional_clubs_visibility
      WHEN 'public' THEN true
      WHEN 'followers' THEN
        (t.id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM viewer_follows vf WHERE vf.user_id = t.id)
        OR EXISTS (SELECT 1 FROM viewer_friends fr WHERE fr.user_id = t.id)
      WHEN 'friends' THEN
        (t.id = p_viewer_id)
        OR EXISTS (SELECT 1 FROM viewer_friends fr WHERE fr.user_id = t.id)
      WHEN 'private' THEN
        (t.id = p_viewer_id)
      ELSE false
    END AS can_see_additional
  FROM target t
),

primary_club AS (
  SELECT
    t.id AS user_id,
    jsonb_build_object('id', gc.id, 'name', gc.name) AS prim_club
  FROM target t
  JOIN eligibility e ON e.user_id = t.id AND e.can_see_primary = true
  LEFT JOIN public.golf_clubs gc ON gc.id = t.prim_club_id
),

additional AS (
  SELECT
    uhc.user_profile_id AS user_id,
    count(*) AS additional_count,
    jsonb_agg(
      jsonb_build_object('id', gc.id, 'name', gc.name)
      ORDER BY gc.name
    ) AS additional_all
  FROM public.user_home_clubs uhc
  JOIN target t ON t.id = uhc.user_profile_id
  JOIN eligibility e
    ON e.user_id = uhc.user_profile_id
   AND e.can_see_additional = true
  JOIN public.golf_clubs gc ON gc.id = uhc.club_id
  WHERE uhc.club_id IS DISTINCT FROM t.prim_club_id
  GROUP BY uhc.user_profile_id
),

final AS (
  SELECT
    t.id,
    jsonb_build_object(
      'primary_club', pc.prim_club,
      'additional_count', COALESCE(a.additional_count, 0),
      'additional_preview',
        COALESCE(
          (CASE
            WHEN a.additional_all IS NULL THEN '[]'::jsonb
            WHEN jsonb_array_length(a.additional_all) <= 3 THEN a.additional_all
            ELSE jsonb_build_array(a.additional_all->0, a.additional_all->1, a.additional_all->2)
          END),
          '[]'::jsonb
        )
    ) AS payload
  FROM target t
  LEFT JOIN primary_club pc ON pc.user_id = t.id
  LEFT JOIN additional a ON a.user_id = t.id
)

SELECT COALESCE(jsonb_object_agg(id, payload), '{}'::jsonb)
FROM final;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_clubs_for_users(uuid[], uuid) TO authenticated;
