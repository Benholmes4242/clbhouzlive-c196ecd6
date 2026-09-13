-- Local fixture for the Phase D1 port-fidelity harness. NOT production SQL.
-- Minimal shapes for exactly the columns get_explore_stream reads, plus a stub
-- get_viewer_standing so the harness proves the CALL, never a second rank.
create table user_profiles (
  id uuid primary key, display_name text, profile_photo_url text,
  eg_handicap_index numeric, manual_handicap_index numeric, primary_club_id uuid);
create table golf_courses (
  id uuid primary key, name text, country text, sub_country text, region text,
  thumbnail_image text, club_id uuid);
-- SCHEMA PARITY IS THE POINT: production gam_round_stats has NO id column -
-- whs_score_id (attnum 1) is its key. The invented id here is what let the
-- 42703 through D1-D3 green. Never add a column production does not have.
create table gam_round_stats (
  user_id uuid, course_id uuid,
  whs_score_id uuid primary key, play_date date, created_at timestamptz default now(),
  gross_score int, course_par int, stableford_points int, birdies int, eagles int,
  albatrosses int, holes_in_one int, clean_card boolean, hcp_at_time numeric,
  holes_played int default 18);
create table gam_round_net (whs_score_id uuid, net_score int);
create table course_ratings (
  id uuid primary key default gen_random_uuid(), user_id uuid, course_id uuid,
  rating numeric, review text, created_at timestamptz default now(), is_mock boolean default false);
create table amateur_stories (
  id uuid primary key default gen_random_uuid(), slug text, kicker text,
  headline text, image_url text, published_at timestamptz);
create table course_shortlists (user_id uuid, course_id uuid);
create table follows (
  follower_actor_id uuid, follower_actor_type text,
  following_actor_id uuid, following_actor_type text);
create table gam_course_legends (
  course_id uuid, user_id uuid, category text, rank int, value numeric,
  attained_at timestamptz, is_current boolean);
create table notifications (user_id uuid, type text, data jsonb);
create table user_surface_last_seen (user_id uuid, surface_key text, last_seen_at timestamptz);

create function get_viewer_standing(p_viewer uuid)
returns table (course_id uuid, course_name text, region text, sub_country text,
  image_url text, rank_now int, field_now int, rank_then int, delta int,
  last_change_at timestamptz, board text)
language sql stable as $$
  select s.course_id, c.name, c.region, c.sub_country, c.thumbnail_image,
         s.rank_now, s.field_now, s.rank_then, s.delta, now(), 'topar'
  from viewer_standing_fixture s join golf_courses c on c.id = s.course_id
  where s.viewer = p_viewer;
$$;
