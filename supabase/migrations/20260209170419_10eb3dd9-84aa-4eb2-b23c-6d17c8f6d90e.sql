
-- 1.1 Unique club constraint (no duplicates found, safe to apply)
CREATE UNIQUE INDEX unique_active_club_claim 
ON business_accounts (club_id) 
WHERE club_id IS NOT NULL AND is_deleted = false;

-- 1.2 Review Responses Table
CREATE TABLE public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES course_ratings(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  responded_by UUID NOT NULL REFERENCES auth.users(id),
  response_text TEXT NOT NULL CHECK (char_length(response_text) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  UNIQUE(review_id, business_id)
);

ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted responses
CREATE POLICY "Public read responses" ON public.review_responses
  FOR SELECT USING (is_deleted = false);

-- Only verified business owners/admins can insert
CREATE POLICY "Verified business members insert" ON public.review_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members bm
      JOIN business_accounts ba ON ba.id = bm.business_id
      WHERE bm.business_id = review_responses.business_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
        AND ba.is_verified = true
        AND ba.is_deleted = false
    )
  );

-- Only the responder can update
CREATE POLICY "Responder can update" ON public.review_responses
  FOR UPDATE USING (responded_by = auth.uid());

-- Only the responder can delete (soft delete)
CREATE POLICY "Responder can delete" ON public.review_responses
  FOR DELETE USING (responded_by = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_review_responses_updated_at
  BEFORE UPDATE ON public.review_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.3 Business Course Review Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_business_on_course_review()
RETURNS TRIGGER AS $$
DECLARE
  v_club_id UUID;
  v_course_name TEXT;
  v_business RECORD;
  v_member RECORD;
BEGIN
  -- Get the course's club
  SELECT gc.club_id, gc.name INTO v_club_id, v_course_name
  FROM golf_courses gc WHERE gc.id = NEW.course_id;
  
  IF v_club_id IS NULL THEN RETURN NEW; END IF;
  
  -- Find the claiming business
  SELECT id, name, slug INTO v_business
  FROM business_accounts
  WHERE club_id = v_club_id AND is_deleted = false
  LIMIT 1;
  
  IF v_business.id IS NULL THEN RETURN NEW; END IF;
  
  -- Notify all owners and admins of the business
  FOR v_member IN
    SELECT user_profile_id FROM business_members
    WHERE business_id = v_business.id
      AND role IN ('owner', 'admin')
      AND user_profile_id != NEW.user_id  -- don't notify the reviewer if they're also an admin
  LOOP
    INSERT INTO notifications (
      user_id, type, actor_id, entity_type, entity_id,
      title, message, data
    ) VALUES (
      v_member.user_profile_id,
      'business_course_review',
      NEW.user_id,
      'course_rating',
      NEW.id,
      'New course review',
      v_course_name || ' received a new review',
      jsonb_build_object(
        'course_name', v_course_name,
        'course_id', NEW.course_id,
        'rating', NEW.rating,
        'review_id', NEW.id,
        'business_id', v_business.id,
        'business_name', v_business.name
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_course_rating_notify_business
  AFTER INSERT ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_business_on_course_review();
