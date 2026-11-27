# Brief 44 — Tour pages: flags, biggest movers, chart colours

## Files changed
- NEW `src/features/tourhub/_shared/BoardFlag.tsx`: the one leaderboard flag (World rankings' `CountryFlag` sm 16×12, radius 2, `border-none`), flex none, after the name; renders nothing without a country.
- Overview: `LiveHeroBoard.tsx`, `LeadersGroup.tsx` (avatar removed, gap 8, flag after name); `LastYearRow.tsx` (+`country` prop, flag after name) and `UpcomingOverviewSections.tsx` (passes `row.country`); `HeroBoardBand.tsx` `RoundMovementBand` (no face; `initialSurname` 15/700, movement line margin-top 3, three equal left-aligned columns `repeat(3, minmax(0,1fr))`, gap 8).
- Tournament page: `HeroBoardRows.tsx` (also Also this week; flag after name, 5px row gap + 3 = 8), `MiniBoard.tsx` (tournament presentation: avatar removed; panel presentation: flag moved from before to after the name); `MoveSection.tsx` (no avatar, initial + surname 15/700, margin-top 3; note it is not mounted anywhere in the app today); `TournamentV3Sections.tsx` RaceSection `data-race-phase`; `tournamentPage.css` (live leader line/dot/label `--tv-under`; completed stays `--tv-gold`; name class for ellipsis).
- `completedWeek.css`: new `--cw-gold:#FBBC2E`; champion line, dots, position labels, key swatch and key score gold; champion name ink 700; others' under-par key score stays red.
- Shells (`overviewShells.tsx`): leaders' rows lose the avatar placeholder; movers shell has no face, three equal columns. Picks shell unchanged. Tournament page skeleton had no avatar placeholders.
- Unchanged: World rankings, ChampionStrip, PicksBlock/LivePicksBlock/PicksSheet.

## Rewritten tests (authorised: avatars on these boards/movers)
1. `overviewTypeScale` "(a) live board has 31px rows, 13px names and 22px avatars" → "…and no avatar (Brief 44)". Old: `.live-board-face [style*="width: 22px"]` width 22px. New: `.live-board-face` is null.
2. `upcomingOverviewPlus` "historical board … never renders faces" → "(flags only, Brief 44)". Old: `img` count 0. New: every `img` sits in `[data-board-flag]`.
3. `upcomingLastYearBoard` "uses the live row tracks without avatars or flags" → "…without avatars; no country, no flag (Brief 44)". Name now read from `row.children[1].children[0]`; added: wrapper has one child when no country. Other assertions unchanged.
4. `tourOverviewPicksChipsFullBoard` "(a) the three-mover row and the three-pick grid…" mover half. Old: `EVEN_ROW_GRID`, columns 2/4/6. New: `repeat(3, minmax(0,1fr))`, no grid-column. Picks half unchanged.
5. `tourOverviewMergedAiry` "tightens movers and their figure gap". Old: `children[1].children[1]` marginTop 1px. New: `children[0].children[1]` marginTop 3px.
6. `tourOverviewScorecardTap` "pick-style movers have direction-only arrows…". Old: a 28px face exists. New: none.
7. `tourOverviewScorecardTap` "drops gross 77 …". Old: figure line margin 1px at `children[1].children[1]`. New: 3px at `children[0].children[1]`.
8. `tourLiveStates` "board faces use canonical hairline …" → "board rows have no faces (Brief 44) …". Old: source contains `size={22}`, `hairlineRing`, not `hideRing`. New: source lacks `SquircleAvatar`, contains `<BoardFlag`. Other source checks unchanged.
9. `tourMoversNoTile` "(b) spaces three movers evenly…" → "(b) Brief 44: three equal left-aligned columns". Old: EVEN_ROW_GRID, margin `8px -20px 0px`, columns 2/4/6. New: `repeat(3, minmax(0,1fr))`, marginTop 8px, flex-start.
10. `tourMoversNoTile` "(e) cards have no tile". Old: `flex` `0 1 auto`. New: no `img` in the card. Tile checks unchanged.
11. `tourMoversNoTile` "(f) picks and mover shells both lose the tile". Mover selector `[data-shell-small-card]` → `[data-shell-mover-card]`; assertions unchanged.
12. `tourMoversNoTile` "(g) … both use the even-row grid" → "(g) Brief 44: … three equal columns". Old: EVEN_ROW_GRID, negative margin, 2/4/6. New: `repeat(3, minmax(0,1fr))`, marginTop 8px, three cards, no 34% squircle. Also removed its now-unused `EVEN_ROW_GRID` import.
`overviewTypeScale` "(c) LastYearRow has a 13px name" failed once on structure; fixed in source (wrapper carries `fontSize: 13`), test unchanged.

## New tests — `brief44TourFlags.test.tsx` (16)
Flags/no avatar: live hero board ×2 stages, leaders' group live/non-live, HeroBoardRows (Also this week) live/completed, last-year rows, MiniBoard tournament live/completed, MiniBoard panel; no-country row has no element; World rankings source keeps avatar + flag badge. Movers: overview "R. Taylor"/"T. Giroux"/one-name, 15/700, margin 3, unchanged arrows/places/to-par; MoveSection. Charts: RaceSection phase attribute + CSS rules; WonChart CSS gold rules and red under-par others. jsdom reports `flex: none` as `0 0 auto`.

## Results
Four sequential shards: 2,591 + 2,562 + 2,764 + 2,825 = **10,742 tests / 945 files**, zero failures (shard 4 run on its own after the batched command hit the tool time limit). Brief 43 baseline 10,726/944: +16/+1 = the new file. Typecheck clean.

## Screenshots (temporary harness, test data, real components; harness deleted)
`390_board.png`, `375_board.png`, `320_board.png` (live board THRU/TODAY/TOT; "Nicolai Von Dellingsha…" then flag at 390; at 320 the existing short-name rule shows "N. Von Dell…" with flag visible; no overflow), `390_movers.png`, `320_movers.png` (no ellipsis needed), `390_also.png`, `390_tboard.png`, `390_race.png`, `390_won.png`. Live and real-event data not verified. In `390_race.png` the long end label "Von Dellingshausen −13" is clipped at the SVG's right edge; label placement was untouched by this brief and is flagged for a ruling.

No SQL, migrations, `feed_config` or cap changes; no security "Fix all".
