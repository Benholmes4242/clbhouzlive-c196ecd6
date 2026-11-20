# Two test-only rulings — full sequential suite passed

## Scope
Only `src/test/postWithErrorSurface.test.ts` and `src/test/upcomingLastYearBoard.test.tsx` changed, plus roadmap and verification records. No application code, SQL, migrations, feed_config or round_pool_cap changes. No architecture decision or AGENTS.md edit.

## Exact fixture repair — postWithErrorSurface.test.ts:12
One mock-query line changed; a byte-for-byte comparison against HEAD confirmed every other line, including all nine cases and assertions, is unchanged.

- `select: async () => ({ data: [{ id: 'post-1' }], error: null })` → `select: () => query`.
- `then` resolution `{ data: null, error: null }` → `{ data: [{ id: 'post-1' }], error: null }`, preserving the old awaited-select result.
- `maybeSingle` data `null` → `table === 'posts' ? { status: 'published', scheduled_at: null, visibility: 'anyone' } : null`; error remains null.

Why: the edit-status read requires a chainable select/eq/maybeSingle mock and a published posts row to mount. Cases `edit save sync error shows the same toast, tracks edit and reaches success` and `successful edit emits no failure toast or event` now mount, save, and pass their original assertions. File count **9 → 9**; no assertion changed or case deleted, renamed or rewritten.

## Every authorized assertion change — upcomingLastYearBoard.test.tsx

Case `upcoming LAST YEAR condensed board > uses the live row tracks without avatars or flags`:
- Line 58: `expect(row.style.height).toBe('36px')` → `expect(row.style.minHeight).toBe('31px')`.
- Line 61: `expect(name.style.fontSize).toBe('15px')` → `expect(name.style.fontSize).toBe('13px')`.

Case `upcoming LAST YEAR condensed board > keeps the winner the same size with a neutral 14px outline trophy and canonical score without wash`:
- Line 73: `expect(row.style.height).toBe('36px')` → `expect(row.style.minHeight).toBe('31px')`.

Why: these are the explicitly authorized old-size assertions on the type-scale brief's listed elements. File count **7 → 7**; no cases deleted or renamed. No rank fontSize/fontWeight assertion exists in this file, so none was changed or added. Track columns, trophy geometry, colours, score size, name weight and every other assertion remain unchanged.

## Commands, per-shard totals and retained full output
Each command ran separately, sequentially, with stdout/stderr retained in the adjacent log; `pipefail` preserved test-runner exit status. Every command exited 0.

| Exact test command | Executed | Passed | Failed | Files | Duration | Full output |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `bunx vitest run src/test/postWithErrorSurface.test.ts src/test/upcomingLastYearBoard.test.tsx` | 16 | 16 | 0 | 2 | 7.65s | `focused.log` |
| `bunx vitest run --shard=1/4` | 2,279 | 2,279 | 0 | 208 | 159.31s | `shard-1.log` |
| `bunx vitest run --shard=2/4` | 2,281 | 2,281 | 0 | 208 | 174.56s | `shard-2.log` |
| `bunx vitest run --shard=3/4` | 2,337 | 2,337 | 0 | 208 | 305.56s | `shard-3.log` |
| `bunx vitest run --shard=4/4` | 2,432 | 2,432 | 0 | 208 | 191.44s | `shard-4.log` |

**Full suite: 9,329 executed / 9,329 passed, 832 files, zero failures.** The separate focused 16 is not added to the suite total. Warnings/known jsdom diagnostic output remain in the unabridged logs; no test failed and no unhandled-error summary was reported.

## Inventory before/after and previous baseline
- This ruling: expected **9,329 before → verified 9,329 after**, delta **0**; two edited files remain **9 and 7 cases**.
- Last complete historical pass: **9,301** (`e1e90943b7`).
- Intervening type-scale work: **+6** `overviewTypeScale.test.tsx` → 9,307.
- Intervening Played with display work: **+13** `playedWithTags.test.tsx` → 9,320.
- Intervening Played with save-error work: **+9** `postWithErrorSurface.test.ts` → 9,329.
- Combined reconciliation: **9,301 + 6 + 13 + 9 = 9,329**, now confirmed by all four shards. The complete named inventory of those 28 intervening additions is preserved under “Before/after full-suite inventory reconciliation” in `../upcoming-picks-ruling/report.md`; no intervening additions were removed or renamed here.

This passing run supersedes the test stops in `c842436` and `b642417`, and verifies the combined Overview type-scale, Played with display and save-error work at the test-suite level. Historical stop reports/logs are retained, not overwritten.

## Verification limits
Latest harness entry: `build OK`, `2026-11-20T18:04:27Z`. No manual build/typecheck run. This request is test-only; no authenticated production posting or physical-device check was performed or claimed, and those earlier verification limits remain unchanged.