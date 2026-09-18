# S1 — Schedule row grammar

## Build
- Rework `SeasonRow` to the overview’s 76px, 24px-gutter grid with edge-to-edge hairlines.
- Move tour/date/champion into the kicker, keep venue and full purse in the status line, and show only “Live” in the overview green.
- Replace champion, leader, and defender strips with one right-aligned figure stack; remove avatars, date/countdown rail, tour chip, and live rail.
- Preserve major/playoff treatment without changing schedule data or behavior.
- Change Schedule header, loading, and month-label side gutters from 16px to 24px and correct both stale file comments.

## Verify
- Add focused row coverage for completed, live, upcoming, missing-figure, long-name, long-venue, and tied-leader cases.
- Run the focused tests and TypeScript check.
- Inspect schedule rendering at 320px and 390px where public preview access permits; report any authentication limitation.

## Technical details
- Reuse `getScoreColor`, `TREND_UP`, `AMBER`, `WHITE_ALPHA_06`, existing translations, and existing event fields only.
- Determine the last row within each month in `ScheduleTab` so the final hairline can be omitted without changing grouping.
