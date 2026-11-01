# Courses hero — place line and scrim

## Result and diff
- `CoursesPageHero.tsx`: `kicker={kickerParts.join(...)}` → `kicker={null}`. Macro-only place → `[primary, secondary].filter(Boolean).join(', ')`, followed by existing list label and unchanged rating-or-round tail, joined with ` · `. `placeColor={A.AMBER}` is passed only here.
- `CourseMasthead.tsx`: optional `placeColor` defaults to existing `PLACE_INK`; place style spreads existing `MASTHEAD_PLACE` and overrides only colour. Font size/weight, single line and ellipsis preserved. GolfClubView is unedited and passes no override.
- `photoScrim.ts`: adds `SCRIM_HERO_TALL = 'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 60%)'` with the requested one-line rationale. Existing `SCRIM_STANDOUT` remains byte-for-byte unchanged at 32%.
- Courses hero keeps its canon wash; an absolute inset-zero tall scrim follows it, before the text container whose existing z-index remains 1. No other hero adopts this token.
- Local ownership comments, root ownership pointer, memory and roadmap updated. Exact source diff captured at `/tmp/courses-hero.diff` (temporary sandbox output).

## Test changes — old → new
No existing test is deleted, renamed, rewritten or assertion-modified. Existing `heroScrimCanon.test.ts` remains four cases with unchanged assertions, including both `not.toContain('rgba(0,0,0,0.78)')` checks.

Added `src/test/coursesHeroPlaceScrim.test.tsx`: absent → 10 cases:
1. Full combined location and round tail below name; no preceding kicker.
2. List label precedes rating; rating still wins over round count.
3–5. Missing primary, missing secondary and both missing omit empty parts/separators.
6. Both locations absent starts with the list when present.
7. Existing 12.5px/600 one-line ellipsis style uses A.AMBER, without uppercase or tracking.
8. Default masthead retains existing ink and GolfClubView does not opt in.
9. Canon wash then tall scrim precede text; overlay geometry/text z-index preserved.
10. Standout recipe exactly unchanged; new token differs only by 32% → 60%.

Real English I18nextProvider and MemoryRouter used; no react-i18next mock.

## Executed checks and full-suite count
Focused command: `bunx vitest run src/test/coursesHeroPlaceScrim.test.tsx src/test/heroScrimCanon.test.ts --maxWorkers=1 --reporter=verbose`.
Result: **14/14 passed across 2 files** (new 10 plus unchanged 4).

Full command, launched for each `i=1,2,3,4` concurrently:
`bunx vitest run --shard=$i/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/courses-hero-suite/shard-$i.json`

| Shard | Executed | Passed | Failed | Files |
|---|---:|---:|---:|---:|
| 1 | 1325 | 1322 | 3 | 129 |
| 2 | 1260 | 1260 | 0 | 129 |
| 3 | 1396 | 1396 | 0 | 129 |
| 4 | 1389 | 1389 | 0 | 128 |
| Total | **5370** | **5367** | **3** | **515** |

No new failures. Full suite is **not green**: the same three inherited News observer failures remain, unchanged and uncorrected.

Before this task: News report's expected inventory **5360/514** (not a completed passing suite). After: actually executed **5370/515**, +10/+1 solely from coursesHeroPlaceScrim.test.tsx.
Last fully passing baseline **5284/512** (YC2): +86/+3 = News overviewNewsRebuild 66/+1, News overviewNewsReads 10/+1, Courses 10/+1. Against 5172/509: +198/+6 = YC1 30/+1, World Rankings 36/+1, YC2 46/+1, News 76/+2, Courses 10/+1.

## Every pre-existing failure
Tool error for each: `TypeError: Cannot redefine property: IntersectionObserver`.
- `src/test/overviewNewsRebuild.test.tsx:43:8`: “device News freshness writes after one second half visible and holds the first baseline”.
- `src/test/overviewNewsRebuild.test.tsx:43:8`: “device News freshness writes after one second half visible and holds the previous baseline”.
- `src/test/overviewNewsRebuild.test.tsx:52:8`: “device News freshness visibility below half cancels the pending baseline”.
Exact runner stack starts `at Function.defineProperty (<anonymous>)`, then `at Object.stubGlobal (file:///dev-server/node_modules/vitest/dist/chunks/vi.bdSIJ99Y.js:3948:11)`, then the case locations above. These match TOUR_NEWS_STOP_REPORT.md. No News fixture/assertion repair or standalone rerun performed.

## Preview and scope
Automatic preview log: `2026-11-01T16:10:39Z — build OK`. No manual build or typecheck.
Authenticated end-to-end Courses photo check remains unavailable: project authentication status `external_unmanaged`. Real member photo/navigation are not claimed browser-verified; fixture component checks cover the requested display.
No SQL, migrations, migration files, RPC/edge changes, feed_config, round_pool_cap or native/Median changes. No publication.