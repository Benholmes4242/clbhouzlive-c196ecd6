# Golf This Week sheet dark conversion

## Audit findings
- **Trajectory parity:** the round tile passes `holes={shape.holes}`, `surface="dark"`, `height={49}`, `viewWidth={244}`, `showTicks={false}`, `padY={0}`, `strokeWidth={1.6}`, plus its well-matched fill colors. The sheet row will pass `holes={shape.holes}`, `surface="dark"`, `height={38}`, `viewWidth={96}`, `showTicks={false}`, and `padY={0}`. It will retain TrajectoryLine’s default 1.8px stroke and native dark fills because the row sits directly on the canonical dark canvas.
- **Hole data:** no transform is needed. `shape.holes` already exposes `{ holeNo, par, strokes }`, exactly the required trajectory fields. Omitted `played` is valid because the shape builder has already removed unplayed holes and TrajectoryLine treats an absent flag as played.
- **Row-scale legibility:** at 96×38, each hole gets 5.33px horizontally. The graded stroke remains visible with the default 1.8px stroke and a 1:1 `viewWidth={96}`; individual color transitions are compact but distinguishable. Gold beads remain legible. No TrajectoryLine change is needed.
- **Dark surfaces from the converted Profile sheet:** sheet ground, header, pill band, scroll ground, sticky day headers, and transparent rows use `A.CANVAS` (`#15171F`); separators use `A.BORDER` (`rgba(255,255,255,0.10)`). The row remains flat rather than taking `A.PANEL`, matching the Profile sheet’s canvas-level list treatment.
- **FriendRoundRow light residues before conversion:** `#0F172A`, `#94A3B8`, `#64748B`, `#E2E8F0`, and `active:bg-slate-50`. The local font-stack declaration is also present, but will be removed because the brief forbids font-family declarations.
- **Avatar ring:** `hairlineRing` is a 1px overlay border tracing the 34% squircle. It has no gap and no filled-gap box shadow, so the Honours fault is absent. On the dark sheet it resolves to the canonical white 22% hairline.
- **Measured truncation at 320px:** row inner width is 288px. Avatar 34 + trace 96 + score 76 + three 10px gaps consume 236px, leaving 52px for the name/course column; the insight has about 36px after its glyph. Representative rendered widths are 103px for “Benjamin Holmes”, 136px for “Sundridge Park Golf Club”, and 113px for “4.6 better than average”. All necessarily truncate.

## Implementation
1. Replace `RoundShape` in `FriendRoundRow` with the imported canonical `TrajectoryLine`, using the row geometry above and no `yDomain`.
2. Convert `GolfThisWeekSheet` to `variant="dark"` and the Profile sheet’s `A.CANVAS`/`A.BORDER` surfaces. Keep the existing shared `WeekScopePills`, which already renders the exact shipped Discover pill primitive.
3. Replace FriendRoundRow’s light colors with `A.INK`, `A.MUTE`/`A.BODY`, and `A.BORDER`. Keep gross and readable facts white, labels at `A.MUTE` (0.62), under-par red, and index movement green/red.
4. Fix truncation by changing each row to a two-line layout: first grid line keeps avatar, member/course, 96px trace, and score; the insight moves below as a full-width line aligned with the text column. This preserves the fixed trajectory and score geometry while giving the sentence roughly 202px at 320px—enough for the measured 113px phrase. Name/course still truncate only when genuinely long, with materially more space than today.
5. Verify the open sheet at 320px and a wider mobile viewport: dark surfaces, exact pills, visible graded trajectory, earned-red behavior where sample data permits, full insight, readable facts, and no console errors.
6. Confirm `TrajectoryLine.tsx` has a zero-line diff and report final caller props side by side.

## Brief corrections
- The brief says `yDomain` does not exist, but `TrajectoryLine` currently defines it. This implementation will still follow the requested shipped decision and will not pass or modify it.
- `TrajectoryLine`’s header says the friends tile still uses a different stroke, but the current `RoundShape` already delegates its curve to `TrajectoryLine`. The requested swap removes the wrapper and makes the sheet’s direct dependency explicit; the protected component remains untouched.
