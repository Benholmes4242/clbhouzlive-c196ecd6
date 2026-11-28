# Screenshot index — Briefs 48–48C and 49

All screenshots are viewport captures at 390×1800 or 320×1800 CSS pixels, not stitched full-page captures. Numbered screenshots overlap to show the real overview through Coming up. “Fixture” means test data, not a production event result or a delivered push.

## final-skins-real — 390px

Event: **The Farmers Insurance Skins Game**. State: `results`. Source: real public overview data.

- `screenshots/final-skins-real-390-1.png`
- `screenshots/final-skins-real-390-2.png`

## live-between-rounds-real — 390px

Event: **BMW Australian PGA Championship**. State: `live`. Source: real public overview data.

- `screenshots/live-between-rounds-real-390-1.png`
- `screenshots/live-between-rounds-real-390-2.png`

## upcoming-real — 390px

Event: **Grant Thornton Invitational**. State: `upcoming`. Source: real public overview data.

- `screenshots/upcoming-real-390-1.png`
- `screenshots/upcoming-real-390-2.png`

## season-finished-real — 390px

Event: **The season in review**. State: `recap`. Source: real public overview data.

- `screenshots/season-finished-real-390-1.png`
- `screenshots/season-finished-real-390-2.png`

## final-skins-real — 320px

Event: **The Farmers Insurance Skins Game**. State: `results`. Source: real public overview data.

- `screenshots/final-skins-real-320-1.png`
- `screenshots/final-skins-real-320-2.png`

## live-between-rounds-real — 320px

Event: **BMW Australian PGA Championship**. State: `live`. Source: real public overview data.

- `screenshots/live-between-rounds-real-320-1.png`
- `screenshots/live-between-rounds-real-320-2.png`

## upcoming-real — 320px

Event: **Grant Thornton Invitational**. State: `upcoming`. Source: real public overview data.

- `screenshots/upcoming-real-320-1.png`
- `screenshots/upcoming-real-320-2.png`

## season-finished-real — 320px

Event: **The season in review**. State: `recap`. Source: real public overview data.

- `screenshots/season-finished-real-320-1.png`
- `screenshots/season-finished-real-320-2.png`

## loaded fixture — 390px

isolated test-data push payload; actual routeForNotif, arrival hook, CardFeed and FeedCard; no real push/session.

- `screenshots/top-ten-push-loaded-fixture-390.png`
- `screenshots/royal-county-down-pills-fixture-390.png`

## missing fixture — 390px

isolated test-data push payload; actual routeForNotif, arrival hook, CardFeed and FeedCard; no real push/session.

- `screenshots/top-ten-push-missing-fixture-390.png`
- `screenshots/royal-county-down-pills-fixture-390.png`

## missing fixture — 320px

isolated test-data push payload; actual routeForNotif, arrival hook, CardFeed and FeedCard; no real push/session.

- `screenshots/top-ten-push-missing-fixture-320.png`
- `screenshots/royal-county-down-pills-fixture-320.png`

## skins fixture — 390px

test data through actual overview components; illustrative Atlantic Fields course photo reused.

- `screenshots/skins-overview-fixture-390.png`

## team fixture — 390px

test data through actual overview components; illustrative Atlantic Fields course photo reused.

- `screenshots/team-overview-fixture-390.png`

## final-stroke fixture — 390px

test data through actual overview components; illustrative Atlantic Fields course photo reused.

- `screenshots/final-stroke-overview-fixture-390.png`

## final-stroke fixture — 320px

test data through actual overview components; illustrative Atlantic Fields course photo reused.

- `screenshots/final-stroke-overview-fixture-320.png`

## Fixture provenance and limitations

- Team: Grant Thornton Invitational **illustrative ten-team field**, led by Gina Kim / Yana Wilson, followed by sample Morgan / Taylor pairs with same/different-country flags. Not a live field or score report.
- Live skins: **illustrative 18-hole, four-player scenario**, 16 holes scored and two unplayed. Justin Thomas has 8 skins; Wyndham Clark and Brooks Koepka 4 each; Rory McIlroy 0. The 17th is worth 1 skin. Not the actual Farmers result.
- Completed stroke supplement: BMW Australian PGA **illustrative four-player final**, McIlroy −14, Thomas −13, Clark −12, Koepka −11. Used solely to show the completed stroke component and narrow round columns; not a claim about the actual event.
- These component examples reuse the already-existing Atlantic Fields course photograph as illustrative scenery; it is **not** a claim that the photo is Tiburon or The Lakes.
- Top 10: **illustrative Thomas Muchmore post** `fixture-ten`, with sample Alex Morgan surrounding posts and placeholder course images. The real `routeForNotif`, arrival hook, `CardFeed`, `FeedCard` and `TenRail` render it. Data reads, identity providers and impressions are replaced only within the isolated fixture; backend requests are blocked. The small static “clbhouz” header is fixture framing, not a capture of the actual account islands.
- A test button opens a realistic Top 10 push payload through the real push route function. This is a **simulated push landing**, not a received native push or an authenticated production Clubhouse session.
- Real session minting is unavailable for this user-managed Supabase backend; no credentials were requested.
