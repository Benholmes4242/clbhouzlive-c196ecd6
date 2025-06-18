
-- Complete the GB&I regional rankings for all UK/Ireland courses in positions 31-100
-- These courses should continue the GB&I regional ranking sequence

-- Add the remaining GB&I courses in their proper regional ranking order
UPDATE public.golf_courses SET regional_rank = 31 WHERE name = 'Royal Lytham & St Annes Golf Club' AND country = 'United Kingdom' AND global_rank = 61;
UPDATE public.golf_courses SET regional_rank = 32 WHERE name = 'Royal Porthcawl Golf Club' AND country = 'United Kingdom' AND global_rank = 65;
UPDATE public.golf_courses SET regional_rank = 33 WHERE name = 'Cruden Bay Golf Club (Championship)' AND country = 'United Kingdom' AND global_rank = 70;
UPDATE public.golf_courses SET regional_rank = 34 WHERE name = 'Ganton Golf Club' AND country = 'United Kingdom' AND global_rank = 72;
UPDATE public.golf_courses SET regional_rank = 35 WHERE name = 'Portmarnock Golf Club (Championship)' AND country = 'Ireland' AND global_rank = 74;
UPDATE public.golf_courses SET regional_rank = 36 WHERE name = 'Trump International Golf Links Scotland - Old Course' AND country = 'United Kingdom' AND global_rank = 77;
UPDATE public.golf_courses SET regional_rank = 37 WHERE name = 'Royal Birkdale Golf Club' AND country = 'United Kingdom' AND global_rank = 82;
UPDATE public.golf_courses SET regional_rank = 38 WHERE name = 'St George''s Hill Golf Club (Red & Blue)' AND country = 'United Kingdom' AND global_rank = 85;
UPDATE public.golf_courses SET regional_rank = 39 WHERE name = 'Royal Aberdeen Golf Club (Balgownie)' AND country = 'United Kingdom' AND global_rank = 88;
UPDATE public.golf_courses SET regional_rank = 40 WHERE name = 'Royal Cinque Ports Golf Club' AND country = 'United Kingdom' AND global_rank = 90;
UPDATE public.golf_courses SET regional_rank = 41 WHERE name = 'Prestwick Golf Club' AND country = 'United Kingdom' AND global_rank = 93;

-- Fix the incorrectly assigned rankings from the previous migration
-- Reset rankings 20-30 that were incorrectly assigned to courses 61-100
UPDATE public.golf_courses SET regional_rank = 20 WHERE name = 'Royal Lytham & St Annes Golf Club' AND country = 'United Kingdom' AND global_rank = 61;
UPDATE public.golf_courses SET regional_rank = 21 WHERE name = 'Royal Porthcawl Golf Club' AND country = 'United Kingdom' AND global_rank = 65;
UPDATE public.golf_courses SET regional_rank = 22 WHERE name = 'Cruden Bay Golf Club (Championship)' AND country = 'United Kingdom' AND global_rank = 70;
UPDATE public.golf_courses SET regional_rank = 23 WHERE name = 'Ganton Golf Club' AND country = 'United Kingdom' AND global_rank = 72;
UPDATE public.golf_courses SET regional_rank = 24 WHERE name = 'Portmarnock Golf Club (Championship)' AND country = 'Ireland' AND global_rank = 74;
UPDATE public.golf_courses SET regional_rank = 25 WHERE name = 'Trump International Golf Links Scotland - Old Course' AND country = 'United Kingdom' AND global_rank = 77;
UPDATE public.golf_courses SET regional_rank = 26 WHERE name = 'Royal Birkdale Golf Club' AND country = 'United Kingdom' AND global_rank = 82;
UPDATE public.golf_courses SET regional_rank = 27 WHERE name = 'St George''s Hill Golf Club (Red & Blue)' AND country = 'United Kingdom' AND global_rank = 85;
UPDATE public.golf_courses SET regional_rank = 28 WHERE name = 'Royal Aberdeen Golf Club (Balgownie)' AND country = 'United Kingdom' AND global_rank = 88;
UPDATE public.golf_courses SET regional_rank = 29 WHERE name = 'Royal Cinque Ports Golf Club' AND country = 'United Kingdom' AND global_rank = 90;
UPDATE public.golf_courses SET regional_rank = 30 WHERE name = 'Prestwick Golf Club' AND country = 'United Kingdom' AND global_rank = 93;
