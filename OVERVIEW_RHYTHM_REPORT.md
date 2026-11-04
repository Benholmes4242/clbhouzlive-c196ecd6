# Overview rhythm

## Delivered
- Coming up and Also this week share `selectOverviewEventsAbove` through `useOverviewEventsAbove`: every hero slide ID, of any type, and every displayed week ID are excluded. Also this week's existing eligibility, viewed-event exclusion and four-event cap are preserved.
- Coming up requests 12 events, sorts start date ascending, then purse descending (missing last), then canonical tour order, and shows next plus at most four rows. Sorting also happens before the hook's twelve-event truncation. The hook already enforced a twelve-event minimum; this change makes the component request explicit.
- Existing ComingUpNext appearance, defending line and actions are unchanged. Its shared Kicker already supplied conditional comingTag chips; no duplicate kicker implementation was needed.
- OverviewPhotoSlot accepts `OverviewSlotContent` and reuses StoryBand/HeroStory. Its story selection uses the News-lensed list, the same seven-day/photo freshness rule, first-band exclusion, freshest different-tour preference and freshest-any fallback. No sponsored code exists.
- Slot is between Coming up and World rankings. The page's 32px stack gap owns both seams; StoryBand's original 26px margin is retained only on the first band. Null content or failed photos render no flex item.
- News excludes both band IDs and retains hero + two features + three rows maximum. First band, hero, picks, week, rankings and News appearance/order remain otherwise unchanged.

## Tests and exact existing changes
No test was deleted. One existing test was renamed; all other names/counts remain unchanged.

1. `src/test/tourOverviewDesignA.test.ts`:
   - Old name: **keeps the first six chronological events and does not stretch a two-event source**.
   - New name: **keeps next plus four chronological events and does not stretch a two-event source**.
   - Old assertion: `expect(selectComingUpRail(rows, 'event-1').map((row) => row.id)).toEqual(['event-0', 'event-2', 'event-3', 'event-4', 'event-5', 'event-6']);`
   - New assertion: `expect(selectComingUpRail(rows, ['event-1']).map((row) => row.id)).toEqual(['event-0', 'event-2', 'event-3', 'event-4', 'event-5']);`
   - Why: the brief explicitly requires next plus at most four and list-based exclusions. The two-event assertion is unchanged.
2. Same file, **never repeats the band story in News**:
   - Setup only: `selectOverviewNews(stories, 'band')` → `selectOverviewNews(stories, ['band'])`.
   - Assertions unchanged: `expect(news.hero?.id).toBe('lead');` and the shown IDs `.not.toContain('band')`.
   - Why: requested list-based exclusion API; test count unchanged.
3. `src/test/comingUpSection.test.tsx`, **exclusion applies before five-event cap**:
   - Setup only: `<ComingUp tour="lpga" excludeId="other"/>` → `<ComingUp tour="lpga" excludeIds={['other']}/>`.
   - Assertion unchanged: `expect(container.querySelector('[data-coming-next]')).toHaveAttribute('data-coming-next','next');`.
   - Why: list-based exclusions; test count unchanged.

### New cases: src/test/overviewRhythm.test.tsx (22)
1. excludes every hero slide type and every displayed Also this week id
2. orders dates before purse size
3. puts the biggest same-day purse first and missing purse last
4. uses canonical tour order for equal purses
5. fills the next panel and four rows after all above-page exclusions
6. passes the selected tour lens unchanged to the twelve-event read
7. next kicker includes a tag when comingTag supplies one
8. next kicker omits the chip when comingTag is absent
9. catalogue sorts same-day purse ties before its twelve-event cap
10. prefers the freshest different-tour story even over a newer same-tour story
11. falls back to the freshest any-tour story
12. excludes the first band story
13. excludes stories older than seven days
14. includes a story exactly seven days old
15. withholds future and undated stories
16. withholds unphotographed stories
17. empty content leaves no slot element between its siblings
18. failed photo removes the shared band without an empty flex item
19. News excludes both bands while keeping six-story composition
20. page order is hero band week coming-up slot rankings News
21. slot uses the News tour lens while first band selection stays unchanged
22. page has no slot when no fresh unused story remains

