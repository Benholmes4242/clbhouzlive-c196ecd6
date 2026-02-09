
-- Notify the original reviewer when a business responds to their review
CREATE OR REPLACE FUNCTION public.notify_reviewer_on_response()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_id UUID;
  v_course_id UUID;
  v_course_name TEXT;
  v_business_name TEXT;
BEGIN
  -- Get the review and reviewer
  SELECT cr.user_id, cr.course_id, gc.name
  INTO v_reviewer_id, v_course_id, v_course_name
  FROM course_ratings cr
  JOIN golf_courses gc ON gc.id = cr.course_id
  WHERE cr.id = NEW.review_id;

  -- Get business name
  SELECT name INTO v_business_name FROM business_accounts WHERE id = NEW.business_id;

  -- Don't notify if the reviewer is the same as the responder
  IF v_reviewer_id IS NULL OR v_reviewer_id = NEW.responded_by THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (
    user_id, type, actor_id, entity_type, entity_id,
    title, message, data
  ) VALUES (
    v_reviewer_id,
    'review_response',
    NEW.responded_by,
    'review_response',
    NEW.id,
    v_business_name || ' responded to your review',
    'Your review of ' || v_course_name || ' received a response',
    jsonb_build_object(
      'course_name', v_course_name,
      'course_id', v_course_id,
      'review_id', NEW.review_id,
      'response_id', NEW.id,
      'business_id', NEW.business_id,
      'business_name', v_business_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_review_response_notify_reviewer
  AFTER INSERT ON review_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reviewer_on_response();
