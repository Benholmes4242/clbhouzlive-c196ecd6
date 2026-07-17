
CREATE OR REPLACE FUNCTION public.soft_delete_review_response(p_response_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT business_id INTO v_business_id
  FROM public.review_responses
  WHERE id = p_response_id AND is_deleted = false;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Response not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = v_business_id
      AND bm.user_profile_id = v_uid
      AND bm.role = ANY (ARRAY['owner','admin'])
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this response' USING ERRCODE = '42501';
  END IF;

  UPDATE public.review_responses
  SET is_deleted = true, updated_at = now()
  WHERE id = p_response_id;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_review_response(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_review_response(uuid) TO authenticated;
