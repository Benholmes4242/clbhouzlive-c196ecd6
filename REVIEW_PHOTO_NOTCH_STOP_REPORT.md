# Review Step 1 — Photo under notch: STOP report

## Implementation
- `src/features/review-v2/ReviewComposerV2.tsx`: InnerComposer owns the claim and single unmount release. Composer reports its actual photo-form state in a layout effect; InnerComposer reclaims the same id before paint. Photo uses `statusBarStyle: 'light'`, `statusBarColor: '00000000'`, `shieldColor: 'transparent'`. Other forms retain `FF16161A` and `RV2.canvas`.
- No header geometry, back/close position, route rules, SQL, migrations, deployed functions, feed_config, round_pool_cap or native configuration changed.

## Full suite
Command: `bunx vitest run`.
Before: **4,400/4,400 across 452 files** (last reported green).
After: **4,399 passed / 4 failed / 4,403 total across 452 files**.
No pre-existing failures appeared; all four failures are in the rewritten claim test's new mock. Stopped without correcting the mock or rerunning.

## Error (verbatim)
`src/features/review-v2/components/ReviewComposerHeader.tsx:41:17`:

> Error: [vitest] No "headerScore" export is defined on the "@/features/review-v2/hooks/useReviewHeaderFacts" mock. Did you forget to return it from "vi.mock"?

Failing cases in `src/test/reviewComposerChrome.test.tsx`:
1. `claims transparent photo then canvas after folding, overlay=false, with one unmount release`
2. `claims transparent photo then canvas after folding, overlay=true, with one unmount release`
3. `claims canvas on step 2 and releases once`
4. `claims canvas in edit mode and releases once`

## Test inventory
Rewritten/replaced case: `claims the review canvas once on mount and releases it on unmount`.
Its assertions were `expect(claimOverlayChrome).toHaveBeenCalledTimes(1)`, `expect(claimOverlayChrome).toHaveBeenCalledWith({ id: 'review-composer', statusBarStyle: 'light', statusBarColor: 'FF16161A', shieldColor: RV2.canvas })`, `expect(releaseOverlayChrome).not.toHaveBeenCalled()`, `expect(releaseOverlayChrome).toHaveBeenCalledTimes(1)`, and `expect(releaseOverlayChrome).toHaveBeenCalledWith('review-composer')`.
Why: the approved brief replaces unconditional canvas-on-mount with actual-header-form claims; the test must now render the data-dependent composer rather than suppressing AccessControl descendants. The four replacement cases retain one-release checks and assert exact photo/canvas claims, fold persistence, Step 2 and edit mode. One old case becomes four: **+3 tests**, no test-file delta. No other existing test changed.

## Every file changed
- `src/features/review-v2/ReviewComposerV2.tsx`
- `src/test/reviewComposerChrome.test.tsx`
- `roadmap.md`
- `REVIEW_PHOTO_NOTCH_STOP_REPORT.md`

## Verification limits
The suite did not reach the intended claim assertions because the header mock omitted an export. No authenticated browser/device visual verification was completed; route/overlay coverage is a test harness, not a real signed-in visual check. Automatic build/typecheck result unavailable in the sandbox diagnostics. No manual project build/typecheck was run.