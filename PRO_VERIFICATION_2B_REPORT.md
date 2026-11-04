# BRIEF 2B — STOPPED ON NEW TEST FAILURE

## Production mounting audit

| Requested surface | Production evidence / result |
|---|---|
| WhoToFollowRail | Mounted from Clubhouse's CardFeed insertion slots in `src/pages/Clubhouse.tsx`. |
| FindPeoplePage | Mounted at `/find-people` in App; `/golferstofollow` redirects there preserving search. Suggestion and search personal rows covered; business names unchanged. |
| SuggestedGolfersBlock | Mounted after the first activity bucket in `ActivityPageV2`. |
| SuggestedGolferRow | Mounted through `NobodySawThatRound` in ActivityPageV2. The unused SuggestedGolfersRail is not the basis for this finding. |
| FriendRequestsRail | Mounted in ActivityPageV2. |
| FriendSheet header | **Skipped:** the provider exists in App, but no production caller opens it. ProfilePageV2 reads `open` as `openHybridSheet` at line 180 and never invokes it; the provider only renders FriendSheet after open sets state. FriendSheet and SheetHeader are untouched. |
| WhoPlayingSection | Mounted in CoursesBrowsePage; actual member captions, not course names, receive labels. |
| YourPickSheet Who's picked who | TournamentPicksBoard is rendered by YourPickSheet, reached from live Tour/player entrypoints. Member rows receive labels; player group names and field/summary player names do not. |
| PeopleShelf | Mounted in ExploreMagazine's people shelf case. |
| components/feed-cards/FeedCard.tsx | Live grid/tile card, distinct from components/feed/FeedCard.tsx; mounted through HubMixedGrid and CourseMediaCanonGrid. Personal creator text receives the label when the caption is rendered; business/system and bare tiles do not invent a name or label. |

## Changes made

Added opt-in `InlineProMemberName` content using the existing `useProMembers` cache and small `ProLabel`. It sits **inside** each original name element rather than outside it: caller tags, inline styles, classes, handlers, selectors and DOM positions are retained. The internal name shrinks/ellipses before the nonshrinking label. Shared CSS contains only content layout rules; no card heights, tile widths or line reservations were edited.

WhoPlayingSection preserves the original `joinNames` grammar (one name; two joined by “and”; first two plus count of more), retaining member ids for the printed names only. Business and Tour player names are excluded. Existing cache coalescing owns per-screen reads, without new RPCs or any server changes.

No changes to previously built Brief 2 surfaces, dormant FriendSheet, guest browsing, review wizard, news, round plots, SQL/migrations, deployed RPCs/edge functions, feed_config, native/Median. round_pool_cap stays 30. The feed-cards module header records its authorized personal-name presentation exception while retaining shared media behavior.

## Tests and STOP

Added `src/test/proVerification2B.test.tsx` — **12 cases**:
1. rail: verified-only labels with one batched screen read
2. find people: verified-only labels with one batched screen read
3. suggested block: verified-only labels with one batched screen read
4. suggested row: verified-only labels with one batched screen read
5. friend requests: verified-only labels with one batched screen read
6. course members: verified-only labels with one batched screen read
7. picks members: verified-only labels with one batched screen read
8. people shelf: verified-only labels with one batched screen read
9. grid card: verified-only labels with one batched screen read
10. business grid names never enter the pro read
11. centred shelf name stays in the original second child with unchanged sibling reservations
12. mixed follow rail labels members but never businesses

Command: `bunx vitest run src/test/proVerification2B.test.tsx --maxWorkers=2`.
Result: **11 passed / 1 failed, 12 executed, one file**. Complete output retained in `docs/verification/pro-2b/focused.log`.

```text
FAIL src/test/proVerification2B.test.tsx > Brief 2B mounted member names > picks members: verified-only labels with one batched screen read
AssertionError: expected "spy" to be called with arguments: [ 'get_pro_members', …(1) ]

Received:
1st spy call:
[
  "get_pro_members",
  {
    "p_user_ids": [
-     "pro",
      "ordinary",
      "pending",
+     "pro",
    ],
  },
]
Number of calls: 1

❯ src/test/proVerification2B.test.tsx:81:21
79| await waitFor(() => expect(container.querySelectorAll('.pro-label')).toHaveLength(1));
80| expect(h.rpc).toHaveBeenCalledTimes(1);
81| expect(h.rpc).toHaveBeenCalledWith('get_pro_members', { p_user_ids: ids });
```

