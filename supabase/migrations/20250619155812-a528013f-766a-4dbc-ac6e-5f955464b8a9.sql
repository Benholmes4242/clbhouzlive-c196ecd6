
-- Fix the USA ranking order by updating courses 44-58 to their correct positions
-- First, let's move the misplaced courses to their correct USA rankings

-- Update Baltusrol Golf Club (Lower) to USA rank 44
UPDATE public.golf_courses 
SET usa_rank = 44 
WHERE name = 'Baltusrol Golf Club (Lower)' AND country = 'United States';

-- Update Kiawah Island Golf Resort (Ocean) to USA rank 45
UPDATE public.golf_courses 
SET usa_rank = 45 
WHERE name = 'Kiawah Island Golf Resort (Ocean)' AND country = 'United States';

-- Update The Country Club (Clyde & Squirrel) to USA rank 46
UPDATE public.golf_courses 
SET usa_rank = 46 
WHERE name = 'The Country Club (Clyde & Squirrel)' AND country = 'United States';

-- Update Old Barnwell to USA rank 47
UPDATE public.golf_courses 
SET usa_rank = 47 
WHERE name = 'Old Barnwell' AND country = 'United States';

-- Update Old Sandwich Golf Club to USA rank 48
UPDATE public.golf_courses 
SET usa_rank = 48 
WHERE name = 'Old Sandwich Golf Club' AND country = 'United States';

-- Update Essex County Club to USA rank 49
UPDATE public.golf_courses 
SET usa_rank = 49 
WHERE name = 'Essex County Club' AND country = 'United States';

-- Update Winged Foot Golf Club (East) to USA rank 50
UPDATE public.golf_courses 
SET usa_rank = 50 
WHERE name = 'Winged Foot Golf Club (East)' AND country = 'United States';

-- Update Yeamans Hall Club to USA rank 51
UPDATE public.golf_courses 
SET usa_rank = 51 
WHERE name = 'Yeamans Hall Club' AND country = 'United States';

-- Update Wade Hampton Golf Club to USA rank 52
UPDATE public.golf_courses 
SET usa_rank = 52 
WHERE name = 'Wade Hampton Golf Club' AND country = 'United States';

-- Update Southern Hills Country Club (Championship) to USA rank 53
UPDATE public.golf_courses 
SET usa_rank = 53 
WHERE name = 'Southern Hills Country Club (Championship)' AND country = 'United States';

-- Update Ohoopee Match Club to USA rank 54
UPDATE public.golf_courses 
SET usa_rank = 54 
WHERE name = 'Ohoopee Match Club' AND country = 'United States';

-- Update The Golf Club to USA rank 55
UPDATE public.golf_courses 
SET usa_rank = 55 
WHERE name = 'The Golf Club' AND country = 'United States';

-- Update Quaker Ridge Golf Club to USA rank 56
UPDATE public.golf_courses 
SET usa_rank = 56 
WHERE name = 'Quaker Ridge Golf Club' AND country = 'United States';

-- Update Piping Rock Club to USA rank 57
UPDATE public.golf_courses 
SET usa_rank = 57 
WHERE name = 'Piping Rock Club' AND country = 'United States';

-- Update Gozzer Ranch Golf & Lake Club to USA rank 58
UPDATE public.golf_courses 
SET usa_rank = 58 
WHERE name = 'Gozzer Ranch Golf & Lake Club' AND country = 'United States';
