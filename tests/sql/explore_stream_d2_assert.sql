-- Phase D2 assertions: the backlog lane. Lane classification on real arrival
-- arithmetic, news first, no backlog lead, the one-in-three allowance, an ace
-- synced the day it was played staying NEWS, and backlog reachable on a deep
-- page for a thin-news viewer. Every D1 rule is re-asserted on the same walk.
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

insert into follows (follower_actor_id, follower_actor_type, following_actor_id, following_actor_type) values
  ('20000000-0000-0000-0000-000000000001','personal','20000000-0000-0000-0000-000000000002','personal'),
  ('20000000-0000-0000-0000-000000000001','personal','20000000-0000-0000-0000-000000000003','personal');

-- NEWS ROUNDS: played inside the last 20 days, arrived within 30 hours.
insert into gam_round_stats
  (user_id, course_id, whs_score_id, play_date, created_at, gross_score, course_par,
   stableford_points, birdies, eagles, albatrosses, holes_in_one, clean_card, hcp_at_time)
select ('20000000-0000-0000-0000-00000000000' || (1 + (i % 6)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 8)))::uuid,
       gen_random_uuid(),
       current_date - (i % 20),
       now() - ((i % 30) || ' hours')::interval,
       68 + (i % 20), 72, 30 + (i % 18), i % 6, 0, 0, 0,
       (i % 11) = 0, 12.4
from generate_series(1, 60) i;

-- THE BACKLOG: 200 historic rounds, all synced in one cluster minutes ago -
-- exactly the shape production showed (2021 play dates, 1674..2028 day lag).
insert into gam_round_stats
  (user_id, course_id, whs_score_id, play_date, created_at, gross_score, course_par,
   stableford_points, birdies, eagles, albatrosses, holes_in_one, clean_card, hcp_at_time)
select ('20000000-0000-0000-0000-00000000000' || (1 + (i % 6)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 8)))::uuid,
       gen_random_uuid(),
       date '2021-06-01' + (i % 300),
       now() - ((i % 40) || ' minutes')::interval,
       70 + (i % 18), 72, 28 + (i % 16), i % 5, 0, 0, 0,
       (i % 13) = 0, 14.1
from generate_series(1, 200) i;

-- AN ACE, PLAYED THREE DAYS AGO AND SYNCED TODAY. Arrival is not late, so it is
-- NEWS and must not be pushed into the backlog by its notability.
insert into gam_round_stats
  (id, user_id, course_id, whs_score_id, play_date, created_at, gross_score, course_par,
   stableford_points, birdies, eagles, albatrosses, holes_in_one, clean_card, hcp_at_time)
values ('99999999-9999-9999-9999-999999999999',
        '20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',
        gen_random_uuid(), current_date - 3, now() - interval '1 hour',
        69, 72, 41, 4, 0, 0, 1, false, 8.2);

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

insert into viewer_standing_fixture values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001', 2, 6, 4, 2),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002', 1, 5, 1, 0),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003', 4, 6, null, null);

-- ------------------------------------------------------- lane truth, read once
create table lane_truth as
select 'round:' || id::text cid,
       (created_at::date - play_date) > 30 as should_backlog
from gam_round_stats;

-- ---------------------------------------------------------------- page walking
create table walk (page int, pos int, id text, kind text, ring text, lane text,
                   score numeric, cons jsonb, relaxed boolean, facts jsonb);

do $$
declare
  v_cur jsonb := null; v_page int := 0; v_pos int; v_rows int; v_next jsonb;
  v_rec record;
begin
  loop
    v_page := v_page + 1; v_pos := 0; v_next := null;
    for v_rec in
      select * from public.get_explore_stream(
        '20000000-0000-0000-0000-000000000001'::uuid, 'all', 'world', v_cur, 12,
        '10000000-0000-0000-0000-000000000001'::uuid, 'Kent', 'England')
    loop
      v_pos := v_pos + 1;
      insert into walk values (v_page, v_pos, v_rec.id, v_rec.kind, v_rec.ring,
        v_rec.lane, v_rec.score, v_rec.consequence, v_rec.relaxed, v_rec.facts);
      v_next := v_rec.next_cursor;
    end loop;
    select count(*) into v_rows from walk where page = v_page;
    raise notice 'page % rows % backlog % next %', v_page, v_rows,
      (select count(*) from walk where page = v_page and lane = 'backlog'), v_next is not null;
    exit when v_rows = 0 or v_next is null or v_page >= 5;
    v_cur := v_next;
  end loop;
