# WAGR Career — stopped on existing tests

## Implemented
Career-wide distinct-event figures, derived timeline, owner editing doors, career reads and invalidation, and shared pro career sheets parameterised for amateur table/key. Uploaded 124-row fixture saved at requested path; existing five-row fixture and all existing tests unchanged. Generated types already contain amateur_career_moments, so no type file edit was needed. No SQL, migrations, policies or feed_config changes.

Files:
- `src/features/amateur-ranking/ProfileRankingTab.tsx`
- `src/features/amateur-ranking/SettingsWagrCard.tsx`
- `src/features/amateur-ranking/ranking-tab.css`
- `src/features/amateur-ranking/rankingTabRules.ts`
- `src/features/amateur-ranking/useAmateurRanking.ts`
- `src/features/pro-profile/ProCollectionSheets.tsx`
- `src/features/pro-profile/useProCollections.ts`
- `src/features/pro-verification/useShowTourResults.ts`
- `src/pages/ProfilePageV2.tsx`
- `src/test/fixtures/lewy-amateur-rank-history.json`
- `src/test/wagrCareer.test.tsx`
- `roadmap.md`

## Verification and counts
Last passing full-suite baseline 8,691. Added 16 tests in wagrCareer.test.tsx; inventory now 8,707 (+16). Existing tests deleted, renamed or rewritten: none. Full shards not run after unexpected focused failures; no passing full-suite total claimed.

Command:
```text
bunx vitest run src/test/wagrCareer.test.tsx src/test/proCollectionRules.test.ts src/test/proCollectionSections.test.tsx src/test/wagrRankingTab.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-career/focused.json
```
80 executed / 76 passed / 4 failed. New Career tests 16/16 passed, including exact 5/21/46 totals and ten-entry order; unchanged pro rules 17/17 and pro collection flows 20/20 passed; existing Ranking tests 23/27 passed.

## Stop errors (tool output verbatim)
### Tab renders Lewy headline, movement, tiles and foot
File: /dev-server/src/test/wagrRankingTab.test.tsx
```text
Error: Unable to find an element with the text: ▲ 3. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div />[39m
[36m</body>[39m
    at waitForWrapper (/dev-server/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/test/wagrRankingTab.test.tsx:161:16
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:155:11
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:752:26
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1863:10)
    at runTest (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1574:12)
    at processTicksAndRejections (node:internal/process/task_queues:103:5)
```
### Chart draws with two or more rows and labels the ends
File: /dev-server/src/test/wagrRankingTab.test.tsx
```text
Error: Unable to find an element with the text: 4,440. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div />[39m
[36m</body>[39m
    at waitForWrapper (/dev-server/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/test/wagrRankingTab.test.tsx:172:16
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:155:11
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:752:26
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1863:10)
    at runTest (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1574:12)
    at runSuite (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1729:8)
```
### Five events show, then See all expands in place
File: /dev-server/src/test/wagrRankingTab.test.tsx
```text
Error: Unable to find an element with the text: RECENT EVENTS. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div />[39m
[36m</body>[39m
    at waitForWrapper (/dev-server/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/test/wagrRankingTab.test.tsx:188:16
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:155:11
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:752:26
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1863:10)
    at runTest (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1574:12)
    at runNextTicks (node:internal/process/task_queues:64:5)
```
### Event rows show ordinal finishes, Team and the points dash
File: /dev-server/src/test/wagrRankingTab.test.tsx
```text
Error: Unable to find an element with the text: RECENT EVENTS. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div />[39m
[36m</body>[39m
    at waitForWrapper (/dev-server/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/test/wagrRankingTab.test.tsx:198:16
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:155:11
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:752:26
    at file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1863:10)
    at runTest (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1574:12)
    at runSuite (file:///dev-server/node_modules/@vitest/runner/dist/chunk-hooks.js:1729:8)
```

No retry, mock repair or assertion change after these failures. Existing Ranking mock sends event-shaped rows for any new non-history table; that is a potential fixture-shape issue, not a confirmed diagnosis or permission to alter it.

Preview latest observed build OK at 2026-11-14T12:44:53Z. 390/320 browser comparison and authenticated add/edit/remove remain unverified. No real writes or ranking sync invoked. Exact mock CSS was adapted to shared sheet selectors; visual parity is not claimed. git diff --check also reports trailing whitespace at ProCollectionSheets.tsx:22 (inherited end-of-line space on the edited long JSX line); it is not a test error.

## New test names
- whole WAGR career has 5 wins, 21 top tens and 46 distinct events
- duplicate events count once and only whole-number finishes 1 to 10 count
- Lewy ten derived entries match the exact signed-off order
- career high includes eventless rows and takes earliest tied week
- all five wins are gold while three podium entries are not
- podiums retain only the five most recent ranked events
- first event uses ISO Thursday year and member moments sort after derived entries
- career tiles render 312th, 5, 21 and 46 rather than rolling summary
- failed history produces three unknown career tiles and preserves member moments
- failed moments leaves derived entries only
- visitor has no editing doors and source lines only on derived entries
- owner without moments has Add but no Edit
- owner with moments has both editing doors
- amateur add writes its own table and invalidates its own query
- amateur edit writes its own table and invalidates its own query
- amateur remove deletes its own row and invalidates its own query
