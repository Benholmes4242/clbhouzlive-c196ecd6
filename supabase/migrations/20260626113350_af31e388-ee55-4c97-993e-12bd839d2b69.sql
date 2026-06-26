-- Shared business inbox: any business manager can SELECT notifications
-- routed to a business they manage (owner/admin/editor). Personal rows
-- remain gated by user_id = auth.uid().
CREATE POLICY "Business members can view business notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  recipient_actor_type = 'business'
  AND EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = notifications.recipient_actor_id
      AND bm.user_profile_id = auth.uid()
      AND bm.role IN ('owner', 'admin', 'editor')
  )
);

-- Allow business members to mark business-recipient notifications read
-- (shared read state across managers).
CREATE POLICY "Business members can update business notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  recipient_actor_type = 'business'
  AND EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = notifications.recipient_actor_id
      AND bm.user_profile_id = auth.uid()
      AND bm.role IN ('owner', 'admin', 'editor')
  )
);