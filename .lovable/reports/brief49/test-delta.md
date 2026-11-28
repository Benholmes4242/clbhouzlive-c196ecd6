## Added test cases — complete delta reconciliation

### `src/test/brief49ClubhousePostArrival.test.tsx` — 8 added cases

- loaded post aligns once smoothly below islands, consumes only post param and does not fetch
- missing post uses the permalink read and is first, never duplicated by a later page
- deleted opens the normal feed and removes the target silently
- access error opens the normal feed and removes the target silently
- rejection opens the normal feed and removes the target silently
- waits for the first feed read before deciding a post needs fetching
- StrictMode arrival still resolves and consumes the target
- a pinned card cannot cross viewer identities

### `src/test/brief49TopTenAlertsPills.test.tsx` — 5 added cases

- inbox new_course uses data.post_id before post entity id
- push new_course uses data.post_id before post entity id
- inbox ten comments, replies, mentions and post reactions retain their routes
- push ten comments, replies, mentions and post reactions retain their routes
- long pills use auto height and a two-line clamp while short pills retain the 26px minimum

### `src/test/overviewHybridPhotoNavigation.test.tsx` — 2 added cases

- live: band click and Enter each open once
- recap: band click and Enter each open once

### `src/test/overviewUpcomingCupRead.test.tsx` — 3 added cases

- shows the cup card when two team rows arrive
- falls back to the standard countdown card with fewer than two team rows or an error
- mounts the cup read only for upcoming cup slides

### `src/test/tourOverviewHybrid48.test.tsx` — 37 added cases

- round1 uses finished, low round and scoring average without a cut tile
- inPlay uses finished, low round and scoring average without a cut tile
- cutRound uses finished, low round and scoring average without a cut tile
- suspended uses finished, low round and scoring average without a cut tile
- after-cut playing and made-cut figures exclude the missed cut
- between rounds drops the ring and retains three figures
- before tee keeps only the first three present field facts
- missing scoring average drops its tile rather than supplying a number
- final round uses the lead instead of average
- team events keep the finished count and team field count
- projects only active players at or better than the cutline
- after the cut never reuses a stale projection
- no-cut events have no footer
- live round 1 selects only previous/current columns
- live round 2 selects only previous/current columns
- live round 4 selects only previous/current columns
- a 54-hole final selects three round columns
- board shows ten rows, not the entire field, and opens the canonical scorecard
- team rows deduplicate identical countries while retaining both distinct flags
- completed low round is the lowest across all rounds, not the total
- a zero winning margin uses playoff PO
- final weekday comes from the event end date, not a fixed Sunday
- uses field, purse and last winning score first
- missing primary values fill from par then yards then par fives
- no available facts produce no tiles
- a confirmed stroke champion has one face and a to-par figure
- tied live leaders retain the true count and two faces
- no resolvable champion never invents a champion face
- skins champion retains a skins figure, never gross strokes
- glass faces are capped at three
- finished pick uses actual round strokes and F
- on-course pick status uses its thru value
- not-started pick uses the existing event-zone tee
- withdrawn pick cannot show a tee or strokes
- recap points list takes five rows when available
- card list takes twelve earners, keeping the source order
- switcher keeps exactly five segments and dispatches the canonical tour id

