# BRIEF_WAGR_RANKING_TAB_FIX — report

Three corrections to the Ranking tab, found by rendering with Lewy Hayward's real database-shaped WAGR data. Chart maths untouched (polyline already matches the mock at 0.0 difference). No SQL, no migrations, feed_config untouched.

## Diff

`src/features/amateur-ranking/rankingTabRules.ts`
- `AmateurEventRow` gains `week_year: string | null`.
- `eventMonthLabel` now takes the row: a date-shaped `event_week` (`YYYY-MM-DD`, the ISO week's Thursday) wins and is parsed as UTC; otherwise the `week_year` `WW/YYYY` text goes through `isoWeekThursday`; otherwise `''`.
- `rankingLabelY` flip threshold `< 8` → `< 4` (the signed-off mock keeps the last label at y 6.6).

`src/features/amateur-ranking/ProfileRankingTab.tsx`
- `eventMonthLabel(event.event_week)` → `eventMonthLabel(event)`.

`src/features/amateur-ranking/ranking-tab.css`
- New root rule `.amateur-ranking-tab{line-height:normal}` (app default 1.5 made event rows 54px instead of the mock's 48px). Explicit line-heights on `.amr-hl>strong` (.9), `.amr-tile span` (1.3) and `.amr-foot` (1.4) kept.
- `.amr-all` gains `font:inherit` (placed before the mock's size/weight so they still win); it already had background none, border 0, text-align left and only the mock's 10px 2px 0 padding.

`src/test/wagrRankingTab.test.tsx`
- Authorised fixture correction: `event_week` is now the ISO Thursday date ('2026-09-24', '2026-09-17', '2026-08-27', '2026-07-23', '2026-07-16', '2026-06-18') and `week_year` holds the 'WW/YYYY' text — the real database shape.
- Authorised assertion update: 'Rank labels flip under their point when above would clip' → 'Rank labels flip under their point only below y 4'; the `rankingLabelY(14, -8, 14)` assertion changed from `28` to `6` (threshold change), plus a new `rankingLabelY(11, -8, 14)` → `25` flip case.
- New cases: 'Lewy last label stays at y 6.6, unflipped' (`rankingLabelY(14.6, -8, 14)` → `6.6`); date-shaped event_week in the axis/event label test; 'Event label falls back to week_year, then blank'.

No existing test deleted, renamed or rewritten beyond the one authorised assertion above.

## Shard totals

Command: `bunx vitest run --shard=N/4 --maxWorkers=2 --reporter=json`

- Shard 1: 2,211 passed / 0 failed
- Shard 2: 2,070 passed / 0 failed
- Shard 3: 2,182 passed / 0 failed
- Shard 4: 2,204 passed / 0 failed
- **Total: 8,667 passed, 0 failed** — previous 8,665 + 2 new cases = 8,667. Reconciled.

Preview build: OK (2026-11-14T10:59:56Z).
