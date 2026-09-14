-- DRAFT ONLY - DO NOT APPLY FROM THE APP.
-- Ben runs this in Supabase after review.
--
-- Purpose: let an authenticated member read a handicap snapshot when the
-- snapshot owner's current profile settings make that handicap public.
-- A clbhouz follow is deliberately not treated as a WHS friend match.
--
-- Do not replace this expression with whs_connection_publicly_visible().
-- That helper currently checks eg_visible and profile deletion, but omits
-- handicap_visibility. The member-facing setting is the authority here.
--
-- This policy evaluates user_profiles on every read. Changing
-- handicap_visibility away from 'public', setting eg_visible away from true,
-- or deleting the profile therefore closes this public path on the next
-- database read; it does not wait for the next WHS sync. Existing client-side
-- query data may remain visible until that reader refetches (the Circle query
-- currently has a 30-minute stale window), so immediate on-screen revocation
-- also requires privacy-setting invalidation or a shorter/refetching cache.
-- The existing owner policy remains, so a member can still read their own
-- snapshots after making them private.

create policy "whs_handicap_snapshots_select_public_visible"
on public.whs_handicap_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.whs_connections c
    join public.user_profiles up on up.id = c.user_id
    where c.id = whs_handicap_snapshots.connection_id
      and up.deleted_at is null
      and up.eg_visible is true
      and up.handicap_visibility = 'public'
  )
);

-- Sibling audit, 14 Sep 2026:
--
-- whs_scores already has whs_scores_select_public_visible, which calls
-- whs_connection_publicly_visible(connection_id). The currently deployed
-- helper omits handicap_visibility, so that policy still has the same gap.
--
-- whs_score_holes already has whs_score_holes_select_public_visible, which
-- calls whs_score_publicly_visible(score_id). The currently deployed score
-- helper explicitly requires handicap_visibility = 'public' as well as
-- eg_visible, a live profile, public profile, and non-suspended profile. It
-- does not have the same gap.
--
-- This draft intentionally changes snapshots only. Fixing the connection
-- helper would also change whs_connections and whs_scores visibility and must
-- be reviewed as a separate shared-policy change.