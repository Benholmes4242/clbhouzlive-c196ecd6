-- PHASE 4: structured decisions, audit trail, and the (off-by-default) two-reviewer quorum.

-- 1. A decision reason, not a note.
ALTER TABLE public.business_verification_requests
  ADD COLUMN IF NOT EXISTS review_reason text;

COMMENT ON COLUMN public.business_verification_requests.review_reason IS
  'Structured decision reason chosen from the published-criteria list (below_bar, document_illegible, ...). Free-text lives in admin_note alongside it.';

-- 2. required_approvals defaulted to 2, which would have deadlocked a one-reviewer queue.
ALTER TABLE public.business_verification_requests
  ALTER COLUMN required_approvals SET DEFAULT 1;

-- 3. The quorum ledger. One row per (request, reviewer) so the SAME reviewer
--    cannot satisfy two approvals - enforced by the unique constraint, not by app code.
CREATE TABLE IF NOT EXISTS public.business_verification_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.business_verification_requests(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_verification_approvals_unique_reviewer UNIQUE (request_id, reviewer_id)
);

GRANT SELECT ON public.business_verification_approvals TO authenticated;
GRANT ALL ON public.business_verification_approvals TO service_role;

ALTER TABLE public.business_verification_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read verification approvals"
  ON public.business_verification_approvals
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. Approve becomes quorum-aware and returns the outcome.
DROP FUNCTION IF EXISTS public.approve_business_verification(uuid);

CREATE OR REPLACE FUNCTION public.approve_business_verification(
  _request_id uuid,
  _admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  _business_id uuid;
  _required int;
  _count int;
  _status text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select business_id, coalesce(required_approvals, 1), status
    into _business_id, _required, _status
  from public.business_verification_requests
  where id = _request_id;

  if _business_id is null then
    raise exception 'Request not found';
  end if;

  if _status <> 'pending' then
    raise exception 'Request is not pending';
  end if;

  -- Records this reviewer's approval. The unique constraint means a second
  -- approval from the SAME reviewer is a no-op, never a quorum.
  insert into public.business_verification_approvals (request_id, reviewer_id, note)
  values (_request_id, auth.uid(), nullif(btrim(coalesce(_admin_note, '')), ''))
  on conflict (request_id, reviewer_id) do nothing;

  select count(*) into _count
  from public.business_verification_approvals
  where request_id = _request_id;

  update public.business_verification_requests
  set approval_count = _count,
      admin_note = coalesce(nullif(btrim(coalesce(_admin_note, '')), ''), admin_note),
      updated_at = now()
  where id = _request_id;

  if _count < _required then
    return jsonb_build_object(
      'completed', false,
      'approval_count', _count,
      'required_approvals', _required
    );
  end if;

  update public.business_verification_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_reason = null,
      updated_at = now()
  where id = _request_id;

  update public.business_accounts
  set is_verified = true,
      verified_at = now(),
      verified_by = auth.uid()
  where id = _business_id;

  return jsonb_build_object(
    'completed', true,
    'approval_count', _count,
    'required_approvals', _required
  );
end;
$function$;

-- 5. Reject / needs-more-info carry the structured reason. Reason is OPTIONAL at
--    the DB boundary so a pre-Phase-4 client call still succeeds.
DROP FUNCTION IF EXISTS public.reject_business_verification(uuid, text);

CREATE OR REPLACE FUNCTION public.reject_business_verification(
  _request_id uuid,
  _admin_note text,
  _review_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.business_verification_requests
  set status = 'rejected',
      admin_note = _admin_note,
      review_reason = nullif(btrim(coalesce(_review_reason, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = _request_id;

  if not found then
    raise exception 'Request not found';
  end if;
end;
$function$;

DROP FUNCTION IF EXISTS public.request_info_business_verification(uuid, text);

CREATE OR REPLACE FUNCTION public.request_info_business_verification(
  _request_id uuid,
  _admin_note text,
  _review_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if _admin_note is null or length(btrim(_admin_note)) < 3 then
    raise exception 'admin_note required (min 3 characters)';
  end if;

  update public.business_verification_requests
  set status = 'needs_more_info',
      admin_note = _admin_note,
      review_reason = nullif(btrim(coalesce(_review_reason, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = _request_id;

  if not found then
    raise exception 'Request not found';
  end if;
end;
$function$;