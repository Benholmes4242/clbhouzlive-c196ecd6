GRANT SELECT, UPDATE ON public.whs_unmatched_courses TO authenticated;
GRANT ALL ON public.whs_unmatched_courses TO service_role;

DROP POLICY IF EXISTS "Admins can read unmatched courses" ON public.whs_unmatched_courses;
CREATE POLICY "Admins can read unmatched courses"
ON public.whs_unmatched_courses
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update unmatched courses" ON public.whs_unmatched_courses;
CREATE POLICY "Admins can update unmatched courses"
ON public.whs_unmatched_courses
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());