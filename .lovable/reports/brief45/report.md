# Brief 45 — Top 10 cards: the owner's score, labelled

## Files changed
- `src/components/topTen/TenRail.tsx` — corner `.ten-score-pill` removed; `railFigures` now returns owner figure (`ownerScoreLabel(first_name)`, or `You` when `block.is_owner`) then `Golfers`; `–` + `data-missing` when null. Signed out = visitor. Story slot unchanged.
- `src/components/topTen/topTenModel.ts` — `ownerScoreLabel` moved here (avoids a TenRail ⇄ ProfileTopTenRail import cycle); `ProfileTopTenRail.tsx` re-exports it, so existing imports keep working.
- Unchanged: Courses chart (movement corner), course standing card, share card pills, the band.

## Rewritten tests (authorised: Briefs 31/34/38)
1. `brief31TopTen` "null member scores leave corners empty, while 9.1 appears plainly" → "Brief 45: no corner pill; a null member score is a dash owner figure…". Old: `[data-ten-corner-score]` null on #1 / "9.1" on #6. New: no `.ten-score-pill`; #1 first figure `–`, #6 first figure `9.1`.
2. `brief34ProfileTenRail` "own profile: Golfers and Tens…" → labels `['You','Golfers']` (was `['Golfers','Tens']`).
3. `brief34ProfileTenRail` "visitor: Golfers and You…" → labels `['Thomas','Golfers']` (was `['Golfers','You']`); removed the `[data-missing]` dash assertion (viewer score no longer on the card).
4. `brief34ProfileTenRail` "signed-out visitors see Golfers and Tens" → `['Thomas','Golfers']`.
5. `brief34ProfileTenRail` "rail shows 9.7 in the pill and none for a null score" → first figure `9.7`, null `–`, no pill.
6. `brief34ProfileTenRail` "the feed rail pill carries the glass background" → "the feed rail has no corner pill" (old: pill class + rgba(10,10,12,.5) background).
7. `brief38FeedTenRail` "4. figures follow the block…" → visitor/signed out `[['Thomas','9.1'],['Golfers','8.8']]`, owner `[['You','9.1'],['Golfers','8.8']]` (old Golfers/You and Golfers/Tens; the viewer-null case removed as the viewer figure left the card).
8. `topTenOwnerLabelRender` "Brief 34: member ratings sit in the corner glass score pill" → "Brief 45: member ratings are the first labelled figure, with no corner pill".
No Brief 43 test needed changing.

## New tests
`src/test/brief45TenOwnerScore.test.tsx` — 6 tests (brief tests 1–6), all passing.

## Screenshots (test data, harness removed)
`390_feed_visitor.png`, `320_feed_visitor.png`, `390_own_profile.png`, `390_visitor_profile.png`. Cards 264×322 (390) / 213×259 (320); no overflow; story ellipsises.

No SQL, no migrations, feed_config untouched, round_pool_cap 30, no security "Fix all".
