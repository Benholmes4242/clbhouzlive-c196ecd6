# Fullscreen viewer action pills — fixture ruling and full suite passed

## Source-post fixture ruling — complete
Test fixtures only: no application/source, font, SQL, migration, feed_config or round_pool_cap changes. All seven case names and assertions are unchanged. No tests were added, deleted, renamed or rewritten in this request; only their supplied props changed.

### Each authorised fixture change
1. `src/test/canonicalFullscreenViewer.test.tsx`, “a source-post course photo shows all four action pills”: the shared `chrome` helper forwards optional `confirmedSourcePostIds`; this case explicitly supplies `['post-1']`.
2. `src/test/pf2HoleGuide.test.tsx`, “renders only with a sourcePostId, on its own line in the Full review style”: shared `chrome` supplies `confirmedSourcePostIds: ['post-1']` for the source shot; the null-source rerender supplies `[]`, retaining the negative check.
3. Same file, “the tap opens the post and never reaches the slide”: shared `chrome` supplies `confirmedSourcePostIds: ['post-1']`.
4. Same file, “video shots keep View post in the stack with the canonical video row below it”: shared `chrome` supplies `confirmedSourcePostIds: ['post-1']`.
5. `src/test/canonicalGalleryChrome.test.tsx`, “source-post gallery actions are two flex pills plus three 44px squares and four 8px gaps”: opts into the shared mount helper's confirmed-source engagement.
6. `src/test/galleryControls.test.tsx`, “a video shot renders the canonical video row mute and Tag in the pill row”: opts into shared mount confirmation/engagement for `post-v1`.
7. Same file, “a photo shot renders Tag with no mute and no blank slot”: opts into shared mount confirmation/engagement for `post-a`.

Both gallery helpers add exactly `{ likeState: { isLiked: false, count: 0 }, commentCount: 0, onLike: vi.fn(), onComment: vi.fn(), onShare: vi.fn() }` only when the case opts in and its shot carries a source post. Other calls retain `engagement: undefined`; standalone cases are not confirmed by default.

### Commands and results
Focused: `bunx vitest run src/test/canonicalFullscreenViewer.test.tsx src/test/pf2HoleGuide.test.tsx src/test/canonicalGalleryChrome.test.tsx src/test/galleryControls.test.tsx src/test/viewerContent.test.tsx --maxWorkers=2 --minWorkers=2` — **48/48**, five files, 10.48s.

Full commands: `bunx vitest run --shard=N/4 --maxWorkers=2 --minWorkers=2`, N=1, then 2, then 3, then 4, separate sequential runs from the start:
- Shard 1: **2,239/2,239**, 205 files, 312.33s.
- Shard 2: **2,266/2,266**, 205 files, 312.07s.
- Shard 3: **2,280/2,280**, 205 files, 332.51s.
- Shard 4: **2,349/2,349**, 204 files, 312.36s.
- Full suite: **9,134 passed / 9,134 executed**, 819 files; no failures or isolated reruns. This supersedes the historical stops below.

### Before/after reconciliation: 9,118 → 9,134 (+16)
This request changes inventory by zero. All sixteen intervening additions, retained from the prior viewer work:
1. `canonicalFullscreenViewer.test.tsx`: “a source-post course photo shows all four action pills”.
2. Same file: “the review score strip uses the full-width card row and its divider”.
3. Same file: “no application viewer open passes readOnly”.
4. `canonicalGalleryChrome.test.tsx`: “source-post gallery actions are two flex pills plus three 44px squares and four 8px gaps”.
5. `viewerContent.test.tsx`: “source-post counts and active-actor likes come from one batch, and the canonical cache patches them”.
6. Same file: “an open review with null breakdown hydrates all four scores in one batched read”.
7. Same file: “a standalone course photo has no post target or post batch”.
8. `momentReviewPages.test.tsx`: “CourseMoments opens grouped reviews at the tapped media and likes the review”.
9. Same file: “YourMomentsSection opens grouped reviews at the tapped media and likes the review”.
10. Same file: “CourseYouTab shares the moments opener with review targets and tapped media”.
11. `userCourseMomentsReviewRead.test.tsx`: “own moments retain review identity, text and all scores from one ratings batch”.
12. `canonicalFullscreenViewer.test.tsx`: “a resolved unmatched post has no pills and double-tap cannot call a like”.
13. Same file: “a course-media RPC review without score columns reads its review once and renders all five figures”.
14. `viewerContent.test.tsx`: “a successful missing-source batch warns once per open and reports absence authoritatively”.
15. `canonicalFullscreenViewer.test.tsx`: “untagged Tag previews have no pills; standalone course photos share a valid Media URL only”.
16. Same file: “place shot actions and View post require a resolved source batch; unmatched shots share only”.

