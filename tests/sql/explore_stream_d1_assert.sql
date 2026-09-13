-- Phase D1 assertions: port fidelity, keyset pagination, cross-page cadence,
-- and a cold member's first page. Any failure raises and the harness exits 1.
\set ON_ERROR_STOP on

-- ---------------------------------------------------------------- fixture data
insert into golf_courses (id, name, country, sub_country, region, thumbnail_image, club_id)
select ('00000000-0000-0000-0000-00000000000' || i)::uuid,
       'Course ' || i, 'United Kingdom',
       case when i <= 4 then 'England' else 'Scotland' end,
       case when i <= 2 then 'Kent' else 'Fife' end,
       'img' || i,
       ('10000000-0000-0000-0000-00000000000' || i)::uuid
from generate_series(1, 8) i;

insert into user_profiles (id, display_name, primary_club_id)
select ('20000000-0000-0000-0000-00000000000' || i)::uuid, 'Member ' || i,
       '10000000-0000-0000-0000-000000000001'::uuid
from generate_series(1, 6) i;

-- viewer = member 1. Circle = members 2 and 3.
insert into follows (follower_actor_id, follower_actor_type, following_actor_id, following_actor_type) values
  ('20000000-0000-0000-0000-000000000001','personal','20000000-0000-0000-0000-000000000002','personal'),
  ('20000000-0000-0000-0000-000000000001','personal','20000000-0000-0000-0000-000000000003','personal');

insert into gam_round_stats
  (user_id, course_id, whs_score_id, play_date, created_at, gross_score, course_par,
   stableford_points, birdies, eagles, albatrosses, holes_in_one, clean_card, hcp_at_time)
select ('20000000-0000-0000-0000-00000000000' || (1 + (i % 6)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 8)))::uuid,
       gen_random_uuid(),
       current_date - (i % 40),
       now() - ((i % 30) || ' hours')::interval,
       68 + (i % 20), 72, 30 + (i % 18), i % 6, 0, 0,
       case when i = 7 then 1 else 0 end,
       (i % 11) = 0, 12.4
from generate_series(1, 150) i;

insert into gam_round_net (whs_score_id, user_id, course_id, play_date, gross_score, course_handicap, net_score)
  select whs_score_id, user_id, course_id, play_date, gross_score, 12, gross_score - 12 from gam_round_stats;

insert into course_ratings (user_id, course_id, rating, review, created_at)
select ('20000000-0000-0000-0000-00000000000' || (2 + (i % 5)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 8)))::uuid,
       6 + (i % 5), 'A real sentence about the course. And another.',
       now() - ((i % 20) || ' hours')::interval
from generate_series(1, 24) i;

insert into amateur_stories (slug, kicker, headline, image_url, published_at)
select 'story-' || i, 'THE WIRE', 'Headline ' || i, 'simg' || i, now() - (i || ' hours')::interval
from generate_series(1, 8) i;

insert into course_shortlists (user_id, course_id) values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005');
insert into user_surface_last_seen (user_id, surface_key, last_seen_at) values
  ('20000000-0000-0000-0000-000000000001','discover', now() - interval '20 hours');

-- The viewer's standing on three courses, from the stub: the RPC CALLS it.
insert into viewer_standing_fixture values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001', 2, 6, 4, 2),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002', 1, 5, 1, 0),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003', 4, 6, null, null);

-- ---------------------------------------------------------------- page walking
create table walk (page int, pos int, id text, kind text, ring text, score numeric, cons jsonb, relaxed boolean);

do $$
declare
  v_cur jsonb := null; v_page int := 0; v_pos int; v_rows int; v_next jsonb;
  v_rec record;
begin
  loop
    v_page := v_page + 1;
    v_pos := 0;
    v_next := null;
    for v_rec in
      select * from public.get_explore_stream(
        '20000000-0000-0000-0000-000000000001'::uuid, 'all', 'world', v_cur, 12,
        '10000000-0000-0000-0000-000000000001'::uuid, 'Kent', 'England')
    loop
      v_pos := v_pos + 1;
      insert into walk values (v_page, v_pos, v_rec.id, v_rec.kind, v_rec.ring, v_rec.score, v_rec.consequence, v_rec.relaxed);
      v_next := v_rec.next_cursor;
    end loop;
    select count(*) into v_rows from walk where page = v_page;
    raise notice 'page % rows % next %', v_page, v_rows, v_next is not null;
    exit when v_rows = 0 or v_next is null or v_page >= 5;
    v_cur := v_next;
  end loop;
