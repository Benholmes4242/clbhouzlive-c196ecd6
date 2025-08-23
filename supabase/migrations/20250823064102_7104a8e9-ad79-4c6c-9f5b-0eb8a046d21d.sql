-- Create function to update mobile crop data
CREATE OR REPLACE FUNCTION update_mobile_crop_data(
  p_user_id UUID,
  p_crop_x NUMERIC,
  p_crop_y NUMERIC,
  p_crop_width NUMERIC,
  p_crop_height NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    mobile_crop_x = p_crop_x,
    mobile_crop_y = p_crop_y,
    mobile_crop_width = p_crop_width,
    mobile_crop_height = p_crop_height,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;