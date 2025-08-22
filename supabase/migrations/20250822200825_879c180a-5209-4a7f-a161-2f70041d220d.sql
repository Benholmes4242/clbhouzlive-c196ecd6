-- Add mobile crop fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN mobile_crop_x NUMERIC(5,2) CHECK (mobile_crop_x >= 0 AND mobile_crop_x <= 100),
ADD COLUMN mobile_crop_y NUMERIC(5,2) CHECK (mobile_crop_y >= 0 AND mobile_crop_y <= 100), 
ADD COLUMN mobile_crop_width NUMERIC(5,2) CHECK (mobile_crop_width > 0 AND mobile_crop_width <= 100),
ADD COLUMN mobile_crop_height NUMERIC(5,2) CHECK (mobile_crop_height > 0 AND mobile_crop_height <= 100),
ADD COLUMN desktop_crop_x NUMERIC(5,2) CHECK (desktop_crop_x >= 0 AND desktop_crop_x <= 100),
ADD COLUMN desktop_crop_y NUMERIC(5,2) CHECK (desktop_crop_y >= 0 AND desktop_crop_y <= 100),
ADD COLUMN desktop_crop_width NUMERIC(5,2) CHECK (desktop_crop_width > 0 AND desktop_crop_width <= 100),
ADD COLUMN desktop_crop_height NUMERIC(5,2) CHECK (desktop_crop_height > 0 AND desktop_crop_height <= 100);

-- Add comments for clarity
COMMENT ON COLUMN public.user_profiles.mobile_crop_x IS 'Mobile crop X position as percentage of original image (0-100)';
COMMENT ON COLUMN public.user_profiles.mobile_crop_y IS 'Mobile crop Y position as percentage of original image (0-100)';
COMMENT ON COLUMN public.user_profiles.mobile_crop_width IS 'Mobile crop width as percentage of original image (0-100)';
COMMENT ON COLUMN public.user_profiles.mobile_crop_height IS 'Mobile crop height as percentage of original image (0-100)';
COMMENT ON COLUMN public.user_profiles.desktop_crop_x IS 'Desktop crop X position as percentage of original image (0-100)';
COMMENT ON COLUMN public.user_profiles.desktop_crop_y IS 'Desktop crop Y position as percentage of original image (0-100)';
COMMENT ON COLUMN public.user_profiles.desktop_crop_width IS 'Desktop crop width as percentage of original image (0-100)';
COMMENT ON COLUMN public.user_profiles.desktop_crop_height IS 'Desktop crop height as percentage of original image (0-100)';