-- Add mini card crop fields and websites array to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS mini_card_crop_x numeric,
ADD COLUMN IF NOT EXISTS mini_card_crop_y numeric,
ADD COLUMN IF NOT EXISTS mini_card_crop_width numeric,
ADD COLUMN IF NOT EXISTS mini_card_crop_height numeric,
ADD COLUMN IF NOT EXISTS websites text[];