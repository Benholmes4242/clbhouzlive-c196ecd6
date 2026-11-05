# FS_NOTCH_1 — STOP

## Result
Shared known-dimension geometry now anchors qualifying portrait media to y=0 with contain fit, narrowing height-limited media above the unchanged comment band. Other aspects and unknown dimensions retain their existing geometry. Slide-local notch scrims use the supplied gradient and safe-area height, beneath unchanged chrome, with course-gallery exclusion. Gallery geometry, fullscreenBand, overlay bleed setup, playback and all prohibited areas were not edited.

**Not complete:** focused checks stopped on three new test failures. No failing tests were repaired, no shards were run, and no browser/device verification is claimed. Preview build reported OK at 2026-11-05T22:18:25Z.

## Exact failures
Command: `bunx vitest run src/lib/media/__tests__/fullscreenBand.test.ts src/test/fsNotch1.test.tsx src/test/memberShotViewerPolish.test.tsx src/test/cb52VideoTimings.test.ts --maxWorkers=2`

**38 passed / 3 failed / 41 executed, four files.** Full output retained at `docs/verification/fs-notch-1/focused.log`.

1. `src/test/fsNotch1.test.tsx:37:45`, “renders the scrim inside a top-0 portrait slide”: `AssertionError: expected '' to be '0px' // Object.is equality`. Scrim presence passed; the image selector also matches the backdrop, not exclusively the media frame. No selector repair after failure.
2. `src/lib/media/__tests__/fullscreenBand.test.ts:65:18`, “height-limits taller portraits and centres between lateral safe insets”: `AssertionError: expected { top: +0, …(4) } to match object { top: +0, …(3) } (1 matching property omitted from actual)`. Expected width `251.33333333333334`; received `251.33333333333331`. New assertion used exact floating-point equality; no repair after failure.
3. `src/lib/media/__tests__/fullscreenBand.test.ts:75:22`, “anchors synthetic portrait media without reserving a footer”: `AssertionError: expected 98.83333333333331 to be +0 // Object.is equality`. This exposes a brief contradiction, not an alternative geometry implementation.

## Contradiction requiring a ruling
The brief defines tall portrait as `mediaAspect < 1 AND widthFilledH ≥ 0.9 × usableH`, where `usableH = h − safeTop − safeBottom`.

It also states: “safeBottom 0 there, so a 9:16 lands at top 0 with the backdrop below, which is intended.”

At 390×844, safeTop47, safeBottom0: widthFilledH = 693.333; usableH = 797; threshold = 717.3. A 9:16 does **not** qualify under the stated formula and remains centred at top98.833. No synthetic exception was added because the brief expressly forbids separate aspect logic and synthetic geometry changes beyond the shared rule.

## Changed files
- `src/lib/media/resolveRestingRect.ts`: shared rule and authority header.
- `src/components/feed/FeedSlide.tsx`: scrim consumes each image/video/borrow/pager rect; no gallery/aspect classifier added.
- `src/components/feed/FullscreenNotchScrim.tsx` and `fullscreen-notch.css`: slide-local scrim and semantic gradient token.
- `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx`: comments only; positions unchanged.
- `src/lib/media/__tests__/fullscreenBand.test.ts` and new `src/test/fsNotch1.test.tsx`: test ledger below.
- `roadmap.md` and this report: status/accounting.

SnapVideoPlayer remains unchanged: FeedSlide's settled engine-backed video already calls `VideoEngine.setObjectFit('fullscreen', settledRect.fit)` and gives its host the same rect aspect; no settled full-screen bars arise from SnapVideoPlayer's separate heuristic on this path. Actual playback still requires live verification.

## Test ledger and totals
Before this task: expected inventory **7,056 tests / 625 files**, not suite-verified. Last confirmed green **7,024 / 620**; intervening report ledger: EXP_RING_1 +3/+1, Tour menu +15/+1, Top Ten +4/+1, world-ranking admin +4/+1, world-ranking events +6/+1.

After this task: expected **7,072 / 626**, +16 cases/+1 file. Full-suite totals are not claimed as executed. Shards 1–4: **not run**, due to the new focused failures.

One existing test renamed/rewritten:
- `fullscreenBand.test.ts`: “contains a portrait video, width-limited, centred above the band” → “contains a portrait video, width-limited, anchored under the notch”. Old assertion: `expect(rect.top + rect.height / 2).toBeCloseTo((47 + 754) / 2)`; new: `expect(rect.top).toBe(0)`. Reason: explicitly authorized top-0 portrait rule. Width/height/fit/left/band assertions retained.

No tests deleted, no existing fixtures rewritten, no other existing assertions changed.

Added 10 cases in fullscreenBand: 393×852 video/image (2), 320×568 (1), 4:5 (1), 1:1/3:4/2:3 (3), taller lateral-inset portrait (1), unknown dimensions (1), synthetic portrait (1).
Added six mounted FeedSlide cases: top-0 single portrait (1), centred 4:5/landscape (2), inline portrait (1), gallery exclusion (1), mixed-aspect pager (1).

## Six requested checks
1. 390×844 safeTop47: shared resolver passed top0/width390/height693.333/bottom≤754. Full-frame video playback unverified.
2. 320×568: resolver passed top0/height496/width279/left20.5 and no horizontal overflow. Actual side-backdrop/video visuals unverified.
3. Open/settle/close transitions: not browser-verified; overlay target and settled path share resolver, but no no-jump/no-flash claim.
4. Landscape and 4:5 geometry tests pass unchanged; same-feed live visuals unverified.
5. Centred/inline scrim absence and pager-only scrim presence pass; single portrait scrim presence passes before the selector failure. Physical notch/status-bar readability and chrome/progress geometry unverified; chrome source changed only in comments.
6. Course-gallery mounted exclusion passes and gallery gradient remains; gallery geometry branch and galleryFit unchanged. Live gallery unverified.

Hosted auth is external/unmanaged; authenticated end-to-end checks are unavailable in this environment. No guest mint was attempted.

## Named pre-existing failures (not rerun or repaired)
- `src/test/tourIsland.test.tsx:235:30`: `expected '' to be 'min(346px, calc(100vw - 24px))'` (prior report).
- `src/test/expRing1.test.tsx:31:33`: two `expected '' to be 'none'` cases (prior report).
- `src/test/ws3WatchBottom.test.tsx`: 17 prior failures from missing `DARK_HAIRLINE` mock export.

All global bans preserved: no SQL/migrations/deployed server edits/feed_config/native or Median changes; round_pool_cap unchanged at30.