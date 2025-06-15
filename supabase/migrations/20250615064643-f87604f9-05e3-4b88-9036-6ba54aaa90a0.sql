
-- Allow users to insert their own profile in user_profiles (where they are the owner)
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
