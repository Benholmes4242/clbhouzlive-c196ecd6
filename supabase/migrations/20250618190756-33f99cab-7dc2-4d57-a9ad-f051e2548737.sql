
-- Fix the GB&I regional rankings to be in proper 1-100 order based on global rankings
-- Reset all regional rankings first for GB&I courses
UPDATE public.golf_courses 
SET regional_rank = NULL 
WHERE country IN ('United Kingdom', 'Ireland');

-- Now set the correct regional rankings based on global ranking order
-- Course #3 globally should be #1 in GB&I, etc.
UPDATE public.golf_courses SET regional_rank = 1 WHERE name = 'Royal County Down (Championship)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 2 WHERE name = 'St Andrews Links (Old)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 3 WHERE name = 'Royal Portrush Golf Club (Dunluce)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 4 WHERE name = 'Muirfield - Honourable Company of Edinburgh Golfers' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 5 WHERE name = 'Trump Turnberry Resort - Ailsa' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 6 WHERE name = 'Royal Dornoch Golf Club (Championship)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 7 WHERE name = 'Royal St George''s Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 8 WHERE name = 'Sunningdale Golf Club (Old)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 9 WHERE name = 'Ballybunion Golf Club (Old)' AND country = 'Ireland';
UPDATE public.golf_courses SET regional_rank = 10 WHERE name = 'Lahinch Golf Club (Old)' AND country = 'Ireland';
UPDATE public.golf_courses SET regional_rank = 11 WHERE name = 'Carnoustie Golf Links (Championship)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 12 WHERE name = 'Rosapenna Golf Resort - St Patrick''s Links' AND country = 'Ireland';
UPDATE public.golf_courses SET regional_rank = 13 WHERE name = 'Sunningdale Golf Club (New)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 14 WHERE name = 'North Berwick Golf Club (West Links)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 15 WHERE name = 'Kingsbarns Golf Links' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 16 WHERE name = 'Ardfin' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 17 WHERE name = 'St Enodoc Golf Club (Church)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 18 WHERE name = 'Swinley Forest Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 19 WHERE name = 'Cabot Highlands (Castle Stuart)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 20 WHERE name = 'Royal Lytham & St Annes Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 21 WHERE name = 'Royal Porthcawl Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 22 WHERE name = 'Cruden Bay Golf Club (Championship)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 23 WHERE name = 'Ganton Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 24 WHERE name = 'Portmarnock Golf Club (Championship)' AND country = 'Ireland';
UPDATE public.golf_courses SET regional_rank = 25 WHERE name = 'Trump International Golf Links Scotland - Old Course' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 26 WHERE name = 'Royal Birkdale Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 27 WHERE name = 'St George''s Hill Golf Club (Red & Blue)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 28 WHERE name = 'Royal Aberdeen Golf Club (Balgownie)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 29 WHERE name = 'Royal Cinque Ports Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET regional_rank = 30 WHERE name = 'Prestwick Golf Club' AND country = 'United Kingdom';
