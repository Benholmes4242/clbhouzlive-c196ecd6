
-- Add RLS policy to allow viewing public user bags
-- Users can view bags of public profiles
CREATE POLICY "Public profiles bags are viewable" 
  ON public.user_bag 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = user_bag.user_id 
      AND user_profiles.is_public = true 
      AND user_profiles.bag_visible = true
    )
  );
