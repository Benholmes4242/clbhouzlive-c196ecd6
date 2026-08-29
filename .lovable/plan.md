# Tighten the Recent Rounds sheet

## Scope
Rebuild only `GolfThisWeekSheet.tsx`; consume the existing `RoundShape`, `selectMoment`, reaction hook, filters, and round-opening behavior unchanged.

## Implementation
- Replace the kicker/title stack with a 19px uppercase `RECENT ROUNDS` masthead and the board hero’s figure-over-label stat rail.
- Derive rounds and unique-course totals from the filtered sheet rows, and derive days from `GOLF_WEEK_DAYS`; reuse the existing board rail translation keys.
- Replace the shared tall `FriendRoundRow` usage in this sheet with a compact, fixed-grid row local to the sheet:
  - 30px squircle avatar;
  - one constrained identity column with single-line ellipsis for name/course and a one-line reason;
  - a reserved chart column rendering `RoundShape` only when `selectMoment(...).kind !== 'plain'`;
  - a fixed gross/to-par column using the existing under-par red / over-and-even muted law;
  - a fixed reaction column sized for a glyph plus three-digit count, including an outline heart at zero and a non-interactive glyph/count presentation for the viewer’s own round.
- Keep every row at a stable approximately 70px height and keep the chart/gross/reaction columns reserved so content and reaction changes cannot shift alignment.
- Preserve chronological date grouping, existing sticky day headers/counts, scope pills, batched hole-shape loading, reaction cache behavior, and row navigation.

## Verification
- Run the focused typecheck/test harness.
- Use the live preview at 390×844 to measure rendered row height and visible row capacity, confirm sticky headers during scroll, and check that the sheet drag gesture remains available.
- Inspect current rendered rows to count moment-qualified charts and report the proportion.
- Capture a close view of a reduced `RoundShape` with an under-par hole to judge whether its red segment remains legible; adjust only the passed size/stroke width if needed, never the component.
