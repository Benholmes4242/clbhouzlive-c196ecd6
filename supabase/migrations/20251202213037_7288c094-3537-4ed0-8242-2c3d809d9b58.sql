
-- Fix get_top100_friends_snapshot to count DISTINCT Top 100 courses across all lists
-- instead of summing per-list counts which double-counts courses in multiple lists
create or replace function get_top100_friends_snapshot(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  with all_players as (
    -- Me
    select target_user_id as user_id

    union

    -- Friends (using user_follows for friendships)
    select f.following_id as user_id
    from user_follows f
    where f.follower_id = target_user_id
  ),
  -- Count DISTINCT Top 100 courses played per user across ALL lists
  top100_counts as (
    select
      ap.user_id,
      count(distinct ctm.course_id)::integer as total_top100_played
    from all_players ap
    left join user_course_activity uca on uca.user_id = ap.user_id
    left join course_top100_memberships ctm on ctm.course_id = uca.course_id
    left join top100_lists tl on tl.id = ctm.list_id and tl.is_active = true
    where ctm.course_id is not null
    group by ap.user_id
  ),
  profiles as (
    select
      p.id,
      p.display_name,
      p.profile_photo_url,
      p.home_club
    from user_profiles p
    join all_players ap on ap.user_id = p.id
  )
  select
    jsonb_build_object(
      'me',
      (
        select jsonb_build_object(
          'friend_id', p.id,
          'display_name', p.display_name,
          'profile_photo_url', p.profile_photo_url,
          'home_club', p.home_club,
          'total_top100_played', coalesce(t.total_top100_played, 0)
        )
        from profiles p
        left join top100_counts t on t.user_id = p.id
        where p.id = target_user_id
      ),
      'friends',
      (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'friend_id', p.id,
            'display_name', p.display_name,
            'profile_photo_url', p.profile_photo_url,
            'home_club', p.home_club,
            'total_top100_played', coalesce(t.total_top100_played, 0)
          )
          order by coalesce(t.total_top100_played, 0) desc,
                   p.display_name
        ), '[]'::jsonb)
        from profiles p
        left join top100_counts t on t.user_id = p.id
        where p.id <> target_user_id
      )
    )
  into result;

  return coalesce(result, jsonb_build_object(
    'me', null,
    'friends', '[]'::jsonb
  ));
end;
$$;
