# Logo island Option B — partial completion

## Delivered
- Removed the 34px disc; the existing mark sits directly on glass at 30×30, object-fit contain.
- Rest padding `0 7px`, zero gap while collapsed, giving 30 + 14 + 2 border = 46px. Scrolled padding `0 15px 0 11px`, gap 9px.
- Wordmark slot height 16→20px; expanded maxWidth 52→64px. Existing opacity fade, reduced-motion snap, home tap and aria-label retained.
- Additive `SquircleAvatar.ringWidth` override; AvatarCell passes 1.5 with existing amber and 36px box. Unspecified widths preserve all existing ring variants, including the existing 1px hairline overlay.
- Both glances use the requested system-font stack.
- Connect CTA is a plain `button type="button"`, shared primaryCtaStyle and marginTop 14; navigation and decline behavior unchanged.
- No new negative letter-spacing.

## Artwork blocker
The uploads for this turn contain the brief and `logo-island-signed-off.html`, but no `clbhouz-wordmark-white@3x.png`. Exact filename searches in the project and both upload mounts found no match. The HTML wordmark is the old embedded SVG; its two embedded PNG entries are 1563×1563 marks, not a 192×60 wordmark. Existing project white PNGs are 1920×601, not the requested file.

No artwork was generated, rasterized, resized or substituted. The current SVG import/source remains temporarily so the scrolled island does not display a broken image. Consequently the PNG publication, exact `/brand/clbhouz-wordmark-white@3x.png` source assertion and removal of the SVG request remain blocked on the exact PNG upload. This is not a claim of exact completed mock parity.

## Full-suite result
Command: `bunx vitest run` (output captured in `/tmp/logo-island-vitest.log`).

- Last reported green baseline: **4,005 tests / 428 files**.
- Current full run: **4,007 passed / 4,007 total; 429 passed files / 429 total**.
- Delta: **+2 tests / +1 file**, entirely `src/components/ui/SquircleAvatar.ringWidth.test.tsx`:
  - `preserves the existing standard 2px ring when ringWidth is omitted` — asserts `borderWidth` equals `2px`.
  - `uses the supplied 1.5px ring width` — asserts `borderWidth` equals `1.5px`.
- No failed, skipped or removed tests; no pre-existing failures observed in this run.
- `src/test/islandsRound2.test.tsx` remains eight cases. No cases deleted or renamed; two existing cases updated with the brief's authority:
  - `hands the shared avatar its amber ring and member identity`: retained all assertions, added `ringWidth: 1.5` to expected props.
  - `shows the white wordmark beside the mark only once scrolled`: changed height `16px`→`20px`, expanded maxWidth `52px`→`64px`, rest padding `0px 6px`→`0px 7px`, scrolled padding `0px 15px 0px 6px`→`0px 15px 0px 11px`; added no-disc/direct-child mark and 30px geometry assertions and rest/scrolled gaps. Opacity/collapse behavior assertions retained. Replaced non-null assertions with a guarded image reference. Reason: the brief explicitly supersedes these dimensions and disc.

## Verification limits
Real signed-in visual checks unavailable: this project's browser authentication is `external_unmanaged`. No authenticated mock-match or persistence claim. Available observability path is an inaccessible mount symlink in this sandbox, so automatic build-log output could not be read; no manual project build or typecheck was run.

## Every changed project file
1. `src/features/chrome-v2/ChromeIsland.tsx`
2. `src/components/ui/SquircleAvatar.tsx`
3. `src/features/chrome-v2/index-glance.css`
4. `src/features/chrome-v2/ConnectGlance.tsx`
5. `src/test/islandsRound2.test.tsx`
6. `src/components/ui/SquircleAvatar.ringWidth.test.tsx` (new)
7. `roadmap.md`
8. `LOGO_ISLAND_OPTION_B_REPORT.md` (new)

Project memory also records the signed-off requirements in `mem://style/navigation/logo-island-option-b` and adds its index reference in `mem://index.md`.

No SQL, migrations/migration files, deployed RPCs/edge functions, feed_config, cap or native/Median configuration changed.