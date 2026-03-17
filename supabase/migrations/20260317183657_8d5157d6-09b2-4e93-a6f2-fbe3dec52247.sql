-- Prevent username changes via RLS: once a username is set, it cannot be modified
CREATE POLICY "username_immutable" ON public.user_profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (
    username = (SELECT up.username FROM public.user_profiles up WHERE up.id = auth.uid())
    OR (SELECT up.username FROM public.user_profiles up WHERE up.id = auth.uid()) IS NULL
  );