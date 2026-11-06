# Pro profile 1c — result-sheet round row

## Delivered
- ResultDetail sets `gridTemplateColumns: repeat(n, 1fr)` from the actual round count, capped at four (empty grid safely uses one). Five or more rounds flow into further rows.
- `.pro-profile-sheet .pro-profile-rounds` uses an 8px gap. Existing sheet tile padding 10px 12px, value 20px/800, and labels are unchanged.
- This week retains its original auto-fit grid and 10px gap. No SQL, migrations, server changes or other feature changes.

## Tests and inventory
`src/test/proProfileBuildOneB.test.tsx`: 39 → 44 cases, five added cases only:
- `result sheet with 3 rounds uses 3 columns`
- `result sheet with 4 rounds uses 4 columns`
- `result sheet with 2 rounds uses 2 columns`
- `result sheet with 5 rounds uses 4 columns`
- `320px result sheet keeps all four round columns without auto-fit`

Assertions check `gridTemplateColumns` and preservation of every round tile. The 320px case asserts the four-column style as requested; jsdom does not measure physical overflow. No existing assertions, cases, names or fixtures rewritten, deleted or renamed. No new test files.

Focused command: `bunx vitest run src/test/proProfileBuildOneB.test.tsx --maxWorkers=2` — 44/44 passed.

## Fresh full-suite run
Commands: `bunx vitest run --maxWorkers=2 --shard=1/4`, then the same command with `2/4`, `3/4`, `4/4` in order.

| Shard | Passed | Known failed | Executed |
|---|---:|---:|---:|
| 1 | 1,872 | 0 | 1,872 |
| 2 | 1,741 | 0 | 1,741 |
| 3 | 1,829 | 3 | 1,832 |
| 4 | 1,758 | 0 | 1,758 |
| Total | 7,200 | 3 | 7,203 |

Previous reported test total 7,198 → 7,203, exactly +5 from the five named added cases. Previous passing total 7,195 → 7,200. No unexpected failures.

Current per-shard file totals are 159/159/159/156: 633 unique executed files, matching 633 source test files. The prior PREVIEW_FIX_1 report stated 634 files, but its printed shard counts (158/158/159/156) sum to 631, not 634. That historical file-total claim is internally inconsistent; it cannot establish a real file delta. This change adds/removes no test file. Historical underlying file lists have not been reverified.

Full focused/shard output retained in `docs/verification/pro-result-round-row/`.

## Three known FS_NOTCH failures only
- `src/test/fsNotch1.test.tsx:37:45`, `renders the scrim inside a top-0 portrait slide`: `AssertionError: expected '' to be '0px' // Object.is equality`.
- `src/lib/media/__tests__/fullscreenBand.test.ts:65:18`, `height-limits taller portraits and centres between lateral safe insets`: `AssertionError: expected { top: +0, …(4) } to match object { top: +0, …(3) }`; expected width `251.33333333333334`, received `251.33333333333331`.
- `src/lib/media/__tests__/fullscreenBand.test.ts:75:22`, `anchors synthetic portrait media without reserving a footer`: `AssertionError: expected 98.83333333333331 to be +0 // Object.is equality`.

All three tests left untouched. Preview status: `build OK` at 2026-11-06T06:20:00Z. No authenticated live result-sheet or physical overflow check claimed; verification is the requested mounted grid-style regression.