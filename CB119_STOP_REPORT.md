# CB119 — stop report

## Status: STOPPED on one test the brief does not explicitly authorise

`src/test/cb109MediaFirstEverywhere.test.tsx:70` — `CB109 media-first everywhere > PostsTabContent defaults to mediaFirst for a business profile`
`AssertionError: expected '/**\n * BusinessProfilePage - Phase 1…' to match /<PostsTabContent\s+actorType="busines…/`

Cause: the assertion reads the page source for a direct `<PostsTabContent actorType="business"` — the call inside the deleted non-club Posts tab (`renderTab`). The page now renders posts only through `ClubFromTheClub` (which calls `PostsTabContent` with `layout="mediaFirst"`). CB119 names cb107/108/112/118 for retargeting; cb109 is not named and the assertion is about the media-first default, so it is left unedited. Ruling needed: e.g. retarget the business case to `src/components/business/ClubFromTheClub.tsx`.

## Full suite
- Last green: 3,816 / 418 files.
- This run: 3,830 passed / 2 failed / 3,832 across 419 files (before the authorised cb117 retarget). After it: only the cb109 failure remains (cb117 + cb109 file run: 30 passed / 1 failed).
- Delta +16: new `cb119BusinessPosts.test.tsx` (16 tests: 5 component, 4 page incl. 6-category `it.each` = 9, 1 club, 1 skeleton). No tests deleted.
- No pre-existing failures.

## Changes
- `ClubFromTheClub.tsx`: optional `title` (default "From the club") and `emptyName` (default `courseActivityClubName(businessName)`); non-club title nowrap/ellipsis/min-width 0, count `flex: none`; `data-club-feed-title` only when `title` is passed, so club DOM is unchanged. New `scrollToBusinessFeed()` (same top-chrome offset as the nearby card).
- `BusinessProfilePage.tsx`: non-club `ClubFromTheClub` directly after Visiting / Contact, `title="From {name}"`, `emptyName={name}`, `onPost={bizTeam?.onPost}` — the hero's own non-club team gate (`clubTeam` is the club hero's; its post gate is the same `clubTeamGates(...).post`). Removed tabs row, tab container, `renderTab`, `activeTab` + effect, `tabsRef`, `BusinessTab`, `RailChips`/`PostsTabContent`/`BusinessTeamTab`/`cn` imports. Posts figures (standard and coach strips) call `scrollToBusinessFeed`. Skeleton `tabs={0}`.
- **`business_tab_changed` no longer fires.**
- `ProfileSurfaceSkeleton.tsx`: no tab row when `tabs` is 0; `data-skeleton-tabs` marker; personal default 3 unchanged.
- **Deleted** `src/components/business/BusinessProfileInfo.tsx` — no other callers (only test mocks and a comment in `openingHours.ts`, now pointing to ClubVisiting). It had no dedicated tests. Removed its `vi.mock` line from cb103, cb107, cb108, cb112, cb118.
- `BusinessTeamTab` kept (Visiting sheet).

## Retargeted tests (old → new, reason: non-club tabs removed by CB119)
- cb107 `a non-club adds Visiting contacts while keeping its About and Posts tabs` → `… with no tabs; From {name} follows Visiting` (About/Posts tab clicks → no tablist/About, feed follows Visiting).
- cb108 `a non-club profile keeps its tabs` → `a non-club profile has no tabs and ends with From {name}`.
- cb112 `Followers tap navigates; Posts tap selects the Posts tab` → `… Posts tap scrolls to From {name}`.
- cb118 `page places the card directly after mentions and before unchanged tabs …` → `… before From {name} …`; `courses query error keeps the existing non-club fallback` and `business without club_id never waits …` (names unchanged): `tab About` present → absent, feed present.
- cb117 `page places nonclub rail after followers and before tabs …` → `… before Visiting …` (asserted `data-business-tabs`).
Club assertions unchanged throughout.

No SQL, migrations, RPC/edge, feed_config, cap or native changes. Visual preview unchecked (no signed-in session).
