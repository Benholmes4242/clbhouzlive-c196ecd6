ALTER TABLE public.tour_stories
  ADD COLUMN IF NOT EXISTS source_text text;

COMMENT ON COLUMN public.tour_stories.source_text IS
  'The raw pasted story the blocks were parsed from. Kept so a re-parse is always possible: the day the parser gets something wrong, this is the only way back.';

-- Panel admins (full/limited) author the wire. Moderators do NOT: can_moderate()
-- includes them and this is a publishing surface, not a moderation queue.
CREATE POLICY "Panel admins read all stories"
  ON public.tour_stories FOR SELECT TO authenticated
  USING (public.is_panel_admin());

CREATE POLICY "Panel admins write stories"
  ON public.tour_stories FOR INSERT TO authenticated
  WITH CHECK (public.is_panel_admin());

CREATE POLICY "Panel admins edit stories"
  ON public.tour_stories FOR UPDATE TO authenticated
  USING (public.is_panel_admin())
  WITH CHECK (public.is_panel_admin());

CREATE POLICY "Panel admins delete stories"
  ON public.tour_stories FOR DELETE TO authenticated
  USING (public.is_panel_admin());

GRANT SELECT ON public.tour_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_stories TO authenticated;
GRANT ALL ON public.tour_stories TO service_role;