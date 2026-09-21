# Team Board Rows Stacked

## Goal
Render each team as two equal-weight name lines across the tournament detail boards, while leaving player rows unchanged.

## Changes
- Replace `BoardEntity.label` with `BoardEntity.lines`, returning one line for players and two provider-authored lines for teams.
- Preserve the event-wide initials rule: all team lines use initials when any surname collision exists; otherwise all use surname forms.
- Update BoardTable, MiniBoard, and FullBoardSheet integrations so team rows use two 12.5px, weight-600, full-ink lines with 1.28 line height and 9px vertical padding.
- Keep position and score cells vertically centred against the stacked pair; keep player rows at their existing single-line typography.
- Adapt non-board consumers to use the lines safely while retaining full-name prose for narrative copy.
- Update focused resolver and rendering tests.

## Validation
- Run focused tests and TypeScript checks.
- Check Zurich 2026 and Dow 2026 at 320, 390, and 430px in the mini board and full board.
- Confirm equal team-row heights, centred numeric cells, and no ellipsis including the Tejedo Mulet pair.
- Confirm no SQL, migration, view, or pack-track changes.