## Verification
Focused command:
`bunx vitest run src/test/overviewRhythm.test.tsx src/test/tourOverviewDesignA.test.ts src/test/comingUpSection.test.tsx src/test/comingUpReads.test.ts src/test/alsoWeekSection.test.tsx src/test/alsoWeekRebuild.test.tsx src/test/alsoWeekReads.test.ts src/test/overviewNewsN1.test.tsx src/test/overviewNewsRebuild.test.tsx src/features/tourhub/overview/sections/__tests__/ComingUp.test.tsx --maxWorkers=2`

**253/253 passed across 10 files.** Existing React act warnings and outdated Browserslist notice remain warnings, not test failures.

Full command per shard: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed | Executed | Files | Failures |
|---|---:|---:|---:|---:|
| 1 | 1,705 | 1,705 | 146 | 0 |
| 2 | 1,569 | 1,569 | 146 | 0 |
| 3 | 1,675 | 1,675 | 146 | 0 |
| 4 | 1,676 | 1,676 | 146 | 0 |
| Total | **6,625** | **6,625** | **584** | **0** |

Previous reported baseline: **6,603 / 583** in FIX_UPLOAD_PLAYER_1_REPORT.md. Delta **+22 tests / +1 file**, entirely overviewRhythm.test.tsx. Existing rewritten/setup-only cases add/remove zero tests. Shard allocations changed with the added file; total reconciles exactly. No pre-existing or unexpected failures observed; no unhandled-error summary. Full outputs retained in `docs/verification/overview-rhythm/focused.log` and `shard-1.log` through `shard-4.log`.

Latest observed automatic build: **2026-11-04T09:06:31Z — build OK**. No manual build/typecheck run.

## Real-page observations and limits
Playwright checked `/tourhub` at 390×844 and 1280×1800 with real reads. Both showed the DP World Tour Championship first ($10m), its SEASON FINALE chip, then Austin ($6m), ANNIKA ($3.3m), Charles Schwab ($3m), CME ($11m, later date). The Yamashita Maybank photo loaded in the new slot before rankings; News's first ID differed from both band IDs. No page errors were captured.

The existing mobile guest shade covers lower content and blocks interaction; it was not dismissed, hidden or bypassed. External-unmanaged authentication makes signed-in end-to-end checks unavailable. Public rendering/real-read evidence is not authenticated interaction sign-off.

Screenshots inspected under `/tmp/browser/overview-rhythm/`: `390-start.png`, `390-slot.png`, `390-coming.png`, `1280-start.png`, `1280-slot.png`, `1280-coming.png`. Script and full observations: `check_overview.py`, `results.log`.

### Frozen mock/data differences, not silently adopted
- Mock shows a 480px band and additional bottom kicker; canonical StoryBand/HeroStory is 340px, existing headline/deck treatment and 24px inset. The brief explicitly says reuse the same band and preserve signed-off component looks, so the shared build remains authoritative.
- Mock's hand-picked rows omit ANNIKA and CME; real date/purse rules include them ahead of later RSM/Skins rows. No IDs were hardcoded to reproduce a dated example.
- Real Earth Course yardage is 7,675, not mock 7,706; winning share is absent and therefore omitted. Defending history did not supply the mock's −18/playoff details, so existing defending-only fallback remains. No figures invented.
- Yamashita reads YESTERDAY from the live published timestamp, not mock's 2 DAYS AGO. Existing age formatter is unchanged.

## Scope
No SQL, migration, migration file, deployed RPC/edge-function, feed_config, round_pool_cap, native or Median change. Guest restrictions, review wizard and round plots untouched. News changes are only the explicitly requested Overview exclusion API/composition; standalone News page and shared HeroStory untouched.