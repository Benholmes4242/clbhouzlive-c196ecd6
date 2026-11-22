# TOUR ROUND NUMBER — remaining surfaces (STOPPED at shard 4)

## Shared hook
`src/features/tourhub/hooks/useEffectiveRound.ts` (ownership in header): `useEffectiveRound(tournamentId, providerRound, live)` and `useEffectiveRounds(list)`, one key `['tourhub','effective-round', id, providerRound]`, staleTime/refetch 60s. Returns provider round while loading or when not live.
Deviation from the brief's probe order (same answer, fewer probes): the first probe asks "any active row with round_{p-1} or any later round", walking down from p-1. Probing round_p then p-1 (as written) costs three probes for RSM and would get the cancelled-round case wrong only if it stopped at the first hit below; the brief's "two for RSM" figure is only reachable this way. Extra probe when nothing is scored (empty board vs round 1). Status filter lists upper/lower/title casings because PostgREST `in` is exact.

## Applied
TourIsland descriptor, TourSideMenu live rows, usePlayerState (LiveNowStrip), LinkedLiveCard (venue line and hole strip), useOverviewNewsData, CutWatchLine (now exported), AlsoThisWeek `statusFor` (optional round argument; it has no app caller).
Not changed: usePredictionTracker — it never reads the provider round; its `currentRound` is the player's own highest scored round from the full field rows it already loads (RSM: 2, not 4). Needs a ruling on what "round it reads predictions for" should mean.

## Tests
New `src/test/useEffectiveRound.test.tsx`: 27 tests, no existing test edited.

## Suite
Before: 9,853 / 872 files. After: 2,443 / 2,440 / 2,447 / 2,550 = 9,880 / 873; 9,879 passed, 1 failed. +27 = useEffectiveRound.test.tsx.

## STOP
`src/test/overviewNewsReads.test.tsx:22` "observes the existing tournament cache without reading tournaments":
`AssertionError: expected "spy" to be called 1 times, but got 2 times`.
Caused by this brief: the News hook now makes the board read plus the effective-round probe. The test pins exactly one sr_leaderboards read. Not edited; needs a ruling (allow the probe read in that assertion, or keep News on the provider round).
Captures and the overview probe count were not run.