Historical authorised assertion changes/renames are listed in the earlier sections below; none removes a case or changes this +16 reconciliation. No assertion text changed in this request. Diff whitespace and assertion/name preservation checks passed. Harness preview status checked at closeout; no manual build/typecheck was run for this fixture-only request.

Ben's physical iPhone checks remain external/unverified: public clubhouse/range source actions and View post; You moment review like; untagged Tag preview without buttons; JohnL's Sunningdale (Old) five scores via Media and Watch. This fixture-only request did not perform a live/device check.

## Confirmed-source ruling — STOP at focused checks
- Synthetic member-shot source actions now require a successful source batch that returned the id. The overlay passes confirmed ids to ImmersiveFullscreenChrome; View post is hidden during loading/failure/unmatched. viewerActionPost returns null for unconfirmed synthetic targets, so likes/double-taps cannot target them. Synthetic chrome uses standalone Share when a courseId exists and no pills otherwise; non-synthetic unmatched posts retain the phantom guard. Gallery like/comment/source Share require the confirmed engagement supplied by the overlay; its existing Tag/Grid controls remain independent.
- Updated the two source-id comments exactly to describe every tag path and viewer batch confirmation. No SQL, migrations, feed_config, round_pool_cap or font changes.
- Only pf2HoleGuide change: renamed “place shots never get one” → “place shots carry their source post”; `expect(posts[0].mediaItems[0].memberShot?.sourcePostId).toBeNull()` → `.toBe('post-9')`. No other change to that file.
- Added one case, canonicalFullscreenViewer.test.tsx: “place shot actions and View post require a resolved source batch; unmatched shots share only”. Loading, confirmed, unmatched and failed-equivalent states exercise the target resolver and rendered pills/View post. This case passed.
- Baseline **9,118 → expected 9,134 (+16)**: original seven + follow-up seven + Tag-preview one + confirmed-source one, all named in this report. No deletions; one authorised rename, no case-count loss. This is expected inventory, not a passing full-suite total. Four full shards NOT STARTED because focused checks failed.

Focused command: `bunx vitest run src/test/canonicalFullscreenViewer.test.tsx src/test/pf2HoleGuide.test.tsx src/test/canonicalGalleryChrome.test.tsx src/test/galleryControls.test.tsx src/test/viewerContent.test.tsx --maxWorkers=2 --minWorkers=2` — **41 passed / 7 failed / 48 executed**, one file passed / four failed, 10.04s. All seven failed assertions remain unchanged; their direct-render fixtures supply no batch confirmation (Immersive) or confirmed engagement (gallery).

