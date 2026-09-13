-- Local fixture for the Explore harnesses (D1-D5). NOT production SQL.
--
-- SCHEMA PARITY IS THE POINT. Every table below carries the FULL production
-- column set (wide tables carry the declared subset the Explore family reads),
-- verified against tests/sql/production_columns.snapshot.sql by
-- tests/sql/schema_parity_assert.sql, which runs before any function body.
-- Production gam_round_stats has NO id column - whs_score_id is its key. The
-- invented id that used to sit here is what let `g.id` through D1-D3 green while
-- four live views ran on the client fallback. Never add a column production does
-- not have, and never omit one it does.
--
-- STANDING IS THE REAL FUNCTION (AUDIT RULING 3). The fabricated stub that used
-- to live at the bottom of this file meant card-vs-shelf agreement - the single
-- property the whole standing design rests on - had never been machine-checked:
-- the harness compared the RPC's figures against numbers this file made up. The
-- DEPLOYED public.get_viewer_standing is reproduced verbatim below, together
-- with the board_pool / board_qualifies / board_window_from family it reuses, so
-- the assertion now compares the card against the same rank logic the Champions
-- tab and the standing shelf use.

create table user_profiles (
  id uuid primary key,
  display_name text,
  profile_photo_url text,
  eg_handicap_index double precision,
  manual_handicap_index numeric,
  primary_club_id uuid);

create table golf_courses (
  id uuid primary key,
  name text,
  country text,
  sub_country text,
  region text,
  thumbnail_image text,
  club_id uuid);

create table gam_round_stats (
  whs_score_id uuid primary key,
  user_id uuid,
  play_date date,
  course_id uuid,
  course_name text,
  course_par int,
  course_rating numeric,
  slope_rating int,
  gross_score int,
  nett_score int,
  stableford_points int,
  score_diff numeric,
  hcp_at_time numeric,
  holes_played int default 18,
  pcc numeric,
  is_competition boolean,
  tee_marker text,
  birdies int,
  eagles int,
  albatrosses int,
  holes_in_one int,
  pars int,
  bogeys int,
  double_bogeys int,
  triple_plus int,
  longest_par_or_better_run int,
  longest_birdie_run int,
  beat_par boolean,
  sub_70 boolean,
  sub_80 boolean,
  sub_90 boolean,
  sub_100 boolean,
  clean_card boolean,
  is_counter boolean,
  delta_index numeric,
  evaluator_version int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  hole_detail_present boolean,
  counter_settled boolean);

create table gam_round_net (
  whs_score_id uuid,
  user_id uuid,
  course_id uuid,
  play_date date,
  gross_score int,
  course_handicap int,
  net_score int);

create table course_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  rating numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  review text,
  review_date timestamptz,
  helpful_count int,
  unhelpful_count int,
  design_score numeric,
  condition_score numeric,
  facilities_score numeric,
  clubhouse_score numeric,
  is_mock boolean default false,
  title text,
  is_review_of_week boolean,
  review_of_week_week text,
  verdict text,
  share_to_feed boolean,
  tee_label text);

create table amateur_stories (
  id uuid primary key default gen_random_uuid(),
  slug text,
  kicker text,
  headline text,
  standfirst text,
  body_blocks jsonb,
  source_text text,
  image_url text,
  image_credit text,
  categories text[],
  tournament_name text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now());

create table course_shortlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  created_at timestamptz default now(),
  list_key text);

create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_actor_type text,
  follower_actor_id uuid,
  following_actor_type text,
  following_actor_id uuid,
  follower_user_id uuid,
  created_at timestamptz default now());

create table gam_course_legends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  category text,
  rank int,
  value numeric,
  attained_at timestamptz,
  trigger_whs_score_id uuid,
  is_current boolean,
  updated_at timestamptz default now());

create table user_surface_last_seen (
  user_id uuid,
  surface_key text,
  last_seen_at timestamptz,
  updated_at timestamptz default now());

/* board_pool's circle CTE reads `follows` only; user_friends and user_follows
   are here because _get_user_friend_set is in the same family and a missing
   table would hide a change that starts reading them again. */
create table user_friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  friend_id uuid,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now());

create table user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid,
  following_id uuid,
  created_at timestamptz default now(),
  follower_actor_type text,
  follower_actor_id uuid);

/* TOP 100 - created here, not in the D3 fixture, because board_pool's ok_courses
   branch references course_top100_memberships and a SQL function body is
   validated at CREATE time: the family below will not load without it. */
