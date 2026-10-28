# CB118.2 — Loading watcher correction and Media isolation checks

## Result

`bunx vitest run`: **3,816 passed / 0 failed / 3,816 tests across 418 files**, duration **306.02s**. Business-profile tests and all Media tests pass. Automatic preview check: **build OK, 2026-10-28T08:07:43Z**.

Before/after inventory: **3,816/418 → 3,816/418**, no count delta. Against the prior Media v3 baseline **3,808/417**, the eight additional tests remain the four intervening CB118.1 loading tests and the four shared glass accessibility tests in one new file. No tests added, deleted or renamed in CB118.2.

## Watcher diff

Only the explicitly authorized test **CB118.1 club courses loading identity > resolved club courses render the club layout without an intermediate non-club card** in `src/test/cb118BusinessVisiting.test.tsx` changed.

Old watched selector:
`[data-business-tabs], [data-about-content], [data-posts-content]`

New watched selector:
`[role="tablist"], [data-business-you], [data-business-nearby], [data-business-followers], [data-business-mentions], [data-visiting-variant="business"]`

Exact card roots:
- BusinessYouCard: `data-business-you` (emitted by its shared YouCardShell).
- BusinessNearbyCourses: `data-business-nearby`.
- BusinessFollowersCard: `data-business-followers`.
- BusinessMentionsRail: `data-business-mentions`.
- Non-club ClubVisiting: newly added `data-visiting-variant="business"`.

The watcher still checks added elements and their descendants throughout pending-to-resolved rendering. Shared PostsTabContent is no longer misclassified as non-club. Every assertion stays unchanged, including `expect(nonClubNodes).toHaveLength(0)` and the resolved Visiting-after-What-golfers-say assertion. Reason: the club legitimately renders PostsTabContent in ClubFromTheClub.

The only application-file change is the brief's explicit diagnostic-attribute exception: `data-visiting-variant={nonClub ? 'business' : undefined}` on ClubVisiting's section. Club markup omits the attribute, and appearance/behavior are unchanged. The accepted two-line loading gate is untouched.

## Isolation results

Each file was run alone, sequentially, using `bunx vitest run src/test/<file>.test.tsx --reporter=verbose`. None of the Media files, selectors or timeouts changed.

| File | Result | File duration | Named formerly timing-out case | Case time |
| --- | --- | --- | --- | --- |
| adminHoleTagging.test.tsx | 19/19 passed | 11.10s | Remove tag calls admin_untag_hole_media with the row id and refreshes the same keys | 982ms |
| coursesRailsUnlimited.test.tsx | 15/15 passed | 8.22s | admin hole-tag predicate invalidation refetches the active infinite holes rail | 1786ms |
| holePhotoFastPaths.test.tsx | 16/16 passed | 8.40s | MEDIA_FAST_1 > successful next tags exact URL and hole then advances | 545ms |
| holePhotoFastPaths.test.tsx | same file run | same run | MEDIA_FAST_1 > a second and third photograph can be tagged to the same hole | 1351ms |
| holeTagBatchV3.test.tsx | 28/28 passed | 19.59s | tapping the selected hole again deselects it and disables Tag; a different tap moves the selection | 1036ms |
| mediaV3.test.tsx | 19/19 passed | 10.71s | single has one selection across holes and places, and only submits on primary | 1306ms |

All six are **pre-existing, Media-owned, load-dependent timeout failures** from the earlier run; none reproduces in isolation or in this turn's single full run. No timeout increases or Media fixes were made.

Business check: `bunx vitest run src/test/cb118BusinessVisiting.test.tsx src/test/cb107ClubVisiting.test.tsx`: **59/59 passed across 2 files**, duration **6.98s**.

## Historical Hole 7 failure

**admin block and batch > member own block stays before admin and uses unchanged member write** was the pre-existing Media-owned multiple-Hole-7 failure. Its selector and assertions remain unchanged here. The preceding shared-overlay accessibility correction already fixed it; it passes this isolation run (**723ms**) and this full run. No Media edit was made in CB118.2.

## Protected scope

No SQL, migrations, migration files, deployed RPC/edge function edits, feed_config changes or native/Median configuration edits. round_pool_cap remains 30. No authenticated live checks were required for this test-only correction.

With full green confirmed, `MEDIA_V3_STOP_REPORT.md` is deleted as previously requested. Its historical test-change inventory is preserved below; those historical edits were not repeated in CB118.2.