-- Create RPC to get user's Top 100 intent signals
create or replace function public.get_user_top100_intent(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  played_by_list jsonb;
  recent_courses uuid[];
  wishlist_lists text[];
  user_rank int;
begin
  -- Get played counts by list
  select jsonb_object_agg(t.slug, count_data.course_count)
  into played_by_list
  from (
    select ctm.list_id, count(distinct uca.course_id) as course_count
    from user_course_activity uca
    join course_top100_memberships ctm on ctm.course_id = uca.course_id
    where uca.user_id = target_user_id
      and uca.is_top100 = true
    group by ctm.list_id
  ) count_data
  join top100_lists t on t.id = count_data.list_id;

  -- Get recent Top 100 courses (last 10 viewed/played)
  select array_agg(distinct uca.course_id order by uca.last_played_at desc)
  into recent_courses
  from user_course_activity uca
  join course_top100_memberships ctm on ctm.course_id = uca.course_id
  where uca.user_id = target_user_id
    and uca.is_top100 = true
  limit 10;

  -- Get wishlist lists (lists where user has viewed courses but played < 3)
  select array_agg(t.slug)
  into wishlist_lists
  from top100_lists t
  where exists (
    select 1
    from course_top100_memberships ctm
    join user_courses uc on uc.course_id = ctm.course_id
    where ctm.list_id = t.id
      and uc.user_id = target_user_id
      and uc.wishlist = true
  )
  and (
    select count(distinct uca.course_id)
    from user_course_activity uca
    join course_top100_memberships ctm2 on ctm2.course_id = uca.course_id
    where uca.user_id = target_user_id
      and ctm2.list_id = t.id
      and uca.is_top100 = true
  ) < 3;

  -- Get total played
  -- Get leaderboard rank (worldwide, all time)
  select rank into user_rank
  from (
    select 
      uca.user_id,
      row_number() over (order by count(distinct uca.course_id) desc) as rank
    from user_course_activity uca
    where uca.is_top100 = true
    group by uca.user_id
  ) ranked
  where ranked.user_id = target_user_id;

  -- Build result
  result := jsonb_build_object(
    'total_top100_played', (
      select count(distinct course_id)
      from user_course_activity
      where user_id = target_user_id and is_top100 = true
    ),
    'played_by_list', coalesce(played_by_list, '{}'::jsonb),
    'recent_course_ids', coalesce(recent_courses, array[]::uuid[]),
    'wishlist_list_slugs', coalesce(wishlist_lists, array[]::text[]),
    'leaderboard_rank', user_rank
  );

  return result;
end;
$$;

-- Create RPC for personalized Top 100 recommendations
create or replace function public.get_top100_discover_recommendations(
  target_user_id uuid,
  limit_param int default 12
)
returns table (
  post_id uuid,
  course_id uuid,
  course_name text,
  list_slug text,
  list_rank int,
  engagement_score numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  user_intent jsonb;
  target_lists text[];
begin
  -- Get user's Top 100 intent
  user_intent := get_user_top100_intent(target_user_id);
  
  -- Extract lists user is chasing
  select array_agg(key)
  into target_lists
  from jsonb_each(user_intent->'played_by_list')
  where (value::text::int) > 0
  union
  select unnest((user_intent->>'wishlist_list_slugs')::text[]);

  if target_lists is null or array_length(target_lists, 1) = 0 then
    -- Fallback to global top 100
    target_lists := array['global-top-100'];
  end if;

  return query
  select
    p.id as post_id,
    gc.id as course_id,
    gc.name as course_name,
    t.slug as list_slug,
    ctm.rank as list_rank,
    (coalesce(pl.likes_count, 0) + coalesce(pc.comments_count, 0) * 2)::numeric as engagement_score,
    p.created_at
  from posts p
  join post_media pm on pm.post_id = p.id
  join golf_courses gc on pm.media_url like '%' || gc.id::text || '%'
  join course_top100_memberships ctm on ctm.course_id = gc.id
  join top100_lists t on t.id = ctm.list_id
  left join (
    select post_id, count(*) as likes_count
    from post_likes
    group by post_id
  ) pl on pl.post_id = p.id
  left join (
    select post_id, count(*) as comments_count
    from post_comments
    group by post_id
  ) pc on pc.post_id = p.id
  where t.slug = any(target_lists)
    and not exists (
      select 1
      from user_course_activity uca
      where uca.user_id = target_user_id
        and uca.course_id = gc.id
        and uca.is_top100 = true
    )
    and p.created_at > now() - interval '90 days'
  order by engagement_score desc, p.created_at desc
  limit limit_param;
end;
$$;

-- Create RPC for trending Top 100 content (global)
create or replace function public.get_trending_top100_moments(
  limit_param int default 12,
  days_window int default 7
)
returns table (
  post_id uuid,
  course_id uuid,
  course_name text,
  list_slug text,
  list_rank int,
  engagement_score numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id as post_id,
    gc.id as course_id,
    gc.name as course_name,
    t.slug as list_slug,
    ctm.rank as list_rank,
    (coalesce(pl.likes_count, 0) * 1.0 + coalesce(pc.comments_count, 0) * 2.0 + coalesce(ps.shares_count, 0) * 3.0)::numeric as engagement_score,
    p.created_at
  from posts p
  join post_media pm on pm.post_id = p.id
  join golf_courses gc on pm.media_url like '%' || gc.id::text || '%'
  join course_top100_memberships ctm on ctm.course_id = gc.id
  join top100_lists t on t.id = ctm.list_id
  left join (
    select post_id, count(*) as likes_count
    from post_likes
    group by post_id
  ) pl on pl.post_id = p.id
  left join (
    select post_id, count(*) as comments_count
    from post_comments
    group by post_id
  ) pc on pc.post_id = p.id
  left join (
    select post_id, count(*) as shares_count
    from post_shares
    group by post_id
  ) ps on ps.post_id = p.id
  where p.created_at > now() - interval '1 day' * days_window
  order by engagement_score desc, p.created_at desc
  limit limit_param;
end;
$$;

-- Grant permissions
grant execute on function public.get_user_top100_intent to authenticated;
grant execute on function public.get_top100_discover_recommendations to authenticated;
grant execute on function public.get_trending_top100_moments to authenticated, anon;