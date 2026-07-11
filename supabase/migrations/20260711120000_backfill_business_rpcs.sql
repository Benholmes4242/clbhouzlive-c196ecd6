-- Backfill migration: business-system RPCs that existed only in the live DB.
-- Captured from production via pg_get_functiondef so the repo is authoritative.
-- No behaviour change: these are CREATE OR REPLACE of the exact live definitions,
-- including the approve_course_claim corruption guard + auto-verify and the
-- atomic soft_delete_business cleanup. Post-launch tech-debt item P1.
-- See POST-LAUNCH-cleanup-tracker.md.


-- ===== request_course_claim =====
CREATE OR REPLACE FUNCTION public.request_course_claim(_business_id uuid, _club_id uuid, _club_key text, _source_course_id uuid, _proof_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _new_id uuid;
BEGIN
  -- caller must be owner/admin of the business
  IF NOT EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = _business_id AND user_profile_id = auth.uid()
      AND role IN ('owner','admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized for this business';
  END IF;

  -- club must not already be owned by an approved business
  IF EXISTS (SELECT 1 FROM business_accounts WHERE club_id = _club_id AND is_deleted = false) THEN
    RAISE EXCEPTION 'This club is already claimed';
  END IF;

  -- no active claim already in flight (the partial unique index also enforces this)
  IF EXISTS (
    SELECT 1 FROM course_claim_requests
    WHERE club_id = _club_id AND status IN ('pending','needs_more_info')
  ) THEN
    RAISE EXCEPTION 'A claim for this club is already under review';
  END IF;

  INSERT INTO course_claim_requests (business_id, club_id, club_key, source_course_id, requested_by, proof_note, status)
  VALUES (_business_id, _club_id, _club_key, _source_course_id, auth.uid(), _proof_note, 'pending')
  RETURNING id INTO _new_id;

  RETURN _new_id;
END; $function$;

-- ===== approve_course_claim =====
CREATE OR REPLACE FUNCTION public.approve_course_claim(_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _req course_claim_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO _req FROM course_claim_requests WHERE id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Claim request not found'; END IF;
  IF _req.status NOT IN ('pending','needs_more_info') THEN
    RAISE EXCEPTION 'Claim is not pending';
  END IF;

  -- guard: club not taken by ANOTHER business in the meantime
  IF EXISTS (
    SELECT 1 FROM business_accounts
    WHERE club_id = _req.club_id AND is_deleted = false
      AND id <> _req.business_id
  ) THEN
    RAISE EXCEPTION 'This club was already claimed by another business';
  END IF;

  -- corruption guard: refuse if THIS business already manages a different club
  IF EXISTS (
    SELECT 1 FROM business_accounts
    WHERE id = _req.business_id
      AND club_id IS NOT NULL
      AND club_id <> _req.club_id
  ) THEN
    RAISE EXCEPTION 'This business already manages another club. Create a separate Golf Club profile for this course.';
  END IF;

  -- the link: business now owns the club AND becomes verified (claim implies verification)
  UPDATE business_accounts
  SET club_id     = _req.club_id,
      club_key    = _req.club_key,
      is_verified = true,
      verified_at = now(),
      verified_by = auth.uid()
  WHERE id = _req.business_id;

  UPDATE course_claim_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = _request_id;
END; $function$;

-- ===== reject_course_claim =====
CREATE OR REPLACE FUNCTION public.reject_course_claim(_request_id uuid, _admin_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _admin_note IS NULL OR length(btrim(_admin_note)) < 3 THEN
    RAISE EXCEPTION 'admin_note required (min 3 characters)';
  END IF;

  UPDATE course_claim_requests
  SET status = 'rejected', admin_note = _admin_note, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = _request_id AND status IN ('pending','needs_more_info');

  IF NOT FOUND THEN RAISE EXCEPTION 'Claim not found or not pending'; END IF;
END; $function$;

-- ===== approve_business_verification =====
CREATE OR REPLACE FUNCTION public.approve_business_verification(_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _business_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select business_id into _business_id
  from public.business_verification_requests
  where id = _request_id;

  if _business_id is null then
    raise exception 'Request not found';
  end if;

  update public.business_verification_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = _request_id;

  update public.business_accounts
  set is_verified = true,
      verified_at = now(),
      verified_by = auth.uid()
  where id = _business_id;
end;
$function$;

-- ===== soft_delete_business =====
CREATE OR REPLACE FUNCTION public.soft_delete_business(_business_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _club_id uuid;
BEGIN
  -- 1. Authorization: caller must be the OWNER of this business
  IF NOT EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = _business_id
      AND user_profile_id = auth.uid()
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the owner can delete this business';
  END IF;

  -- Capture the club link before we clear it
  SELECT club_id INTO _club_id FROM business_accounts WHERE id = _business_id;

  -- 2. Soft-delete AND release verification + club link atomically
  UPDATE business_accounts
  SET is_deleted  = true,
      deleted_at  = now(),
      is_verified = false,
      verified_at = NULL,
      verified_by = NULL,
      club_id     = NULL,
      club_key    = NULL
  WHERE id = _business_id;

  -- 3. Cancel any open/approved claim for that club so the course is cleanly reclaimable
  IF _club_id IS NOT NULL THEN
    UPDATE course_claim_requests
    SET status = 'cancelled',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE business_id = _business_id
      AND status IN ('pending','needs_more_info','approved');
  END IF;

  -- 4. Remove all memberships
  DELETE FROM business_members WHERE business_id = _business_id;

  -- 5. Clear polymorphic actor references so no ghost content remains in feeds
  DELETE FROM post_likes
    WHERE actor_type = 'business' AND actor_id = _business_id;
  DELETE FROM posts
    WHERE actor_type = 'business' AND actor_id = _business_id;
  DELETE FROM follows
    WHERE (follower_actor_type  = 'business' AND follower_actor_id  = _business_id)
       OR (following_actor_type = 'business' AND following_actor_id = _business_id);
  DELETE FROM notifications
    WHERE actor_id = _business_id
       OR (recipient_actor_type = 'business' AND recipient_actor_id = _business_id);
END;
$function$;
