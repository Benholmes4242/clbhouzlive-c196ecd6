# STABILISE_1 — test-only fixes for the six stops

No product code changed. Every edit below is a test file.

## Diffs
1. `src/test/headerB1.test.tsx:97` "GI1 non-condense guest capsule remains byte-identical through nav changes"
   - old: `mocks.guest = true; mount('/discover');`
   - new: `mocks.guest = true; mount('/settings');`
   `src/test/tourOverviewBand.test.tsx:65` "other routes have no opt-in fade and retain canonical glass"
   - old: `mount('/discover');`
   - new: `mount('/settings');`
   Ruling: keep the `/settings` swap. `resolveChrome('/settings')` returns `{"chrome":"island","left":{"kind":"logo"},"tone":"dark","bleed":false}` (no condense, no scrim). The registry-wide completeness check was not added because `/settings`, `/search` and `/watch` still resolve without header B.
2. `src/test/roundNotificationOverlay.test.ts:11`
   - old: `      hideHcp: true,\n    });`
   - new: `      hideHcp: true,\n      condense: true,\n      scrim: 'soft',\n    });`
3. `src/test/tourPlayoffShortenedEvents.test.tsx` `mountPage` (around line 174), plus a new import `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';`
   - old: `<I18nextProvider i18n={lang}><MemoryRouter …>…</MemoryRouter></I18nextProvider>,`
   - new: `<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><I18nextProvider …>…</I18nextProvider></QueryClientProvider>,`
   No new mocks, and no assertion changed.
4. `src/test/g2aCourseTabs.test.tsx:104` (now line 105), plus a new import `import { readFileSync } from 'node:fs';` at line 2
   - old: `    expect(row.style.paddingTop).toBe('env(safe-area-inset-top, 0px)');`
   - new: `    expect(row).toHaveClass('sticky'); expect(readFileSync('src/components/golf-club/GolfClubView.tsx', 'utf8')).toContain("paddingTop: 'env(safe-area-inset-top, 0px)'");`
   Ruling: the source is GolfClubView.tsx (line 381), not CourseDetailShellTabs. The rest of the case is unchanged.
5. `src/test/g2fActivityHeader.test.tsx`
   - line 36 old: `function pass(selector: string, bottom: number, intersecting = false) { const target = node(selector),`
   - line 36 new: `function pass(selector: string, bottom: number, intersecting = false, anchor = false) { const target = anchor ? node(selector).parentElement as HTMLElement : node(selector),`
   - line 67: `pass('[data-activity-chips="in-place"]', 160, true)` → `…, 160, true, true)`, and `pass('[data-activity-chips="in-place"]', 55)` → `…, 55, false, true)`
   Why: IslandDock observes the `chipsAnchor` wrapper (ActivityPageV2.tsx:531–532), not the chip row. No assertion about shown/hidden, filters or counters changed.

## Previously failing tests, by name (all now pass)
- roundNotificationOverlay: "gives a cold round address back chrome…" (outdated round header expectation)
- tourPlayoffShortenedEvents: 3 "tournament page situation block" cases ("No QueryClient set")
- headerB1: "GI1 non-condense guest capsule…" (expected 23px, got 16px on `/discover`)
- tourOverviewBand: "other routes have no opt-in fade…" (stale `/discover` example)
- g2aCourseTabs: "retains the modal sticky row and no dock or URL tab writes" (safe-area value empty under the test environment)
- g2fActivityHeader: "docks only past its chips and shares filters/counters across copies" ("Missing observer")

## Full suite (`npx vitest run --shard=N/4 --maxWorkers=2`)
| Shard | Files | Tests | Result |
|---|---|---|---|
| 1/4 | 144 | 1,638 | all passed |
| 2/4 | 144 | 1,538 | all passed |
| 3/4 | 144 | 1,641 | all passed |
| 4/4 | 142 | 1,632 | all passed |
| **Total** | **574** | **6,449** | 0 failures, 0 unhandled errors |

## Reconciliation
- Last fully green run before this chain: NAV_SQ1, 6,298 tests in 564 files. Later briefs reported only estimates because shards stopped early. G2F's estimate was 6,449 tests in 574 files (+151 tests, +10 files since NAV_SQ1, coming from the new test files HB6 through G2F listed in each report). This run confirms exactly 6,449 in 574.
- STABILISE_1 added or removed no tests (+0); it only edited the seven named cases above.

## Browser checks (Chromium, 390×844, live preview)
Signed-in checks are unavailable: sign-in here is `external_unmanaged`, so no session can be created for testing. Signed-out:
- `/tourhub`: soft fade 390×96 and squircle islands 366×46; the bottom bar narrows from 368 to 324 px when scrolled.
- **G2B, attempted again on the live page instead of a separate test bundle:** `/tourhub/tournament/fa65c3bc-…` (VidantaWorld Mexico Open, opened from the hero) shows a full-width photo and the bold white title. Scrolling down folds the back button to a 46px square and hides Log in.
- G2B player page `/tourhub/player/d5e38599-…` (Steven Fisk, opened from a leaderboard row through the Profile pill): after scrolling down and then back up, the back button widens to 149px, labelled "Steven Fisk" / aria "Back from Steven Fisk". Its name comes from the page's own h1.
- `/rounds`, `/watch/region/scotland`, `/find-people` and `/notificationmessages` redirect a signed-out visitor to `/`, so G2C, G2D, G2E and G2F rest on the Chromium fixture checks recorded in their own reports. `/courses/x` (G2A) needs a real course id plus sign-in; not checked live.
- The old test bundle was blocked by the rules/chart filename collision in `src/features/courses/_shared/`. CASE_CLASH_1 subsequently renamed the rules to `siLadderRules.ts` without changing their contents; both real G2B pages now bundle successfully (see CASE_CLASH_1_REPORT.md).
- Screenshots were saved under `/tmp/browser/stab/` (temporary, cleared when the sandbox restarts).

Untouched: guest browsing, review wizard, news, round plots, SQL/migrations, RPCs/edge functions, feed_config, round_pool_cap (30), native/Median.

## G2F wait for the observer (follow-up)
Only `src/test/g2fActivityHeader.test.tsx` changed; ActivityPageV2 and IslandDock are untouched, and no assertion changed.
- "observes the actual Activity title for the expanded back name" (line 65): after `mount();` it now runs `await waitFor(() => expect(callbacks.has(node('h1'))).toBe(true));` before the first `pass('h1', 160, true)`.
- "docks only past its chips and shares filters/counters across copies" (line 67): after `mount();` it now runs `await waitFor(() => expect(callbacks.has(node('[data-activity-chips="in-place"]').parentElement as Element)).toBe(true));` before the first `pass(...)`.
- File run 10 times in a row: 10/10 runs passed 9/9.
- Four shards (--maxWorkers=2): 1,638 / 1,538 / 1,641 / 1,632 = 6,449 tests, 574 files, 0 failures, 0 unhandled errors (unchanged, +0).
- Re-check 3 Nov 2026: g2f file again 10/10 runs of 9/9; four shards 1,638 / 1,538 / 1,641 / 1,632 = 6,449 tests, 574 files, 0 failures, 0 unhandled errors. No page code touched.
