# Round plot — interrupted draw-on

## Result
Animation lifecycle correction and all tests pass. Four-card guest proof is **not complete**: the genuine guest feed opens its existing “Join the community” gate before four round plots can be verified. No gate or feed policy was bypassed or changed.

## Cause and correction
Confirmed in `src/components/feed/roundTilePlot.tsx`: `play()` previously added the score identity to `playedRoundPlots` before the 120ms delay. Width/path changes triggered cleanup (timer/frame cancellation), while the next render read the already-added identity and finished immediately. The same persisted identity survived virtualised unmounts. The first card settling earlier is a plausible explanation for the device pattern, not separately proven on that device.

The identity is now added only in `finish(true)` after the 1200ms draw completes. Interrupted delays/draws restart from zero on the next 60% observation, including remounts. Reset also hides the interrupted head dot. Completed identities retain finished presentation at the newly measured width without replay. The threshold, delay, easing, endpoint pop, reduced-motion and unavailable-geometry instant fallback remain unchanged. No unrelated typography, scoring, navigation or feed behavior changed.

## Tests and reconciliation
Before: **4,934 tests / 497 files**, the preceding Tour report baseline.
After: **4,939/4,939 tests / 497 files**. No failures or unhandled errors reported. No existing test deleted, renamed, rewritten or assertion changed.

Five added executions in `src/test/roundPlotLineStrip.test.tsx`:
- `plays both round plots when the second enters view later`: first and second both reach 195 mid-draw and 390 finished; second stays zero until its own observation.
- `restarts after a width change during the delay and marks only completion`: restarted reveal is zero, no frame at 59% or 119ms, 187.5 at halfway, 375 complete; remount is finished at 390.
- `restarts after a width change during the draw and marks only completion`: same concrete checks for interruption after halfway.
- `replays an interrupted draw from the start after the same round remounts`: interrupted width 195, remounted zero, start 16, halfway 195, completed 390.
- `keeps a completed draw finished across width changes without replay`: finished resized width 375, visible endpoint, no additional animation frame.

The existing completed-round-remount regression remains unchanged and passes. Delta: **+5 tests, +0 files**, all named above; this file grows from 14 to 19 cases.

Commands:
- `bunx vitest run src/test/roundPlotLineStrip.test.tsx src/test/roundTilePlot.test.tsx src/test/feedEndDot.test.tsx src/test/feedGrossDots.test.tsx src/test/feedRoundUnderParFill.test.tsx src/test/feedRoundNet.test.tsx src/test/roundPlotScale.test.ts --maxWorkers=2`: **73/73 across 7 files**.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,420/2,420 across 249 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,519/2,519 across 248 files**.
- Latest automatic preview check: **build OK**, `2026-10-31T13:40:22Z`. No manual build/typecheck run.

## Genuine guest proof — 390×844
Browser verified an anonymous preview session and loaded the real Clubhouse at `http://localhost:8080/`. Used normal mouse-wheel scrolling in 220px increments with 1650ms waits, recording reveal-width changes without altering application state or animation functions. Evidence: `/tmp/browser/round-draw/proof.log`, `start.png`, `end.png`; screenshot inspected.

Observed card identities and outcome:
1. **khk6527gbc — Sundridge Park Golf Club (East Course), Thu Oct 29**: completion-width event recorded offscreen; the draw itself was not captured visibly, so not claimed verified.
2. **Thomas Holmes — Sundridge Park Golf Club (East Course), Thu Oct 29**: zero-width event recorded while offscreen; no visible draw captured, so not claimed verified.
3. **nickleconte204 — Old Fold Manor, Sun Oct 18**: **visible draw confirmed**, 69 reveal events including intermediate widths 16.747, 17.202, 18.606 through finished width 390. End screenshot shows the completed trace.
4. **Not reached**: existing guest invitation overlays and stops further feed scrolling. Four-card proof remains blocked by guest access, not reported as passed. No observed failed draw is established for cards 1 or 2 by offscreen events.

## Protected scope
No SQL, migrations, RPC/edge deployment, `feed_config`, native/Median changes or publication. `round_pool_cap` remains 30. Local lifecycle ownership is recorded beside the module, following AGENTS.md's local-header rule.