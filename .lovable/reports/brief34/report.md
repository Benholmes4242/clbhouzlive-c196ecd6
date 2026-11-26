# Brief 34 — CLOSED (26 Nov 2026)

No SQL, migrations, writes, deployment, triggers or schedules. feed_config untouched; round_pool_cap 30. "Fix all" not used.

## Built
- `src/components/topTen/TenRailCard.tsx` — shared rail card; `ClbhouzTenSection` now draws it (Brief 32 tests pass unchanged; live 264×322 / 253×308 / 213×259 at 390/375/320, no overflow).
- `ProfileTopTenRail.tsx` — rail, glass pill, Golfers/Tens (own, signed-out) or Golfers/You (signed-in visitor), story, ticks, hint + "Share your ten ›" (own), visitor pills, tap band (TenBand) after ticks, deep links. "of yours" pill deleted.
- `TenBlock.tsx` — band extracted as `TenBand`; feed score in `.ten-score-pill`; `TenPills` owner branch deleted (props `ownProfile`/`onShare` removed).
- `top-ten.css` — `.ten-score-pill` and sizes; profile rail rules; text-shadow tokens removed.
- `ClubsCard.tsx` + `ProfilePageV2.tsx` — Home club canonical heading, own/visitor title, content at 12px.
- Casing: TenBlock, CourseTopTenStandingCard, ClbhouzTenSection, ClbhouzTenSheet.
- Part D eyebrow sizes moved to section-eyebrow tokens: HcpSection kicker (9/.19em), `.profile-pro-tour-heading` (10/.14em), `.amateur-ranking-tab .amr-hd h2` (9/.16em), `.pro-profile-heading h2` (9/.16em). Colours unchanged.

## Tests
Typecheck fix: `TenPills` accepts the retired `ownProfile`/`onShare` props as unused, so `brief31TopTen.test.tsx:115` type-checks without a test edit; its assertion still fails pending ruling.
Four sequential shards: 2,568 + 2,567 + 2,705 + 2,889 = **10,729 tests / 935 files**, 9 failing. Baseline 10,717/934: +12/+1 = new `brief34ProfileTenRail.test.tsx` (12 tests, all pass).
Authorised edit made: `brief33CourseTopTen.test.tsx:72` 'Joins the clbhouz Ten on Monday' → 'clbhouz ten'.

### Failures (not edited — need ruling)
1. `brief31TopTen.test.tsx` "pills preserve server comparison lines and singular own chart grammar": `expected '' to contain '1 of yours is on the clbhouz Ten'`; also typecheck `brief31TopTen.test.tsx(115,117) TS2322 Property 'ownProfile' does not exist`. Brief deletes this pill.
2. `topTenOwnerLabelRender.test.tsx` ×6 (three equal columns / number one 178px / plain-text score right 9 top 8 / null corner / resting owner tiles / names ellipsis): render ProfileTopTenRail and expect the old grid ("Missing block" etc.). Brief replaces it with the rail and moves the score into a pill.
3. `topTenTileWidth.test.tsx` "tiles 2 and 3 share the three-column 2px block": same cause.
4. `proProfileScale.test.tsx:16` `expected '…font-size:var(--section-eyebrow-size)…' to contain 'font-size:9px'` — Part D eyebrow move on `.pro-profile-heading h2`.

## Part D — other profile eyebrows (proposed titles for Ben)
| Surface | Eyebrow | Status | Proposed title |
|---|---|---|---|
| ClubsCard | Also a member at | already canonical | Where else they play |
| JourneySummaryCard | Your course legacy | shared Panel KICKER, 11/.16em (line-height not 1; not changed — Panel shared with course pages) | Every course you've played |
| Rounds: Season / Year / Courses / Every round, Ageing out, Courses tab Map/Chase/Signature/Still to rate/Archive/Share | — | already canonical with titles | — |
| Handicap: Rounds that count / The mechanism / Where the strokes go | moved | titles already follow | — |
| Tour tab year / "<TOUR> · year" | moved (sizes) | — | "<year> results" |
| Ranking: Recent events / Career | moved | — | "Latest results" / "The career so far" |
| Pro: This week / <year> season / How he plays / In the bag / Partners / Career / Ask <name> | moved | — | "Where he is playing" / "The year so far" / "His game in numbers" / "What he plays" / "Who he plays for" / "How he got here" / "Ask him anything" |
| Pro nested: Form · last 10 (9/.16em), LIVE · TOUR card kicker (9/.1em) | not changed (subsection/card labels) | — | — |

