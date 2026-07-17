DROP FUNCTION IF EXISTS public.update_vault_secret(uuid, text);
DROP FUNCTION IF EXISTS public.create_vault_secret(text, text);

CREATE OR REPLACE FUNCTION public.upsert_internal_fn_secret(p_secret text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'INTERNAL_FN_SECRET';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(p_secret, 'INTERNAL_FN_SECRET');
    RETURN 'created';
  ELSE
    PERFORM vault.update_secret(v_id, p_secret);
    RETURN 'updated';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_internal_fn_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_internal_fn_secret(text) TO service_role;