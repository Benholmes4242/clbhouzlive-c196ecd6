# Two authorised rulings — full-suite closeout

2026-11-18. Changes are saved in commit `07ffd537ae`.

## Exact authorised changes
- `src/components/media-system/hooks/__tests__/useSuggestedFeed.paging.test.tsx:53`: **later pages exclude every earlier cached post, use numeric pages and dedupe output** — wrapped `expect(result.current.hasNextPage).toBe(false)` in `await waitFor(...)`; expected value unchanged. Reason: wait for query-observer notification.
- Same file `:91`: **a first-page refetch omits exclusions even when cached posts exist** — wrapped `expect(result.current.posts.map(post => post.id)).toEqual(['fresh'])` in `await waitFor(...)`; expected value unchanged. Same reason.
- `src/components/courses/browse/useFeaturedSignals.ts:41`: wrapped only the existing follows chain in an immediately invoked async function so a synchronous throw becomes a promise rejection handled by Promise.all. No other change to that file; `proVerification2B.test.tsx` untouched.
- No tests added, deleted or renamed; only the two named checks above changed.

## Commands and results
Focused command: `npx vitest run src/components/media-system/hooks/__tests__/useSuggestedFeed.paging.test.tsx src/components/media-system/hooks/__tests__/useSuggestedFeed.refetch.test.ts src/test/proVerification2B.test.tsx src/test/featured* --maxWorkers=2`.

**56/56 passed**, 9 files: paging 9/9, proVerification2B 18/18, six matching featured files 29/29. The user's independent featured check said eight files/41 cases; this glob matched six files/29 cases locally, not eight. All files also participated in the full suite below.

Full commands: `npx vitest run --maxWorkers=2 --shard=1/4`, then `--shard=2/4`, then `--shard=3/4`, then `--shard=4/4`, run by a sequential nohup runner that exits on the first nonzero result.

| Shard | Passed / executed | Files | Exit |
| --- | ---: | ---: | ---: |
| 1 | 2,290 / 2,290 | 202 | 0 |
| 2 | 2,253 / 2,253 | 202 | 0 |
| 3 | 2,269 / 2,269 | 202 | 0 |
| 4 | 2,344 / 2,344 | 200 | 0 |
| Total | **9,156 / 9,156** | **806** | |

No failures, skips or unhandled errors. Logs retained under `/tmp/two-rulings/`.

Count before this request: expected inventory **9,156**, after: measured **9,156**, delta **0**. Against the last fully measured scope **9,142**: +8 paging cases listed in feed-pages-by-seen-not-cursor.md, then +6 business cases listed in business-posts-always-everyone.md = +14. Both stopped verifications are now suite-resolved; their earlier reports remain historical.

Preview build: `build OK` at 2026-11-18T07:55:29Z. No manual typecheck run for this closeout. No authenticated end-to-end check claimed. No SQL, migrations, feed_config or round_pool_cap changes.