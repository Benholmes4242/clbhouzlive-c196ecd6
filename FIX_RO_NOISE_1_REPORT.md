# FIX_RO_NOISE_1 report

## §1 Sources (deferred to next frame, pending frame cancelled on re-fire and cleanup)
- `useFitOneLine.ts`: observer fires now run `fit()` in requestAnimationFrame. The first synchronous `fit()` and the fonts-ready `fit()` are unchanged.
- `HowItPlays.tsx` (LocalHoleChart): `setW` from the observer is now deferred a frame. The first `measure()` is unchanged. `LocalHoleChart` is now exported for the test, with no behaviour change.
- `ChromeIsland.tsx`: the island-row observer's `publish(height)` (`--chrome-island-h` / `--chrome-clearance`) is now deferred a frame. The initial publish is unchanged.

### Other observers whose callbacks write synchronously (reported, not changed)
These call a measure/publish/fit function directly from the observer. Each sets React state, a style or a CSS variable synchronously:
- AmateurHero, ProfilePageV2:406, BottomNavigationContext:53 (setHeight)
- MiniBoard, AppDownloadGate (positionIdentity), useEdgeFades, ScheduleTab (publish)
- admin chartPrimitives:91 (setWidth), ShellSlot:70
- ImmersiveFullscreenChrome, CourseGalleryChrome, FixedPageHeader, AppHeader
- roundTilePlot:236 (setWidth)
- CroppedImage, BoardTable, AdjustSheet, MediaStageV2
- GlobalBottomNavigation (write), PicksBlock, TeamSummary, TeamListSection
- SegmentedControl, HcpTrendChart, ExpandableCaption, MentionsComposerInput
- EmptyStateScreen (fit), HundredRaceParts
- ReviewComposerV2 / SubmitBar / ReviewReceipt: review wizard, out of bounds.

Already deferred: BottomSheet (requestAnimationFrame). `useDeepLinkTabScroll` runs `assert` straight from its observer.

This list comes from reading the call sites, not from an in-depth trace of every function.

## §2 Tracker filter
New `src/lib/resizeObserverNoise.ts` holds `isResizeObserverNoise(message)`, which matches any message starting with "ResizeObserver loop". The window `error` listeners in `errorTracking.ts` and `perf/consoleCapture.ts` return early when it matches. Everything else is tracked as before.

## Files touched
useFitOneLine.ts, HowItPlays.tsx, ChromeIsland.tsx, errorTracking.ts, perf/consoleCapture.ts, lib/resizeObserverNoise.ts (new), test/fixRoNoise1.test.tsx (new).

## Tests
No existing test changed. Added `fixRoNoise1.test.tsx` (6 tests):
- One observer fire schedules one frame, and the font size changes inside it.
- Cleanup cancels a pending frame.
- In the How it plays chart, the width updates on the next frame.
- Neither ResizeObserver message is recorded.
- Any other error is still tracked.

## Counts
Before: 6,754 / 594 files. After: 1,748 / 1,605 / 1,720 / 1,687 = 6,760 / 595 files (+6 new tests, +1 file). 0 failures, 0 unhandled errors, no pre-existing failures.

The build first flagged a type error at fixRoNoise1.test.tsx:19 (the mock observer callback was declared with no arguments). I fixed it in the test file only and re-ran that file (6/6). The build was OK at 2026-11-04T22:00:33Z. Shards ran before this test-only type fix, so I did not re-run them. Logs: docs/verification/fix-ro-noise-1/.
