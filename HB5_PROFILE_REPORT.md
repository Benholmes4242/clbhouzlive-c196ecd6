# HB5 Profile header — completed report

## Implementation
- Only `/profile` and bare `/profile/:id` opt into history back with `/` fallback, soft fade, bleed and folding squircles. Resolved dark glass reuses existing HB4 behavior.
- `ProfilePageV2` observes the full display name only while the actual hero is ready, on the two permitted route shapes. Optional `nameRef` passes through `ProfileHero` to the real heading in `ProfileCoverBand`.
- Brief path clarification: `HeroShell` no longer renders personal profiles. The actual anchor is in `ProfileCoverBand`; no HeroShell change or visual hero/content change was made.
- `IslandBackCapsule`, `useIslandBackName`, `islandBackNameStore`, `islandBoundary`, fitting logic and shared styles are untouched.
- No guest browsing, review wizard, news, round plot, SQL, migrations, deployed function/RPC, feed_config or native/Median changes. round_pool_cap unchanged at30.

## Historical STOP — cleared by authorized route-only correction
Original full output retained at `/tmp/hb5/shard4.log` and `/tmp/hb5/shard4-original-failure.log`. No correction was made until the user's explicit authorization.

```text
FAIL src/test/tourOverviewBand.test.tsx > Tour overview band > other routes have no opt-in fade and retain canonical glass
AssertionError: expected <div aria-hidden="true" …(2)></div> to be null
❯ src/test/tourOverviewBand.test.tsx:67:40
65| it('other routes have no opt-in fade and retain canonical glass', ()…
66|   mount('/profile/ben');
67|   expect(layer('island-scrim-soft')).toBeNull();
```

The case's intent remains unchanged: a non-header-B route has no soft fade and retains canonical logo glass without a transition. The stale profile example was changed to `/discover` only, under the user's 16:43 UTC authorization. All assertions and the case name are unchanged. No pre-existing failing test was observed against the last green baseline. Existing act warnings and Browserslist staleness warnings are not Vitest unhandled errors.

Exact authorized diff in `src/test/tourOverviewBand.test.tsx`:
```diff
   it('other routes have no opt-in fade and retain canonical glass', () => {
-    mount('/profile/ben');
+    mount('/discover');
     expect(layer('island-scrim-soft')).toBeNull();
     const left = document.querySelector<HTMLElement>('[aria-label="Go to home"]');
     expect(left?.style.background).toBe('rgba(14, 14, 16, 0.84)');
     expect(left?.style.transition).toBe('');
   });
```

## Tests and inventory
Focused command:
`bunx vitest run src/test/hb5ProfileBackName.test.tsx src/test/hb4CourseBackName.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/profileHeroClubWhite.test.tsx src/test/cr2CreatorProfile.test.tsx --maxWorkers=2`

Result54/54 across6 files, including13 new HB5 cases. Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, N=1,2,3,4.

| Shard | Passed | Failed | Files |
|---|---:|---:|---:|
|1|1594|0|141|
|2|1520|0|141|
|3|1558|0|141|
|4 rerun|1619|0|139|
|Total|6291|0|562|

Final result6291/6291 tests, zero failures and zero Vitest unhandled errors. Shards1–3 are the preserved original green runs; only shard4 was rerun with `bunx vitest run --maxWorkers=2 --shard=4/4`, as requested (1619/1619; `/tmp/hb5/shard4-rerun.log`). Before: HB4 green6278 tests/561 files. After:6291 tests/562 files (+13/+1 solely `hb5ProfileBackName.test.tsx`); no deletions, two rewritten/renamed existing cases plus one route-only fixture correction, no count change in those files. The correction adds/removes zero tests.

New cases (13):
1–2. opts `/profile` and `/profile/abc` into soft folding history-back chrome.
3. starts arrow-only and observes the real cover heading.
4. goes back through history.
5. falls back to home without history.
6. shows the full name only past the heading while open and hides when folded or returned.
7. fits the unchanged full long display name to13px.
8. clears the published name on unmount.
9–12. keeps followers, following, quest and edit out of soft folding chrome.
13. preserves business profile logo and nonfolding chrome.