## Not verified
Profile captures (own resting, band open, visitor, feed pills) — sign-in sessions cannot be created on this user-managed backend. Courses chart captures in `captures/`.

## Close-out (Ben authorised rewrites, 26 Nov 2026)
Rewritten to the Brief 34 design (no deletions; test count unchanged):
- `brief31TopTen.test.tsx` "pills preserve server comparison lines and singular own chart grammar" → "Brief 34: own pills no longer carry the "of yours" pill or a share button". Old: `expect(textContent).toContain('1 of yours is on the clbhouz Ten')`; click `Share your ten`; `expect(share).toHaveBeenCalledTimes(1)`. New: `not.toContain('of yours')`; `queryByRole('button',{name:'Share your ten'})` is null; `share` not called.
- `topTenOwnerLabelRender.test.tsx` (6):
  1. "the block uses three equal columns and 2px gutters" → "the ten is one countdown rail of cards in position order". Old: `[data-ten-block]` gridTemplateColumns `repeat(3,minmax(0,1fr))`, gap `2px`. New: `.clb-ten-rail` card ranks equal `['1'..'5']`.
  2. "number one spans the full grid at 178px" → "number one is the first rail card, the same card as the rest". Old: `{gridColumn:'1/-1',height:'178px'}`. New: rank-1 card is the rail's first child and has `.clb-ten-card`.
  3. "member ratings are plain text at the top right" → "member ratings sit in the corner glass score pill". Old: span `9.0`, `{position:'absolute',right:'9px',top:'8px'}`, not `.ten-pill`. New: span `9.0` with class `ten-score-pill`.
  4. "a null member rating leaves its corner empty without a dash" (kept name, Brief 34 prefix). Old: card `textContent` has no `–`. New: no `[data-ten-corner-score]`, rank reads `2`, the corner area has no `–` (the card's figures legitimately show the Brief 34 missing-figure dash).
  5. "resting owner tiles carry no score pills, badges or score labels" → "owner rail cards carry no badges and the owner gets Share your ten". Old: no `.ten-pill`/`.pro-label`/`.ten-label`/`[data-badge]`, 10 `[data-ten-position]`. New: 5 rail cards, no `.pro-label`/`[data-badge]`, `Share your ten ›` button present.
  6. "all tile names stay on one line with ellipsis inside the shared block" → "every card names its course once". Old: 5 `.ten-name` with nowrap/hidden/ellipsis. New: `.clb-ten-name` texts equal the five course names (jsdom does not load clbhouz-ten.css).
- `topTenTileWidth.test.tsx` "tiles 2 and 3 share the three-column 2px block without widening tracks" → "positions 2 and 3 are consecutive cards in the one countdown rail". Old: parent grid `repeat(3,minmax(0,1fr))`, gap `2px`, both minWidth `0`. New: parent has `.clb-ten-rail`, both in it, ranks `['2','3']`, 3 follows 2.
- `proProfileScale.test.tsx` "section padding and heading match the golfer scale". Old: `font-size:9px`, `font-weight:700`, `letter-spacing:.16em`. New: `font-size:var(--section-eyebrow-size)`, `font-weight:var(--section-eyebrow-weight)`, `letter-spacing:var(--section-eyebrow-tracking)`.

### The "extra test" in shard 3
Traced by running all four shards with the JSON reporter on snapshots of `228ec328f9` (Brief 33) and `9884a5b4a9` (Brief 34) and diffing per-file counts. The only per-file difference is the new `brief34ProfileTenRail.test.tsx` (+12, shard 1). Shard totals moved because adding a file reshuffles shard assignment: `mediaRetagOneStep.test.tsx` (7) moved 1→2, `src/features/admin/lib/courseTypes.test.ts` (1) moved 2→3, `alsoWeekRebuild.test.tsx` (64) moved 3→4. Shard 3: 2,768 − 64 + 1 = 2,705. The one extra test in shard 3 is `courseTypes.test.ts`, moved from shard 2; no test was added or lost.
