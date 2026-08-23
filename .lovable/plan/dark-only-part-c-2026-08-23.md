# Dark-Only Part C

## Goal
Correct the four remaining dark-surface defects without changing Part A/B foundations, score grammar, layout, spacing, radii, typography, media, or maintenance state.

## Implementation

### 1. Make dark bogeys visible and preserve the light branch
- In `ScoreMark.tsx`, set both dark over-par grounds to the existing `WHITE_ALPHA_18`; leave `LIGHT_BOGEY_GROUND` and `LIGHT_DOUBLE_GROUND` unchanged.
- Add the requested warning that at small sizes the 1.5px magnitude ring is now the sole bogey/double distinction and must not be softened independently.
- Mirror the exact same `WHITE_ALPHA_18` ground for bogey and double in `RoundShape.tsx`; keep the double’s existing 1px outer ring and surface-coloured inset gap.
- Verify the shared renderer and 17px mini-grid side by side on dark surfaces. If the ring is insufficient, stop and report with evidence rather than restoring separate grounds.

### 2. Give leader emoji a reliable surface
- Preserve the deliberate emoji-vs-Lucide decision documented in `GolfThisWeek.tsx`: emoji remain on celebratory band tiles; section-system icons remain Lucide.
- Test option (a) first by placing each platform emoji on an existing low-white-alpha circular ground, with no filter or shadow and no change to the tile geometry/type.
- Capture on-device evidence for fire, dartboard, bird, and flexed-arm markers; only consider size as a fallback if the surface does not solve contrast.

### 3. Make Honours celebratory with broadcast gold
- Build the ace head treatment from the existing scorecard broadcast gold `SC_FILL_GOLD` mixed over `A.PANEL`, using a stronger subtle gradient rather than the muted achievement-gold family.
- Keep albatross clearly distinct on the neutral `A.PANEL` head; it remains rarer in wording/order while ace retains the app’s established gold convention.
- Keep all small lettering on dark-ramp ink (`A.INK`/`A.BODY`/`A.MUTE`) rather than using broadcast gold as 8px text.
- Synchronize the Honours skeleton treatment and capture a rail screenshot containing both ace and albatross cards.

### 4. Finish the profile sheet conversion
- Convert the sheet frame, grabber, loading skeleton, Posting As eyebrow, actor cards, selected/inactive borders, avatar hairlines, unread badges, dividers, and the no-business card using the same existing `A.CANVAS`, `A.PANEL`, `A.TRACK`, `A.BORDER`, `A.HAIRLINE`, and dark ink tokens already used by the converted body.
- Audit every below-fold child (`HcpStrip`, quick actions, navigation, sign-out) and remove only stranded light panel/chrome values; retain intentional white chart highlights where white is a data-visibility stroke rather than a surface.
- Apply the same correction to the nested course-analytics sheet’s remaining white cards/search/building surfaces because it is launched from this sheet and currently carries the same partial conversion.
- Do not invent any colour; report if an existing role cannot represent a required surface.

## Verification and report
- Run focused tests and inspect `/explore` plus the authenticated profile sheet at the current mobile viewport.
- Produce: a close 17px bogey/double screenshot, a leader-emoji screenshot, an Honours screenshot with both kinds, and a full/profile-sheet scroll audit.
- Report exact score-ground values in both implementations, emoji option tested and observed result, Honours mix values and ace/albatross distinction, any missing profile token, and any incorrect brief assumptions.
- Re-triage the Part A 424-candidate inventory against current source and report other likely member-app light panels separately; do not expand this implementation to fix them.
