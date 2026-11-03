# HB5 Profile header — STOP report

## Implementation
- Only `/profile` and bare `/profile/:id` opt into history back with `/` fallback, soft fade, bleed and folding squircles. Resolved dark glass reuses existing HB4 behavior.
- `ProfilePageV2` observes the full display name only while the actual hero is ready, on the two permitted route shapes. Optional `nameRef` passes through `ProfileHero` to the real heading in `ProfileCoverBand`.
- Brief path clarification: `HeroShell` no longer renders personal profiles. The actual anchor is in `ProfileCoverBand`; no HeroShell change or visual hero/content change was made.
- `IslandBackCapsule`, `useIslandBackName`, `islandBackNameStore`, `islandBoundary`, fitting logic and shared styles are untouched.
- No guest browsing, review wizard, news, round plot, SQL, migrations, deployed function/RPC, feed_config or native/Median changes. round_pool_cap unchanged at30.

## STOP: new full-suite failure
Full output retained at `/tmp/hb5/shard4.log`. No correction or rerun after failure.

```text
FAIL src/test/tourOverviewBand.test.tsx > Tour overview band > other routes have no opt-in fade and retain canonical glass
AssertionError: expected <div aria-hidden="true" …(2)></div> to be null
❯ src/test/tourOverviewBand.test.tsx:67:40
65| it('other routes have no opt-in fade and retain canonical glass', ()…
66|   mount('/profile/ben');
67|   expect(layer('island-scrim-soft')).toBeNull();
```

This existing case still expects profiles to have no soft fade, conflicting with HB5's requested fade. The brief only explicitly authorizes existing no-back/logo assertions and two partial-mock/hidden-query corrections; this fade assertion was not changed. No pre-existing failing test was observed against the last green baseline. Existing act warnings and Browserslist staleness warnings are not Vitest unhandled errors.

## Tests and inventory
Focused command:
`bunx vitest run src/test/hb5ProfileBackName.test.tsx src/test/hb4CourseBackName.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/profileHeroClubWhite.test.tsx src/test/cr2CreatorProfile.test.tsx --maxWorkers=2`

Result54/54 across6 files, including13 new HB5 cases. Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, N=1,2,3,4.

| Shard | Passed | Failed | Files |
|---|---:|---:|---:|
|1|1594|0|141|
|2|1520|0|141|
|3|1558|0|141|
|4|1618|1|139|
|Total|6290|1|562|

Executed6291 tests, zero Vitest unhandled errors. Before: HB4 green6278 tests/561 files. After:6291 tests/562 files (+13/+1 solely `hb5ProfileBackName.test.tsx`); no deletions, two rewritten/renamed existing cases, no count change in those files.

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
- Chromium fixture390×844, `--sat:47px`: top arrow-only box46×46, top57px,16px radius and computed `rgba(14, 14, 16, 0.55)` verified.
- `/tmp/browser/hb5/top.png`, `folded.png`, `named.png` exist but the latter two did NOT verify folding/name expansion. Latest fixture scrolled600/550 but remained expanded/unnamed; browser fixture wiring is unresolved. Do not treat filenames as proof.
- Signed-off mock scrolled600/550: `phone ph c named` then `phone ph named`; screenshots `mock-top.png`, `mock-folded.png`, `mock-named.png` captured. Mock script's `const chrome` isolated only in browser text to avoid Chromium global conflict; upload untouched.
- Browser setup retries: default module exports, router instance query-version, fixed-container geometry and standalone shell. Initial router errors were fixture-only. Latest run had zero page errors, but fold/name state remains unverified. Stop after the suite failure; no further fixture work.
- Hosted authenticated profile check unavailable (`external_unmanaged`). No auth bypass or settings claims.

## Build
Latest automatic build observed: `=== build 2026-11-03T16:34:25Z ===` / `build OK`. No manual build/typecheck run (environment disallows them).

## Files touched
Product: `src/features/chrome-v2/registry.ts`, `src/pages/ProfilePageV2.tsx`, `src/components/profile/hero/ProfileHero.tsx`, `src/components/profile/hero/ProfileCoverBand.tsx`.
Tests: `src/test/hb5ProfileBackName.test.tsx` (new), `src/test/headerB1.test.tsx`, `src/test/islandSquircle.test.tsx`.
Documentation: `HB5_PROFILE_REPORT.md` (new), `roadmap.md`; memory `mem://features/chrome/hb5-profile.md` and index. Browser scripts/logs/screenshots only under `/tmp/browser/hb5`; full test logs `/tmp/hb5`.

Remaining: ruling on the fade assertion, passing rerun/full-suite confirmation, successful folded/named fixture screenshots and authenticated profile proof.