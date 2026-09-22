# Feed partial-round thru qualifier

## What will change

- Extend the existing batched feed-round load with each scorecard’s declared hole count from `whs_scores.total_holes`, and carry it on `PostRound`.
- Keep `roundScore`’s current gross and played-par arithmetic. Add `thru`, set only when every played hole is scored but the scored count is below a known declared length.
- When declared length is unavailable on the hole-sum path, suppress to-par and `thru`; do not change the WHS fallback branch.
- Render `· thru N` in the score suffix for a partial card, using the established lowercase scorecard wording and existing feed typography. Complete eighteen- and nine-hole rounds remain unchanged.

## Proof

- Add focused tests for the ten-of-eighteen proof case, complete eighteen, complete nine, unknown declared length, and a picked-up-hole WHS fallback.
- Verify the proof case keeps gross 47 and its existing played-par delta while adding `· thru 10`.
- Run focused tests, the full suite expecting 704 passing with the same four known failures, and the TypeScript check.
- Report every other `roundScore` consumer and whether it renders `toPar`; make no changes outside this feed path.

## Technical scope

Expected edits are limited to `usePostRounds`, `roundGross`, `FeedCard`, English feed copy, focused tests, and this roadmap. No score arithmetic changes, scorecard/explore changes, edge functions, SQL, migrations, or requeues.
