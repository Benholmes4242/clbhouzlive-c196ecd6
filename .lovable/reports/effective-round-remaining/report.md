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

# Rulings follow-up (after 2d745f3 / 52f015a)

1. overviewNewsReads.test.tsx, authorised. Test "observes the existing tournament cache without reading tournaments":
   old: `await waitFor(()=>expect(mocks.from).toHaveBeenCalledTimes(1));expect(mocks.from.mock.calls).toEqual([['sr_leaderboards']]);`
   new: `await waitFor(()=>expect(mocks.from).toHaveBeenCalledTimes(2));expect(mocks.from.mock.calls).toEqual([['sr_leaderboards'],['sr_leaderboards']]);expect(c.or.mock.calls).toEqual([[ACTIVE_FILTER],['round_3.not.is.null,round_4.not.is.null']]);expect(client.getQueryCache().find({queryKey:effectiveRoundKey('t',4),exact:true})?.state.data).toBe(4);`
   The shared `setup()` chain (line 12) gained `eq` and `or` and answers a probe with one row, so the probe stops after one read; otherwise unchanged. A third read fails the count and the exact `or` list.
2. usePredictionTracker unchanged. It has no caller in the app (only its type file references it), so nothing renders its round, and it never reads the provider round.
3. effectiveCurrentRound already compares case-insensitively (isActiveEntry upper-cases the status); unchanged. The hook's filter is now case-insensitive too (`status.is.null,and(status.not.ilike.mc,…)`; ilike without wildcards = case-insensitive equality; accepted by the live API in the browser check). New case in useEffectiveRound.test.tsx: "mixed-case status (Cut, Wd) is inactive in both" (both give 3).
4. Weights 800 -> 700: TheArgumentSection.tsx:73 rank figure; .t100b-axis, .t100b-badge, .t100b-lb-labels, .t100b-lb-rv, .t100b-see-all, .t100b-label. No 800/900 left in top100Compare.css. Captures ../weights-700/top100_before_390.png and _after_390.png (computed weights 800 -> 700).

## Suite
Before (52f015a): 9,885 / 874, 9,884 passed, 1 failed (overviewNewsReads).
After: 2,444 / 2,440 / 2,451 / 2,551 = 9,886 / 874, all passed. +1 = the mixed-case case; overviewNewsReads now passes. Logs: logs-final/.

## Captures (RSM shape, disposable page, network probes faked: round 3+ empty, round 2 scored)
captures/rsm_main_{390,320}.png: island "LIVE · ROUND 3", player strip "The RSM Classic · R3", pro This week "Seaside Course · Round 3", PROJECTED CUT −3 shown (cut round 3). captures/rsm_menu_{390,320}.png: side menu "ROUND 3". 2 probes per page for all four surfaces together; no horizontal overflow. Island is drawn from the real islandDescriptor + useEffectiveRounds, not the full chrome.

## Probe count, Tour overview, two live events (real data, 5 loads)
Initial: 2 probes (one per event: 02055e51 provider 4 -> scored round 3, 462bab2e provider 3). Observed totals 2, 4, 6, 2, 4: each extra pair comes from useTournamentStatusRealtime invalidating the whole ['tourhub'] prefix on sr_tournaments updates (cache event log shows `invalidate` then `fetch`). Not changed; moving the key out of the ['tourhub'] prefix would stop it — needs a ruling.
