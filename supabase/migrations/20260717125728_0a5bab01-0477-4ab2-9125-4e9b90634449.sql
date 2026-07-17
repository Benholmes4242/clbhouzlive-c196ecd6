-- SECURITY DEFINER wrappers, name-scoped to 'INTERNAL_FN_SECRET' only.
-- Callable only by service_role (edge functions running with SR key).
CREATE OR REPLACE FUNCTION public.update_vault_secret(p_id uuid, p_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_name text;
BEGIN
  SELECT name INTO v_name FROM vault.secrets WHERE id = p_id;
  IF v_name IS DISTINCT FROM 'INTERNAL_FN_SECRET' THEN
    RAISE EXCEPTION 'update_vault_secret: name-scope violation (only INTERNAL_FN_SECRET permitted)';
  END IF;
  PERFORM vault.update_secret(p_id, p_secret);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_vault_secret(p_secret text, p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_name IS DISTINCT FROM 'INTERNAL_FN_SECRET' THEN
    RAISE EXCEPTION 'create_vault_secret: name-scope violation (only INTERNAL_FN_SECRET permitted)';
  END IF;
  SELECT vault.create_secret(p_secret, p_name) INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_vault_secret(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_vault_secret(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_vault_secret(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_vault_secret(text, text) TO service_role;