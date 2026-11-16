# Profile rail follow-up — authorised test-only closeout

## Scope and changed assertions
Only `src/test/profileRailFollowup.test.tsx` changed among product/test files. No product code, other tests, SQL, migrations, feed_config or pool-cap changes.

Four cases rewritten under explicit authorisation; none deleted or renamed:
- **time-scaled points preserve 80-day and 10-day proportions**: replaced `expect(line?.coords.map(p=>p.x)).toEqual([0,361*80/90,361])` with `expect(line?.coords).toHaveLength(3)` and each x `toBeCloseTo(x,6)`; equivalent floating-point calculations require tolerance.
- **rail reverses oldest-first data and uses canonical short course names**: replaced `.toBe('Royal County Down')` with `.toBe('Royal County Down (Championship)')` and `.toBe(shortCoursePart('Royal County Down Golf Club (Championship)'))`; the canonical helper correctly retains the variant.
- **member no-photo cover uses the gradient token without SVG** and **business no-photo cover uses the gradient token without SVG**: replaced `expect(cover?.style.background).toBe('var(--profile-fallback-cover-gradient)')` with element/no-SVG checks, `expect(FALLBACK_COVER_GRADIENT).toBe('var(--profile-fallback-cover-gradient)')`, and stylesheet `.toContain('--profile-fallback-cover-gradient: linear-gradient(180deg, #1C2A22 0%, #131B16 58%, #0A0A0C 100%)')`; jsdom discards the variable shorthand.

No other assertions changed. Existing data and mocks unchanged.

## Commands and counts
Focused: `npx vitest run --maxWorkers=2 src/test/profileRailFollowup.test.tsx` — 13/13 passed.

Four separate sequential full-suite commands: `npx vitest run --maxWorkers=2 --shard=N/4`, N=1,2,3,4:

| Shard | Tests passed | Files passed |
|---|---:|---:|
| 1/4 | 2,284 | 195 |
| 2/4 | 2,196 | 195 |
| 3/4 | 2,237 | 195 |
| 4/4 | 2,274 | 193 |
| Total | **8,991** | **778** |

Zero failures or skips. Before this test-only correction the inventory was 8,991, unchanged afterward. Last verified passing baseline was 8,978/777 files; the 13 previously added cases in profileRailFollowup.test.tsx explain the entire +13/+1-file delta. Relative to the original 8,954 baseline, +24 Tour cases and +13 profile cases = +37. Raw logs accompany this report.

## Browser measurements
Actual HeroHandicapDisplay rendered with representative connected data, in own and visitor modes, at 320/375/430. Both round dots measured exactly **8×8 CSS px** at every width; chart widths 288/343/398 respectively. Border radius 50%; computed lowered colour rgb(52,215,127), other colour rgb(248,250,252), canvas halo rgb(10,10,12), 2px. Outside-window round remained in the rail with no chart dot. Zero browser page errors. Screenshot checks confirmed round shapes.

Script: `/tmp/browser/profile-rail-authorised/measure_dots.py`; screenshots: own/other-320/375/430.png in that folder. Measurements saved alongside this report. These are isolated actual-component fixtures, not authenticated member pages: managed sessions are unavailable for this external_unmanaged project. No authenticated end-to-end claim.

Latest preview compilation signal: build OK at 2026-11-16T10:44:30Z. Earlier stop report is retained as history. The unrelated Tour more-row visual recheck remains pending; no product work was undertaken under this test-only authorisation.