create table top100_lists (
  id uuid primary key,
  slug text,
  name text,
  short_label text,
  description text,
  is_active boolean,
  sort_order int,
  created_at timestamptz default now(),
  updated_at timestamptz default now());

create table course_top100_memberships (
  id uuid primary key default gen_random_uuid(),
  course_id uuid,
  list_id uuid,
  rank int,
  added_at timestamptz default now(),
  updated_at timestamptz default now());

-- ---------------------------------------------------------------------------
-- THE DEPLOYED STANDING FAMILY, verbatim (pg_get_functiondef, 2026-09-13).
-- Do not simplify these. A local simplification is a second rank logic, which
-- is the exact disagreement the standing design exists to prevent.
-- ---------------------------------------------------------------------------

create or replace function public.board_window_from(p_window text)
 returns date language sql stable as $function$
  select case p_window
           when '14'   then current_date - 14
           when '30'   then current_date - 30
           when '90'   then current_date - 90
           when 'year' then date_trunc('year', current_date)::date
           else date '1900-01-01'
         end;
$function$;

create or replace function public.board_qualifies(p_board text, p_gross integer,
  p_par integer, p_net integer, p_sf integer, p_delta numeric, p_birdies integer,
  p_play_date date, p_ace integer default 0, p_alb integer default 0,
  p_eagle integer default 0, p_clean boolean default false)
 returns boolean language sql immutable as $function$
  select case p_board
    when 'gross'      then p_gross is not null and p_par between 62 and 80
    when 'topar'      then p_gross is not null and p_par between 62 and 80
    when 'net'        then p_net is not null and p_par between 62 and 80
    when 'stableford' then p_sf >= 36
    when 'improved'   then p_delta < 0
    when 'birdies'    then p_birdies >= 3
    when 'recent'     then p_play_date is not null
    when 'ace'        then p_ace > 0
    when 'albatross'  then p_alb > 0
    when 'eagle'      then p_eagle > 0
    when 'clean_card' then p_clean is true
    else false
  end;
$function$;

create or replace function public.board_pool(p_viewer uuid,
  p_scope text default 'everyone', p_window text default '14',
  p_region_kind text default null, p_region_value text default null,
  p_courses text default 'any', p_course_id uuid default null,
  p_band text default 'any', p_competition text default 'any')
 returns table(user_id uuid, whs_score_id uuid, play_date date, course_id uuid,
   course_name text, country text, sub_country text, gross_score integer,
   course_par integer, net_score integer, stableford_points integer,
   delta_index numeric, birdies integer, eagles integer, albatrosses integer,
   holes_in_one integer, clean_card boolean, beat_par boolean, sub_80 boolean,
   sub_70 boolean, is_competition boolean, hcp_at_time numeric, ok_scope boolean,
   ok_window boolean, ok_region boolean, ok_courses boolean, ok_band boolean,
   ok_competition boolean)
 language sql stable as $function$
  with viewer as (
    select up.id,
           coalesce(up.eg_handicap_index, up.manual_handicap_index) as idx,
           up.primary_club_id
    from public.user_profiles up
    where up.id = p_viewer
  ),
  circle as (
    select f.following_actor_id as uid
    from public.follows f
    where f.follower_actor_id    = p_viewer
      and f.follower_actor_type  = 'personal'
      and f.following_actor_type = 'personal'
    union
    select p_viewer
  ),
  played as (
    select distinct g.course_id
    from public.gam_round_stats g
    where g.user_id = p_viewer and g.holes_played = 18 and g.course_id is not null
  ),
  cutoff as (
    select public.board_window_from(p_window) as from_date
  )
  select
    g.user_id, g.whs_score_id, g.play_date,
    g.course_id, g.course_name, c.country, c.sub_country,
    g.gross_score, g.course_par, n.net_score,
    g.stableford_points, g.delta_index, g.birdies,
    g.eagles, g.albatrosses, g.holes_in_one,
    g.clean_card, g.beat_par, g.sub_80, g.sub_70,
    g.is_competition, g.hcp_at_time,

    case p_scope
      when 'circle' then exists (select 1 from circle where circle.uid = g.user_id)
      when 'club'   then g.user_id in (
                          select up.id from public.user_profiles up
                          where up.primary_club_id is not null
                            and up.primary_club_id = (select primary_club_id from viewer)
                        )
      when 'you'    then g.user_id = p_viewer
      else true
    end,

    g.play_date >= (select from_date from cutoff),

    case
      when p_region_kind is null then true
      when p_region_kind = 'country'     then c.country     = p_region_value
      when p_region_kind = 'sub_country' then c.sub_country = p_region_value
      else true
    end,

    case p_courses
      when 'top100' then exists (
        select 1 from public.course_top100_memberships m where m.course_id = g.course_id)
      when 'played' then g.course_id in (select course_id from played)
      when 'one'    then g.course_id = p_course_id
      else true
    end,

    case p_band
      when 'any'  then true
      when 'near' then g.hcp_at_time is not null
                     and (select idx from viewer) is not null
                     and abs(g.hcp_at_time - (select idx from viewer)) <= 4.0
      when 'plus' then g.hcp_at_time is not null and g.hcp_at_time <  0
      when 'b0'   then g.hcp_at_time between 0    and 4.9
      when 'b5'   then g.hcp_at_time between 5    and 9.9
      when 'b10'  then g.hcp_at_time between 10   and 14.9
      when 'b15'  then g.hcp_at_time between 15   and 19.9
      when 'b20'  then g.hcp_at_time between 20   and 27.9
      when 'b28'  then g.hcp_at_time >= 28
      else true
    end,

    case p_competition
      when 'competition' then g.is_competition is true
      when 'social'      then g.is_competition is false
      else true
    end

  from public.gam_round_stats g
  left join public.golf_courses c on c.id = g.course_id
  left join public.gam_round_net n on n.whs_score_id = g.whs_score_id
  where g.holes_played = 18;
