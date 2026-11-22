# FULL-SCREEN VIEWER — build report

## Suite
Command: `./node_modules/.bin/vitest run --shard=N/4`, four sequential runs (logs: shard1–4.log).
- Before (last full run, feed media chrome): 9,789 tests / 866 files (9,788 passed, 1 known failure).
- After: 2,398 / 2,418 / 2,443 / 2,545 = 9,804 tests / 867 files (9,803 passed, 1 failed).
- Delta +15 tests / +1 file = new `src/test/fullscreenViewerStack.test.tsx` (15 cases). No test deleted.
- The one failure is the already-reported `overviewRoundParity.test.tsx:82` casing ruling ('ROUND 1 · First tee' vs 'ROUND 1 · FIRST TEE'), unchanged and awaiting a ruling.

## Entry points checked
ImmersiveFullscreenChrome (feed, profile, course Reviews/About review opens, Latest holes course-photo opens via syntheticPosts), FullscreenFeedOverlay (owns the reads for both chromes), CourseGalleryChrome (course Media tab).

## Existing tests changed (rule changed by this brief; names kept unless stated)
- canonicalFullscreenViewer: RPC review — was `row.getAttribute('data-variant')==='card'` in `[data-review-score-strip]`; now the five figures are read from `[data-fullscreen-stats] b`. "score strip uses the full-width card row" renamed "is replaced by the five-cell stat row". (a) `[data-likers="review"]` id → `[data-likers]` absent. (e) renamed; hole strip "Par 4 · 303 yards" → stat row hole cell "4th"; `[data-fullscreen-video-row]` → mute in `[data-fullscreen-pill-row]`.
- canonicalGalleryChrome (d) renamed; facts card kicker/h2/stats → stat row `['4th','4','303','7','+0.4']`; place variant unchanged. (e) renamed; mute moves from video row to pill row.
- courseGallery: hole info → stat row cells; unknown yards → cells hole/par/SI/field; unscored → `['1st']`; untagged credit `.course-gallery-credit b` → member line `.fs-name`, plus no stat row.
- fullscreenHoleTileRow (a)(b)(c) rewritten and renamed: the hole tile is retired; hole course photos print the stat row, place photos have none.
- fullscreenStackAndUploadWhite (a)(b) renamed: "Full review is the last stack child" → stat row last, no Full review; "keeps the real LikedByRow" → no liked-by line.
- fullscreenViewerRedesign (e)(f) renamed: score tile gone / scores in stat row; Full review line → REVIEW chip on the member line.
- galleryControls: mute `[data-fullscreen-video-row]` → pill row; credit avatar 38px → member-line 32px (renamed); date `small` "14 Jan 2026" with no "·" → `.fs-time` "· 14 Jan 2026".
- latestHolesSwipeCaption: two strip-detail cases rewritten/renamed to stat-row hole cells following the active shot.
- likedByCollapse: "%s still passes reserve to LikedByRow" → "%s no longer renders a LikedByRow".
- memberShotCredit: shot author/date selectors → member line; hole strip → stat row; scrubber `left` containing '40px' → not containing (renamed).
- memberShotPosts: `{!syntheticPosts && likeState.count > 0 && <div ...` → source has no `<LikedByRow`.
- pf2HoleGuide: video row present → absent, mute in pill row.
- playedWithTags (f) renamed: chip after author/before caption → chip in pill row before member line, no CaptionBlock.
- reviewPlayedWith (g) renamed: chip after `[data-fullscreen-author]` → first child of pill row, followed by member line.

## Captures (placeholder background, fixture data; not live data or a real phone)
captures/{review-hole,review-untagged,post-hole,post-untagged,gallery-hole,gallery-clubhouse}_{390,320}.png and swipe1–3_{390,320}.png; metrics.json.
- Page width equals viewport at both widths; no stack element overflows.
- 320: avatar hidden (width 0), stat values 17px, row 34px; 390: 38px.
- Swipe hole → untagged → hole: dots, pill row, member line and stat row keep the same y (390: 586/602/652/696; 320: 590/606/656/700).
- Captures are not composited beside the mock; comparison was by eye.
- "Best 75" needs a signed-in viewer record, so it is covered by the test, not a capture.

## Differences from the mock / decisions to rule on
1. Scrubber and button row stay at their existing fixed positions (fullscreenCanon) instead of flowing in the stack with 14px gaps; the stack sits directly above them.
2. Follow pill, handicap and home club are gone from the author line (the mock's member line has name · time only).
3. Detailed videos keep the PF3B VideoTeaser (title + About sheet) above the stack; removing it would remove the About sheet.
4. An attached-round pill (FullscreenRoundPill) still shows between member line and stat row when a post has a round.
5. Course PAR/YARDS use the tee set with most rounds sampled; MEMBERS is the batched community rating, shown only at ≥ COURSE_RATING_FLOOR ratings.
6. Course-photo (Latest holes) opens map the shot kicker back to a hole number; hole facts then come from the shared hook. The old "Par 4 · 303 yards" detail text is no longer printed.
7. Course Media viewer: place facts card stays (above the stack); the stack anchor still moves between photo and video shots, as before.
8. Gallery tagged pill appears only for shots whose real source post is in the one tags batch; standalone shots have none.
9. Avatar initials use SquircleAvatar's existing 600 weight.
10. New wording keys are English only (other locales are disabled).
