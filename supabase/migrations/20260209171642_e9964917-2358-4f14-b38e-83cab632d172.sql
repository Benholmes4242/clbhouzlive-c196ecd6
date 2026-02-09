
-- Course edit suggestions table for verified businesses
CREATE TABLE public.course_edit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES golf_courses(id),
  business_id UUID NOT NULL REFERENCES business_accounts(id),
  suggested_by UUID NOT NULL REFERENCES auth.users(id),
  field_name TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_course_edit_suggestion_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be pending, approved, or rejected.', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_course_edit_suggestion_status_trigger
  BEFORE INSERT OR UPDATE ON public.course_edit_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_course_edit_suggestion_status();

-- Enable RLS
ALTER TABLE public.course_edit_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for admin panel)
CREATE POLICY "Authenticated users can read suggestions" ON public.course_edit_suggestions
  FOR SELECT TO authenticated USING (true);

-- Only verified business members can insert
CREATE POLICY "Verified business members can insert suggestions" ON public.course_edit_suggestions
  FOR INSERT WITH CHECK (
    auth.uid() = suggested_by
    AND EXISTS (
      SELECT 1 FROM business_members bm
      JOIN business_accounts ba ON ba.id = bm.business_id
      WHERE bm.business_id = course_edit_suggestions.business_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
        AND ba.is_verified = true
        AND ba.is_deleted = false
    )
  );

-- Suggestor can view their own (redundant with above but explicit)
CREATE POLICY "Users can update own pending suggestions" ON public.course_edit_suggestions
  FOR UPDATE USING (
    auth.uid() = suggested_by AND status = 'pending'
  );
