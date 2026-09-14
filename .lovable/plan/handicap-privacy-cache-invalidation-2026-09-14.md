# Handicap privacy cache invalidation

## Build
- Add one shared invalidation helper covering profile caches, Circle rounds, and every WHS query family that can contain an index, movement, score, or handicap-derived ranking.
- Call it after a successful `handicap_visibility` update from the existing settings hook; do not invalidate on failed writes.
- Add a focused test that asserts the complete key list is invalidated with partial-key matching.

## Report
- List each newly visible surface after the proposed snapshot policy, separating intended other-member reads from owner-only reads.
- State the client-cache boundary precisely: the settings screen can invalidate its own browser immediately; another member’s already-open browser still requires its next refetch because React Query caches are not remotely revocable.
- Provide the unapplied SQL draft path for Ben.

## Technical details
- No database policy will be applied.
- The SQL draft remains `docs/sql/whs_handicap_snapshots_public_visibility.sql`.
- Existing public/`eg_visible` UI disclosure checks remain unchanged.
