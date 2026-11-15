# ADMIN_INBOX_V3B — literal "\u00b7" on support and course request rows

Date: 15 Nov 2026. Baseline: 8,856 (ADMIN_INBOX_V3, commit `15c6aba406`).

## What was wrong

`SubLine` in `src/features/admin/components/InboxQueueRow.tsx` wrote the middle dot as JSX
text (`{who} \u00b7 {…}`). JSX does not interpret backslash escapes in text children, so the
support and course request rows printed the six characters `\u00b7` instead of `·`.

## Change

`src/features/admin/components/InboxQueueRow.tsx` — two lines, no other change:

- line 115 (support): `{who} \u00b7 {…}` → `{who}{' \u00b7 '}{…}`
- line 120 (course request): `{who} \u00b7 {…}` → `{who}{' \u00b7 '}{…}`

The other `\u00b7` uses in the file (lines 99–101, 110) are inside JS string literals and were
already correct; they are untouched.

## Tests

`src/test/adminInboxV3.test.tsx` — two cases added, none deleted, renamed or rewritten:

1. "a support row prints a real middle dot between the name and the rest of the fact line" —
   asserts `fact.textContent` contains `Jane Rimmer · last message from the member` and that
   neither the fact line nor the whole row contains the literal characters `\u00b7`.
2. "a course request row prints a real middle dot between the name and the note" —
   asserts `fact.textContent` contains `Jane Rimmer · Please add it` and the same two
   literal-character absences.

Focused file: 12/12 passed (10 existing + 2 new).

## Suite

| Shard | Command | Tests |
| --- | --- | --- |
| 1/4 | `npx vitest run --maxWorkers=2 --shard=1/4` | 2,255 |
| 2/4 | `npx vitest run --maxWorkers=2 --shard=2/4` | 2,146 |
| 3/4 | `npx vitest run --maxWorkers=2 --shard=3/4` | 2,222 |
| 4/4 | `npx vitest run --maxWorkers=2 --shard=4/4` | 2,235 |
| **Total** | | **8,858** |

Reconciles by name: 8,856 + 2 new cases in `src/test/adminInboxV3.test.tsx` (shard 3, which
went 2,220 → 2,222). No other shard moved.

No failures in any shard. Neither known intermittent failure appeared
(`src/test/tourIsland.test.tsx:235`, `src/test/guestStage24.test.tsx:85`), so no shard needed a
rerun. Neither known existing failure appeared
(`src/test/coursesBrowseHighestRatedRemoval.test.tsx`, two cases) — not fixed, as instructed.

Build: clean.

## Untouched

Guest browsing, the review wizard, news and round plots. No SQL, no migrations, no migration
files, no edits to deployed RPCs or edge functions, `feed_config` untouched, `round_pool_cap`
still 30, no native/Median config changes. Detail sheets, drawers, Tools sub-pages,
`src/features/admin/lib/panels.ts` and `CourseSearchField.tsx` were not edited in this brief.
