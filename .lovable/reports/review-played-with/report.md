# Reviews: Played with and notifying mentions — stopped

## Status
Requested application changes are implemented, with **23 new cases**. Focused verification stopped on **three unexpected failures in the new test file**. No failed tests were repaired or rerun, and none of the four shards ran. This is not a fully verified completion.

## Implemented scope
- `reviewWith.ts` mirrors post tag filtering, eight-member cap, first-error sync, tagged-member removal and batched profile/username reads. Its narrowly typed table cast is temporary until generated types include review_with; no SQL or migration was written.
- ReviewComposerV2 renders the unchanged PlayedWithSection after the text/dictation block, before the media tray, for personal actors only. Selection uses toggleWith; suggestions/search/mention candidates use the existing post member sources. Edit reads existing review tags before permitting toggles.
- After an instant successful review submission, create writes or edit syncs the tags against the returned review id. Shared eight-second errors report `review_create` or `review_edit` and do not undo the saved review.
- Successful saves sync canonical review-text mention markup through syncMentionsForContent with sourceType review. Rejected sync only warns. No client notification insertion.
- Staged media reviews use the existing upload/publish controller and preserve its cleanup/cache callback. A captured optional post-publication callback receives the actual published ratingId from the outcome, then writes tags and mentions; it never writes against pendingId and survives composer unmount.
- Feed and profile hosts and the fullscreen overlay select review tags from the same usePostGolfTags result. One distinct review-id batch joins the existing post-tag batch; no read in a card or slide. The hook key includes hydrated review identities and shared mutation invalidation retains its prefix.
- Review media reuses the same chip/panel. Photo bottom is `calc(var(--review-glass-h, -12px) + 18px)`; video adds the mute area's 44px plus 8px. Review panels receive the same raised baseline, so their bottom does not fall over the course-name strip. Existing post panel defaults are unchanged.
- No-media reviews reuse name-row faces, the byline and Played with sheet. Real review fullscreen chrome now permits the same viewer chip under the author row. No tags produces no tag display; business display remains excluded.
- RemoveMeMenu receives an optional reviewId; review cards invoke removeMeFromReview and invalidate the shared tag cache, while existing post removal defaults remain unchanged.
- No feed_config or round_pool_cap changes. No server/notification/RLS logic or migration changed.

## Notification routing audit — change was required
Before this work, a review **mention** preferred the course review permalink even with data.post_id; a review **tag** could use post_id but did not have the review/course fallback when no post_id existed. Both were incomplete against this brief.

An early branch now handles type tag or mention with data.source_type review:
1. data.post_id → `/post/:post_id`.
2. course_id + review_id (or canonical source_id/legacy rating_id/entity review fallback) → `/courses/:course_id?tab=reviews&review=:review_id`.
3. Only course_id → course Reviews tab; no usable target → inert link.

Both new tag/mention routing cases pass. Existing source-typed non-review and reaction paths remain unchanged; full routing-suite verification is not established because the mandatory stop prevented shards.

## Mock authority and deviations
- The mock's review frame uses illustrative overall/greens/value scores and an older meta line. Those are frozen outside this brief: the shipped shared five-score row, course text and review header pills remain unchanged, not replaced by that illustration.
- Frame 5's caption labels it a round/text example; the brief explicitly applies its no-photo grammar to reviews, so that grammar is reused without replacing the review's existing course and score content.
- The wizard's current state/types contain no review play date. Suggestions deliberately receive null, as the brief permits when a date is unknown; no publication-date or unrelated-round fallback was invented. The new hook accepts a known course/day unchanged, and that case passes.
- The staged path publishes through publish_pending_review rather than submit_course_review_v2; its social writes run after the same real review identity exists, preserving the existing upload architecture rather than forcing media down the instant path.
- 320px browser geometry and physical-device comparisons were not performed before the test stop. Existing chip ellipsis/panel caps are reused; their visible containment is not claimed verified.

## Exact command and focused results
```text
bunx vitest run src/test/reviewPlayedWith.test.tsx src/test/playedWithTags.test.tsx src/test/postWithErrorSurface.test.ts src/test/reviewComposerChrome.test.tsx src/test/reviewReceiptNextCourse.test.tsx src/test/reviewUploadProgress.test.tsx
```
**71 executed: 68 passed, 3 failed**, six files (five passed, one failed), 10.28 seconds. Full stdout/stderr: `focused.log` adjacent to this report. No assertions in existing tests failed.

