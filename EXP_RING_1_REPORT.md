# EXP_RING_1 — STOP

Explore's sole default-2px caller was changed in CreatorSpotlight.tsx:15 (DARK_HAIRLINE import), :148 (business inset), :152 (hairlineRing + DARK_HAIRLINE); local ownership comment added at :9. Size 56, ActiveRing and ActiveAvatarDoor are unchanged. User resolved the brief's 0.5px/actual component discrepancy in favour of matching Tour's **1px traced personal/photo ring**. Business initials keep the specifically requested 0.5px inset using DARK_HAIRLINE. Shared avatar defaults and all Tour files are untouched.

## Stop evidence
Command: `bunx vitest run src/test/expRing1.test.tsx src/test/er2CreatorsRegion.test.tsx src/test/ws3WatchBottom.test.tsx --maxWorkers=2`.
Result: **35 passed / 19 failed / 54 executed across 3 files**. Full output retained at docs/verification/exp-ring-1/focused.log.

New expRing1.test.tsx:31:33, two parameterized inactive/active cases:
`AssertionError: expected '' to be 'none' // Object.is equality` at `expect(inner?.style.border).toBe('none')`.

Untouched ws3WatchBottom.test.tsx:58 has an existing SquircleAvatar mock returning only SquircleAvatar; 17 tests now fail at CreatorSpotlight.tsx:152:153:
`Error: [vitest] No "DARK_HAIRLINE" export is defined on the "@/components/ui/SquircleAvatar" mock. Did you forget to return it from "vi.mock"?`

This is a new mock-export failure exposed by the requested import, not a classified pre-existing flake. No isolated flake reruns or four shards were run because the new test itself failed. No failing test/assertion was repaired, no existing test changed. er2CreatorsRegion passed 10/10; ws3WatchBottom passed 24/41; expRing1 passed 1/3. Browser and final build verification not completed; no completion claim.

Baseline **7,024 tests / 620 files**. Expected inventory **7,027 / 621**, solely from the three new expRing1 cases; not full-suite verified. No deleted/rewritten existing tests or assertions. New cases: inactive and active Tour-matching hairline without 2px border, and business 0.5px inset.

## Explore sweep: deliberately unchanged
There are 13 SquircleAvatar uses across 11 files; only CreatorSpotlight used the default thick ring. Existing explicit ring variants are outside the brief's default-ring sweep:
- ExploreCard.tsx:555, :868, :1283 — already hairlineRing (sizes 20/34/26), mounted All feed.
- HelpfulReviewsShelf.tsx:93 — already hairlineRing, mounted Explore shelf.
- PeopleShelf.tsx:251 — explicit thinRing, mounted Explore shelf; not default 2px.
- FeaturedRoundCard.tsx:205 — explicit hideRing, mounted All featured round; protected round presentation.
- CircleShelf.tsx:323–329 — explicit hideRing; no production mount caller found.
- watch/WatchLead.tsx:321–328 — already hairlineRing, mounted featured fallback.
- watch/RoundsThisWeekShelf.tsx:111 — already hairlineRing, mounted Watch All.
- watch/StandoutRoundsShelf.tsx:30 — already hairlineRing, mounted Watch All; round presentation untouched.
- watch/CreatorsRow.tsx:32 — already hairlineRing; no production mount caller found.
Photo-bearing business creators use the same changed SquircleAvatar branch; initials-only business creators use the requested inset.

## Boundaries
Only product file edited: CreatorSpotlight.tsx. Added expRing1.test.tsx, this report, roadmap task and saved user ring ruling. No SQL/migrations/deployed RPC/edge changes, feed_config untouched, cap 30, no native/Median changes; guest browsing/review wizard/news/round plots and all Tour files untouched. Next work is blocked by the exact test/mock failures above.