# Finish the Courses dark migration

## Current audit result

The main Courses tab is dark and its critical paired controls currently render coherently: the active `Courses` chip is light with dark ink, inactive chips remain muted, and the Stat Browse controls are legible. The sweep found remaining light-mode residue in the shipped Top 100 surface, especially its heading/provenance and sticky filter glass.

Baseline acceptance scope: 13 shipped files covering shared Courses tokens, shared filters/selects, both shell/glass bands, Stat Browse, Top 100, course cards, review slots, score bands, and the directory sheet.

## Implementation sequence

### Atomic change set A — shared ink and dependent button labels (§1 + §5)

- Keep the dark shared token ramp authoritative in `features/courses/_shared/tokens.ts`.
- Resolve every button whose fill is derived from `INK`, `SLATE_50`, or another flipped shared token in the same change set; labels must use explicit contrasting dark or light ink rather than inherited `text-white`.
- Recheck the Stat Browse empty-state switch, connect CTA, browse CTA, and directory-floor CTA together so no intermediate invisible-text state exists.

### Atomic change set B — glass bands and filter state (§2 + §3)

- Move the remaining Top 100 sticky filter band to the canonical dark glass variables used by Stat Browse, the Courses shell-tabs wrapper, and `GlassHeaderPlate`.
- Keep `FilterChips` in the same change set: active = light fill/dark ink; inactive = dark translucent fill/muted light ink with a light hairline.
- Verify `Courses` and `Top 100` selection visually in both tabs, including the stuck-header state.

### Remaining shipped-surface cleanup

- Replace the Top 100 heading and provenance light ink with the shared dark-surface ink tiers.
- Audit Top 100 search, loading, empty, error, verdict/stats, review slots, card bands, directory sheet, and Select popovers for any light-surface literal or inherited semantic token that resolves incorrectly on the dark canvas.
- Preserve intentional white/black treatments over course photography, score marks, flags, and scrims; do not flatten those into page-surface tokens.

## Verification and receipt

1. Run focused tests for the affected Courses components.
2. Render `/courses` at 1280×1800 and a mobile viewport; inspect both `Courses` and `Top 100`, the sticky state, Select popovers, and the directory sheet.
3. Run the literal sweep against the final shipped files and report every pattern and count separately:
   - Exact light/dark hex: `#fff`, `#ffffff`, `#f8fafc`, `#15171f`, `#1b1e27`, `#0a0e14`, `#0f172a`.
   - Raw `rgb/rgba/hsl/hsla` white and black forms.
   - Tailwind raw utilities: `bg|text|border|ring|fill|stroke` × `white|black`, including opacity suffixes.
   - Semantic utilities: foreground, muted-foreground, background, card, muted, popover, primary, secondary, and accent.
   - CSS custom properties, including `--glass-bg`, foreground/card/popover variables, and `hsl(var(...))` uses.
   - Color-bearing variables/constants and color ternaries.
   - `.css` files and color matches within them.
   - Shared Courses token importer count and direct-use line count to expose propagated values.
4. Treat counts as floors and classify every match as migrated, intentional photo/score/flag contrast, shared primitive, or remaining fault.
5. Re-read every changed file after the final edit. The ship report will cite only those final line numbers, never pre-edit snapshots.

## Technical notes

- Current baseline for the 13-file acceptance set: 13 exact-hex lines, 47 raw color-function lines, 4 raw white/black utility lines, 30 semantic utility lines, 14 CSS-variable references, 30 color-variable declarations, and 6 color ternaries.
- The broader Courses trees contain no local `.css` files; the final report will still include that search and its zero count.
- Shared Courses tokens currently propagate through 27 importers and appear on 462 matched use-lines in the broader Courses scope; these dependency counts will be rerun after edits.
