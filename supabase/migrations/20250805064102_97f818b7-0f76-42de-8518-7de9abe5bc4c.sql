-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.get_cloudflare_secrets()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return the account ID (this can be public)
  -- API token should be handled server-side only
  RETURN jsonb_build_object(
    'CLOUDFLARE_ACCOUNT_ID', 'ybxkehyomcakqjvuhnna'
  );
END;
$$;