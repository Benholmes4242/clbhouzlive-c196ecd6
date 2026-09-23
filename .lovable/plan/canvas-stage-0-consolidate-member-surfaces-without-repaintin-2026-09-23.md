# Canvas Stage 0 — Consolidate member surfaces without repainting

## Scope
Centralise the existing opaque background colours used by the member app’s pages, panels, cards, sheets, and member chrome in `src/lib/tokens/surfaces.ts`. Preserve every rendered colour exactly.

Excluded and left byte-for-byte alone unless required only to classify them: admin, glass/blur, scrims/backdrops, media letterboxing, image/avatar fallbacks, skeletons, charts, maps, and their dedicated tokens.

## Implementation
1. **Freeze a before-state**
   - Use the completed canvas audit as the source ledger, then re-scan current source so changes made after the audit are included.
   - Capture computed backgrounds and screenshots for every accessible required screen before editing.
   - Record authenticated/data-gated screens that cannot be opened with the external Supabase setup; do not imply they were checked.

2. **Extend the canonical surface module**
   - Keep `PAGE_CANVAS`, `SHEET_SURFACE`, `INK_ON_LIGHT`, and `STATUS_BAR_CANVAS` unchanged.
   - Add separate, role-named exports for every distinct in-scope member canvas, panel, card, sheet, header/nav, field, chip/pill, well, rail, and empty-state surface.
   - Keep semantically different roles separate even when their current values match.
   - Add one-line ownership comments to every export.
   - Add a deterministic alpha helper only where an existing opaque token is currently rewritten as `rgb`, `rgba`, concatenated hex-alpha, or a gradient stop; verify its output string resolves to the same channels and alpha.

3. **Route in-scope consumers through the module**
   - Replace in-scope TypeScript/TSX hex, RGB/RGBA, numeric/ARGB, concatenated, template-built, and Tailwind arbitrary background literals with imports from the canonical module.
   - Repoint existing member feature palettes such as the analytical and composer surface roles to canonical exports, preserving their public names so downstream files do not need unrelated edits.
   - Keep transparent states, imagery, foreground colours, borders, shadows, score colours, and every excluded category unchanged.
   - For static Tailwind arbitrary backgrounds, use a token-backed inline custom property or equivalent static class bridge without changing specificity, layout, interaction, or the computed colour.

4. **Deduplicate CSS surface variables safely**
   - Trace each in-scope custom property through import order, selector specificity, theme scope, and runtime class state.
   - Keep the declaration that currently wins in each real scope and remove only genuinely duplicate declarations of that same variable.
   - Do not collapse intentionally scoped overrides such as a `.dark` value that differs from `:root`.
   - CSS cannot import a TypeScript value directly. Keep the required single CSS declaration at its exact current value and document that constrained bridge rather than introducing runtime paint changes.

5. **Add regression guards**
   - Add a focused source-level test that rejects new in-scope opaque surface literals outside the canonical module while allowing the named exclusions.
   - Assert every canonical export retains its original exact value and alpha derivations retain the original computed channels.
   - Update only assertions whose source spelling changes; do not change visual expectations.

## Verification
- Run the focused surface-token tests, TypeScript checking, and the existing relevant test suite.
- Compare before/after screenshots and computed background values at the same viewport and state.
- Attempt and explicitly report: Clubhouse, Discover, Courses browse, course detail, Top 100, Tour Hub, Handicap, Trophy Room, profile, Messages, Echo, Activity, post composer, review composer, Settings, and at least five distinct bottom sheets.
- Report separately: screens actually opened, screens blocked by authentication/data, every excluded or uncertain surface left alone, and anything intentionally retained because replacing it could alter colour or cascade.

## Final report
- Exact final exports in `surfaces.ts`, with values and roles.
- Total replacements and changed-file count.
- Every duplicate CSS variable declaration removed, including the declaration retained and why it wins.
- Every remaining in-scope-looking literal that could not safely route through the module, with file and reason.
- Every item left alone because touching it risked a colour change.