| File | Passed | Failed | Total |
| --- | ---: | ---: | ---: |
| reviewPlayedWith.test.tsx | 20 | 3 | 23 |
| playedWithTags.test.tsx | 13 | 0 | 13 |
| postWithErrorSurface.test.ts | 9 | 0 | 9 |
| reviewComposerChrome.test.tsx | 4 | 0 | 4 |
| reviewReceiptNextCourse.test.tsx | 4 | 0 | 4 |
| reviewUploadProgress.test.tsx | 18 | 0 | 18 |

## Exact surviving errors — no repair after failure
1. `review Played with > (e) review photo chip and upward panel clear the measured glass strip`:
```text
AssertionError: expected '' to be 'calc(var(--review-glass-h, -12px) + 1…' // Object.is equality
 ❯ src/test/reviewPlayedWith.test.tsx:161:127
- Expected: calc(var(--review-glass-h, -12px) + 18px)
+ Received: empty string
```
Assertion: `expect(chip.style.bottom).toBe('calc(var(--review-glass-h, -12px) + 18px)')`.

2. `review Played with > (e) review video chip clears the mute tap area by eight pixels`:
```text
AssertionError: expected '' to be 'calc(var(--review-glass-h, -12px) + 1…' // Object.is equality
 ❯ src/test/reviewPlayedWith.test.tsx:166:124
- Expected: calc(var(--review-glass-h, -12px) + 18px + 44px + 8px)
+ Received: empty string
```
Assertion: `expect(required(view.container, '[data-testid="played-with-chip"]').style.bottom).toBe('calc(var(--review-glass-h, -12px) + 18px + 44px + 8px)')`.

The source assigns the requested expressions; jsdom drops these calc/var bottom declarations, analogous to the earlier CSS-token testing limitation. The photo case stops before opening the panel. A further ruling is required for how these geometry assertions should be verified; no test-only attributes or changes were added to the application to make them pass.

3. `review Played with > (i) tagged viewer gets Remove me on the review and deletes their review tag`:
```text
TestingLibraryElementError: Unable to find role="menuitem" and name "Remove me"
 ❯ src/test/reviewPlayedWith.test.tsx:186:34
```
Failing call: `fireEvent.click(await screen.findByRole('menuitem', { name: 'Remove me' }))`.
The preceding fixture event is `fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })`. The rendered trigger exists with aria-label Post options, but remains data-state closed/aria-expanded false in the runner's DOM. The review deletion was not reached. This is not evidence that removal works on a real device; no browser run or fixture repair was attempted after the mandatory stop.

## Four requested sequential shards
| Command | Outcome |
| --- | --- |
| `bunx vitest run --shard=1/4` | Not run: unexpected focused-test stop |
| `bunx vitest run --shard=2/4` | Not run: unexpected focused-test stop |
| `bunx vitest run --shard=3/4` | Not run: unexpected focused-test stop |
| `bunx vitest run --shard=4/4` | Not run: unexpected focused-test stop |

No full-suite executed or passing total is available for this request.

## Every existing test change — mock only
Both files below remain **4 → 4 cases**. A byte comparison verified that removing these exact three added mock lines reproduces each HEAD file; **all other lines and assertions are unchanged**. No existing case was deleted, renamed or rewritten.

### reviewComposerChrome.test.tsx and reviewReceiptNextCourse.test.tsx
Old: no golfPostReads/reviewWith/syncMentions mock for the newly integrated review-social path.
New (identical additions in both files):
```ts
vi.mock('@/features/post-v2/lib/golfPostReads', () => ({ fetchPlayedWithSuggestions: async () => [], readWithCandidates: async () => [], searchMembers: async () => [] }));
vi.mock('@/features/review-v2/lib/reviewWith', () => ({ readReviewWith: async () => [], writeReviewWith: async () => ({ saved: [], error: null }), syncReviewWith: async () => null }));
vi.mock('@/lib/mentions/syncMentions', () => ({ syncMentionsForContent: async () => ({ added: 0, removed: 0, kept: 0 }) }));
```
Why: the brief authorizes new stubs for tests mocking review submission; these keep unrelated wizard chrome/receipt tests isolated from new review tag, suggestion and mention reads/writes. Neither react-i18next mock was changed.

