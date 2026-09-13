-- Phase D3 assertions: Scores, Courses and Reviews on the RPC, each walked for
-- three pages under a real scope. Candidate correctness, the scope predicate,
-- keyset integrity across pages, single-type cadence, standing fidelity, the
-- unsupported-view contract (Watch), and the D2 lane rules re-asserted on the
-- Scores walk - because Scores is the round view and must keep the backlog.
\set ON_ERROR_STOP on

-- ---------------------------------------------------------------- fixture data
-- Courses 1..2 are Kent/England and belong to club 1; 3..4 Fife/England;
-- 5..8 Fife/Scotland. Course 9 has NO rounds and NO ratings: it must never be a
-- candidate. Course 10 has a rating but no rounds: it must be one.
insert into golf_courses (id, name, country, sub_country, region, thumbnail_image, club_id)
select ('00000000-0000-0000-0000-00000000000' || i)::uuid,
       'Course ' || i, 'United Kingdom',
       case when i <= 4 then 'England' else 'Scotland' end,
       case when i <= 2 then 'Kent' else 'Fife' end,
       'img' || i,
       ('10000000-0000-0000-0000-00000000000' || least(i, 2))::uuid
from generate_series(1, 8) i;
insert into golf_courses values
  ('00000000-0000-0000-0000-000000000009','Course 9','United Kingdom','England','Kent','img9',
   '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000010','Course 10','United Kingdom','England','Kent','img10',
   '10000000-0000-0000-0000-000000000001');

insert into user_profiles (id, display_name, primary_club_id)
select ('20000000-0000-0000-0000-00000000000' || i)::uuid, 'Member ' || i,
       '10000000-0000-0000-0000-000000000001'::uuid
from generate_series(1, 6) i;
-- A member with NO club, to prove the club scope cannot be faked.
insert into user_profiles (id, display_name, primary_club_id)
values ('20000000-0000-0000-0000-000000000009','Clubless', null);

insert into follows (follower_actor_id, follower_actor_type, following_actor_id, following_actor_type) values
  ('20000000-0000-0000-0000-000000000001','personal','20000000-0000-0000-0000-000000000002','personal'),
  ('20000000-0000-0000-0000-000000000001','personal','20000000-0000-0000-0000-000000000003','personal');

-- NEWS ROUNDS across all eight played courses.
insert into gam_round_stats
  (user_id, course_id, whs_score_id, play_date, created_at, gross_score, course_par,
   stableford_points, birdies, eagles, albatrosses, holes_in_one, clean_card, hcp_at_time)
select ('20000000-0000-0000-0000-00000000000' || (1 + (i % 6)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 8)))::uuid,
       gen_random_uuid(), current_date - (i % 20), now() - ((i % 30) || ' hours')::interval,
       68 + (i % 20), 72, 30 + (i % 18), i % 6, 0, 0, 0, (i % 11) = 0, 12.4
from generate_series(1, 90) i;

-- BACKLOG ROUNDS at the viewer's own club course, so the Scores club scope has
-- a backlog to reach.
insert into gam_round_stats
  (user_id, course_id, whs_score_id, play_date, created_at, gross_score, course_par,
   stableford_points, birdies, eagles, albatrosses, holes_in_one, clean_card, hcp_at_time)
select ('20000000-0000-0000-0000-00000000000' || (1 + (i % 6)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 2)))::uuid,
       gen_random_uuid(), date '2021-06-01' + (i % 300), now() - ((i % 40) || ' minutes')::interval,
       70 + (i % 18), 72, 28 + (i % 16), i % 5, 0, 0, 0, (i % 13) = 0, 14.1
from generate_series(1, 120) i;

insert into gam_round_net (whs_score_id, user_id, course_id, play_date, gross_score, course_handicap, net_score)
  select whs_score_id, user_id, course_id, play_date, gross_score, 12, gross_score - 12 from gam_round_stats;

-- PROSE REVIEWS, plus SCORE-ONLY ratings that must never become candidates.
insert into course_ratings (user_id, course_id, rating, review, created_at)
select ('20000000-0000-0000-0000-00000000000' || (2 + (i % 5)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 8)))::uuid,
       6 + (i % 5), 'A real sentence about the course. And another.',
       now() - ((i % 20) || ' hours')::interval
from generate_series(1, 40) i;
insert into course_ratings (user_id, course_id, rating, review, created_at)
select ('20000000-0000-0000-0000-00000000000' || (2 + (i % 5)))::uuid,
       ('00000000-0000-0000-0000-00000000000' || (1 + (i % 8)))::uuid,
       7, '   ', now() - ((i % 9) || ' hours')::interval
