# Signed-off Clubhouse Tour slot — stopped verification

## Saved implementation
- One client-side slot before post index 12 only when there are more than 12 posts; existing rail indices and Round of the week are unchanged.
- Preview/Live/Result presentation; shared venue image resolver and photo fade, predictions ranks 1–3, leaderboard top three, tour ordering, guarded visit cursor, result London Tuesday expiry, navigation and analytics.
- Uses the existing persistent tournament post edge function and actor-aware post engagement cache. Feed action/comment UI extracted with default geometry preserved.
- Live narrative uses tournamentHeadline, confirmed by Ben after the brief named heroStateLine (which actually returns a round label).
- Shared sponsorship clause helper extracted without changing LeaderboardTab's Championship shortening behavior.
- No SQL, migrations, feed_config, feed RPC, rankings, deployments, or native changes.

## Stop
Command: `bunx vitest run src/test/tourSlot.test.tsx src/test/pf1bFeedCard.test.tsx --maxWorkers=2`

Executed **40**: **39 passed, 1 failed**. tourSlot: 31 passed / 1 failed (32); existing pf1bFeedCard: 8 passed (8).

```text
FAIL src/test/tourSlot.test.tsx > Tour slot rendering and post binding > binds actions and liked-by to the returned persistent post id
AssertionError: expected undefined to be 'post-123' // Object.is equality
 ❯ src/test/tourSlot.test.tsx:87:657
```
Failed assertion: `expect(h.onLike.mock.calls[0]?.[0]?.id).toBe('post-123');`
No failed test or production behavior was changed after this failure. The check fires a click; the reused Pressable control uses pointer-press interaction. This is a possible test-input mismatch, not a verified diagnosis or permission to rewrite it.

## Four separate shards
| Shard | Result |
|---|---|
| 1/4 | Not run — focused unexpected-failure stop |
| 2/4 | Not run — focused unexpected-failure stop |
| 3/4 | Not run — focused unexpected-failure stop |
| 4/4 | Not run — focused unexpected-failure stop |

## Full-suite accounting
Last fully passing baseline: **8,458**.
Prior notch change added three (8,461 expected); prior top fade added 34 (8,495 expected). Those intervening inventories were not fully verified because the notch observer setup failures remain.
Before this request: **8,495 expected inventory**. Added **32** in src/test/tourSlot.test.tsx. After: **8,527 expected inventory**, not a passing suite total. No tests deleted, renamed, or rewritten; existing test files unchanged.

## Every new test
1. is Preview before the pick lock
2. stays Preview after lock with fewer than three positioned rows
3. counts positioned rows only when deciding the three-row threshold
4. is Live with three positioned leaderboard rows
5. requires published predictions for Preview
6. holds a closed result through Tuesday 23:59 London
7. removes a result at Wednesday midnight London
8. uses London midnight during British summer time
9. accepts both closed and complete results
10. excludes LIV from every state
11. orders the selected tour first then fixed tours and Live Result Preview
12. ignores all and major as tour priorities
13. rotates the cursor once per call and wraps modulo eligible length
14. falls back to zero when cursor reads throw
15. falls back to zero when cursor writes throw
16. formats ties and ordinals including teen exceptions
17. keeps the cut score for MC and removes the score for WD
18. names a sole chaser and a shot
19. names two chasers and two shots
20. counts three or more chasers and spells gap words
21. omits the chaser sentence for a shared lead
22. reads the same best-pick record figures as the Tour picks block
23. formats the best-of-three result line
24. formats the picked-winner result line
25. strips sponsorship clauses but preserves Championship
26. places the slot only before index twelve with more than twelve posts
27. renders nothing without an eligible tournament
28. binds actions and liked-by to the returned persistent post id
29. hides actions and comment doors when no post id is returned
30. selects the tournament tour and navigates when the body is tapped
31. does not navigate when the action or comment row is tapped
32. shows the first top tie marker only and keeps pick positions in ink

## Verification limits
Latest preview signal before report: build OK (2026-11-13T17:02:04Z). No manual build or typecheck run. No authenticated live feed journey, actual like/comment writes, or 390/320 three-state visual comparison was performed after the stop. All interaction tests use mocked published reads, not a real member session.

Ben's local mock acceptance remains pending. Prior unrelated notch test failures remain untouched.

## Architecture ownership
tourSlotRules owns eligibility/formatting, useTourSlotData owns paginated published reads and Clubhouse-owned visit state, TourSlot owns slab presentation and post binding; FeedPostControls shares the existing feed doors. Module headers document these local decisions; root AGENTS rules unchanged.

## git diff --stat
Pre-report-finalisation staged stat (includes the report):
```text
 .lovable/reports/clubhouse-tour-slot-stop.md       |  77 +++++++++
 roadmap.md                                         |   5 +
 src/components/feed/FeedCard.tsx                   | 103 ++----------
 src/components/feed/FeedPostControls.tsx           |  54 +++++++
 src/features/clubhouse-tour/TourSlot.tsx           | 179 +++++++++++++++++++++
 src/features/clubhouse-tour/tourSlotRules.ts       | 102 ++++++++++++
 src/features/clubhouse-tour/useTourSlotData.ts     | 102 ++++++++++++
 src/features/tourhub/_shared/eventName.ts          |   4 +
 .../tourhub/leaderboard/LeaderboardTab.tsx         |   3 +-
 src/pages/Clubhouse.tsx                            |   7 +
 src/test/tourSlot.test.tsx                         |  92 +++++++++++
 11 files changed, 637 insertions(+), 91 deletions(-)
```
