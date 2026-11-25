# Close-out — Briefs 22, 23, 24B, 24A

Command: `npx vitest run --shard=N/4`, four shards run one at a time, no retries.

| Shard | Tests | Files |
|---|---|---|
| 1/4 | 2,520 | 231 |
| 2/4 | 2,544 | 231 |
| 3/4 | 2,730 | 231 |
| 4/4 | 2,817 | 231 |
| Total | 10,611 | 924 |

Baseline 10,562 / 920. Delta +49 tests / +4 files:
- Brief 22: +10 / +1 (brief22SecondPass.test.ts)
- Brief 23: +11 / +1 (strip edit badge tests)
- Brief 24B: +16 / +1 (brief24bPendingClub.test.tsx)
- Brief 24A: +12 / +1 (brief24aSetupFixes.test.ts 7; routing test file +5, existing file)

brief18EyebrowInk did not time out or fail in this run.

Rulings applied:
- Brief 23: edit badge gained `gridTemplateColumns: 'minmax(0, 1fr)'`; fixOverflowSource.test.ts untouched.
- Brief 24B: ClubFromTheClub.tsx `lockedMessage` moved onto the existing props line, with its note folded into the header comment; the eyebrow is back on line 55. No test change.
- Brand case: the delete-business dialog already reads "from clbhouz" (commit 9e144b5eba). A search of src for user-facing "Clbhouz" (components and all locale files) found no remaining capitalised strings; the only hits are identifiers, comments, a .md design note, a CSS comment and tests asserting absence. No strings changed, no tests changed.
- Part F skipped: recents hold query text only.

No SQL was run and no migration was written.
