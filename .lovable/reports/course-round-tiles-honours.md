# Course page: round tiles and honours board — STOPPED at shard 1

## Built
- RoundCard.tsx rebuilt (player row, ScoreFigureRow, line, nines) + lately-tile.css; RoundTileParts/RoundTileMarks untouched.
- CourseLatelySection.tsx: four-cell facts row, rail top padding 16, colour key; rail/paging/skeleton/error/empty/analytics/taps unchanged.
- latelyRules.ts: tile rules (points, nines, line, played off). roundsShelfRules.ts: `recentSentenceCourse` exported (no logic change).
- ScoreFigureRow.tsx: opt-in `dividerSpace`, `rules`, `leadAlign`; defaults unchanged.
- New CourseHonoursSection.tsx, useCourseHonours.ts, honoursRules.ts, course-honours.css; mounted after Lately in CourseAboutTab.tsx.
- Locales: courseDetail.lately.tile.* and courseDetail.honours.* in all six courses.json.

## Tests
- cs1CourseLately.test.tsx (authorised): (c) `[data-course-lately-tiles]` 3 children 4/+10.8/74 → `[data-course-lately-facts]` 4 children 4/3/+10.8/74; (d) CIRCLE second line / `.standout-when` "Nov 4" → `[data-round-card-meta]` "You · Nov 4" / "Circle · Nov 4". Titles of (c)/(d) renamed.
- New: courseLatelyTiles.test.tsx (17), courseHonours.test.tsx (7). Focused 3 files pass; typecheck clean.

## STOP — shard 1
`src/test/rsRoundsShelf.test.tsx` (not named by the brief) encodes the old RoundCard markup; 5 failed, isolated rerun reproduces 21/26:
- :293 `expected 'lately-tile' to contain 'standout-card'`
- :319, :343, :379 `toHaveTextContent` on old standout foot/when/name
- :352 `Cannot read properties of null (reading 'style')`
Shards 2–4 not run. Log /tmp/honours-shard-1.log.

## Mock vs brief differences (built to the brief, awaiting ruling)
- Line copy: mock "Right on average here, across their 14 rounds" and "4th best of your 22 rounds" vs brief's "…against their average" set.
- Honours date tag: mock MEDAL / STABLEFORD / CLUB CHAMPS vs brief COMPETITION (data has only is_competition).
- Albatross mark: mock double ring vs brief single circle. Eagle double-circle exists in mock CSS but brief says one circle for any under par.
- Dates: latelyShortDate prints "Nov 18" in English; mock "18 Nov".
- Section gap: mock 40px between Lately and Honours; AboutSection's canonical 34px kept.
- Mock file was named course-scores-honours-a.html, not -signed-off.

390/320 browser check not done (needs a signed-in member with rounds).

## Rulings applied (signed-off mock course-scores-honours-signed-off.html)
Signed-off mock matches the build on line copy, COMPETITION and single circle; no change there. Spacing stays 34px.

### rsRoundsShelf.test.tsx (authorised)
Deleted:
- 'round card: the Standout tile — NET/GROSS foot …' — asserted `card.className` contains 'standout-card', NET70−1/GROSS81+10, `.standout-when` 'Oct 31' + COMP, 18 hole marks, story text. Retired tile.
- 'round card: level par reads E in the NET figure …' — asserted `[data-kind="net"]` 'NET71E', zero marks. Retired tile.
- 'the date lives in .standout-when, never in the header' — asserted `.standout-when` 'Oct 31'. Retired tile.
- 'a long full course name renders in full with no ellipsis' — asserted `.standout-story` full course-name text. Retired tile.
Rewritten:
- 'the sentence carries no line clamp …' — before: mounted card, story inline line-clamp '', card.style.height '', minHeight '214px', plus standout-shelf.css rules. After: standout-shelf.css rule assertions only (unchanged); now synchronous.
Replacement coverage in courseLatelyTiles.test.tsx: (e2) tile tap → ('s1','u1') + rounds_shelf_card_tapped, no shape → no nines; new (e3) level par 'E' in TO PAR and name rule nowrap/overflow hidden/ellipsis.

### Dates
Tile meta and facts BEST label use `formatDayMonthShortGB` ("4 Nov"); honours keep "14 Aug 2026". cs1 (d): 'You · Nov 4' → 'You · 4 Nov', 'Circle · Nov 4' → 'Circle · 4 Nov'. courseLatelyTiles (d2): 'Nov 4' → '4 Nov'.

### Shards (sequential, logs /tmp/honours2-shard-{1..4}.log)
2,275 / 2,271 / 2,306 / 2,402 = 9,254 = 9,236 + 22 new (15 tile + 7 honours) − 4 deleted. Typecheck clean.

### 390/320
Not run: no signed-in session available to this environment, so Sundridge Park (West) HOLES IN ONE · 2 and Rochester & Cobham Park ALBATROSSES · 1 are unverified.
