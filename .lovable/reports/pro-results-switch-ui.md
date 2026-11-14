# BRIEF_PRO_RESULTS_SWITCH_UI — build report

When a tour pro turns "Show my tour results" off, his profile renders to every
viewer but himself exactly like a pro with no results yet, and the client stops
asking the per-member-ungated public tour feed. No SQL, no migrations,
feed_config untouched.

## Files changed

- `src/features/pro-verification/useProResultsVisible.ts` (new) — the one
  source of truth. Owner is always visible with no read; otherwise
  `rpc('pro_results_visible', { p_user: userId })` under query key
  `['pro-profile', 'results-visible', userId]`, so useShowTourResults'
  existing `['pro-profile']` invalidation refreshes it. Fail closed: loading
  or error means `visible: false`; `settled` is true only after a successful
  read.
- `src/features/pro-profile/ProProfileBuildOne.tsx` — `showResults` from the
  hook gates: `''` player id into usePlayerSeasonResults / useLinkedProLive /
  useLinkedProStats (no tour-feed read at all); no headline (neither world
  rank nor BEST FINISH fallback); hero counters are FOLLOWERS and FRIENDS
  only; no LinkedLiveCard, ProSeasonSection or HowProPlays; ProCollectionSections
  gets `showCareer={false}`. While visibility loads for a visitor, none of the
  results sections render (no flash).
- `src/features/pro-profile/ProCollectionSections.tsx` — new optional
  `showCareer` prop (default true) hides the whole CAREER section; IN THE BAG
  and PARTNERS unchanged.
- `src/pages/ProfilePageV2.tsx` — `showTourTab = isPersonal && proTabs.tour &&
  (isSelf || visible)`; the tour → activity redirect effect also waits for the
  visibility read to settle (alongside profilePros.isLoading), so a deep link
  to `?tab=tour` is not bounced in flight; `onSeeAllResults` is gated on the
  same flag.

## Tests

New files (7 tests, all passing):

- `src/test/proResultsSwitch.test.tsx` (5) — visitor + switch off: no
  rpc-dependent sections, feed hooks receive `''`, no headline, counters
  FOLLOWERS/FRIENDS only, no Career, bag and partners still show; visitor +
  switch on: as today; owner + switch off: everything shows and
  pro_results_visible is never called; visibility loading: no results
  sections; RPC error: fail closed.
- `src/test/proResultsSwitchPage.test.tsx` (2) — a deep link to `?tab=tour`
  waits for the read to settle, then redirects to activity only when not
  visible, and keeps the Tour tab when visible.

Mock-only additions to existing tests (authorised by the brief; no assertions
changed):

- `src/test/proProfileBuildOne.test.tsx` — added
  `vi.mock('@/features/pro-verification/useProResultsVisible', …)` returning
  `{ visible: true, settled: true }`.
- `src/test/proProfileBuildOneB.test.tsx` — same mock-only addition.

No existing test was deleted, renamed or rewritten; no assertion changed.

## Shard totals

Baseline 8,707 → 8,714 (+7 new tests). All four app shards pass, each run as
its own command:

- Shard 1/4: 2,226 passed
- Shard 2/4: 2,086 passed
- Shard 3/4: 2,195 passed
- Shard 4/4: 2,207 passed

## Unchanged on purpose (brief §4)

The owner's own view (always everything), the PRO badge, bag, partners, Ask
and posts, the AllCoursesList tour courses (server-gated), and the TourHub
player page.

## Not verified

The pro_results_visible rpc itself is Ben's database work; no real-device or
authenticated end-to-end check was run (external unmanaged Supabase).
