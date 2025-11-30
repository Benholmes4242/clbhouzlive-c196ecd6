-- Fix get_top100_friends_snapshot RPC - column name was incorrect
create or replace function get_top100_friends_snapshot(target_user_id uuid)
returns jsonb
language plpgsql
as $$
declare
  me_record record;
  result jsonb;
begin
  -- Aggregate Top 100 counts for the user + their friends
  with all_players as (
    -- Me
    select u.id as user_id
    from auth.users u
    where u.id = target_user_id

    union

    -- Friends (using user_follows for friendships)
    select f.following_id as user_id
    from user_follows f
    where f.follower_id = target_user_id
  ),
  top100_counts as (
    select
      ap.user_id,
      coalesce(sum(uca.courses_played_in_list), 0)::integer as total_top100_played
    from all_players ap
    left join user_top100_progress_view uca
      on uca.user_id = ap.user_id
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