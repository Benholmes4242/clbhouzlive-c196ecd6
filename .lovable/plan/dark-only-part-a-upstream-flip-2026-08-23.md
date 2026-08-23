# Dark-only Part A upstream flip

## Scope
Flip the app’s upstream canvas, semantic color tokens, shared analytical palette, Discover palette, composer palette, and route-chrome default to dark-only. Keep the diff restricted to the six files named in the brief.

## Implementation
- Update `src/index.css` boot paint and native `color-scheme` to dark, set both live `--bg-page` declarations and `.clubhouse-root` to `#15171F`, and replace the root semantic light palette with dark canvas/card/input/border/foreground values.
- Preserve the narrower `.dark` achievement scope at `#111113`, the `.light` compatibility scope, and the `route-hub` foreground override; document their live scopes in the report.
- Repoint the analytical `A` ramp to the specified dark values, including `INDEX_DELTA.dark`, while preserving amber and `TOPAR_RED`.
- Repoint course-led Discover ink to `SURFACE.dark` without changing geometry or typography.
- Repoint `CT` color roles through the existing `CT_DARK` palette while leaving palette alphas and all geometry/type values unchanged.
- Make `isDarkChromeRoute` return dark by default. Keep Echo/Messages’ near-black route classifier and Tour Hub’s explicit `dark={false}` behavior intact.

## Verification
- Confirm only the six allowed files changed and no type/layout declarations were altered.
- Check old light literals are gone from the edited token declarations.
- Verify cold boot, native dark controls, Echo/Messages near-black, Tour Hub light opt-out, Discover, Clubhouse, and Handicap in browser screenshots where authentication permits.
- Produce the full stranded-light-surface inventory as a report artifact for Parts B onward, including `bg-white`, inline backgrounds, and CSS literals.

## Known brief conflict
The overturned “dark zone” comment is in `src/styles/handicap-dark.css`, outside the six-file allowlist. The six-file acceptance rule takes precedence in this pass, so the stale comment will be reported rather than edited.
