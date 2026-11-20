# Review media-array safeguard ruling — complete

## Exact application change and commit audit
Only application line changed: `src/components/feed/ReviewPostCard.tsx:105`:
```diff
-  const withBottom = post.mediaItems[activeMediaIndex]?.type === 'video' ? 'review-video' as const : 'review' as const;
+  const withBottom = post.mediaItems?.[activeMediaIndex]?.type === 'video' ? 'review-video' as const : 'review' as const;
```
A missing array now takes the existing review-photo offset rather than throwing. Present arrays retain exactly their previous video/photo choice.

Audited both commits with `git show <commit> --format= -- '*.ts' '*.tsx'`, inspecting added lines containing `post.mediaItems` (broader than indexed access). Both dc1aa2c and b337846 contain this same sole indexed access in ReviewPostCard; no other new post.mediaItems index exists to guard. Complete matching audit output is saved in audit.log.

No test changed; particularly all ten feedReviewGlass cases and all three reviewPostScoreCompact cases retain their exact existing content and assertions. No tests added, rewritten, removed or renamed; no test files added/removed/renamed. No SQL, migration, feed_config, round_pool_cap, other application change or architecture change.

## Commands and totals — four separate sequential runs
| Command | Executed | Passed | Failed | Files | Duration | Full output |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `bunx vitest run src/test/feedReviewGlass.test.tsx src/test/reviewPostScoreCompact.test.tsx` | 13 | 13 | 0 | 2 | 4.61s | focused.log |
| `bunx vitest run --shard=1/4` | 2,293 | 2,293 | 0 | 209 | 166.22s | shard-1.log |
| `bunx vitest run --shard=2/4` | 2,275 | 2,275 | 0 | 209 | 158.27s | shard-2.log |
| `bunx vitest run --shard=3/4` | 2,342 | 2,342 | 0 | 209 | 163.36s | shard-3.log |
| `bunx vitest run --shard=4/4` | 2,442 | 2,442 | 0 | 206 | 239.72s | shard-4.log |

**Full suite: 9,352 executed / 9,352 passed; 833 files; no failures.** Full stdout/stderr retained for every run; existing warning output is retained, not suppressed. No reruns or test repairs.

## Before/after reconciliation
- Last verified complete baseline: **9,329**, commit 988ec7f95f.
- Intervening review build dc1aa2cd85 added **23** cases, all in reviewPlayedWith.test.tsx, yielding expected **9,352**.
- Subsequent offset/keyboard ruling b337846 added/deleted/renamed no cases; this safeguard ruling likewise has **zero inventory delta**.
- Before/after this ruling: **9,352 → 9,352**. Last verified baseline reconciliation: **9,329 + 23 = 9,352**, now confirmed by all four shards.
- Shard totals differ from the old 9,329 baseline because adding one test file repartitions shard membership; no cases were lost. Shard four explicitly reports reviewPlayedWith.test.tsx (23 tests) passed.

### Intervening 23 review case names (all passed in the complete suite)
1. `(a) personal wizard puts unchanged selection after text and before the tray` — now passed.
2. `(a) business wizard has no Played with selection or suggestions read` — now passed.
3. `(b) create waits for the returned review id before writing selected ids` — now passed.
4. `(b) edit preloads tags then syncs removal and addition after save` — now passed.
5. `(c) review tag error reports review_create for eight seconds and still shows saved review` — now passed.
6. `(d) syncs review mention markup on successful save, edit=false` — now passed.
7. `(d) syncs review mention markup on successful save, edit=true` — now passed.
8. `(e) review photo chip and upward panel clear the measured glass strip` — now passed.
9. `(e) review video chip clears the mute tap area by eight pixels` — now passed.
10. `(f) review without media opens the sheet from both faces and byline` — now passed.
11. `(g) real review fullscreen chrome shows the chip under its author and opens the panel` — now passed.
12. `(h) one host batch reads distinct review ids once alongside post tags and joins usernames` — now passed.
13. `(i) tagged viewer gets Remove me on the review and deletes their review tag` — now passed.
14. `(j) tag review notification prefers feed post then exact course review` — now passed.
15. `(j) mention review notification prefers feed post then exact course review` — now passed.
16. `review writer excludes self` — now passed.
17. `review writer caps at eight tagged members` — now passed.
18. `sync returns the first removal error and does not insert` — now passed.
19. `mention failure only warns and leaves saved review successful` — now passed.
20. `staged wizard waits for the published review id and preserves mention markup` — now passed.
21. `suggestions pass a known course/play day unchanged and otherwise null` — now passed.
22. `review with no tags renders no new display` — now passed.
23. `empty review id list causes no read` — now passed.

## Verification and limitations
The central regression was verified by mounting the real card through the 13 unchanged cases with absent mediaItems; all pass. Full suite clears the preceding review offset/menu fixture stops and missing-array mount stop. Harness reports build OK at 2026-11-20T18:47:06Z. No manual build/typecheck was run. Live authenticated/device comparisons remain unverified; this narrowly scoped safeguard does not establish hosted auth settings or visual equivalence on a physical device.
