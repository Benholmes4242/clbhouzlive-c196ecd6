-- D6 assertions: the ARRIVAL-KEYED lane. Runs after
-- tests/sql/explore_stream_d3_assert.sql (same cluster, same fixture data), so
-- everything D1-D5 asserts has already passed on this body.
--
-- Two properties the re-key exists for, and one the D3 walk cannot show because
-- news never runs out in three pages:
--   1. an OLD round that ARRIVED inside the window is news;
--   2. a round that arrived long ago is backlog whatever its play date;
--   3. with news cut to a handful, the backlog is still ARRIVING deep into the
--      walk - the lane is reachable, not decorative.
\set ON_ERROR_STOP on

-- An old round, synced this morning. Under the old gap rule this is a backfill
-- (a five-year gap); under arrival recency it is today's news, which is the
-- whole correction.
insert into gam_round_stats
  (user_id, course_id, whs_score_id, play_date, created_at, gross_score, course_par,
   stableford_points, birdies, eagles, albatrosses, holes_in_one, clean_card, hcp_at_time)
values ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',
        '88888888-8888-8888-8888-888888888888', date '2019-05-04',
        now() - interval '2 hours', 74, 72, 33, 2, 0, 0, 0, false, 11.0);
insert into gam_round_net (whs_score_id, user_id, course_id, play_date, gross_score,
                           course_handicap, net_score)
values ('88888888-8888-8888-8888-888888888888',
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001', date '2019-05-04', 74, 12, 62);

-- Cut the news lane down: keep only the rounds that arrived in the last 30 days
-- if they are among the newest twelve, plus the 2019 round above.
delete from gam_round_stats
where created_at >= now() - interval '30 days'
  and whs_score_id <> '88888888-8888-8888-8888-888888888888'
  and ctid not in (select ctid from gam_round_stats
                   where created_at >= now() - interval '30 days'
                   order by created_at desc limit 12);
delete from course_ratings where ctid not in (select ctid from course_ratings limit 3);

create table walk6 (page int, pos int, id text, kind text, lane text);

do $$
declare v_cur jsonb := null; v_page int := 0; v_pos int; v_rows int;
        v_next jsonb; v_rec record; v_bl int;
begin
  loop
    v_page := v_page + 1; v_pos := 0; v_next := null;
    for v_rec in
      select * from public.get_explore_stream(
        '20000000-0000-0000-0000-000000000001'::uuid, 'scores', 'world', v_cur, 12,
        null, null, null)
    loop
      v_pos := v_pos + 1;
      insert into walk6 values (v_page, v_pos, v_rec.id, v_rec.kind, v_rec.lane);
      v_next := v_rec.next_cursor;
    end loop;
    select count(*), count(*) filter (where lane = 'backlog') into v_rows, v_bl
      from walk6 where page = v_page;
    raise notice 'D6 thin page % rows % backlog %', v_page, v_rows, v_bl;
    exit when v_rows = 0 or v_next is null or v_page >= 8;
    v_cur := v_next;
  end loop;
end $$;

-- 1. THE OLD ROUND THAT ARRIVED TODAY IS NEWS.
do $$
declare v_lane text;
begin
  select lane into v_lane from walk6
   where id = 'round:88888888-8888-8888-8888-888888888888';
  if v_lane is null then
    raise exception 'D6 FAIL: the newly arrived 2019 round was never served';
  end if;
  if v_lane <> 'news' then
    raise exception 'D6 FAIL: a round that arrived today was placed in the % lane', v_lane;
  end if;
  raise notice 'PASS a 2019 round that arrived today is news';
end $$;

-- 2. EVERY BACKLOG CARD ARRIVED OUTSIDE THE WINDOW, and every news card did not.
do $$
declare n int;
begin
  select count(*) into n from walk6 w join gam_round_stats g
    on ('round:' || g.whs_score_id::text) = w.id
  where (w.lane = 'backlog') <> (g.created_at <
    now() - ((select max(value) from public.explore_config where key = 'news_days')
             || ' days')::interval);
  if n > 0 then raise exception 'D6 FAIL: % rounds in the wrong arrival lane', n; end if;
  raise notice 'PASS the lane is arrival age, on every card served';
end $$;

-- 3. THE BACKLOG IS REACHABLE AND KEEPS ARRIVING, and never leads a page that
--    placed news, and no card is served twice.
do $$
declare v_pages int; v_cards int; n int;
begin
  select count(distinct page), count(*) into v_pages, v_cards
    from walk6 where lane = 'backlog';
  if v_cards = 0 then
    raise exception 'D6 FAIL: thin news and the backlog was never reached';
  end if;
  if (select max(page) from walk6) < 6 then
    raise exception 'D6 FAIL: the walk stopped at page %, so depth is not bottomless',
      (select max(page) from walk6);
  end if;
  select count(*) into n from walk6 w
   where w.pos = 1 and w.lane = 'backlog'
     and exists (select 1 from walk6 x where x.page = w.page and x.lane = 'news');
  if n > 0 then raise exception 'D6 FAIL: backlog led % page(s) that placed news', n; end if;
  select count(*) into n from (select id from walk6 group by id having count(*) > 1) d;
  if n > 0 then raise exception 'D6 FAIL: % cards served twice', n; end if;
  raise notice 'PASS backlog reached page %, % cards on % pages, no lead and no repeats',
    (select max(page) from walk6 where lane = 'backlog'), v_cards, v_pages;
end $$;

do $$ begin raise notice 'D6 HARNESS: ALL ASSERTIONS PASSED'; end $$;