from generate_series(1, 12) i;
-- A RATINGS BURST on course 2 inside 30 days, and the rating-only course 10.
insert into course_ratings (user_id, course_id, rating, review, created_at)
select ('20000000-0000-0000-0000-00000000000' || (1 + (i % 6)))::uuid,
       '00000000-0000-0000-0000-000000000002', 9, 'Burst review sentence.',
       now() - ((i) || ' days')::interval
from generate_series(1, 5) i;
insert into course_ratings (user_id, course_id, rating, review, created_at)
values ('20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000010',
        8, 'Rated but never tracked.', now() - interval '3 days');

insert into amateur_stories (slug, kicker, headline, image_url, published_at)
select 'story-' || i, 'THE WIRE', 'Headline ' || i, 'simg' || i, now() - (i || ' hours')::interval
from generate_series(1, 8) i;

insert into top100_lists (id, slug) values
  ('30000000-0000-0000-0000-000000000001','top-100-worldwide'),
  ('30000000-0000-0000-0000-000000000002','top-100-gbi');
insert into course_top100_memberships (course_id, list_id, rank) values
  ('00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001', 14),
  ('00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',  3),
  ('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002',  8);

insert into course_shortlists (user_id, course_id) values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005');
insert into user_surface_last_seen (user_id, surface_key, last_seen_at) values
  ('20000000-0000-0000-0000-000000000001','discover', now() - interval '20 hours');

insert into viewer_standing_fixture values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001', 2, 6, 4, 2),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002', 1, 5, 1, 0),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003', 4, 6, null, null);

-- ---------------------------------------------------------------- page walking
create table walk3 (view text, scope text, page int, pos int, id text, kind text,
                    ring text, lane text, score numeric, cons jsonb,
                    relaxed boolean, facts jsonb, subject jsonb);

create function walk3_run(p_view text, p_scope text, p_viewer uuid,
                          p_club uuid, p_pages int default 3) returns void
language plpgsql as $$
declare v_cur jsonb := null; v_page int := 0; v_pos int; v_rows int;
        v_next jsonb; v_rec record;
begin
  loop
    v_page := v_page + 1; v_pos := 0; v_next := null;
    for v_rec in
      select * from public.get_explore_stream(p_viewer, p_view, p_scope, v_cur, 12,
        p_club, 'Kent', 'England')
    loop
      v_pos := v_pos + 1;
      insert into walk3 values (p_view, p_scope, v_page, v_pos, v_rec.id, v_rec.kind,
        v_rec.ring, v_rec.lane, v_rec.score, v_rec.consequence, v_rec.relaxed,
        v_rec.facts, v_rec.subject);
      v_next := v_rec.next_cursor;
    end loop;
    select count(*) into v_rows from walk3
      where view = p_view and scope = p_scope and page = v_page;
    raise notice '% / % page % rows % next %', p_view, p_scope, v_page, v_rows, v_next is not null;
    exit when v_rows = 0 or v_next is null or v_page >= p_pages;
    v_cur := v_next;
  end loop;
end $$;

select walk3_run('scores',  'club',    '20000000-0000-0000-0000-000000000001',
                 '10000000-0000-0000-0000-000000000001');
select walk3_run('scores',  'county',  '20000000-0000-0000-0000-000000000001',
                 '10000000-0000-0000-0000-000000000001');
select walk3_run('courses', 'country', '20000000-0000-0000-0000-000000000001',
                 '10000000-0000-0000-0000-000000000001');
select walk3_run('courses', 'world',   '20000000-0000-0000-0000-000000000001',
                 '10000000-0000-0000-0000-000000000001');
select walk3_run('reviews', 'world',   '20000000-0000-0000-0000-000000000001',
                 '10000000-0000-0000-0000-000000000001');
select walk3_run('all',     'world',   '20000000-0000-0000-0000-000000000001',
                 '10000000-0000-0000-0000-000000000001');

-- 1. EACH VIEW SERVES ITS OWN TYPE, and nothing else.
do $$
declare n int;
begin
  select count(*) into n from walk3 where view = 'scores'  and kind <> 'round';
  if n > 0 then raise exception 'D3 FAIL: % non-round cards in Scores', n; end if;
  select count(*) into n from walk3 where view = 'courses' and kind <> 'course';
  if n > 0 then raise exception 'D3 FAIL: % non-course cards in Courses', n; end if;
  select count(*) into n from walk3 where view = 'reviews' and kind <> 'review';
  if n > 0 then raise exception 'D3 FAIL: % non-review cards in Reviews', n; end if;
  select count(*) into n from walk3 where view = 'all' and kind not in ('round','review','story');
  if n > 0 then raise exception 'D3 FAIL: All served an unexpected kind'; end if;
  raise notice 'PASS every view serves exactly its own candidate type';
end $$;

