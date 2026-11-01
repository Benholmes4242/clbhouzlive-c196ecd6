# Tour News — approved test-only observer fix

## Diff and assertion preservation
Only application test source changed: `src/test/overviewNewsRebuild.test.tsx`.
- Saved `const original = window.IntersectionObserver`.
- Both `vi.stubGlobal('IntersectionObserver', class …)` installations → direct `window.IntersectionObserver = class … as unknown as typeof window.IntersectionObserver` assignment.
- Removed both `vi.unstubAllGlobals()` calls; `afterEach` restores the original observer together with the existing cleanup, mock restoration and `vi.useRealTimers()`.
- No setup, component, data hook, locale, configuration or other test changes.

The three authorized fixture-corrected cases (names unchanged):
- “writes after one second half visible and holds the first baseline”
- “writes after one second half visible and holds the previous baseline”
- “visibility below half cancels the pending baseline”

Their assertion text remains exactly:
```ts
expect(localStorage.getItem(NEWS_LAST_SEEN)).toBe(first?null:String(now.getTime()-1000));
expect(localStorage.getItem(NEWS_LAST_SEEN)).toBe(String(now.getTime()+1000));
expect(r.container.querySelector('section')?.getAttribute('data-new')).toBe(String(!first));
expect(localStorage.getItem(NEWS_LAST_SEEN)).toBeNull();
```
Why: writable-but-nonconfigurable observer accepts assignment, not vi.stubGlobal's property redefinition. An AST extraction compared all **59 exact expect-containing statements** with the pre-edit source: byte-for-byte identical. No tests deleted, renamed or added; this file remains **66 cases**. The old three failures now pass.

## Commands and results
Focused:
`bunx vitest run src/test/overviewNewsRebuild.test.tsx src/test/overviewNewsReads.test.tsx src/test/overviewNewsN1.test.tsx src/test/tourNewsCard.test.tsx src/test/tourOverviewDesignA.test.ts --maxWorkers=2`
**148/148 passed across 5 files**, including all three corrected cases and existing story composition/player-chip visual checks. Existing non-failing React act warnings are not asserted as failures and were not changed.

Full suite: each i=1,2,3,4 launched concurrently:
`bunx vitest run --shard=$i/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/news-observer/suite/shard-$i.json`

| Shard | Passed / executed | Files | Exit |
|---|---:|---:|---:|
| 1 | 1325/1325 | 129 | 0 |
| 2 | 1260/1260 | 129 | 0 |
| 3 | 1396/1396 | 129 | 0 |
| 4 | 1389/1389 | 128 | 0 |
| Total | **5370/5370** | **515** | All passed |

Before this fix: last executed suite **5367 passed / 3 failed / 5370 total, 515 files**. After: **5370 passed / 0 failed / 5370 total, 515 files**. Inventory delta for this task: **0 tests / 0 files**.

Against requested **5238/511 baseline**: **+132 tests / +4 files**, all reconciled:
- `src/test/yc2YourCoursesOpen.test.tsx`: +46/+1.
- `src/test/overviewNewsRebuild.test.tsx`: +66/+1 (this task alters fixtures only).
- `src/test/overviewNewsReads.test.tsx`: +10/+1.
- `src/test/coursesHeroPlaceScrim.test.tsx`: +10/+1.
No loss, deletion or rename. All inherited failures resolved by the expressly approved fix; no new failures.

## Fresh 390×844 screenshot beside mock
Script: `/tmp/browser/news-observer/check_news_comparison.py`.
- Real route: `http://localhost:8080/tourhub`; 390×844 viewport, no guest-gate bypass or injected member/fixture state.
- `/tmp/browser/news-observer/live.png`, `mock.png` and `comparison.png` (live left, signed-off mock right).
- Screenshot inspected: real guest Join card and shade cover News and the fixed top menu occludes the section heading. This is **gated-state evidence, not unobstructed parity**. Existing component visual/composition/player-chip assertions passed in the 148-test focused run; member follow states remain unit-tested only.
- Six story shapes render. Viewport and document scroll width both390; no horizontal overflow. Five photos loaded; one existing remote image reported naturalWidth0. Mock photo areas are colour blocks in the supplied HTML, not replacement imagery shipped in the app.
- No browser page errors observed. Signed-in end-to-end check unavailable (`external_unmanaged`).

Latest automatic preview build: `2026-11-01T16:18:23Z — build OK`. No manual build/typecheck, SQL, migrations, RPC/edge edits, feed_config, round_pool_cap, native/Median configuration or publication.
This report supersedes the open observer stop in TOUR_NEWS_STOP_REPORT.md and the inherited-failure status in COURSES_HERO_PLACE_SCRIM_REPORT.md without rewriting their historical results.