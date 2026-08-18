-- ─────────────────────────────────────────────────────────────────────────────
-- 1. REVOCATION NOTICE — actor_id
--    idx_notifications_dedup is (user_id, type, actor_id, entity_id). The insert
--    left actor_id NULL, so NULLs never collided and the named target was
--    dropped for a bare ON CONFLICT DO NOTHING. actor_id carries FKs to
--    user_profiles AND auth.users, so it CANNOT hold the business id — the
--    revoking ADMIN is the actor, which is both valid and the right semantics.
--    With a real value the named target and the unique_violation arm both work.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_business_verification(
  p_business_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT NULL::text,
  p_bypass_cooldown boolean DEFAULT false,
  p_note text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin uuid := COALESCE(p_admin_id, auth.uid());
  v_is_system_account boolean;
  v_business_name text;
  v_business_logo_url text;
  v_bypass boolean;
  v_notified integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden - Admin required';
  END IF;

  SELECT is_system_account, name, logo_url
    INTO v_is_system_account, v_business_name, v_business_logo_url
  FROM business_accounts WHERE id = p_business_id;

  IF v_business_name IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  v_bypass := v_is_system_account AND p_bypass_cooldown;

  UPDATE business_accounts
  SET is_verified = false,
      verified_at = NULL,
      verified_by = NULL,
      last_verification_action = 'revoked',
      verification_cooldown_until = CASE WHEN v_is_system_account OR v_bypass
                                         THEN NULL ELSE now() + interval '7 days' END,
      verification_recheck_due_at = NULL,
      verification_recheck_state = NULL,
      verification_recheck_at = NULL,
      verification_recheck_reason = NULL
  WHERE id = p_business_id;

  UPDATE business_verification_requests
  SET status = 'revoked',
      reviewed_at = now(),
      reviewed_by = v_admin,
      review_reason = COALESCE(p_reason, review_reason),
      admin_note = COALESCE(p_note, admin_note)
  WHERE business_id = p_business_id AND status = 'approved';

  INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES ('business', p_business_id, 'revoked', v_admin,
          COALESCE(p_note, p_reason, 'Business verification removed by admin.'),
          jsonb_build_object(
            'review_reason', p_reason,
            'admin_reason', p_reason,
            'admin_note', p_note,
            'business_name', v_business_name,
            'cooldown_bypassed', v_is_system_account OR v_bypass,
            'is_system_account', v_is_system_account,
            'admin_override', p_bypass_cooldown));

  BEGIN
    INSERT INTO notifications (user_id, type, title, message, actor_id, recipient_actor_id, data, entity_type, entity_id)
    SELECT bm.user_profile_id, 'business_verification_revoked', 'Verification removed',
           'The verified badge for ' || v_business_name || ' has been removed.',
           v_admin,
           bm.user_profile_id,
           jsonb_build_object('business_id', p_business_id, 'business_name', v_business_name,
                              'business_logo_url', v_business_logo_url, 'action', 'revoked',
                              'reason', p_reason, 'note', p_note),
           'business', p_business_id
    FROM business_members bm
    WHERE bm.business_id = p_business_id AND bm.role IN ('owner','admin')
      AND bm.user_profile_id IS NOT NULL
    ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;

    GET DIAGNOSTICS v_notified = ROW_COUNT;

    IF v_notified = 0 THEN
      INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
      VALUES ('business', p_business_id, 'notification_failed', v_admin,
              'Revocation notice reached nobody: no owner or admin member to notify, or the notice already existed.',
              jsonb_build_object('operational', true, 'stage', 'revoked_notification', 'recipients', 0));
    END IF;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Revocation notice already present for business %', p_business_id;
    WHEN OTHERS THEN
      INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
      VALUES ('business', p_business_id, 'notification_failed', v_admin,
              'Revocation notice could not be delivered: ' || SQLERRM,
              jsonb_build_object('operational', true, 'stage', 'revoked_notification',
                                 'sqlstate', SQLSTATE, 'sqlerrm', SQLERRM));
  END;
END; $function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DOCUMENT RETENTION PURGE (docs/VERIFICATION_DOCUMENT_RETENTION.md)
--    SQL cannot delete bucket objects, so the split is:
--      · list_expired_verification_documents() — what is out of window
--      · mark_verification_document_purged()   — after the object is gone
--      · verification_documents_referenced()   — orphan sweep support
--    The edge function verification-document-purge does the deleting.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.verification_audit_log
  DROP CONSTRAINT IF EXISTS verification_audit_log_action_check;

ALTER TABLE public.verification_audit_log
  ADD CONSTRAINT verification_audit_log_action_check CHECK (action = ANY (ARRAY[
    'submitted','approved','rejected','removed','revoked','needs_more_info',
    'domain_check_requested','more_proof_requested','cooldown_bypassed',
    'golfer_invited','golfer_accepted','golfer_declined','golfer_approved',
    'golfer_rejected','golfer_removed','golfer_test_reset',
    'golfer_verification_bypassed_second_approval',
    'recheck_passed','recheck_flagged','recheck_prompted','notification_failed',
    'document_purged','document_purge_failed'
  ]));

CREATE OR REPLACE FUNCTION public.list_expired_verification_documents(p_limit integer DEFAULT 200)
RETURNS TABLE(request_id uuid, business_id uuid, document_path text, status text,
              decided_at timestamptz, retention_days integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- approved: 90 days after decision (appeal window + audit of the decision)
  -- rejected/revoked: 30 days (applicant may correct and resubmit)
  -- pending / needs_more_info: held, the reviewer needs it
  SELECT r.id, r.business_id, r.proof_document_url, r.status,
         COALESCE(r.reviewed_at, r.updated_at),
         CASE WHEN r.status = 'approved' THEN 90 ELSE 30 END
  FROM business_verification_requests r
  WHERE r.proof_document_url IS NOT NULL
    AND r.status IN ('approved','rejected','revoked')
    AND COALESCE(r.reviewed_at, r.updated_at)
        < now() - (CASE WHEN r.status = 'approved' THEN 90 ELSE 30 END || ' days')::interval
  ORDER BY COALESCE(r.reviewed_at, r.updated_at) ASC
  LIMIT GREATEST(COALESCE(p_limit, 200), 1);
$function$;

CREATE OR REPLACE FUNCTION public.mark_verification_document_purged(
  p_request_id uuid,
  p_document_path text,
  p_error text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_id uuid;
  v_status text;
BEGIN
  SELECT business_id, status INTO v_business_id, v_status
  FROM business_verification_requests WHERE id = p_request_id;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  IF p_error IS NOT NULL THEN
    -- The file could not be removed. The row KEEPS its path so the next sweep
    -- retries; the failure is on the record either way.
    INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
    VALUES ('business', v_business_id, 'document_purge_failed', NULL,
            'Retention purge could not delete the document: ' || p_error,
            jsonb_build_object('operational', true, 'request_id', p_request_id,
                               'document_path', p_document_path, 'error', p_error));
    RETURN;
  END IF;

  -- The FILE goes; the decision record and proof_metadata stay, minus the path.
  UPDATE business_verification_requests
  SET proof_document_url = NULL,
      proof_metadata = COALESCE(proof_metadata, '{}'::jsonb)
                       - 'document_path'
                       || jsonb_build_object('document_purged_at', now(),
                                             'document_purged_path', p_document_path)
  WHERE id = p_request_id;

  INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES ('business', v_business_id, 'document_purged', NULL,
          'Retention window elapsed — evidence document deleted, decision record retained.',
          jsonb_build_object('request_id', p_request_id, 'request_status', v_status,
                             'document_path', p_document_path));
END; $function$;

CREATE OR REPLACE FUNCTION public.verification_documents_referenced(p_paths text[])
RETURNS TABLE(document_path text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT r.proof_document_url
  FROM business_verification_requests r
  WHERE r.proof_document_url = ANY(COALESCE(p_paths, ARRAY[]::text[]));
$function$;

REVOKE ALL ON FUNCTION public.list_expired_verification_documents(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_verification_document_purged(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verification_documents_referenced(text[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.list_expired_verification_documents(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_verification_document_purged(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verification_documents_referenced(text[]) TO service_role;