Authorized existing changes, quoted:
- `headerB1.test.tsx`: “non-opted profile remains byte-identical when the nav signal changes” → “HB5 profile folds when the nav signal changes”. `expect(container.innerHTML).toBe(before)` replaced by `expect(back).toHaveAttribute('data-condensed', 'false')` then after scroll `expect(back).toHaveAttribute('data-condensed', 'true')`. Reason: profile roots now explicitly fold instead of remaining non-opted.
- `islandSquircle.test.tsx`: “a non-condense island route keeps the fully round23px radius” → “a profile island route uses the HB5 squircle radius”. Both `expect(right?.style.borderRadius).toBe('23px')` become `toBe('16px')`. Reason: HB5 explicitly changes profile island geometry.

## Browser evidence and limitations
- Chromium real-component fixture390×844, `--sat:47px`: top arrow-only box46×46, top57px,16px radius and computed `rgba(14, 14, 16, 0.55)` verified.
- Down600: folded=true, named=false,46×46 at top57px, computed `rgba(14, 14, 16, 0.84)`.
- Up to550, with hero name above islands: folded=false, named=true,161.453125×46 at top57px, accessible label `Back from Chris Leeson`, rest glass0.55. The full visible name remains unchanged.
- Successful screenshots `/tmp/browser/hb5/top.png`, `folded.png`, `named.png` replaced the earlier unverified captures and were visually inspected. Final run `/tmp/browser/hb5/bundled-result.log`: zero page errors; concrete state assertions passed.
- This is a browser-only fixture using unchanged actual `ProfileCoverBand`, `IslandBackCapsule`, `useIslandBackName`, registry and nav store; it is not a hosted authenticated profile. Dependencies bundled only under `/tmp/browser/hb5` to give all components one React/store instance. The fixture loads actual island-back CSS and existing material values, and does not reproduce the full right capsule or soft fade. No product fixture hooks were added.
- Signed-off mock scrolled600/550: `phone ph c named` then `phone ph named`; screenshots `mock-top.png`, `mock-folded.png`, `mock-named.png` captured. Mock script's `const chrome` isolated only in browser text to avoid Chromium global conflict; upload untouched.
- Historical fixture retries included module export/router identities, a still-connected cached old root, duplicated runtime stores and fixed-position trapping from will-change on the artificial parent. Final standalone bundle removes those apparatus issues; actual scroll drives the shared store and observer, no state is forced. One bundled JSX setup error (`React is not defined`) was corrected by matching the app's automatic JSX transform. These were fixture faults, not product changes.
- Hosted authenticated profile check unavailable (`external_unmanaged`). No auth bypass or settings claims.

## Build
Latest automatic build observed: `=== build 2026-11-03T16:43:35Z ===` / `build OK`. No manual project build/typecheck run (environment disallows them); only a temporary browser fixture was bundled.

## Files touched
Product: `src/features/chrome-v2/registry.ts`, `src/pages/ProfilePageV2.tsx`, `src/components/profile/hero/ProfileHero.tsx`, `src/components/profile/hero/ProfileCoverBand.tsx`.
Tests: `src/test/hb5ProfileBackName.test.tsx` (new), `src/test/headerB1.test.tsx`, `src/test/islandSquircle.test.tsx`, `src/test/tourOverviewBand.test.tsx` (authorized route-only correction).
Documentation: `HB5_PROFILE_REPORT.md` (new), `roadmap.md`; memory `mem://features/chrome/hb5-profile.md` and index. Browser scripts/logs/screenshots only under `/tmp/browser/hb5`; full test logs `/tmp/hb5`.

HB5 implementation, requested route-only correction, all four green shard counts and three browser fixture states are complete. Hosted authenticated profile proof remains unavailable because this project has external unmanaged authentication; no credentials or bypass were used.