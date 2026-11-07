# PF2_GUIDE — posting rebuild stage 2: hole guides

## Summary
The composer hole-guide row now follows the audience: only a personal actor posting to Everyone with media can feed a hole guide, and every guide shot that came from a post links back to it from the hole viewer with a "View post ›" pill.

## Product changes
- `src/features/post-v2/lib/composerGolfRules.ts`
  - New `effectiveHoleGuide(addToGuide, mediaCount, personal, visibility)`: member switch AND media AND personal AND `visibility === 'anyone'`.
  - `golfPostPatch` now writes `add_to_hole_guide` as the effective boolean (true or false) whenever a course and hole are set, so turning the guide off actually turns it off.
- `src/features/post-v2/components/golf/ComposerGolf.tsx` + `composerGolf.css`
  - Mock A (personal + Everyone): copy is exactly "Golfers planning a round see it on the {short name} course page, credited to you." — "once it's approved" removed.
  - Mock B (any other audience): box not in the "on" border state; switch renders off, disabled, at opacity 0.4 and cannot be turned on; copy is exactly "Hole guides are public. Change **Who can see this** to Everyone."; tapping anywhere on the row (including the locked switch, whose tap bubbles to the row) opens the existing VisibilitySheet.
- `src/features/post-v2/StageComposer.tsx`
  - `guideEffective` computed once from `effectiveHoleGuide(state.addToGuide, media.length, isPersonalActor, visibility)` and used for the posts patch (`doCreate`), both `composerDestinations` footer sub-lines (ShareFooter and Preview share), and the row's `audienceOk`/`onRowTap`.
  - `state.addToGuide` is never rewritten on audience change, so switching back to Everyone restores the member's choice. Drafts keep `addToGuide` in course_data as before.
  - Posting as a business/club page: the row does not render (`isPersonalActor` gate) and the patch can never be true.
  - Edit mode: `doSaveEdit` does not write golf fields today (patch covers content, course_id, tagged_course_ids, visibility, scheduled_at only), so per the brief it was left alone — reported here.
  - Success screen: PostSuccessV2 carries no guide copy; the only guide announcement is the footer sub-line, which now uses the effective value.
- `src/lib/courseMedia/memberShotPosts.ts`
  - `MemberShotRow.source_post_id?: string | null`; `holeShotItems` carries it into `item.memberShot.sourcePostId` for both `get_hole_media` (hole walk / viewer) and `get_latest_hole_media` (Latest holes rail). Server order is rendered as returned (newest first); no client re-sort was added or present on the hole path.
  - Place shots explicitly get `sourcePostId: null`; course-post shots never get one.
- `src/components/media-system/types/media.ts` — `memberShot.sourcePostId?: string | null`.
- `src/components/fullscreen-feed/MemberShotCredit.tsx` + `member-shot-credit.css`
  - Glass pill "View post ›": 34px high, 0 12px padding, 11px radius, rgba(14,14,16,0.55) background, 1px rgba(255,255,255,0.14) border, no blur; 12.5px/700 #F8FAFC, 6px gap, "›" in rgba(248,250,252,0.62)/600, nowrap.
  - Own row at left 72px, bottom 24px + safe area (48px + safe area for video); the caption lifts 46px (34 + 12) only when the pill is present. Shots without a source post render exactly as before.
  - The pill takes pointer events (caption stays pointer-events: none) and stopPropagation, so a tap never advances the slide.
- `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx`
  - `handleViewSourcePost`: closes the viewer first (onBeforeNavigate/onClose, same contract as mention taps), then navigates to `/post/:postId` with state `{ closeTo: current path + search }` (VIEW_POST_1 contract), so closing the post returns to the course or Courses page it came from.

## Tests
- New `src/test/pf2HoleGuide.test.tsx` (14 cases): effective-guide rule (personal+anyone+media → true; followers/private → false while the switch stays on and returns on anyone; business → false; no media → false); golfPostPatch false write; footer sub-line with/without guide; mock A and mock B exact copy; locked switch cannot turn on; row tap opens visibility; holeShotItems/latest-holes sourcePostId carriage and server-order preservation; place shots null; pill renders only with sourcePostId; caption lifts 46px only then; tap reports the post and never reaches the slide; video geometry classes.
- Changed existing tests (brief changed the rules they encode):
  1. `src/test/pf1bPostGolfContext.test.tsx` — "never writes it without the toggle, a hole or a course" renamed to "writes the effective boolean both ways, but never without a hole or a course"; old assertion `expect(golfPostPatch({ course, holeNo: 15, addToGuide: false })).toEqual({ tagged_course_ids: ['c1'], hole_no: 15 })` → new `…toEqual({ tagged_course_ids: ['c1'], hole_no: 15, add_to_hole_guide: false })`. Reason: PF2 writes false explicitly so edits can turn the guide off.
  2. `src/test/memberShotPosts.test.ts:123` — hole-caption payload expectation gained `sourcePostId: null`. Reason: holeShotItems now always carries the key.
  3. `src/test/memberShotPosts.test.ts:208` — latest-holes per-item payload expectation gained `sourcePostId: null`. Same reason.
- No tests deleted.

## Suite
- Focused (pf2HoleGuide, pf1bPostGolfContext, pf1ComposerGolf, memberShotPosts, memberShotViewerPolish, latestHolesSwipeCaption, courseMediaV2, holeMediaVideos, holeLibraryVideosStage2, holePanelCarousel): 136/136.
- Four separate `bunx vitest run --maxWorkers=2 --shard=N/4` runs: 1,923 / 1,788 / 1,906 / 1,806 = **7,423 tests / 649 files, zero failures**. The known pre-existing tourIsland.test.tsx:235 failure did not appear. Logs: /tmp/pf2/shard1–4.log.
- Preview build: OK (2026-11-07T13:49:49Z).

## Checks (per brief)
1. Followers post with a hole → mock B row, tap opens Who can see this, switching back to Everyone restores the switch: covered by unit tests; live run needs a signed-in member (external unmanaged auth — not verified here).
2. Posting as a club page → no guide row: covered by the `isPersonalActor` gate and rule tests; live check with Ben.
3. Personal Everyone photo post with hole 15 and the guide on → appears in the 15th's viewer with "View post ›", pill opens the post, closing returns to the course page: client wiring tested; end-to-end on device with Ben.
4. Shots tagged through the Media tab show no pill: covered (place/course-post shots carry `sourcePostId: null` / none).
5. 320px: mock B copy uses `overflow-wrap:anywhere` on the existing row styles and wraps without truncation in the component test; physical 320px device check with Ben.
