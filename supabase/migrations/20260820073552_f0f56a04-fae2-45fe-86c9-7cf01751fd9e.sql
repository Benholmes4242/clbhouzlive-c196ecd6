insert into public.sr_course_map (sr_venue_name, sr_venue_course_name, sr_city, sr_country, golf_course_id, confidence, source)
values ('Trump International Golf Links (Scotland)', 'Trump International Golf Links', 'Aberdeen', 'Scotland', '25d5a765-2799-4234-95d9-3eac5828beff', 1.00, 'manual')
on conflict do nothing;

update public.sr_tournaments
set golf_course_id = '25d5a765-2799-4234-95d9-3eac5828beff'
where venue_name = 'Trump International Golf Links (Scotland)';