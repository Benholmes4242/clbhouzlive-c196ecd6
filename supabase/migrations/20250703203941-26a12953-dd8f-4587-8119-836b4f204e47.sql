-- Update the check constraint on the logos table to include the new app logo categories
ALTER TABLE public.logos 
DROP CONSTRAINT IF EXISTS logos_category_check;

-- Add the updated constraint with the new app logo categories
ALTER TABLE public.logos 
ADD CONSTRAINT logos_category_check 
CHECK (category IN (
  'app_logo_light',
  'app_logo_dark', 
  'handicap_bodies',
  'golf_courses',
  'universities',
  'golf_tours'
));