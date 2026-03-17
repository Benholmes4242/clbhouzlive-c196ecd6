-- Create a security definer function to check if an email exists in auth.users
-- This avoids needing to expose the auth schema via PostgREST
CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(trim(lookup_email))
  );
$$;

-- Only allow service role / authenticated to call this (no anon access to prevent enumeration)
REVOKE ALL ON FUNCTION public.check_email_exists(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_email_exists(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO service_role;