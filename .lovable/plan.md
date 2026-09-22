# Partial-card score copy

## Goal
Make incomplete scorecards identify how many valid played holes their to-par figure covers, without changing any score arithmetic or complete-card presentation.

## Implementation
1. Extend the shared scorecard head with an optional played-hole count.
   - Keep complete cards exactly as today: `+18 · par 72` and no “TO PAR” text.
   - When round par is null and at least one hole satisfies `played === true && par != null`, use the existing suffix position and typography to show `· thru N`.
   - Add one English scorecard translation key beside `toPar`; leave `toPar` unchanged.
2. Supply the same strict played-hole count from both consumers.
   - Settled sheet: count only rows with `played === true && par != null`.
   - Swipe preview: apply the identical predicate to seeded holes.
   - Never infer from `holes.length` or total row count.
3. In the gross-only panel, omit the to-par stat item when its value is null; preserve the panel copy and gross stat.
4. Add focused regression coverage for partial eighteen, complete eighteen, complete nine, and gross-only behavior.

## Verification
- Partial ten-of-eighteen: `+2 · thru 10`, with no round par, in sheet and preview.
- Complete eighteen: current `+18 · par 72` presentation unchanged.
- Complete nine: real par suffix, never `thru 9`.
- Gross-only: gross alone, with no to-par dash.
- Run the focused tests, full suite, TypeScript check, and formatting check.
- Report all other round to-par render sites whose par may be null, including whether each is labelled; do not edit them.

## Explicitly unchanged
All to-par arithmetic, per-nine figures and labels, `roundCoursePar`, shape/seed data flow, `RoundCardHoleStrip`, server functions, SQL, migrations, and requeues.
