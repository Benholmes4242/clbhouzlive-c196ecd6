-- Asset manifest for deferred Cloudflare Stream + Storage cleanup after
-- user deletion. See delete-account v3 brief.
CREATE TABLE public.user_deletion_asset_manifest (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deletion_audit_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('stream','storage')),
  ref text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','deleted','failed')),
  error text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT ALL ON public.user_deletion_asset_manifest TO service_role;

ALTER TABLE public.user_deletion_asset_manifest ENABLE ROW LEVEL SECURITY;

-- Service role only: no client-side access. Full admins may read via RPC
-- if we ever need a queue view; for now nothing at all.
CREATE POLICY "service role manages manifest"
ON public.user_deletion_asset_manifest
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_udam_status ON public.user_deletion_asset_manifest (status)
  WHERE status IN ('pending','failed');
CREATE INDEX idx_udam_audit ON public.user_deletion_asset_manifest (deletion_audit_id);

CREATE OR REPLACE FUNCTION public.udam_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_udam_updated_at
BEFORE UPDATE ON public.user_deletion_asset_manifest
FOR EACH ROW EXECUTE FUNCTION public.udam_set_updated_at();