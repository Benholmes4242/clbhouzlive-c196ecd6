# New delay-test inventory

Baseline: 9,660 tests / 859 files. After: 9,701 tests / 861 files.
Delta: +41 named cases in exactly two new files; no existing tests changed.

## src/test/roundDelay.test.ts — 29 cases

- `true at first tee plus 61 minutes with round status scheduled and no starters`
- `true at first tee plus 61 minutes with round status null and no starters`
- `false at first tee plus 59 minutes`
- `60 minutes is the boundary and must be exceeded`
- `false once any player has a current-round starter`
- `false when current round status is inprogress`
- `false when current round status is in_progress`
- `false when current round status is suspended`
- `false when current round status is delayed`
- `false when current round status is weather`
- `false when current round status is holdup`
- `false when current round status is complete`
- `false when current round status is closed`
- `false with missing or invalid first tee null`
- `false with missing or invalid first tee undefined`
- `false with missing or invalid first tee invalid`
- `false when republished first tees move back into the future`
- `false when event status is scheduled rather than in progress`
- `false when event status is created rather than in progress`
- `false when event status is closed rather than in progress`
- `false when event status is complete rather than in progress`
- `false when event status is suspended rather than in progress`
- `false when event status is cancelled rather than in progress`
- `uses the existing in_progress event-status alias`
- `does not derive a delay without a valid current round`
- `matches today_round exactly and requires thru greater than zero`
- `one batched tee query selects earliest valid times by exact tournament and round`
- `without in-progress current rounds there is no extra tee query`
- `a failed current-tee batch cannot supply a delayed first tee`

## src/test/roundDelayOverview.test.tsx — 12 cases

- `hero kicker reads PGA Tour · ROUND 3 · DELAYED after the scheduled first tee`
- `hero reverts to after-round wording when a current-round player records a hole before a score arrives`
- `hero keeps after-round wording before the one-hour boundary`
- `republished future tee times remove the hero delay`
- `provider-suspended hero handling remains unchanged`
- `leaders group shows Delayed from the same event, round and earliest tee`
- `leaders group retains Tees off when the round is not delayed`
- `leaders group uses the event’s first tee rather than its own later tee`
- `standalone leaders clock crosses the delay boundary without a new tee read`
- `weekly row reads ROUND 3 · DELAYED without a green live dot`
- `weekly row returns to its normal live label and dot after a starter`
- `weekly section consumes the batched round-keyed tee while retaining its live count`
