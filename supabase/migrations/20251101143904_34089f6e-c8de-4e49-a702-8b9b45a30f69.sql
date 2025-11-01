-- =============================
-- Phase 3.1: Harden Visibility
-- Friends: Ensure following_id
-- Club: Normalize case/whitespace
-- =============================

-- FRIENDS: follower -> following (host) - no status check needed for MVP
create or replace function public.user_is_friend_of_host(_host_id uuid, _viewer_id uuid)
returns boolean
language sql stable security definer set search_path=public as $$
  select exists (
    select 1
    from public.user_follows uf
    where uf.following_id = _host_id
      and uf.follower_id  = _viewer_id
  );
$$;

-- CLUB: normalize home_club to be case/whitespace insensitive
create or replace function public.viewer_shares_host_club(_host_id uuid, _viewer_id uuid)
returns boolean
language sql stable security definer set search_path=public as $$
  with host as (
    select lower(trim(home_club)) as club
    from public.user_profiles
    where id = _host_id
  ),
  viewer as (
    select lower(trim(home_club)) as club
    from public.user_profiles
    where id = _viewer_id
  )
  select coalesce(h.club,'') <> '' and h.club = v.club
  from host h cross join viewer v;
$$;