$function$;

create or replace function public.get_viewer_standing(p_viewer uuid)
 returns table(course_id uuid, course_name text, region text, sub_country text,
   image_url text, rank_now integer, field_now integer, rank_then integer,
   delta integer, last_change_at timestamp with time zone, board text)
 language sql stable
 set search_path to 'public'
as $function$
  with stamp as (
    select s.last_seen_at as seen_at
    from public.user_surface_last_seen s
    where s.user_id = p_viewer
      and s.surface_key = 'discover'
  ),
  pool as (
    select * from public.board_pool(
      p_viewer, 'everyone', 'all', null, null, 'played', null, 'any', 'any')
  ),
  matched as (
    select * from pool
    where ok_scope and ok_window and ok_region and ok_courses and ok_band
      and ok_competition
  ),
  qualified as (
    select m.*, (m.gross_score - m.course_par)::numeric as sv
    from matched m
    where public.board_qualifies('topar', m.gross_score, m.course_par,
            m.net_score, m.stableford_points, m.delta_index, m.birdies,
            m.play_date, m.holes_in_one, m.albatrosses, m.eagles, m.clean_card)
  ),
  dedup_now as (
    select q.* from (
      select q.*,
             row_number() over (
               partition by q.course_id, q.user_id
               order by q.sv asc, q.gross_score asc nulls last, q.play_date desc
             ) as rn
      from qualified q
    ) q
    where q.rn = 1
  ),
  rank_now_cte as (
    select d.*, rank() over (partition by d.course_id order by d.sv asc)::int as pos
    from dedup_now d
  ),
  dedup_then as (
    select q.* from (
      select q.*,
             row_number() over (
               partition by q.course_id, q.user_id
               order by q.sv asc, q.gross_score asc nulls last, q.play_date desc
             ) as rn
      from qualified q
      cross join stamp s
      where s.seen_at is not null
        and q.play_date <= s.seen_at::date
    ) q
    where q.rn = 1
  ),
  rank_then_cte as (
    select d.*, rank() over (partition by d.course_id order by d.sv asc)::int as pos
    from dedup_then d
  ),
  field as (
    select m.course_id,
           count(distinct m.user_id)::int as field_now,
           max(m.play_date)               as last_change
    from matched m
    group by m.course_id
  )
  select
    rn.course_id,
    c.name,
    c.region,
    c.sub_country,
    c.thumbnail_image,
    rn.pos,
    f.field_now,
    rt.pos,
    (rt.pos - rn.pos)::int,
    f.last_change::timestamptz,
    'topar'::text
  from rank_now_cte rn
  join field f          on f.course_id = rn.course_id
  join public.golf_courses c on c.id   = rn.course_id
  left join rank_then_cte rt
         on rt.course_id = rn.course_id
        and rt.user_id   = p_viewer
  where rn.user_id = p_viewer
  order by f.last_change desc nulls last, c.name asc;
$function$;
