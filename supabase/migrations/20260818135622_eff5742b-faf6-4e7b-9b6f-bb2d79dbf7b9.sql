CREATE OR REPLACE FUNCTION public.revoke_business_verification(p_business_id uuid, p_admin_id uuid, p_reason text DEFAULT NULL::text, p_bypass_cooldown boolean DEFAULT false, p_note text DEFAULT NULL::text)
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
  -- §1.3 — an admin, or the service role acting on an admin's behalf.
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

  -- §1.5 — the revoked business MUST be told. A duplicate is tolerable; anything
  -- else is recorded as an OPERATIONAL row (metadata.operational = true) so the
  -- history query can exclude it while the silence stays visible.
  BEGIN
    INSERT INTO notifications (user_id, type, title, message, recipient_actor_id, data, entity_type, entity_id)
    SELECT bm.user_profile_id, 'business_verification_revoked', 'Verification removed',
           'The verified badge for ' || v_business_name || ' has been removed.',
           bm.user_profile_id,
           jsonb_build_object('business_id', p_business_id, 'business_name', v_business_name,
                              'business_logo_url', v_business_logo_url, 'action', 'revoked',
                              'reason', p_reason, 'note', p_note),
           'business', p_business_id
    FROM business_members bm
    WHERE bm.business_id = p_business_id AND bm.role IN ('owner','admin')
      AND bm.user_profile_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_notified = ROW_COUNT;

    IF v_notified = 0 THEN
      INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
      VALUES ('business', p_business_id, 'notification_failed', v_admin,
              'Revocation notice reached nobody: no owner or admin member to notify.',
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

GRANT EXECUTE ON FUNCTION public.revoke_business_verification(uuid, uuid, text, boolean, text) TO authenticated, service_role;