### Exact failures / individual-file isolated reruns
1. `src/test/canonicalFullscreenViewer.test.tsx:165:103`, “a source-post course photo shows all four action pills”, 20ms: `AssertionError: expected [ 'share' ] to deeply equal [ 'like', 'comment', 'share', 'more' ]`. File-alone rerun reproduced, 24ms; 12 passed / 1 failed / 13.
2. `src/test/canonicalGalleryChrome.test.tsx:39:57`, “source-post gallery actions are two flex pills plus three 44px squares and four 8px gaps”, 86ms: `AssertionError: expected [ 'tag', 'share', 'grid' ] to deeply equal [ 'like', 'comment', 'tag', …(2) ]`. File-alone reproduced, 89ms; 7 passed / 1 failed / 8.
3. `src/test/galleryControls.test.tsx:56:22`, “a video shot renders the canonical video row mute and Tag in the pill row”, 71ms: `AssertionError: expected <button …(4)>…(1)</button> to be <button …(3)>…(1)</button> // Object.is equality`. File-alone reproduced, 61ms.
4. `src/test/galleryControls.test.tsx:62:28`, “a photo shot renders Tag with no mute and no blank slot”, 17ms: `AssertionError: expected <button …(3)>…(1)</button> …(2) to have a length of 5 but got 3`. File-alone reproduced, 16ms; galleryControls total 7 passed / 2 failed / 9.
5. `src/test/pf2HoleGuide.test.tsx:129:19`, “renders only with a sourcePostId, on its own line in the Full review style”, 139ms: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "View post"`. File-alone reproduced, 163ms.
6. `src/test/pf2HoleGuide.test.tsx:138:28`, “the tap opens the post and never reaches the slide”, 120ms: same `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "View post"`. File-alone reproduced, 113ms.
7. `src/test/pf2HoleGuide.test.tsx:144:96`, “video shots keep View post in the stack with the canonical video row below it”, 14ms: `AssertionError: expected null not to be null`. File-alone reproduced, 16ms; pf2HoleGuide total 11 passed / 3 failed / 14. The authorised place-source assertion passed.

Individual isolated commands: `bunx vitest run src/test/<file>.test.tsx --maxWorkers=1 --minWorkers=1` for canonicalFullscreenViewer, canonicalGalleryChrome, galleryControls, pf2HoleGuide, sequentially; all seven reproduced. An earlier sequential-worker four-file rerun also reproduced 37 passed / 7 failed / 44. Logs under /tmp/viewer-confirmed-*.log, including each file's -isolated.log.

Harness build/typecheck **build OK at 09:25:39 UTC** after completed code edits; whitespace diff clean. No manual build/typecheck. No browser/iPhone check after mandatory STOP; Ben's public-place actions/View post, untagged Tag preview and JohnL Media/Watch scores remain unverified on device. Work is saved but suite completion requires a ruling on these existing fixtures, not an invented confirmation default.

## Read-only rulings / Tag preview guard — STOP in shard 3
- Applied exactly the three authorised options changes in coursesRailsUnlimited, mediaV3 and holeInlineAutoplay: `options: { readOnly: true, syntheticPosts: true }` → `options: { syntheticPosts: true }`. mediaV3's “single thumbnail opens canonical read-only viewer without saving” renamed “single thumbnail opens the canonical viewer without saving”; retained `expect(save).not.toHaveBeenCalled()`. holeInlineAutoplay's “batch glass thumbnail stays still and opens the canonical read-only video viewer” renamed “…opens the canonical video viewer”; every other assertion in each case remains unchanged. coursesRailsUnlimited's case name is unchanged. memberShotPosts.test.ts was untouched.
- ImmersiveFullscreenChrome suppresses the entire pill row when synthetic media lacks both sourcePostId and courseId. Valid standalone course shots retain Share only, with a guarded `/courses/<courseId>?tab=media&shot=` URL. No font changes or SQL/migration/feed_config/pool-cap changes.
- Added exactly one case in canonicalFullscreenViewer.test.tsx: “untagged Tag previews have no pills; standalone course photos share a valid Media URL only”. It exercises openTagShot, renders its output with no pills, then renders a course-id photo with exactly ['share'] and checks the actual share callback URL.
- Before/after inventory: **9,118 → expected 9,133**, +15: seven original viewer additions + seven follow-up additions listed below + this one case. This request deletes no cases; the two authorised renames above do not change the count. Full-suite passing total is unavailable because shard 3 stopped.

### Pre-shard readOnly audit
`rg -n -U 'expect\([^;]*(?:readOnly:\s*true)' src/test` returned no other expected open-options assertions after the authorised changes. `rg -n 'readOnly:\s*true' src/test` retained only setup/exercise calls: canonicalGalleryChrome:30; courseGallery:31,42,103; fullscreenViewerRedesign:59,75; galleryControls:30; memberShotPosts:161,167. These are not expected open-options objects, were left untouched, and have no matching assertion to quote for §1e. Explicitly retained `store.open([post], 0, { readOnly: true, syntheticPosts: true })` at memberShotPosts:161 and `.open([post], 0, { readOnly: true })` at :167.

### Commands and exact STOP
Focused: `bunx vitest run src/test/canonicalFullscreenViewer.test.tsx src/test/coursesRailsUnlimited.test.tsx src/test/mediaV3.test.tsx src/test/holeInlineAutoplay.test.tsx --maxWorkers=2 --minWorkers=2` — **61/61**, four files.

All full shards started sequentially from shard 1, command `bunx vitest run --shard=N/4 --maxWorkers=2 --minWorkers=2`:
- Shard 1: **2,239/2,239**, 205 files, 303.62s.
- Shard 2: **2,266/2,266**, 205 files, 331.65s.
- Shard 3: **2,278 passed / 1 failed / 2,279 executed**, 204 passed files / one failed, 304.91s.
- Shard 4: NOT RUN due required stop. Executed full-run subtotal: **6,783 passed / 1 failed / 6,784 executed**.

Failure: `src/test/pf2HoleGuide.test.tsx:103:61`, “PF2 holeShotItems source post > place shots never get one”, 7ms:
```text
AssertionError: expected 'post-9' to be null
```
Assertion: `expect(posts[0].mediaItems[0].memberShot?.sourcePostId).toBeNull()`; received `"post-9"`. This test and the place-shot builder were unchanged in this request; the preceding viewer work carries source-post identity. No unauthorised correction made.

Isolated: `bunx vitest run src/test/pf2HoleGuide.test.tsx --maxWorkers=1 --minWorkers=1` — **13 passed / 1 failed / 14 executed**, same error and line, failed case 10ms, duration 4.31s. Logs: /tmp/viewer-tag-focused.log, /tmp/viewer-tag-shard{1,2,3}.log, /tmp/viewer-tag-isolated.log.

Harness build/typecheck: **build OK**, 09:01:40 UTC after final edits; no manual build/typecheck. Diff whitespace check passed. Ben's physical iPhone Tag/You/JohnL Media/Watch checks remain unverified; no further live work performed after the required stop.

## 19 November follow-up — implemented; STOP in shard 1

### Changes
- Removed CourseMoments' obsolete hard-coded/readOnly comment while replacing its media-id pages with canonical grouped review pages. The static scan stayed unchanged.
- `useUserCourseMoments` now retains `reviewId` and supplies text, overall and four breakdown scores from one course_ratings read scoped to the user's course reviews. Removed the unused preliminary all-course review-media read. The hook currently produces review_media only, not post moments.
- `momentPages` groups reviews in first-seen order, orders each review's media newest first, and calls reviewFeedPost. CourseMoments, YourMomentsSection and CourseYouTab preserve the tapped mediaId and resolve its grouped page rather than using tile index as page index. Review engagement remains useStoryEngagement('review'), content reaction toggle('review', reviewId), review comments and canonical review sharing; builders contain no invented engagement counters.
- Successful source-post batches are authoritative: unmatched non-review ids yield null action targets, no pills and no double-tap mutation. Loading behaviour is unchanged. One warning per open lists unmatched ids. Review pages do not enter the source-post batch.
- The only unmatched id exercised in tests was the deliberately invalid `phantom-media` fixture in canonicalFullscreenViewer/viewerContent; no real moments surface yielded an unmatched id. This is fixture verification, not a live surface audit.
- Accepted exceptions: ShotTagCard/openTagShot untagged own media without post/course has no pills; standalone course photos without source posts have Share only. These are the only accepted pages without like/comment; unmatched phantom ids deliberately suppress the entire row.
- JohnL root cause accepted as supplied: get_course_media_v2, get_explore_feed, get_watch_shorts and get_long_form_videos omit review_*_score. A new course-media-shaped-row test confirms source_review_id drives exactly one course_ratings score read and all five card-variant figures render. No SQL, migration, new RPC, feed_config or round_pool_cap change.

### Authorised existing assertion change
- `memberShotsVerticalPaging.test.tsx`, “course placeholders keep three tile ids in rail order and empty member identity”: exact assertion `expect(m.memberShot).toEqual({ kicker: "Through members' eyes", title: 'Course 1', courseId: 'c1', courseName: 'Course 1', credit: '', memberName: '', avatarUrl: null })` gains only `sourcePostId: 'p1'`. Reason: explicitly authorised carried tile post identity. No other changes to that case. No cases deleted, renamed or rewritten in this follow-up; no existing moments media-id assertions were found to update.

### Inventory: 9,118 baseline → expected 9,132 (+14)
The previous build's seven additions are listed below; this follow-up adds seven more. This is inventory, not a full-suite pass.
- `momentReviewPages.test.tsx` +3: “CourseMoments opens grouped reviews at the tapped media and likes the review”; “YourMomentsSection opens grouped reviews at the tapped media and likes the review”; “CourseYouTab shares the moments opener with review targets and tapped media”. The first two render and tap their surface; CourseYouTab exercises its shared opener and checks the source delegates to it, not a full tab render.
- `userCourseMomentsReviewRead.test.tsx` +1: “own moments retain review identity, text and all scores from one ratings batch”.
- `canonicalFullscreenViewer.test.tsx` +2: “a resolved unmatched post has no pills and double-tap cannot call a like”; “a course-media RPC review without score columns reads its review once and renders all five figures”.
- `viewerContent.test.tsx` +1: “a successful missing-source batch warns once per open and reports absence authoritatively”.

### Verification and exact STOP
Focused command: `bunx vitest run src/test/momentReviewPages.test.tsx src/test/userCourseMomentsReviewRead.test.tsx src/test/viewerContent.test.tsx src/test/canonicalFullscreenViewer.test.tsx src/test/canonicalGalleryChrome.test.tsx src/test/galleryControls.test.tsx src/test/latestCoursesSection.test.tsx src/test/latestHolesSection.test.tsx src/test/memberShotsVerticalPaging.test.tsx src/test/cb70CourseMediaOpensTapped.test.tsx --maxWorkers=2 --minWorkers=2` — **106/106**, 10 files.

Sequential full run command: `bunx vitest run --shard=1/4 --maxWorkers=2 --minWorkers=2` — **2,238 passed / 1 failed / 2,239 executed**, 204 files passed / 1 failed; 396.25s. Shards 2–4 NOT RUN.

Unexpected failure: `src/test/coursesRailsUnlimited.test.tsx:134:20`, “loaded holes run and refresh > opens every loaded row in order and selects the tapped second-page shot”, 231ms:
```text
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…} ]
```
Expected `options: { readOnly: true, syntheticPosts: true }`; received `options: { syntheticPosts: true }`. The removed application readOnly flag came from the preceding interactive-viewer work; this protecting assertion was not changed.

Required isolated rerun: `bunx vitest run src/test/coursesRailsUnlimited.test.tsx --maxWorkers=1 --minWorkers=1` — **14 passed / 1 failed / 15 executed**, same file/line/error; failed case 336ms, run 10.66s. STOP retained even if a later rerun passes. Logs: /tmp/viewer-followup-focused.log, /tmp/viewer-followup-shard1.log, /tmp/viewer-followup-isolated.log.

Harness build/typecheck **build OK** at 08:49:16 UTC after final code edits. No manual build/typecheck. `git diff --check` passed. Font declarations in other files were not touched; removed viewer stack remains identical to the app stack in order, so inheritance causes no font-stack change. Physical iPhone visual confirmation remains unverified.

Ben's iPhone checks remain: course You moments live counts/like, and JohnL Sunningdale (Old) five scores via Media and Watch. No signed-in live check was performed after the mandatory test stop.

## Implemented, not fully verified
- Client-only shared batch reads for source-post counts/viewer post_likes (active-actor matching), registered with the feed engagement cache. Viewer action routing resolves the active media's source post for likes, comments, sharing and More.
- Removed application readOnly open flags and the per-post readOnly field; open-wide option remains for compatibility. Course photos without a source post show Share only: no existing standalone course-media report/hide menu was found, so More is omitted rather than inventing one.
- Gallery renders two flex like/comment pills for source posts followed by 44px Tag/Share/Grid controls, retaining conditional Tag and grid selection. Standalone gallery shots omit like/comment.
- Review strip uses unchanged ReviewScoreRow variant="card", its divider and full-width spacing, with existing glass padding/radius and no text shadow prop. Added one batched course_ratings sub-score fallback for null/all-null breakdowns.
- Audit: CourseReviewsTab, Latest reviews/latestReviewInput, AboutMediaStrip and ReviewBottomSheet already forward all four scores. feedMapper forwards flattened review_* score fields; several feed RPC payloads omit those columns (documented in useReviewFallback). The specific JohnL Sunningdale open and live row were not read, so its precise dropping source cannot be established or claimed fixed at source. Shared viewer fallback covers missing supplied scores; live verification remains outstanding.
- Source identity still needs completion for ShotTagCard's OwnMediaSource (no post id/course id in that shape); this preview cannot provide a valid course Media share destination until its caller supplies course identity. No SQL, migration, new RPC, feed_config or pool-cap change.

## Font ruling
Only ImmersiveFullscreenChrome.tsx and course-gallery.css local system-stack declarations were removed; CourseGalleryChrome.tsx contained none. Button fontFamily: 'inherit' stays. Compared the deleted stack against tailwind.config.ts: both list -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif in the same order, so inherited type should remain visually identical. Live/iPhone visual confirmation was not performed. All other file font declarations remain untouched.

## STOP — exact failures
Focused command:
`bunx vitest run src/test/viewerContent.test.tsx src/test/canonicalFullscreenViewer.test.tsx src/test/canonicalGalleryChrome.test.tsx src/test/galleryControls.test.tsx src/test/latestCoursesSection.test.tsx src/test/latestHolesSection.test.tsx src/test/memberShotsVerticalPaging.test.tsx src/test/cb70CourseMediaOpensTapped.test.tsx --maxWorkers=2 --minWorkers=2`

97 passed / 2 failed / 99 executed; 6 files passed / 2 failed. No full shards run after this failure.

1. src/test/canonicalFullscreenViewer.test.tsx:99:23, new case “no application viewer open passes readOnly”, 313ms:
```text
AssertionError: expected [ Array(1) ] to deeply equal []
- []
+ ["src/components/courses/phase5/CourseMoments.tsx"]
```
The scan matched the obsolete comment `// readOnly:true — likes/comments UI is suppressed and no mutation`, not a remaining open flag. Stopped; neither the comment nor the assertion was changed after failure.

