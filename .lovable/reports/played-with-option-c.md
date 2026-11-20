# Played with — Option C (posts)

STATUS: STOPPED at shard 2 (unlisted failure). Shards 3–4 not run.

## Stop
src/test/tourOverviewMergedAiry.test.tsx:91:41 — "AssertionError: the given combination of arguments (null and string) is invalid for this assertion."
Same failure left open by the Tour Overview upcoming/live brief (awaiting a ruling); this brief touches no Tour file.

## Shards
1/4: 2,279 passed. 2/4: 2,280 passed, 1 failed (2,281). 3/4, 4/4: not run.
Shard 2 is +2 vs the earlier 2,279 baseline. The new file adds 13 tests across the suite, so the full-run gain cannot be fully reconciled until shards 3–4 run.

## Files
- src/features/post-v2/lib/golfPostRules.ts — withNames + new withLine copy
- src/features/post-v2/lib/postWith.ts — PostWithPerson.username
- src/components/feed/PostGolfTags.tsx — PostWithLine deleted; PlayedWithChip, PlayedWithPanel, PlayedWithMediaOverlay, PlayedWithViewerChip, PlayedWithSheet, PlayedWithNameFaces, PlayedWithByline; SlideTagChip `lifted` (bottom 50)
- src/components/feed/FeedCard.tsx — media chip, grid bottom-left lift, video offset, text-post faces/byline, sheet
- src/features/explore-magazine/ExploreCard.tsx — optional faces/byline slots in RoundAuthorRow
- src/components/fullscreen-feed/FullscreenFeedOverlay.tsx — one usePostGolfTags(posts,'fullscreen')
- src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx — viewer chip after the author row
- src/test/playedWithTags.test.tsx — new, 13 tests (a–h)

## Assertions changed
- src/test/postPageGolf.test.tsx:74 `expect(withLine(['Danny', 'Thomas', 'Sam'])).toBe('with Danny and 2 others')` → `.toBe('with Danny, Thomas and Sam')`. Why: the brief's new copy for 3 people.

## Deviations
- The copy is a plain English rule function (like the old withLine), not locale keys. The app is English-only, and the test mock's t can't interpolate.
- Reviews show no chip: the review frame is for the later brief.
- Viewer: the panel width is min(300px, calc(100vw − 24px)), because the chip wrapper isn't the media's width.
- Video chip bottom: calc(var(--review-glass-h, −12px) + 18px + 44px + 8px), which is 8px above the mute control's 44px tap target.
- Not run: browser/device check at 320 or 390.
