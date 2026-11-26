# Brief 34 — STOPPED at test gate (build complete, awaiting authorisation)

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
