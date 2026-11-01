# AC2 — Activity folding rounds and crown rows

## What changed
- `src/features/activity-v2/activityFoldRules.ts` (new): pure fold rules — `foldableRounds` (read round rows only), `segmentRows` (3+ fold at the newest round's position), `foldKey` (section label + newest round id), `bestRoundLine` (lowest to_par among 18-hole rounds with a summary, ties keep the newer round, shortened course name), `openOrder` (to_par ascending, not-ready last, newest-first ties).
- `src/features/activity-v2/components/ActivityFoldedRoundsRow.tsx` (new): folded row — up to three 30px squircle avatars (2px canvas ring, −8px overlap), "{n} golfers posted rounds" (n 600), optional 12.5px mute "Best: {name}, {gross} at {short course}", 13.5px/600 "See all {n} ›". No score tile. Click and Enter/Space open.
- `src/features/activity-v2/ActivityPageV2.tsx`: `foldEnabled` only on the All and Friends chips; New section/chip, Mentions and Records never fold. `openFolds` page state survives refetches (keyed by section + newest round id) and resets on unmount. Opening never calls markRead. Open state renders AC1 rows in score order with not-ready last, the day label becomes "{Day} · {n} golfers posted rounds", and a 13.5px/600 mute "Show less" refolds.
- `src/features/activity-v2/components/LedgerRow.tsx`: crown_taken/crown_lost/legend_earned/legend_lost bold the `shortCourseName` of the course (in place when the sentence names it, appended when not). All other kinds keep the full server name; tiles and copy unchanged.
- `src/features/activity-v2/activity-rounds.css`: fold row geometry/type classes; the hairline stays inline reading `ACT.HAIR`.
- No new reads: the fold reuses the AC1 per-page summary read. No SQL, migrations, RPC/edge changes, feed_config, round_pool_cap, or native/Median changes.

## Tests
- New `src/test/ac2ActivityFold.test.tsx`: 24 tests (6 fold rules, 5 best/open order, 3 folded row, 3 crown/legend, 7 page-level: All fold, open order + label + no markRead, Show less, refetch survival, Friends fold, Mentions/New never fold).
- Existing tests: none edited, renamed or deleted. AC1's 28 tests pass unchanged.
- Focused: 52/52 (AC2 24 + AC1 28). Typecheck (`npx tsgo --noEmit`) clean.
- Full suite, four shards: 1336 + 1334 + 1423 + 1389 = **5,482/5,482 across 521 files**, zero failed/skipped. Baseline 5,458/520 → +24/+1, reconciled solely to ac2ActivityFold.test.tsx.

## Verification limits
- Signed-in live Activity verification unavailable (external_unmanaged auth); fold/crown behavior is unit-tested against fixtures. Browser geometry/colors not captured this round.