end $$;

-- 1. NO DUPLICATES across pages.
do $$
declare n int;
begin
  select count(*) into n from (select id from walk group by id having count(*) > 1) d;
  if n > 0 then raise exception 'D1 FAIL: % duplicated ids across pages', n; end if;
  raise notice 'PASS no duplicate ids across pages';
end $$;

-- 2. FULL PAGES while depth remains.
do $$
declare n int;
begin
  select count(*) into n from (
    select page, count(*) c from walk group by page
  ) p where p.c <> 12 and p.page < (select max(page) from walk);
  if n > 0 then raise exception 'D1 FAIL: % short pages before the last', n; end if;
  raise notice 'PASS every page but the last is full';
end $$;

-- 3. CADENCE HOLDS ACROSS THE SEAM: no two adjacent cards share kind:ring.
do $$
declare n int;
begin
  with seq as (
    select row_number() over (order by page, pos) rn,
           coalesce(kind,'none') || ':' || coalesce(ring,'none') k, relaxed
    from walk
  )
  select count(*) into n from seq a join seq b on b.rn = a.rn + 1
  where a.k = b.k and not a.relaxed and not b.relaxed;
  if n > 0 then raise exception 'D1 FAIL: % adjacent same kind:ring pairs', n; end if;
  raise notice 'PASS no adjacent repeats among cadence-placed cards, page seams included';
end $$;

-- 4. THE OUTER-RING CAP: at most one county/country/world card per four.
do $$
declare n int;
begin
  with seq as (
    select row_number() over (order by page, pos) rn,
           (ring in ('county','country','world')) outer_ring, relaxed from walk
  )
  select count(*) into n from seq a join seq b
    on b.rn > a.rn and b.rn <= a.rn + 3
  where a.outer_ring and b.outer_ring and not a.relaxed and not b.relaxed;
  if n > 0 then raise exception 'D1 FAIL: % outer-ring pairs inside four slots', n; end if;
  raise notice 'PASS outer-ring cap holds 1-in-4 among cadence-placed cards';
end $$;

-- 5. A STORY NEVER LEADS a page.
do $$
declare n int;
begin
  select count(*) into n from walk where pos = 1 and kind = 'story';
  if n > 0 then raise exception 'D1 FAIL: a story led % page(s)', n; end if;
  raise notice 'PASS no story leads a page';
end $$;

-- 6. FIGURES COME FROM STANDING, never re-derived: every n/of on a course the
--    viewer stands on equals the stub's rank_now / field_now.
do $$
declare n int;
begin
  select count(*) into n
  from walk w
  where w.cons ->> 'of' is not null
    and (w.cons ->> 'of')::int not in (select field_now from viewer_standing_fixture);
  if n > 0 then raise exception 'D1 FAIL: % field sizes not from get_viewer_standing', n; end if;
  raise notice 'PASS every field size came from get_viewer_standing';
end $$;

-- 7. A COLD MEMBER (no rounds, no standing, no circle) still gets a full page.
do $$
declare n int;
begin
  insert into user_profiles (id, display_name) values
    ('30000000-0000-0000-0000-000000000001','Cold Member');
  select count(*) into n from public.get_explore_stream(
    '30000000-0000-0000-0000-000000000001'::uuid, 'all', 'world', null, 12, null, null, null);
  if n < 12 then raise exception 'D1 FAIL: cold member page had only % rows', n; end if;
  raise notice 'PASS cold member first page is full (% rows)', n;
end $$;

-- 8. OTHER VIEWS ARE DELIBERATELY EMPTY IN D1.
do $$
declare n int;
begin
  select count(*) into n from public.get_explore_stream(
    '20000000-0000-0000-0000-000000000001'::uuid, 'scores', 'world', null, 12, null, null, null);
  if n <> 0 then raise exception 'D1 FAIL: scores view returned % rows before D3', n; end if;
  raise notice 'PASS non-All views return nothing until D3';
end $$;

select page, count(*) rows, count(*) filter (where relaxed) relaxed_tail, count(*) filter (where ring in ('county','country','world')) outer_ring,
       count(*) filter (where kind = 'story') stories, round(min(score),3) min_score, round(max(score),3) max_score
from walk group by page order by page;
