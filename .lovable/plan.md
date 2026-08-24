# Courses Tab Dark Migration

## Goal
Move the Courses page and shared Courses/Top 100 presentation onto the shipped dark ramp without changing layout, behavior, typography, amber semantics, or light score-band constants.

## Implementation

1. **Flip the Courses feature token values in place**
   - Repoint the existing ink, surface, hairline, and tint exports in `features/courses/_shared/tokens.ts` to the exact dark values in the brief.
   - Keep all export names and update the header/comments to explain that the names are historical and intentionally retained.

2. **Migrate shared controls and glass**
   - Invert `FilterChips` so active chips are light-filled/dark-ink and inactive chips use dark translucent fill, muted light ink, and a white hairline.
   - Change the Courses shell tab band, Stat Browse sticky bar, and shared notch plate to canonical dark glass; update the documented fallback/comment reasoning.
   - Remove the accidental hardcoded near-black inline text styles from shared Select content/items.

3. **Clear component-level light literals**
   - Make Stat Browse triggers/search control dark, update skeleton/card-band/empty-state values, and correct the white-filled CTA label to dark ink.
   - Repoint card placeholders and the horizontal card surface/border.
   - Convert the directory sheet to its dark handle variant and dark controls/placeholders while retaining its inline `SURFACE` background.
   - Preserve all existing spacing, sizing, radius, ordering, and structure except the explicitly requested Review Rail divider removal and reviewer-row margin increase.

4. **Wire the dark score scale**
   - Use `bandColorOnDark` for sub-score fills/figures and all requested rating figures.
   - Update score track/label ink, verdict green/red tints and inks, and Top 100 no-rounds muted ink.
   - Keep `BAND_GREEN`, `BAND_AMBER`, and `BAND_RED` unchanged.

5. **Update overturned documentation**
   - Replace—not delete—the comments for glass, review panel rationale, score-on-dark behavior, and token-file lineage.
   - Keep both local 5px card-band declarations and their locality rationale, changing only their dark value.

## Verification and Stop Conditions

- Run focused type/tests through the project harness and a reproducible literal sweep across the named files for: `bg-white`, `#ffffff`/`#FFFFFF`, `#E5E7EA`, `#0C0C0E`, `rgba(15,23,42`, and the two pale `0.72` glass backgrounds.
- Verify `/courses` at the current 390×774 viewport: count sentence figures, lens headline, controls, dark glass while scrolling, review slots, placeholders, and directory sheet.
- Verify Top 100, including readable four-up score tracks/labels and both green and red verdict states when available.
- Verify every shared `FilterChips` consumer reachable without privileged setup. The source audit currently finds **11 shared mounts across 10 importing files**, because both `CourseTabs` and `CourseDetailShellTabs` use the primitive; this is broader than the nine named callsites in the brief and all will be checked/reported.
- Report rather than workaround if any shared chip consumer regresses, dark score amber is unreadable, or Top 100 has an out-of-scope regression.
- Report sheet precedence explicitly: current `BottomSheet` applies the dark fallback first and caller `style` afterward, so `CourseDirectorySheet`’s inline `background: SURFACE` wins and resolves to `#1B1E27`; the dark variant still controls the light grabber.
- Assess and report whether removing the Review Rail internal hairline reads better or worse, whether any lifted alpha is too weak, and any stale/incorrect premise found in the brief.