## Full-suite inventory before/after
- Last complete passing suite: **9,329** (`988ec7f95f`).
- Before this request: **9,329**.
- Added only `reviewPlayedWith.test.tsx`: **0 → 23 cases**, no deletion or rename.
- After this request: **9,352 expected = 9,329 + 23**, not a verified full-run total.

### All 23 new case names
1. `(a) personal wizard puts unchanged selection after text and before the tray` — passed.
2. `(a) business wizard has no Played with selection or suggestions read` — passed.
3. `(b) create waits for the returned review id before writing selected ids` — passed.
4. `(b) edit preloads tags then syncs removal and addition after save` — passed.
5. `(c) review tag error reports review_create for eight seconds and still shows saved review` — passed.
6. `(d) syncs review mention markup on successful save, edit=false` — passed.
7. `(d) syncs review mention markup on successful save, edit=true` — passed.
8. `(e) review photo chip and upward panel clear the measured glass strip` — failed, quoted above.
9. `(e) review video chip clears the mute tap area by eight pixels` — failed, quoted above.
10. `(f) review without media opens the sheet from both faces and byline` — passed.
11. `(g) real review fullscreen chrome shows the chip under its author and opens the panel` — passed.
12. `(h) one host batch reads distinct review ids once alongside post tags and joins usernames` — passed.
13. `(i) tagged viewer gets Remove me on the review and deletes their review tag` — failed, quoted above.
14. `(j) tag review notification prefers feed post then exact course review` — passed.
15. `(j) mention review notification prefers feed post then exact course review` — passed.
16. `review writer excludes self` — passed; concrete saved ids equal ['a'] after author/duplicate input.
17. `review writer caps at eight tagged members` — passed; concrete saved ids equal u0 through u7 from ten candidates.
18. `sync returns the first removal error and does not insert` — passed.
19. `mention failure only warns and leaves saved review successful` — passed.
20. `staged wizard waits for the published review id and preserves mention markup` — passed; captured callback exercised, not a real upload/publish.
21. `suggestions pass a known course/play day unchanged and otherwise null` — passed.
22. `review with no tags renders no new display` — passed.
23. `empty review id list causes no read` — passed.

## Files changed
- AGENTS.md — short ownership pointer; local technical rules are in the new module headers.
- roadmap.md — scope and mandatory test stop.
- src/features/review-v2/lib/reviewWith.ts — new review tag data contract.
- src/features/review-v2/lib/saveReviewSocial.ts — new nonblocking tag/mention save helper.
- src/features/review-v2/hooks/useReviewPlayedWith.ts — new review selection/hydration hook.
- src/features/review-v2/ReviewComposerV2.tsx — wizard section and instant/staged social-save wiring.
- src/features/review-v2/hooks/useReviewMediaPipeline.ts — optional callback after successful real review publication.
- src/features/post-v2/lib/postWithError.ts — review_create/review_edit modes added to the existing reporter.
- src/hooks/feed/usePostGolfTags.ts — shared review batch and identity key.
- src/components/feed/CardFeed.tsx — review batch selection.
- src/components/posts-tab/LightCardFeed.tsx — review batch selection.
- src/components/feed/FeedCard.tsx — review tag props/menu.
- src/components/feed/ReviewPostCard.tsx — review media and no-media displays.
- src/components/feed/PostGolfTags.tsx — optional raised panel bottom/review removal, existing post defaults preserved.
- src/components/fullscreen-feed/FullscreenFeedOverlay.tsx — review batch selection.
- src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx — allow review viewer chip.
- src/features/activity-v2/utils/activityLinks.ts — review tag/mention preference/fallback branch.
- src/test/reviewPlayedWith.test.tsx — 23 added cases.
- src/test/reviewComposerChrome.test.tsx — three authorized mock additions only.
- src/test/reviewReceiptNextCourse.test.tsx — three authorized mock additions only.
- This report and focused.log — retained verification evidence.

## Verification limitations
Latest harness signal: **build OK**, `2026-11-20T18:34:06Z`; intermediate type errors were resolved before focused tests. No manual build/typecheck was run.

Authentication status is external_unmanaged, so authenticated production end-to-end checks are unavailable. No SQL, credentials, session minting, real review creation, real notification delivery, or real tagged-member deletion was performed. Rendered wizard saves were tested with actual composer/submit code and mocked Supabase; they do not prove database trigger delivery. The supplied statement that Ben has deployed review_with and its trigger was not independently queried. Browser/320px/device checks remain unverified because work stopped on the unexpected tests.