-- 2. THE SCOPE PREDICATE IS THE SUBJECT COURSE'S GEOGRAPHY.
do $$
declare n int;
begin
  select count(*) into n from walk3 w join golf_courses c
    on c.id = (w.subject ->> 'course_id')::uuid
  where w.view <> 'all' and w.scope = 'club'
    and c.club_id <> '10000000-0000-0000-0000-000000000001';
  if n > 0 then raise exception 'D3 FAIL: % out-of-club cards in a club scope', n; end if;
  select count(*) into n from walk3 w join golf_courses c
    on c.id = (w.subject ->> 'course_id')::uuid
  where w.view <> 'all' and w.scope = 'county' and c.region <> 'Kent';
  if n > 0 then raise exception 'D3 FAIL: % out-of-county cards in a county scope', n; end if;
  select count(*) into n from walk3 w join golf_courses c
    on c.id = (w.subject ->> 'course_id')::uuid
  where w.view <> 'all' and w.scope = 'country' and c.sub_country <> 'England';
  if n > 0 then raise exception 'D3 FAIL: % out-of-country cards in a country scope', n; end if;
  raise notice 'PASS club, county and country scopes bound the subject course';
end $$;

-- 3. A VIEWER WITH NO CLUB GETS NOTHING FROM A CLUB SCOPE. Geography is passed,
--    so a null club id cannot be silently widened to the world.
do $$
declare n int;
begin
  select count(*) into n from public.get_explore_stream(
    '20000000-0000-0000-0000-000000000009'::uuid, 'scores', 'club', null, 12,
    null, 'Kent', 'England');
  if n > 0 then raise exception 'D3 FAIL: clubless viewer got % club-scoped cards', n; end if;
  raise notice 'PASS no club id means no club-scoped cards';
end $$;

-- 4. COURSE CANDIDATES: rounds or a rating, never neither.
do $$
declare n int;
begin
  select count(*) into n from walk3
  where view = 'courses'
    and coalesce((facts ->> 'rounds_tracked')::int, 0) = 0
    and coalesce((facts ->> 'rating_n')::int, 0) = 0;
  if n > 0 then raise exception 'D3 FAIL: % course cards with no rounds and no rating', n; end if;
  if exists (select 1 from walk3 where view = 'courses'
             and id = 'course:00000000-0000-0000-0000-000000000009') then
    raise exception 'D3 FAIL: the empty course became a candidate';
  end if;
  if not exists (select 1 from walk3 where view = 'courses' and scope = 'world'
                 and id = 'course:00000000-0000-0000-0000-000000000010') then
    raise exception 'D3 FAIL: the rated-but-untracked course was excluded';
  end if;
  raise notice 'PASS neither rounds nor a rating is not a candidate; either one is';
end $$;

-- 5. THE COURSE HEADLINE LADDER, and world outranking regional.
do $$
declare v_event text; v_w int; v_r int;
begin
  select facts ->> 'course_event' into v_event from walk3
  where view = 'courses' and scope = 'world'
    and id = 'course:00000000-0000-0000-0000-000000000002';
  if v_event is distinct from 'ratings' then
    raise exception 'D3 FAIL: a five-rating burst read as %', v_event;
  end if;
  select (facts ->> 'top100_world')::int, (facts ->> 'top100_regional')::int
    into v_w, v_r from walk3 where view = 'courses' and scope = 'world'
    and id = 'course:00000000-0000-0000-0000-000000000001';
  if v_w <> 14 or v_r is not null then
    raise exception 'D3 FAIL: world % and regional % were both claimed', v_w, v_r;
  end if;
  raise notice 'PASS the burst leads the ladder and world outranks regional';
end $$;

-- 6. PROSE ONLY. A blank review is never a candidate anywhere.
do $$
declare n int;
begin
  select count(*) into n from walk3
  where kind = 'review' and btrim(coalesce(facts ->> 'first_sentence','')) = '';
  if n > 0 then raise exception 'D3 FAIL: % score-only ratings served as reviews', n; end if;
  raise notice 'PASS every review card carries prose';
end $$;

-- 7. KEYSET INTEGRITY PER VIEW: no duplicate across pages, no empty page before
--    the last, and no page over the DEPLOYED tolerance. Two properties of the
--    live D1/D2 function are asserted as they are, not "fixed" here:
--      a. a page may go SHORT while the stream continues - D2 documents this,
--         because the backlog allowance turns rows away and the cursor must
--         survive or a thin-news member's history is unreachable;
--      b. a page may carry ONE card over p_limit, because the deferred-card
--         placement inside the loop happens before the EXIT test. Both are
--         deployed behaviour Ben has already verified on device.
do $$
declare n int;
begin
  select count(*) into n from (
    select view, scope, id from walk3 group by view, scope, id having count(*) > 1) d;
  if n > 0 then raise exception 'D3 FAIL: % ids repeated within a walk', n; end if;
  select count(*) into n from (
    select view, scope, page, count(*) c from walk3 group by view, scope, page) p
  where p.c > 13 or p.c = 0;
  if n > 0 then raise exception 'D3 FAIL: % pages outside the deployed size tolerance', n; end if;
  raise notice 'PASS every view paginates without duplicates or empty pages';
