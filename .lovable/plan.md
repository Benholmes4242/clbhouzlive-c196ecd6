# Canvas Stage 1B — Ramp Stragglers

## Implementation

1. **Couple Trophy Room sweeps to their card surface**
   - Add a small local gradient builder in the Trophy Room token file whose final stop is interpolated from `MEMBER_PANEL`.
   - Use it for the nine `RARITY_DARK` entries whose `cardBg` is `MEMBER_PANEL`, preserving every opening tint and stop position exactly.
   - Leave the Obsidian entry unchanged because it has its own black/gold card treatment and does not use `MEMBER_PANEL`.
   - Update the stale dark-surface comment to the current Panel value.

2. **Move the two remaining backgrounds onto the ramp**
   - Change the round-card missing-photo gradient from its old slate literals to `MEMBER_CELL → PAGE_CANVAS`: a Cell-strength opening colour dissolving into the route Canvas.
   - Change the light-mode held-rank pill background to `var(--surface-alt)`, the CSS-owned Cell tier (`#1E1E23`), so CSS does not duplicate the TypeScript hex.

3. **Route inverted-control ink through the foreground token**
   - Import and use `INK_ON_LIGHT` at every named dark-text-on-light/amber site: message send button, outgoing message bubble, Echo Retry/Save, Circle action, post deep-link CTA, scheduled “Post Now”, and both Tour switcher foregrounds.
   - Use the solid foreground token directly; no alpha conversion is involved. Do not change other `#0F172A` ink on light or amber controls.

4. **Correct stale comments only**
   - Update the four named comments to describe the current `#0A0A0C` Canvas and `#16161A` Sheet values without changing behavior.

## Verification

- Extend the existing canvas token test with source guards proving all nine coupled sweeps end through `MEMBER_PANEL`, the old sweep endpoint is absent, and the named foreground sites use `INK_ON_LIGHT`.
- Run focused tests and TypeScript validation.
- Open the signed-out routes that expose the changed messaging, Tour Hub, and post-link surfaces; report authentication-limited Trophy Room, handicap, composer, and sheet states honestly.
- Audit visible pre-ramp clashes, listing excluded charts, maps, admin, skeletons, media letterboxing, and avatar/cover fallbacks without changing them.
