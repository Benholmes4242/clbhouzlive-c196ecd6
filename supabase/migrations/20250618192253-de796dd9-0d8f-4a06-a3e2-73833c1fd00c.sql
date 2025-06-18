
-- Fix Prestwick Golf Club ranking from 31 to 30
UPDATE public.golf_courses 
SET regional_rank = 30 
WHERE name = 'Prestwick Golf Club' AND country = 'United Kingdom';

-- Since Prestwick should be rank 30, we need to shift West Sussex Golf Club and others down by 1
-- Update West Sussex Golf Club from 31 to 32
UPDATE public.golf_courses 
SET regional_rank = 32 
WHERE name = 'West Sussex Golf Club' AND country = 'United Kingdom';

-- Update all other courses from rank 32-60 to be shifted down by 1
UPDATE public.golf_courses 
SET regional_rank = regional_rank + 1 
WHERE regional_rank >= 32 AND regional_rank <= 60 
AND country IN ('United Kingdom', 'Ireland')
AND name != 'West Sussex Golf Club';
