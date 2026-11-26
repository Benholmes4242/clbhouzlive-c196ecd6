# Brief 40 — verified tick (STOPPED at test gate)
Files: new verifiedMembersCache.ts, useVerifiedMembers.ts; ProLabel.tsx (ProMemberName), InlineProMemberName.tsx, ProOrVerifiedMark.tsx, ProfileCoverBand.tsx, pro-label.css, hooks/admin/useUserDetails.ts (invalidate verified/pro/amateur after verify/unverify success); new test brief40VerifiedTick.test.tsx (7 passing).
Shards: 2,581 + 2,575 + 2,720 + 2,894 = 10,770 / 942 (baseline 10,763/941; +7/+1 = new file). 7 unexpected failures, all RPC-call-count assertions now seeing the new get_verified_members read:
- wagrAmBadge.test.tsx:31 (4 cases: pro/am/plain/both verified=true) `expect(h.rpc).toHaveBeenCalledTimes(1)` — got 2
- competitionBoards.test.tsx:73 non-pro/amateur rpc calls toHaveLength(1) — got 3
- exploreSheetShell.test.tsx:86 same filter — got 2
- likesSheetTiers.test.tsx:65 rpcCalls excluding get_verified_amateurs toHaveLength(1) — got 2
Tests not edited. Screenshots not taken (stopped).
