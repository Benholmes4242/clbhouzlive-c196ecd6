# Brief 40 — verified tick (STOPPED at test gate)
Files: new verifiedMembersCache.ts, useVerifiedMembers.ts; ProLabel.tsx (ProMemberName), InlineProMemberName.tsx, ProOrVerifiedMark.tsx, ProfileCoverBand.tsx, pro-label.css, hooks/admin/useUserDetails.ts (invalidate verified/pro/amateur after verify/unverify success); new test brief40VerifiedTick.test.tsx (7 passing).
Shards: 2,581 + 2,575 + 2,720 + 2,894 = 10,770 / 942 (baseline 10,763/941; +7/+1 = new file). 7 unexpected failures, all RPC-call-count assertions now seeing the new get_verified_members read:
- wagrAmBadge.test.tsx:31 (4 cases: pro/am/plain/both verified=true) `expect(h.rpc).toHaveBeenCalledTimes(1)` — got 2
- competitionBoards.test.tsx:73 non-pro/amateur rpc calls toHaveLength(1) — got 3
- exploreSheetShell.test.tsx:86 same filter — got 2
- likesSheetTiers.test.tsx:65 rpcCalls excluding get_verified_amateurs toHaveLength(1) — got 2
Tests not edited. Screenshots not taken (stopped).

## Continuation (authorised test change)
Filters changed (no expected numbers changed):
- wagrAmBadge.test.tsx:31 (4 cases pro/am/plain/both verified=true): old `expect(h.rpc).toHaveBeenCalledTimes(1)` → new `expect(h.rpc.mock.calls.filter(([name]) => name !== 'get_verified_members')).toHaveLength(1)`. Line 41 (separate passing test) untouched.
- competitionBoards.test.tsx:73 and exploreSheetShell.test.tsx:86: old `name !== 'get_pro_members' && name !== 'get_verified_amateurs'` → new `… && name !== 'get_verified_members'`.
- likesSheetTiers.test.tsx:65: old `c.fn !== 'get_verified_amateurs'` → new `c.fn !== 'get_verified_amateurs' && c.fn !== 'get_verified_members'`.
Typecheck clean (tsgo exit 0), vite build OK. Shards after test change: 2,581 + 2,575 + 2,720 + 2,894 = 10,770 / 942, 0 failures.

Hero fix found by the responsive check: tick initially sat at the h1 box's right edge, far from a short last line. Now rendered inline with the name's final word (split after last space or hyphen, nowrap) so it follows the last line and never wraps alone. Measured (fixture "Maximilian Fitzgerald", 2 lines): tick on line 2 at 320/375/390, scrollWidth = viewport. Limitation: a name that already needs 3+ lines is clamped with ellipsis and the tick is clipped with it.

Captures (all TEST DATA, temporary b40.html fixture with intercepted RPCs, deleted before commit; signed-in sessions cannot be minted for this project): 390_hero_hero.png (Darren Gough), {320,375,390}_hero_long.png, 390_feed_verified.png (real FeedCard, verified member, tick), 390_feed_pro.png (real FeedCard, pro, PRO only, 0 ticks).

Rerun after the hero fix: shard 2 had ONE unexpected failure: messagingHairlineAvatars.test.tsx "(b) an incoming last-of-run bubble avatar renders the hairline overlay and no 2px border" (2,574/2,575). Error text not captured by the summary filter. Passed 3/3 alone and passed in an immediate shard-2 rerun; it passed in the run before the hero fix. STOPPED per rule; not edited.
