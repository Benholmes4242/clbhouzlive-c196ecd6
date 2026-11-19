# Fullscreen viewer action pills — stopped at focused verification

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