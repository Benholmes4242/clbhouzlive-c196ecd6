# Pro sponsor sheet export fixes — stopped on unexpected tests

## Implemented scope
- Sponsor event names use canvas measurement in the inherited app font, 400 / 10.5px, with a JavaScript ellipsis. Result spans no longer use hidden overflow or CSS ellipsis; row line-height remains 1.3.
- Sheet-only PRO label uses inline-block, 18px height/line-height, 0 7px padding and middle alignment, without the old negative top offset. Shared ProLabel remains unchanged.
- Rank row uses an auto/1fr grid, 12px gap, bottom alignment and figure line-height 1.
- Sponsor Career filters the derived first world-ranking event before taking four, and removes the derived career-high after clause. Canonical profile Career is unchanged.
- No SQL, migrations, server deployment, feed_config, cap, native or Median changes.

## Files
Added: `src/features/pro-profile/proSponsorRules.ts`, this report.
Changed: `src/features/pro-profile/ProSponsorSheet.tsx`, `src/features/pro-profile/pro-profile.css`, `src/test/proClubhouseSponsor.test.tsx`, `roadmap.md`.
Sponsor-local architecture ownership is documented in module headers.

## Inventory and test ledger
Last reported baseline: 7,392 cases / 645 files (7,391 passed plus one known FM1 failure). Expected after: **7,398 cases / 645 files**, delta +6, all in `proClubhouseSponsor.test.tsx` (39 → 45):
1. sheet PRO label uses print-safe inline-block centring only in the sheet
2. sheet rank row uses a bottom-aligned two-column grid and unit figure line-height
3. sheet filters the first ranking event before taking four and shortens only its derived career high
4. profile Career retains the first ranking event and the career-high after clause
5. cuts a long event with an ellipsis to fit the measured column
6. keeps a short event unchanged when it fits

Existing tests changed, renamed, rewritten or deleted: **none**; no existing old/new assertion code to report. Four helper/content cases pass; the two newly added raw-CSS checks fail because their rule lookups return undefined. They remain untouched after failure.

## Commands and outcomes
- Initial focused: `bunx vitest run src/test/proClubhouseSponsor.test.tsx --maxWorkers=2` — 43/43 before the two print-style cases were added.
- Final focused, same command — **43 passed / 2 failed**, 45 executed.
- `bunx vitest run --shard=1/4 --maxWorkers=2` — **1,892 passed / 162 files**. Before the final two checks; neither belongs to this shard.
- `bunx vitest run --shard=2/4 --maxWorkers=2` — initial 1,822 passed + one known failure; final **1,822 passed / 3 failed / 162 files**, 1,825 executed.
- Shards 3 and 4: **not run following unexpected failures**. No completed full-suite pass total claimed. Latest shard 1+2 subtotal: 3,714 passed + 3 failures = 3,717 executed across 324 files; expected full inventory remains 7,398/645.
- Workflow deviation: focused and shard-2 rerun were submitted in a single command, so shard 2 started before focused failures were inspected. No further shards or test repairs followed inspection.
- Preview build: **OK**, `/tmp/observability/build-errors.log`, 2026-11-06T18:51:53Z.
- Full logs: `/tmp/sponsor-export/focused.log`, `focused-final.log`, `shard1.log`, `shard2.log`, `shard2-final.log`.

## Unexpected stop evidence (verbatim)
`src/test/proClubhouseSponsor.test.tsx:273:18`
```text
FAIL > sponsor sheet > sheet PRO label uses print-safe inline-block centring only in the sheet
AssertionError: expected undefined to be defined
expect(rule).toBeDefined();
```
`src/test/proClubhouseSponsor.test.tsx:286:17`
```text
FAIL > sponsor sheet > sheet rank row uses a bottom-aligned two-column grid and unit figure line-height
AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
expect(row).toContain('display:grid');
```

## Known failure, separate and untouched
`src/test/fw1FeaturedDeck.test.tsx:151:18`, “reserves no right padding on the meta line”:
```text
AssertionError: expected undefined to be defined
expect(rule).toBeDefined();
```

## Not verified
Live Chromium preview/PNG identity and rank glyph bottoms are unverified after the test stop. Auth status is `external_unmanaged`; authenticated profile/export end-to-end verification is unavailable in this project. No saved PNG is claimed verified.