INSERT INTO public.sr_course_map (sr_venue_name, sr_city, sr_country, golf_course_id, confidence, source)
VALUES ('Golfclub Kitzbuhel-Schwarzsee-Reith', 'Kitzbuhel', 'AUT', '5dec247e-10d2-43e1-b0ed-74644b2bb7d9', 1.0, 'manual')
ON CONFLICT DO NOTHING;