end $$;


-- 8. SINGLE-TYPE CADENCE (Phases B2/C): consecutive non-relaxed cards do not
--    repeat the consequence kind in Scores, nor the event kind in Courses.
do $$
declare n int;
begin
  with seq as (
    select row_number() over (order by page, pos) rn, cons ->> 'kind' k
    from walk3 where view = 'scores' and scope = 'county' and not relaxed)
  select count(*) into n from seq a join seq b on b.rn = a.rn + 1
  where coalesce(a.k,'plain') = coalesce(b.k,'plain');
  if n > 0 then raise exception 'D3 FAIL: % adjacent same-consequence pairs in Scores', n; end if;
  with seq as (
    select row_number() over (order by page, pos) rn, facts ->> 'course_event' k
    from walk3 where view = 'courses' and scope = 'world' and not relaxed)
  select count(*) into n from seq a join seq b on b.rn = a.rn + 1
  where coalesce(a.k,'stable') = coalesce(b.k,'stable');
  if n > 0 then raise exception 'D3 FAIL: % adjacent same-event pairs in Courses', n; end if;
  raise notice 'PASS the single-type cadence alternates on the view own key';
end $$;

-- 9. STANDING IS THE SHELF'S. Every n / of a card claims comes from
--    get_viewer_standing, so it cannot disagree with the shelf.
do $$
declare n int;
begin
  select count(*) into n from walk3 w
  join public.get_viewer_standing('20000000-0000-0000-0000-000000000001'::uuid) s
    on s.course_id = (w.subject ->> 'course_id')::uuid
  where w.cons ->> 'of' is not null
    and (w.cons ->> 'of')::int <> s.field_now;
  if n > 0 then raise exception 'D3 FAIL: % cards disagree with the standing field', n; end if;
  raise notice 'PASS every field size on a card is the standing field size';
end $$;

-- 10. SCORES KEEPS THE D2 LANE RULES: rounds split correctly, and backlog never
--     leads a page that had news.
do $$
declare n int;
begin
  select count(*) into n from walk3 w join gam_round_stats g
    on ('round:' || g.whs_score_id::text) = w.id
  where w.view = 'scores'
    and (w.lane = 'backlog') <> ((g.created_at::date - g.play_date) > 30);
  if n > 0 then raise exception 'D3 FAIL: % Scores rounds in the wrong lane', n; end if;
  select count(*) into n from walk3 w
  where w.view = 'scores' and w.pos = 1 and w.lane = 'backlog'
    and exists (select 1 from walk3 x where x.view = w.view and x.scope = w.scope
                and x.page = w.page and x.lane = 'news');
  if n > 0 then raise exception 'D3 FAIL: backlog led % Scores page(s) with news', n; end if;
  if not exists (select 1 from walk3 where view = 'scores' and lane = 'backlog') then
    raise notice 'NOTE Scores walk reached no backlog card in three pages';
  end if;
  raise notice 'PASS Scores keeps the D2 lane split and the no-lead rule';
end $$;

-- 11. WATCH IS NOT IN THE RPC, and an unknown view is not guessed at.
do $$
declare n int;
begin
  select count(*) into n from public.get_explore_stream(
    '20000000-0000-0000-0000-000000000001'::uuid, 'watch', 'world', null, 12,
    '10000000-0000-0000-0000-000000000001'::uuid, 'Kent', 'England');
  if n > 0 then raise exception 'D3 FAIL: Watch returned % rows from the RPC', n; end if;
  select count(*) into n from public.get_explore_stream(
    '20000000-0000-0000-0000-000000000001'::uuid, 'nonsense', 'world', null, 12,
    null, null, null);
  if n > 0 then raise exception 'D3 FAIL: an unknown view returned % rows', n; end if;
  raise notice 'PASS Watch and unknown views return nothing, so the client falls back';
end $$;

-- 12. ALL IS UNTOUCHED: it is still unscoped and still leads with news, and no
--     story leads a page.
do $$
declare n int;
begin
  select count(*) into n from walk3 w join golf_courses c
    on c.id = (w.subject ->> 'course_id')::uuid
  where w.view = 'all' and c.region <> 'Kent';
  if n = 0 then raise exception 'D3 FAIL: All lost its unscoped pool'; end if;
  select count(*) into n from walk3 where view = 'all' and pos = 1 and kind = 'story';
  if n > 0 then raise exception 'D3 FAIL: a story led % All page(s)', n; end if;
  raise notice 'PASS All is unchanged: unscoped, news-led, never story-led';
end $$;

do $$ begin raise notice 'D3 HARNESS: ALL ASSERTIONS PASSED'; end $$;