The new test assumes input-id order, while the existing picks board groups/orders members before mounting their labels. The read is batched once and contains the expected three ids, but their order differs. This is **not** an existing test merely counting/ordering unrelated RPC calls; the broader test-only authorization does not cover rewriting this new assertion. No assertion was changed after the failure; stopped as directed.

| Full-suite shard | Result |
|---|---|
| 1/4 | Not run — focused STOP |
| 2/4 | Not run — focused STOP |
| 3/4 | Not run — focused STOP |
| 4/4 | Not run — focused STOP |

Baseline: **6,730 tests / 592 files** (last four-shard green report). Added **12 tests / 1 file**, expected inventory **6,742 / 593**. No cases removed, renamed or rewritten. No full-suite passing claim. **Existing test files touched under the RPC-only approval: none. Old/new assertions for rewritten tests: none. Known pre-existing failures: none.**

## Build / verification limits

Latest observed harness signal: `=== build 2026-11-04T20:47:01Z ===` / `build OK`. No browser verification or four-shard run after focused STOP. New tests use real surface rendering with source hooks stubbed and the real shared PRO hook/cache; no authenticated hosted read or visual sign-off claimed. Name-element positioning is covered on PeopleShelf; exhaustive browser geometry remains unverified.
## Authorised set-comparison fix, then four shards (2026-11-04 20:49–21:02 UTC)

Ben authorised fixing the new `proVerification2B.test.tsx` failure by comparing the
requested ids as a set (sorted on both sides), keeping the one-call and three-id checks.
No product code changed; no existing test touched.

Changed lines in `src/test/proVerification2B.test.tsx` (new file):

1. Added helper above the `ids` declaration:
   `const proReadIds = (): string[] | undefined => { const call = h.rpc.mock.calls.find(c => c[0] === 'get_pro_members'); return call ? call[1]?.p_user_ids as string[] : undefined; };`
   with the comment that the batched read's id order is not part of the contract.
2. Per-surface case (was line 81):
   - Old: `expect(h.rpc).toHaveBeenCalledWith('get_pro_members', { p_user_ids: ids });`
   - New: `expect(proReadIds()?.sort()).toEqual([...ids].sort());`
   (`expect(h.rpc).toHaveBeenCalledTimes(1);` retained directly above.)
3. Mixed follow-rail case:
   - Old: `expect(h.rpc).toHaveBeenCalledWith('get_pro_members', { p_user_ids: ids });`
   - New: `expect(h.rpc).toHaveBeenCalledTimes(1);` + `expect(proReadIds()?.sort()).toEqual([...ids].sort());`
   (The one-call check was added here; the assertion family is unchanged in intent.)

Focused: `src/test/proVerification2B.test.tsx` **12/12 passed**.

| Shard | Result |
|---|---|
| 1/4 | **1,750 passed** / 149 files |
| 2/4 | **1,600 passed** / 149 files |
| 3/4 | **1 failed / 1,720 passed** (1,721) / 149 files — STOP |
| 4/4 | Not run |

**STOP — unexpected failure in an existing test, introduced by Brief 2B:**

```text
FAIL src/test/wf1FindPeople.test.tsx > WF1 Find people page > renders golfer figures with and without a handicap, and verified badges
AssertionError: expected null to be truthy
❯ src/test/wf1FindPeople.test.tsx:367:102
    367|     expect(screen.getByText('Danny Holmes').parentElement!.querySelector('[aria-label="Verified"]')).toBeTruthy();
```

Cause: Brief 2B wrapped the Find people golfer name (`src/pages/FindPeoplePage.tsx:418`)
in `InlineProMemberName`, so `getByText('Danny Holmes').parentElement` is now the
`.pro-inline-name` wrapper, and the row's Verified badge sits outside that parent.
The test passed in the last green four-shard run (6,730 / 592), so this is a
Brief 2B-introduced regression, not a pre-existing failure.

Reconciliation against the 6,742 / 593 expectation: shards 1–3 ran 1750+1600+1721 = 5,071
tests across 447 files; shard 4 (~1,671 tests / ~146 files) not run after the stop.
Full failing output: `docs/verification/pro-2b/shard3.log`.
No rewritten existing tests; no existing test files touched.
