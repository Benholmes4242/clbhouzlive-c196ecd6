---
name: Chrome Clearance Token
description: CHROME_CLEARANCE is the only top padding for immersive island routes; chrome is the single safe-area owner
type: preference
---

`src/lib/chromeClearance.ts` is the twin of `navClearance.ts`.

- `ChromeIsland` measures the live island row into `--chrome-island-h` (ResizeObserver) and publishes `--chrome-clearance` = `calc(var(--sat) + islandH + 10px gap + 16px breathing)`; `0px` when chrome is suppressed or `chrome: 'none'`.
- Immersive/bleed pages pad the top with `CHROME_CLEARANCE` and NEVER add `env(safe-area-inset-top)` themselves and NEVER type a number. Content STARTS below the islands and scrolls under them afterwards.
- `--header-h` stays sat-exclusive and 0 on bleed routes (ShellSlot/`--chrome-total-h` add `--sat`); `--island-clearance` remains for non-bleed island routes such as `/media`.
- Consumers: Clubhouse feed (`topPadding` + offline banner), `/watch/videos`, `/watch/clips`.

**Known deliberate mismatch:** the second nav tab is labelled **Explore** with a filled compass-disc mark, but its route is `/amateur` and `/explore` is a redirect shim pointing at `/amateur`. Page events keep the `amateur_*` prefix (predates the rename) to protect the Discover baseline comparison. Do not "fix" either by accident.
