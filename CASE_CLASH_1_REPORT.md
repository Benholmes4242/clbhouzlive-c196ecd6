# CASE_CLASH_1 — complete

## Rename and scope
Moved `src/features/courses/_shared/siLadder.ts` to `src/features/courses/_shared/siLadderRules.ts` using filesystem `mv` (repository state is managed by the workspace; no stateful Git command).
Contents unchanged, verified before and after by SHA256:
`af5c0dfc22782ea2f4eebd64ab6f1a4d0c72e7b53a9a748e4e918a1a22946065`.
`SiLadder.tsx` retains its filename; only its rules import changed.

Whole-repository case-sensitive search, including hidden files, docs, mocks and source-reading tests, found no remaining old lowercase path references outside generated dependency/build metadata. Generated metadata was not manually edited. Historical report path mentions were updated to the current name; historical failures remain historical, not new failures.

## Test changes
No existing tests deleted, renamed or rewritten; no existing assertions changed.
Only existing test edit: `src/test/cb94CardAgainstCourse.test.tsx:4`:
```diff
-import * as rules from '@/features/courses/_shared/siLadder';
+import * as rules from '@/features/courses/_shared/siLadderRules';
```
All eight CB94 cases and assertions remain unchanged.
Added one test in `src/test/caseInsensitivePaths.test.ts`: **has no source file paths that differ only by letter case**. It recursively walks every file under `src/`, groups complete paths by lowercase spelling, and asserts the list of duplicate groups is empty. Failure text names every colliding path. No mocks or extra test cases.

## Checks and reconciliation
Focused command: `bunx vitest run src/test/caseInsensitivePaths.test.ts src/test/cb94CardAgainstCourse.test.tsx --maxWorkers=2`: **9/9**, 2 files.
Full commands: `bunx vitest run --shard=N/4 --maxWorkers=2`, individually for N=1,2,3,4:

| Shard | Files passed | Tests passed |
|---|---:|---:|
| 1/4 | 144 | 1,638 |
| 2/4 | 144 | 1,532 |
| 3/4 | 144 | 1,638 |
| 4/4 | 143 | 1,642 |
| **Total** | **575** | **6,450** |

**0 failures, 0 unhandled errors.** Baseline: last STABILISE_1 re-check **6,449 tests / 574 files**. After: **6,450 / 575**, exactly **+1 test / +1 file**, solely the named filename guard. Different per-shard distributions reflect the extra file, not removed tests. Full output retained at `/tmp/case-clash/focused.log` and `/tmp/case-clash/shard1.log` through `shard4.log`; temporary logs do not survive sandbox resets.

Automatic preview build: latest entry `2026-11-03T20:41:41Z — build OK`. No manual project build/typecheck run, per workspace instructions.

## G2B browser bundle retry
The original `/tmp/browser/g2b` fixture and exact command no longer exist. Recreated a standalone browser entry exporting **both real TournamentPage and PlayerPage**, with their full dependency graphs, without aliases or stubs for course dependencies.
```text
node_modules/.bin/esbuild /tmp/browser/case-clash/g2b-entry.tsx --bundle --platform=browser --format=esm --alias:@=/dev-server/src --loader:.png=dataurl --loader:.jpg=dataurl --loader:.jpeg=dataurl --loader:.webp=dataurl --loader:.svg=dataurl --loader:.woff2=file --loader:.woff=file --define:__BUILD_ID__='"case-clash-check"' --outdir=/tmp/browser/case-clash/bundle --metafile=/tmp/browser/case-clash/metafile.json
```
**Success, exit 0, 493ms**, emitting 5.3MB JS and 61.9KB CSS. Metafile confirms inclusion of `siLadderRules.ts`, `AllHolesSheet.tsx`, `TournamentPage.tsx` and `PlayerPage.tsx`. Full output `/tmp/browser/case-clash/bundle.log`. This verifies browser bundling now works; it does not claim a fresh rendered-page, visual parity, or signed-in check.

## Is the chart imported?
**No source importer found for `src/features/courses/_shared/SiLadder.tsx`.** It exports named/default `SiLadder`, but current callers import the rules/data types. AllHolesSheet renders its local `FlatSiLadder`; club analytics renders its list. The component remains present, unchanged apart from its import path; it was not deleted.

## Pre-existing failures
No pre-existing failure reproduced in this run. The earlier G2B bundle filename failure is resolved by this rename. Previously reported test stops all pass in the complete suite:
- `roundNotificationOverlay.test.ts:11`: cold-round chrome expectation omitted `condense`/`scrim`.
- `tourPlayoffShortenedEvents.test.tsx`: awaiting-playoff pulse-live, pulse-completed, and ordinary finished-event cases lacked QueryClientProvider (`No QueryClient set`; hook stack useTournamentPick.ts:37).
- `headerB1.test.tsx:97`: non-condense guest example expected 23px but got 16px on the obsolete `/discover` example.
- `tourOverviewBand.test.tsx:65–66`: obsolete non-condense `/discover` example.
- `g2aCourseTabs.test.tsx:104`: jsdom discarded the `env()` padding value.
- `g2fActivityHeader.test.tsx:36/67`: `Missing observer`, previously resolved by wrapper targeting and observer-registration waits.
These historical failures were already cleared in STABILISE_1; none of those tests was edited here.

## Every changed file
- Renamed `src/features/courses/_shared/siLadder.ts` → `src/features/courses/_shared/siLadderRules.ts` (contents identical).
- `src/features/courses/_shared/SiLadder.tsx` (import path only).
- `src/components/courses/course-detail/about/AllHolesSheet.tsx` (import path only).
- `src/features/business/clubAnalytics/sections.tsx` (import and comment path only).
- `src/test/cb94CardAgainstCourse.test.tsx` (import path only).
- New `src/test/caseInsensitivePaths.test.ts`.
- `AGENTS.md` (cross-cutting source filename portability rule).
- `G2B_TOUR_PAGES_REPORT.md` (path and historical bundle clarification).
- `G2C_ROUNDS_REPORT.md`, `G2D_VIDEO_GRIDS_REPORT.md`, `G2E_FIND_PEOPLE_REPORT.md`, `G2F_ACTIVITY_REPORT.md` (lowercase path/name references only).
- `STABILISE_1_REPORT.md` (renamed path and resolved bundle note).
- `roadmap.md` (path references and this task completion).
- New `CASE_CLASH_1_REPORT.md`.

No behaviour, output or visual changes; no guest browsing, wizard, news, round plots, SQL, migrations, migration files, deployed RPC/edge functions, feed_config, native or Median changes. round_pool_cap remains 30. No publication.