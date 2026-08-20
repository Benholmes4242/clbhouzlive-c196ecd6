insert into public.sr_course_map (sr_venue_name, sr_venue_course_name, sr_city, sr_country, golf_course_id, confidence, source)
values ('Royal Mayfair Golf Club', 'Royal Mayfair Golf Club', 'Edmonton', 'Canada', '9c667d23-1088-4910-9f9d-9e4fe311ffe4', 1.00, 'manual')
on conflict do nothing;

update public.sr_tournaments
set golf_course_id = '9c667d23-1088-4910-9f9d-9e4fe311ffe4'
where venue_name = 'Royal Mayfair Golf Club';