end $$;

-- 1. LANE CLASSIFICATION IS THE ARRIVAL ARITHMETIC, nothing else.
do $$
declare n int;
begin
  select count(*) into n from walk w join lane_truth t on t.cid = w.id
  where (w.lane = 'backlog') <> t.should_backlog;
  if n > 0 then raise exception 'D2 FAIL: % rounds in the wrong lane', n; end if;
  raise notice 'PASS every round lane matches created_at - play_date > 30 days';
end $$;

-- 2. REVIEWS AND STORIES ARE ALWAYS NEWS.
do $$
declare n int;
begin
  select count(*) into n from walk where kind <> 'round' and lane <> 'news';
  if n > 0 then raise exception 'D2 FAIL: % non-round cards in the backlog lane', n; end if;
  raise notice 'PASS only rounds ever split lanes';
end $$;

-- 3. BACKLOG NEVER LEADS a page.
do $$
declare n int;
begin
  select count(*) into n from walk w where w.pos = 1 and w.lane = 'backlog'
    and exists (select 1 from walk x where x.page = w.page and x.lane = 'news');
  if n > 0 then raise exception 'D2 FAIL: backlog led % page(s) that had news', n; end if;
  raise notice 'PASS backlog never leads a page while news remains';
end $$;

-- 4. NEWS FIRST. While news can fill the page, no backlog is admitted at all.
do $$
declare n int;
begin
  select count(*) into n from walk where page = 1 and lane = 'backlog';
  if n > 0 then raise exception 'D2 FAIL: % backlog cards on page 1 with news available', n; end if;
  raise notice 'PASS a full news page admits no backlog';
end $$;

-- 5. THE ALLOWANCE: at most one backlog card per three placed slots, seams
--    included (the pacing gap travels in the cursor).
do $$
declare n int;
begin
  with mixed as (
    select page from walk group by page having count(*) filter (where lane = 'news') > 0
  ), seq as (
    select row_number() over (order by page, pos) rn, lane from walk
    where page in (select page from mixed)
  )
  select count(*) into n from seq a join seq b on b.rn > a.rn and b.rn <= a.rn + 2
  where a.lane = 'backlog' and b.lane = 'backlog';
  if n > 0 then raise exception 'D2 FAIL: % backlog pairs inside three slots', n; end if;
  raise notice 'PASS backlog admitted at most one in three, page seams included';
end $$;

-- 6. THE ACE IS NEWS, and its arrival still buys it freshness.
do $$
declare v_lane text;
begin
  select lane into v_lane from walk where id = 'round:99999999-9999-9999-9999-999999999999';
  if v_lane is null then raise exception 'D2 FAIL: the ace never appeared'; end if;
  if v_lane <> 'news' then raise exception 'D2 FAIL: the ace landed in lane %', v_lane; end if;
  raise notice 'PASS an ace played 3 days ago and synced today is news';
end $$;

-- 7. NO DUPLICATES, and 8. FULL PAGES - D1, re-asserted with the lane in play.
do $$
declare n int;
begin
  select count(*) into n from (select id from walk group by id having count(*) > 1) d;
  if n > 0 then raise exception 'D2 FAIL: % duplicated ids across pages', n; end if;
  select count(*) into n from (select page, count(*) c from walk group by page) p
   where p.c <> 12 and p.page < (select max(page) from walk);
  if n > 0 then raise exception 'D2 FAIL: % short pages before the last', n; end if;
  raise notice 'PASS no duplicates and every page but the last is full';
end $$;

-- 9. CADENCE AND THE OUTER-RING CAP still hold, and no story leads.
do $$
declare n int;
begin
  with seq as (
    select row_number() over (order by page, pos) rn,
           coalesce(kind,'none') || ':' || coalesce(ring,'none') k,
           (ring in ('county','country','world')) outer_ring, relaxed from walk
  )
  select count(*) into n from seq a join seq b on b.rn = a.rn + 1
  where a.k = b.k and not a.relaxed and not b.relaxed;
  if n > 0 then raise exception 'D2 FAIL: % adjacent same kind:ring pairs', n; end if;
  with seq as (
    select row_number() over (order by page, pos) rn,
           (ring in ('county','country','world')) outer_ring, relaxed from walk
  )
  select count(*) into n from seq a join seq b on b.rn > a.rn and b.rn <= a.rn + 3
  where a.outer_ring and b.outer_ring and not a.relaxed and not b.relaxed;
  if n > 0 then raise exception 'D2 FAIL: % outer-ring pairs inside four slots', n; end if;
  select count(*) into n from walk where pos = 1 and kind = 'story';
  if n > 0 then raise exception 'D2 FAIL: a story led % page(s)', n; end if;
  raise notice 'PASS cadence, outer-ring cap and story rule survive the lane split';
