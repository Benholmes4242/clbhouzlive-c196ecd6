# PRO_VERIFICATION_2 — STOPPED

## Inputs and scope
Read the re-sent Brief 2 and `build2-pro-label-and-tour-tab-signed-off.html` (Profile tab). No SQL, migrations, migration files, deployed RPC/edge-function edits, feed_config, native/Median configuration changes. round_pool_cap unchanged at 30. Guest browsing, review wizard, news and round plots unchanged. Mention suggestions use the existing shared composer, without changing its host flows.

## Implemented
- Public `get_pro_members(p_user_ids)` cache: five-minute per-id entries, caches absence, shares in-flight ids, coalesces sibling components' visible ids into one microtask batch. Failed reads grant no label. Own-status changes and own-status invalidation clear it.
- Shared large/small PRO label with signed-off dimensions, semantic global color tokens, nonshrinking label and shrinking name. Cover row orders name / PRO / Creator.
- ProfileHero gets page-owned verified membership; professional descriptor replaces connected index content and connect prompt. Existing cover, social controls and counters retained rather than adopting unrelated mock layout.
- Own pending request read and owner-only note under hero.
- Personal Tour tab after Posts. Linked player uses canonical PlayerResultRow and existing season-results hook. Current UTC year, previous-year fallback only on successful empty current results, first eight sorted newest, player-page and all-starts links. Unlinked Tour pros get owner-only note; teaching pros have no Tour. Owner Tour removes Handicap only without a connection; visitor Handicap privacy unchanged.
- Small member labels wired into FeedCard header, fullscreen author, CommentCard, ReplyRow, search PersonRow and suggested people, SocialListPage pending/ordinary rows, FindGolfersSheet, CreatorsRow and sheet, Inbox ConversationRow, ThreadV2Page header, LikesSheet, LedgerRow prefix/quoted/round actors, and mention suggestions. Business identities and group conversation ids are excluded. CreatorsRow and FindGolfersSheet are retained surfaces with no current production callers found; neither was newly mounted.

## STOP — unexpected shard failure caused by this change
Command: `bunx vitest run --maxWorkers=2 --shard=1/4`

```text
FAIL src/test/ms1MessagesHeadToHead.test.tsx > ThreadV2Page header > names the member at 17px with "{count} rounds together · last {d MMM}" under it
AssertionError: expected '' to be '17px' // Object.is equality

- Expected
+ Received

- 17px

❯ src/test/ms1MessagesHeadToHead.test.tsx:422:33
420|     );
421|     const name = screen.getByText('Thomas Holmes');
422|     expect(name.style.fontSize).toBe('17px');
   |                                 ^
423|     expect(name.style.fontWeight).toBe('600');
424|     expect(container.textContent).toContain('104 rounds together · las…
```

The existing assertion now resolves the nested name-text span introduced by ProMemberName, rather than the outer styled thread-name span. Styling inherits in the browser, but the DOM inline-style assertion no longer finds 17px on that element. This is **not a pre-existing failure**: the test predates Brief 2, the regression is introduced here. No test edited to pass it; work stopped immediately. Full failing-shard output: `docs/verification/pro-2/shard1.log`.

| Shard | Passed | Failed | Files executed |
|---|---:|---:|---:|
| 1 | 1,737 | 1 | 148 |
| 2 | Not run | — | — |
| 3 | Not run | — | — |
| 4 | Not run | — | — |

There is no executed full-suite total for this build. Known pre-existing failures: none.

## Test accounting
Baseline from Brief 1 close-out: **6,704 tests / 588 files**. Added **25 tests / 3 files**, expected inventory **6,729 / 591** (not a full-suite passing claim). No existing test rewritten, renamed or deleted; no old/new assertions to report.

`src/test/proVerification2.test.tsx` — 19 cases:
1. batches and deduplicates all visible screen ids into one RPC
2. caches returned and absent identities per id for five minutes
3. invalidating own status refetches visible identities
4. pending and unverified ids have no pro identity
5. failed public reads never grant a label
6. pro identity precedes Creator in the cover identity row
7. linked tour pro gets a public Tour tab
8. uncovered owner gets Tour instead of unconnected Handicap
9. uncovered visitor gets neither Tour nor Handicap
10. connected owner keeps both Tour and Handicap
11. teaching pro gets no Tour tab
12. ordinary owner retains Handicap
13. pending note is private to the owner
14. verified profile suppresses pending note
15. reads current season and shows eight starts with both player links
16. falls back exactly one season only when current results are empty
17. does not borrow previous season after a current-season error
18. uncovered owner note makes no player read
19. uncovered visitor renders nothing and makes no player read

`src/test/proVerification2Hero.test.tsx` — 2 cases:
- tour_pro replaces index and connect content with the professional descriptor
- teaching_pro replaces index and connect content with the professional descriptor

`src/test/proVerification2Surfaces.test.tsx` — 4 cases:
- search labels only the verified personal identity and batches siblings
- comment labels only the verified personal identity and batches siblings
- reply labels only the verified personal identity and batches siblings
- business comments and replies never request a member label

Focused commands:
- `bunx vitest run src/test/proVerification2.test.tsx src/test/proVerification1.test.tsx --maxWorkers=2`: **62/62** across two files.
- `bunx vitest run src/test/proVerification2.test.tsx src/test/proVerification2Hero.test.tsx src/test/proVerification2Surfaces.test.tsx --maxWorkers=2`: **25/25** across three files.
- Logs: `docs/verification/pro-2/focused.log`, `focused2.log`. An act warning in the new invalidation test is retained; assertions passed.

## Build and verification limits
Latest harness signal: `=== build 2026-11-04T19:50:17Z ===` / `build OK`.
An intermediate proMember prop was initially placed on ProfileRoundsTab; moved to ProfileHero before final test run. No surviving type/build error in the latest signal.

Browser checks not run after the shard STOP. Auth status is `external_unmanaged`; authenticated real-member end-to-end checks are unavailable here. Exact mock visual sign-off and exhaustive per-surface runtime label tests remain unverified. Current coverage directly exercises hero, cache, tab rules, season behavior and search/comments/replies; it does not prove every listed surface. No completion or sign-off claimed.

Structural ownership is documented in new module headers. Root AGENTS.md rule addition was refused by its size budget; existing protected rules were not compressed or modified.