2. src/test/memberShotsVerticalPaging.test.tsx:49:59, existing case “course placeholders keep three tile ids in rail order and empty member identity”, 19ms:
```text
AssertionError: expected { …(8) } to deeply equal { …(7) }
+ "sourcePostId": "p1",
```
Existing exact memberShot-object assertion excludes the newly carried sourcePostId; this assertion was not changed.

Isolated rerun command:
`bunx vitest run src/test/canonicalFullscreenViewer.test.tsx src/test/memberShotsVerticalPaging.test.tsx --maxWorkers=1 --minWorkers=1`
Both reproduced: 18 passed / 2 failed / 20 executed; scan 229ms, placeholder 18ms; same errors above. Logs captured in /tmp/viewer-focused.log and /tmp/viewer-isolated.log.

## Inventory reconciliation
Before full suite: 9,118. Expected inventory after additions: 9,125 (+7). This is an inventory expectation, NOT a completed passing suite.
- canonicalFullscreenViewer.test.tsx +3: “a source-post course photo shows all four action pills”; “the review score strip uses the full-width card row and its divider”; “no application viewer open passes readOnly”.
- canonicalGalleryChrome.test.tsx +1: “source-post gallery actions are two flex pills plus three 44px squares and four 8px gaps”.
- viewerContent.test.tsx +3: “source-post counts and active-actor likes come from one batch, and the canonical cache patches them”; “an open review with null breakdown hydrates all four scores in one batched read”; “a standalone course photo has no post target or post batch”.
- No cases deleted. Existing case changes below do not change counts.

