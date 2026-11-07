# FM1_MUTE_1 — closed

## FM1_FIX_1 close-out — 2026-11-07
- Authorised test-only setup fix in `src/test/fw1FeaturedDeck.test.tsx`; no product code changed.
- Removed `import featuredCss from '@/features/explore-magazine/watch/featured.css?raw';`, added `import { readFileSync } from 'node:fs';`, and read the file inside **reserves no right padding on the meta line**:
  ```ts
  const featuredCss = readFileSync('src/features/explore-magazine/watch/featured.css', 'utf8');
  ```
- Both existing assertions remain byte-identical:
  ```ts
  expect(rule).toBeDefined();
  expect(rule).not.toMatch(/padding(?:-right)?\s*:/);
  ```
  Reason: the raw import yielded no stylesheet text in this test configuration; the direct read follows `accountDoorFit.test.tsx`.
- Tests added/deleted/renamed: none. Only the setup of the named existing test changed; no assertion rewritten.
- Focused command: `bunx vitest run src/test/fw1FeaturedDeck.test.tsx --maxWorkers=2` — **34/34 passed**.
- Full-suite commands, each executed separately:

  | Command | Passing tests | Passing files | Failures |
  | --- | ---: | ---: | ---: |
  | `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,898 | 162 | 0 |
  | `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,828 | 162 | 0 |
  | `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,882 | 162 | 0 |
  | `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,798 | 159 | 0 |

- **Total: 7,406 passed / 7,406 executed across 645 files, zero failures.** Last reported baseline was 7,405 passed + 1 known FM1 failure = 7,406 executed / 645 files. Inventory before/after: **7,406 → 7,406**, file delta zero; the sole pass-count increase is the repaired FM1 test.
- Known pre-existing TourGlance width failure (`tourIsland.test.tsx:235`) did not recur: its file passed 14/14. Neither sponsor-sheet style stop recurred: `proClubhouseSponsor.test.tsx` passed 48/48. No pre-existing or new test failures appeared; those files were untouched.
- Logs retained at `/tmp/fm1-fix-1/focused.log` and `/tmp/fm1-fix-1/shard1.log` through `shard4.log`.
- Preview diagnostic: `build OK` at 2026-11-07T05:05:31Z; no manual build or typecheck run.
- FM1 test/suite stop is closed. Historical implementation details and visual-check limits below remain unchanged; no new browser/device checks were requested or claimed.
- No SQL, migrations, migration files, deployed RPC/edge changes, guest browsing, review wizard, news, round plots, feed_config, round_pool_cap or native/Median changes.

## Historical stop evidence (superseded by the green close-out above)

## Implemented scope
- FeaturedPlayback renders one top-right flex group containing mounted-video sound first, then formatted duration. Parent duration removed.
- Group: top/right 14px, gap 8px, z-index 3. Sound: 30×30px, radius 10px, existing semantic glass/edge/ink, blur 16px, opacity 1, 16px icons, invisible inset -7px hit target.
- Pointerdown/touchstart/click propagation is stopped; old bottom placement and meta right padding removed.
- Existing playback, stack, engagement and gesture behavior retained. No SQL, migrations, RPC/edge deployment, guest browsing, review wizard, news, round plots, feed_config, cap or native/Median changes.

## Stop: exact runner output
Command: `bunx vitest run src/test/fw1FeaturedDeck.test.tsx --maxWorkers=2`

```text
FAIL src/test/fw1FeaturedDeck.test.tsx > FM1 sound group > reserves no right padding on the meta line
AssertionError: expected undefined to be defined
❯ src/test/fw1FeaturedDeck.test.tsx:151:18
149| it('reserves no right padding on the meta line', () => {
150|   const rule = featuredCss.match(/\.featured-meta\s*\{([^}]+)\}/)?.[1];
151|   expect(rule).toBeDefined();
152|   expect(rule).not.toMatch(/padding(?:-right)?\s*:/);
```

33 passed / 1 failed = 34 executed, one file. Full output: `/tmp/fm1-mute/focused.log`.
Stopped without repairing the failed test or running shards. The CSS-import-based check did not find the rule; the CSS source removes the padding, but that does not make this test pass.

## Test ledger and counts
- Last reported full-suite baseline: 7,307 tests / 643 files, from PRO_BAG_PARTNERS_EDIT_REPORT.md.
- Added nine cases in `src/test/fw1FeaturedDeck.test.tsx`: top-right order/single duration; toggle/icons/no engagement; input propagation; reduced-motion duration-only; autoplay-blocked duration-only; absent-source duration-only; failed-video duration-only; next-card muted; no meta padding.
- Existing tests: none deleted, renamed or rewritten. No old/new existing assertion to report. Added imports only; original behavior assertions remain unchanged.
- Expected inventory: 7,316 / 643 (+9 cases in the same file), not an executed full-suite result.
- Shards 1–4: not run because of the new focused failure. No full-suite pass total available this turn.
- Known pre-existing TourIsland width failure: not encountered in the focused scope; no other pre-existing failure observed.
- Preview diagnostic: build OK at 2026-11-06T15:19:56Z, after the production edit. No manual build/typecheck run.

## Requested checks, individually
1. 390px sound left of 0:24, 8px gap and unobscured: not browser-verified before stop.
2. Toggle/icon switches without open/like/advance: mounted test passed; live-member/browser check unverified.
3. Long 12:45 duration clear of badge: unverified.
4. 320px no overlap/overflow: unverified.
5. Next card starts muted: mounted test passed; live swipe unverified.
6. Full-width caption/meta: padding removed in source; new meta test failed as above; browser measurement unverified.

Authenticated end-to-end checks additionally require a legitimate member session; existing environment evidence identifies external unmanaged authentication. No guest mint or authentication bypass attempted.