end $$;

-- 10. FIGURES STILL COME FROM get_viewer_standing.
do $$
declare n int;
begin
  select count(*) into n from walk w
  where w.cons ->> 'of' is not null
    and (w.cons ->> 'of')::int not in (select field_now from viewer_standing_fixture);
  if n > 0 then raise exception 'D2 FAIL: % field sizes not from get_viewer_standing', n; end if;
  raise notice 'PASS every field size came from get_viewer_standing';
end $$;

-- ------------------------------------------- the thin-news viewer, walked deep
-- News is cut to a handful of cards. From the page where news runs short the
-- backlog must start appearing and must still be arriving on page 6.
delete from gam_round_stats where (created_at::date - play_date) <= 30
  and id <> '99999999-9999-9999-9999-999999999999'
  and ctid not in (select ctid from gam_round_stats
                   where (created_at::date - play_date) <= 30 limit 12);
delete from course_ratings where ctid not in (select ctid from course_ratings limit 3);

create table walk2 (page int, pos int, id text, kind text, lane text);

do $$
declare
  v_cur jsonb := null; v_page int := 0; v_pos int; v_rows int; v_next jsonb; v_rec record;
begin
  loop
    v_page := v_page + 1; v_pos := 0; v_next := null;
    for v_rec in
      select * from public.get_explore_stream(
        '20000000-0000-0000-0000-000000000001'::uuid, 'all', 'world', v_cur, 5,
        '10000000-0000-0000-0000-000000000001'::uuid, 'Kent', 'England')
    loop
      v_pos := v_pos + 1;
      insert into walk2 values (v_page, v_pos, v_rec.id, v_rec.kind, v_rec.lane);
      v_next := v_rec.next_cursor;
    end loop;
    select count(*) into v_rows from walk2 where page = v_page;
    raise notice 'thin page % rows % backlog %', v_page, v_rows,
      (select count(*) from walk2 where page = v_page and lane = 'backlog');
    exit when v_rows = 0 or v_next is null or v_page >= 10;
    v_cur := v_next;
  end loop;
end $$;

-- 11. THE BACKLOG IS REACHABLE, and still arriving on page 6.
do $$
declare n int; m int; p int;
begin
  select count(*) into n from walk2 where lane = 'backlog';
  select max(page) into p from walk2;
  select count(distinct page) into m from walk2 where lane = 'backlog';
  if p < 6 then raise exception 'D2 FAIL: thin-news walk ended at page %', p; end if;
  if n = 0 then raise exception 'D2 FAIL: the backlog was never reached'; end if;
  if m < 3 then raise exception 'D2 FAIL: backlog appeared on only % page(s)', m; end if;
  if not exists (select 1 from walk2 where lane = 'backlog' and page >= 6) then
    raise exception 'D2 FAIL: the backlog stopped arriving before page 6';
  end if;
  raise notice 'PASS thin-news walk reached page % with % backlog cards on % pages', p, n, m;
end $$;

-- 12. NO DUPLICATES in the thin-news walk either: the second lane has its own
--     boundary, so a turned-away backlog card is never skipped.
do $$
declare n int;
begin
  select count(*) into n from (select id from walk2 group by id having count(*) > 1) d;
  if n > 0 then raise exception 'D2 FAIL: % duplicated ids in the thin-news walk', n; end if;
  select count(*) into n from walk2 w where w.pos = 1 and w.lane = 'backlog'
    and exists (select 1 from walk2 x where x.page = w.page and x.lane = 'news');
  if n > 0 then raise exception 'D2 FAIL: backlog led % thin-news page(s) with news', n; end if;
  raise notice 'PASS thin-news walk has no duplicates and no backlog lead';
end $$;

select page, count(*) rows, count(*) filter (where lane = 'backlog') backlog
from walk group by page order by page;
select page, count(*) rows, count(*) filter (where lane = 'backlog') backlog
from walk2 group by page order by page;
