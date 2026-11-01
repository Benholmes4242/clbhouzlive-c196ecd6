# Tour Overview News — stop report

## Implemented
- Overview-only opt-in HeroStory/FeatureStory/WorkhorseRow presentation: 470px hero, bottom-owned content, pair/photo/follow marker, rows, details and player chips.
- Device visit helper: first-visit baseline, held prior timestamp, unread/opened IDs, newest-100 cap, try/catch storage and fail-closed indicators.
- Existing Tour story page records successful story reads, covering story entrypoints without changing navigation or News-tab presentation. Overview tap records immediately.
- Data hook observes the existing `tournaments-cache` with `enabled:false` and no tournament query function; hero's deriveHeroState/isInPlayState determine live status. One board read across shown live tournament IDs filtered to story player IDs, 60-second polling; cached follows and one followed-name batch.
- Six locale catalogues updated. Shared section heading unchanged except local News bottom-margin override. Existing storyTime and selector unchanged.

## Stop — exact test failures
Command: `bunx vitest run src/test/overviewNewsRebuild.test.tsx src/test/overviewNewsReads.test.tsx src/test/overviewNewsN1.test.tsx src/test/tourNewsCard.test.tsx src/test/tourOverviewDesignA.test.ts --maxWorkers=2`

Result: **145 passed / 3 failed / 148 total**, five files (four passed, one failed).

All three failures: **`TypeError: Cannot redefine property: IntersectionObserver`**.
- `src/test/overviewNewsRebuild.test.tsx:43:8`: “writes after one second half visible and holds the first baseline”.
- `src/test/overviewNewsRebuild.test.tsx:43:8`: “writes after one second half visible and holds the previous baseline”.
- `src/test/overviewNewsRebuild.test.tsx:52:8`: “visibility below half cancels the pending baseline”.

The existing test setup installs a non-configurable observer property. These new cases attempted vi.stubGlobal, which cannot replace it. No correction, assertion rewrite, deletion, rename or rerun was made after this failure. Request authorization for a fixture-only observer-prototype repair that preserves the three assertions. Baseline visibility behavior is **not verified**.

## Test accounting
Last reported full-suite baseline: **5,284/5,284 across 512 files** (YC2).
Added `overviewNewsRebuild.test.tsx`: **66 cases** (63 passed, three failed).
Added `overviewNewsReads.test.tsx`: **10 cases**, all passed.
Existing untouched: overviewNewsN1 **3/3**, tourNewsCard **8/8**, tourOverviewDesignA **61/61**.
Expected full inventory **5,360 across 514 files** = 5,284 + 76, files 512 + 2. **Full shards not executed due to the required stop; this is an expected inventory, not a full-suite result.** Against older5,172/509, expected delta188/+5 = YC1 30/+1, World Rankings36/+1, YC2 46/+1, News76/+2.
No existing test deleted, renamed or rewritten; no old/new assertion differences.

## Preview and proof
Latest automatic preview log before report: `2026-11-01T16:07:00Z — build OK`. No manual build/typecheck run.
Real `/tourhub`,390×844: six story shapes, hero390×470, five photos loaded and one photo naturalWidth0 (existing remote photo unavailable), document width/scrollWidth390. Real guest shade/card overlays the News section; the image is not unobstructed parity. `/tmp/browser/news/live.png` records that state.
Mock screenshot script initially failed: `Locator.evaluate: Timeout 30000ms exceeded` waiting for `.head` after file navigation. Screenshot-only apparatus repaired by loading the supplied HTML contents, without touching app/test files. Comparison is stored under `/tmp/browser/news/comparison.png` if that repaired capture succeeds.
Member follow/live-player states are unit-tested, not authenticated browser proof; authentication status `external_unmanaged`.
No new examples, story names or colour-block placeholder images shipped. App inherits system font rather than the mock's retired Geist. Lower-case details ages follow this brief's explicit copy.

## Protected scope
No SQL, migrations, feed_config, round_pool_cap, edge/RPC/native/Median changes. No publication.