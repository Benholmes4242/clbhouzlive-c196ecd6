# CB117 — Mentioned by golfers

## Delivered
- `BusinessMentionsRail.tsx` and scoped CSS: signed-off132×165 horizontal photo/poster tiles; member avatar/initials and credit; video mark and dark posterless fallback; header with server count/plural. Hidden images render at40% with Hidden label.
- `BusinessProfilePage.tsx`: non-club branch only, immediately after BusinessFollowersCard and before tabs; management uses existing membership.canManage, restricted to owner/admin. Editors/analysts get visitor controls.
- Read uses only `get_business_mentions`; rows/order/count/eligibility are not client-refiltered. Pending/failed/empty reads omit section; failed refetch suppresses stale data. Identity-scoped query key includes viewer and management capability.
- Owner/admin menu opens shared BottomSheet with Hide/Show and Cancel. Calls `set_business_mention_hidden` with business/post id and boolean; success closes and refetches, no optimistic change. Error toasts and leaves rows unchanged.
- Global semantic tokens plus English i18n keys (including posts_one/posts_other); scoped CSS preserves other sections. Canonical18px SquircleAvatar geometry/ring retained rather than changing shared avatars.
- Architecture ownership recorded in AGENTS.md; requirements and roadmap updated.

## Function confirmation and post destination
Both functions are present in generated types and answer hosted REST calls with the expected signed-out refusal:
- `get_business_mentions`: HTTP401, code42501, `permission denied for function get_business_mentions`.
- `set_business_mention_hidden`: HTTP401, code42501, `permission denied for function set_business_mention_hidden`.
This confirms existence and signed-out restriction, **not signed-in success or hosted payload shape**. Ben's BIZ_MENTIONS_V1 confirmation and documented shapes were used. No SQL or data change occurred during verification.
Tile taps navigate to existing `/post/:postId` (`/post/${post.post_id}`), owned by PostDeepLinkPage in App.tsx. Menu tap is a sibling button and never opens that post.

## Tests and full-suite result
Command: `bunx vitest run`.
Before:3,734 passed/0 failed across414 files.
After:**3,756 passed/0 failed across415 files**; new suite22/22.
Delta:+22 tests/+1 file entirely `src/test/cb117BusinessMentions.test.tsx`. No existing test changes, deletions, rewrites or renames; no old/new names to reconcile.

Added cases:
1. shows server posts without deriving the count or refiltering
2. renders nothing until read settles
3. omits empty posts
4. omits failed reads even with stale data
5. omits zero visible count while retaining hidden team rows
6. has singular and plural count keys
7. uses media image
8–9. video / clip uses poster and play mark
10. video without poster retains tile without image
11. opens existing single post route
12–16. management button obeys owner / admin / editor / analyst / visitor capability
17–18. hidden=false / true calls correct mutation and refetches without post navigation
19. hidden row retains label and shows restore action
20. write error toasts and leaves rail and sheet unchanged with no refetch
21. never renders or reads on a club
22. page places nonclub rail after followers and before tabs using membership capability

These exercise mocked read/write flow, route navigation and error/readback behavior. Role ownership uses the existing hook's owner/admin capability; page placement is source-checked. Hidden opacity is implemented in scoped CSS, not a styling test.

## Pre-existing failures and verification limits
No pre-existing failures at task start. The brief's earlier `coursePlaceTagging.test.tsx` failures — “submit copies owned metadata and invalidates place plus hole key” and “remove deletes the owned row and invalidates both keys” — were resolved by the preceding approved mock repair; all11 cases still pass. No new failures.
Latest automatic preview build: `build OK`,2026-10-27T21:39:19Z.
Authenticated visual verification and real hosted hide/show/readback are unavailable because this external Supabase connection has no managed browser session (`external_unmanaged`). No real member posts or ownership claims were invented, and no signed-in end-to-end verification is claimed.

No SQL, migrations/migration files, deployed RPC/edge changes, feed_config changes, cap changes, native or Median configuration changes.