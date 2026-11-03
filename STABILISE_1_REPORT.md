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
- Last fully green four-shard total: 6,041 tests (Tour overview hairline fix). Several later reports quote higher figures (including tournament picks build 2 at 6,168, HB2 at 6,262 and NAV_SQ1 at 6,298), but those were never reconciled one by one against 6,041 in this chain. The earlier shard runs aren't kept, so the +408 in between can't be traced test by test here.
- Last fully green run before G2C: NAV_SQ1's 6,298 tests in 564 files. Additions since, by brief: HB6 +?, G2A +?, G2B +?, G2C +7, G2D +9, G2E +7, G2F +9.
- G2C to G2F estimated their totals by counting test files, not from a green run; G2F's estimate was 6,449 tests in 574 files. This run confirms exactly 6,449 tests in 574 files, so those estimates were right.
- STABILISE_1 added or removed no tests (+0); it only edited the seven named cases above.

## Browser checks (Chromium, 390×844, live preview)
Signed-in checks are unavailable: sign-in here is `external_unmanaged`, so no session can be created for testing. Signed-out:
- `/tourhub`: soft fade 390×96 and squircle islands 366×46; the bottom bar narrows from 368 to 324 px when scrolled.
- **G2B, attempted again on the live page instead of a separate test bundle:** `/tourhub/tournament/fa65c3bc-…` (VidantaWorld Mexico Open, opened from the hero) shows a full-width photo and the bold white title. Scrolling down folds the back button to a 46px square and hides Log in.
- G2B player page `/tourhub/player/d5e38599-…` (Steven Fisk, opened from a leaderboard row through the Profile pill): after scrolling down and then back up, the back button widens to 149px, labelled "Steven Fisk" / aria "Back from Steven Fisk". Its name comes from the page's own h1.
- `/rounds`, `/watch/region/scotland`, `/find-people` and `/notificationmessages` redirect a signed-out visitor to `/`, so G2C, G2D, G2E and G2F rest on the Chromium fixture checks recorded in their own reports. `/courses/x` (G2A) needs a real course id plus sign-in; not checked live.
- The old test bundle was blocked by `siLadder.ts` and `SiLadder.tsx` having the same name apart from capitalisation, in `src/features/courses/_shared/`. That is still the case and was left alone as ruled; the live-page check replaces the bundle.
- Screenshots were saved under `/tmp/browser/stab/` (temporary, cleared when the sandbox restarts).

Untouched: guest browsing, review wizard, news, round plots, SQL/migrations, RPCs/edge functions, feed_config, round_pool_cap (30), native/Median.
