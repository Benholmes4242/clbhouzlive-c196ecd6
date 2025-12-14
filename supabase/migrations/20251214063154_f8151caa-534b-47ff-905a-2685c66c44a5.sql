-- Fix remove_golfer_verification: use 'message' column instead of 'body'
CREATE OR REPLACE FUNCTION public.remove_golfer_verification(
  p_user_id uuid,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  -- Admin check
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = v_admin AND role IN ('full', 'limited')
  ) THEN
    RAISE EXCEPTION 'Forbidden - Admin required';
  END IF;

  -- Remove verified flag
  UPDATE public.user_profiles
  SET is_verified_golfer = false,
      golfer_verified_at = NULL,
      golfer_verified_by = NULL
  WHERE id = p_user_id;

  -- Mark latest request as removed
  UPDATE public.golfer_verification_requests
  SET status = 'removed',
      reviewed_at = now()
  WHERE user_id = p_user_id AND status = 'approved';

  -- Notify user (using 'message' column, not 'body')
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    p_user_id,
    'golfer_verification_removed',
    'Verification updated',
    'Your verified golfer status has been removed.',
    jsonb_build_object('removed_by', v_admin)
  );

  -- Audit log with admin note
  INSERT INTO public.verification_audit_log (actor_id, target_user_id, action, note)
  VALUES (v_admin, p_user_id, 'golfer_removed', p_note);
END;
$$;