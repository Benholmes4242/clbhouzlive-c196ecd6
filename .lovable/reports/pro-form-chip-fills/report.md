# Pro form chip fills

## Scoped edit
`src/features/pro-profile/ProSeasonSection.tsx:39`: changed the form chip Button from `variant="ghost"` to `variant={null} size={null}`. No other application lines or CSS changed. Result rows and shared Button remain unchanged.

## Test inventory
Before: **9,476 tests / 848 files** (last verified baseline).
After: **9,477 tests / 848 files**, all passing.
Only delta: +1 case in `src/test/proSeasonForm.test.tsx`, **“form chips carry no ghost variant classes”**. The file moves from 31 to 32 cases; no existing case deleted, renamed or rewritten.

New fixture renders `T28` (made), `T3` (top), `1st` (win), `MC` (out).
New assertions:
```tsx
expect(formChips).toHaveLength(4);
formChips.forEach(chip => {
  expect(chip).not.toHaveClass('bg-transparent');
  expect(chip).not.toHaveClass('text-muted-foreground');
});
```
Reason: prevent the ghost variant overriding finish fills and colours; the length assertion prevents an empty strip passing vacuously.

## Full-suite verification
Each shard ran sequentially as its own command, with full stdout/stderr retained beside this report.

| Exact Vitest command | Passed tests | Passed files | Full output |
| --- | ---: | ---: | --- |
| `bunx vitest run --shard=1/4` | 2,315 | 212 | shard-1.log |
| `bunx vitest run --shard=2/4` | 2,308 | 212 | shard-2.log |
| `bunx vitest run --shard=3/4` | 2,391 | 212 | shard-3.log |
| `bunx vitest run --shard=4/4` | 2,463 | 212 | shard-4.log |

Total: **9,477 / 9,477 tests, 848 files**. No unexpected failure or rerun. The +1 appears only in shard three.
Preview harness: **build OK**, 2026-11-21T12:13:05Z; no manual build/typecheck run.

## 320px capture
`strip-320.png` shows the actual ProSeasonSection and original CSS/controls using isolated sample events at a 320px viewport. Visually inspected: made/top chips filled, `1st` has its gold wash, out chips remain unfilled.
Browser computed backgrounds:
- Made and top: `rgba(255, 255, 255, 0.06)`.
- Win: `rgba(251, 188, 46, 0.12)`.
- Out: transparent.

No strip overflow or page errors. Clicking the `1st` chip opened the matching Tournament 5 result detail through the unchanged handler.
This is isolated presentation verification, not authenticated live-profile readback; external unmanaged authentication remains unavailable. No SQL, migration, protected config, deployment or real data write used.