## Every changed existing test
- canonicalFullscreenViewer.test.tsx, case (d) renamed from “About Photos review parents carry the course name and review scores; post parents stay read-only with the header” to “…post parents are interactive with the header”. Assertion `expect(post.readOnly).toBe(true)` → `expect('readOnly' in post).toBe(false)`, plus four-pill check. Reason: authorised removal of per-post readOnly.
- Same file, case (e) “a course-photo open renders the canonical top bar, member author row, hole strip and video row”: `expect(view.container.querySelector('[data-fullscreen-pills]')).toBeNull()` → pill list `['share']`; fixture no longer passes readOnly. Reason: standalone shots now show Share.
- galleryControls.test.tsx, “a video shot renders the canonical video row mute and Tag in the pill row”: `expect(pills[0]).toBe(screen.getByRole('button', { name: 'Tag this shot' }))` → index 2. Reason: Like/Comment precede Tag.
- Same file, “a photo shot renders Tag with no mute and no blank slot”: `expect(pills.children).toHaveLength(3)` → 5; `expect(pills.children[0]).toBe(screen.getByRole('button', { name: 'Tag this shot' }))` → index 2. Reason: five-control source-post row.
- canonicalGalleryChrome.test.tsx, “(b) the Tag pill follows galleryAction: tag primary, retag glass, null absent”: `expect(tag.textContent).toBe('Tag this shot')` and `expect(retag.textContent).toBe('Fix tag')` → identical values asserted via aria-label. Reason: square icon-only Tag preserves accessible label.
- latestCoursesSection.test.tsx, “BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS: two posts combine into one five-item carousel in post-then-media order and the tapped shot sets mediaId”: `expect(args.options).toEqual({ readOnly: true, syntheticPosts: true })` → `{ syntheticPosts: true }`. Reason: interactive course-photo open.
- latestHolesSection.test.tsx, “a tap opens the canonical viewer readOnly on the tapped shot across the whole rail” renamed “…interactively…”, same options assertion change. Reason: interactive course-photo open.
- memberShotsVerticalPaging.test.tsx, “tapping course two opens every loaded course, the tapped full set and other tile sets”: `expect([state.readOnly, state.syntheticPosts]).toEqual([true, true])` → `[false, true]`. Reason: removal of open readOnly flag.
- cb70CourseMediaOpensTapped.test.tsx: removed retired readOnlyFullscreen prop from renderGrid fixture and “a failed image shows the dark panel, no broken glyph, keeps its frame and does not open” fixture. No assertion changes; reason: obsolete prop removed from shared tile.

## Validation status
Harness preview build OK at 08:39:09 after all scoped font edits. Four shards not started due focused STOP; no manual build/typecheck. Signed-in end-to-end and 320px/iPhone checks not performed. Work remains incomplete pending the reported failures and source-identity/source-drop completion.