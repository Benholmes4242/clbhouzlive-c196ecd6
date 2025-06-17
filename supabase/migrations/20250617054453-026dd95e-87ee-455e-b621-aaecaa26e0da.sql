
-- First check if RLS is enabled and enable it if not
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Only create the missing policy for viewing public profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can view public profiles'
    ) THEN
        CREATE POLICY "Users can view public profiles"
          ON public.user_profiles
          FOR SELECT 
          USING (is_public = true);
    END IF;
END $$;
