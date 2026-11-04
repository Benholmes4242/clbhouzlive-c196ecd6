# PRO_VERIFICATION_2 — FOUR SHARDS GREEN; VISUAL LIMITS RETAINED

## Inputs and scope
Read the re-sent Brief 2 and `build2-pro-label-and-tour-tab-signed-off.html` (Profile tab). No SQL, migrations, migration files, deployed RPC/edge-function edits, feed_config, native/Median configuration changes. round_pool_cap unchanged at 30. Guest browsing, review wizard, news and round plots unchanged. Mention suggestions use the existing shared composer, without changing its host flows.

## Implemented
- Public `get_pro_members(p_user_ids)` cache: five-minute per-id entries, caches absence, shares in-flight ids, coalesces sibling components' visible ids into one microtask batch. Failed reads grant no label. Own-status changes and own-status invalidation clear it.
- Shared large/small PRO label with signed-off dimensions, semantic global color tokens, nonshrinking label and shrinking name. Cover row orders name / PRO / Creator.
- ProfileHero gets page-owned verified membership; professional descriptor replaces connected index content and connect prompt. Existing cover, social controls and counters retained rather than adopting unrelated mock layout.
- Own pending request read and owner-only note under hero.
- Personal Tour tab after Posts. Linked player uses canonical PlayerResultRow and existing season-results hook. Current UTC year, previous-year fallback only on successful empty current results, first eight sorted newest, player-page and all-starts links. Unlinked Tour pros get owner-only note; teaching pros have no Tour. Owner Tour removes Handicap only without a connection; visitor Handicap privacy unchanged.
- Small member labels wired into FeedCard header, fullscreen author, CommentCard, ReplyRow, search PersonRow and suggested people, SocialListPage pending/ordinary rows, Inbox ConversationRow, ThreadV2Page header, LikesSheet, LedgerRow prefix/quoted/round actors, and mention suggestions. Business identities and group conversation ids are excluded. CreatorsRow (rail and sheet) and FindGolfersSheet are excluded from Brief 2 because nothing mounts them in production; their pre-Brief-2 markup is restored.

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

## Name-element preservation continuation — 2026-11-04

User directed a product correction, not a change to `ms1MessagesHeadToHead.test.tsx`. That file remains untouched. ProMemberName now accepts the original name element and adds only an outer flex row plus sibling PRO label. Caller style/className are applied to the text element, not the wrapper; original elements keep their own ellipsis and PRO remains flex none. Removed the extra `.pro-name-text` element and its forced truncation rule.

Audited and moved the existing name elements unchanged (tag, inline styles, classes, handlers and selectors):

| Surface | Original name element retained |
|---|---|
| FeedCard header | button, existing inline typography/ellipsis and profile click handler |
| Fullscreen author | span, existing inline typography/ellipsis and profile click handler |
| CommentCard | span.truncate, 14.5px/600 and existing color/tracking; You suffix remains inside |
| ReplyRow | span.truncate, 13.5px/600 and existing color/tracking; You suffix remains inside |
| Search PersonRow | p with text-[15px], font-medium, truncate and existing S.INK style; Highlight retained |
| SearchEmptyState people | p with text-[15px], font-medium, truncate and existing S.INK style |
| SocialListPage pending/ordinary | existing div elements and full inline typography/ellipsis |
| Inbox ConversationRow | span.truncate with MT.NAME, nameColor and minWidth |
| ThreadV2Page header | span.truncate, existing 17px/600, 20px line height and tracking |
| LikesSheet | existing div with full inline typography/ellipsis and You suffix |
| Mention suggestions | span.truncate with existing 15px/600 and color/tracking |
| LedgerRow prefix/quoted | original span with fontWeight 700; composer receives an element-wrapping callback |
| LedgerRow round | original strong.font-semibold; ActivityRoundContent receives the same wrapping callback |

No original name test ids were added, removed or moved. Cover identity h1/PRO/Creator ordering was not changed in this continuation. The unused CreatorsRow and FindGolfersSheet are excluded from this audit's opted-in surface list by the subsequent ruling below.

### Tests and current STOP
Added exactly one test in new `src/test/proThreadNameElement.test.tsx`: **ThreadV2Page name element still carries fontSize 17px with the PRO label present**. It mounts the real thread page, resolves a verified pro, checks the label is present, and asserts the text-holding span still has `fontSize:17px`, `fontWeight:600`, `className:truncate`, with PRO as its sibling.

No test rewritten, renamed or deleted. Old/new assertions: none. `ms1MessagesHeadToHead.test.tsx` still asserts `expect(name.style.fontSize).toBe('17px')` and now passes unchanged.

Focused command:
`bunx vitest run src/test/proThreadNameElement.test.tsx src/test/ms1MessagesHeadToHead.test.tsx src/test/proVerification2.test.tsx src/test/proVerification2Surfaces.test.tsx src/test/proVerification2Hero.test.tsx --maxWorkers=2`
Result: **54/54 tests, 5 files**. Full output (including retained act warnings): `docs/verification/pro-2/name-preservation/focused.log`.

| Command | Passed | Failed | Files |
|---|---:|---:|---:|
| bunx vitest run --maxWorkers=2 --shard=1/4 | 1,738 | 0 | 148 |
| bunx vitest run --maxWorkers=2 --shard=2/4 | 1,590 | 1 | 148 |
| shard 3/4 | Not run | — | — |
| shard 4/4 | Not run | — | — |

Stopped immediately after shard 2. Full output preserved in `docs/verification/pro-2/name-preservation/shard2.log`; shard 1 output is alongside it.

```text
FAIL src/test/ws1WatchTop.test.tsx > EXPLORE_TOP_2 Golfers to watch > names reserve two lines so lines 2 and 3 share a top offset across one- and two-line names
AssertionError: expected [ 'explore-card-ring', …(3) ] to deeply equal [ 'explore-card-ring', …(3) ]

- Expected
+ Received
[
  "explore-card-ring",
- "explore-card-name",
+ "pro-member-name",
  "explore-card-why",
  "explore-card-detail",
]

❯ src/test/ws1WatchTop.test.tsx:405:20
403| for (const card of cardsOf(container)) {
404|   const kids = Array.from(card.children).map((k) => k.className);
405|   expect(kids).toEqual(['explore-card-ring', 'explore-card-name', …
   |                ^
```

This is a newly exposed structural assertion failure, not a pre-existing failure: the user-required wrapper makes the flex row the card's direct child while preserving the original name span inside. No assertion or product workaround applied after STOP. The previous thread-name failure is resolved. Known pre-existing failures: none.

Reconciliation: prior expected inventory **6,729 / 591**, plus this one named test/new file = **6,730 / 592** expected inventory. Relative to last green Brief 1 baseline **6,704 / 588**, total additions are **26 tests / 4 files** (25/3 from Brief 2, 1/1 this pass). Actual executed shards so far: **3,329 tests / 296 files**, **3,328 passed / 1 failed**. No full-suite passing total claimed.

Latest harness build: `=== build 2026-11-04T20:06:19Z ===` / `build OK`. Browser checks not run following STOP. All original constraints remain unchanged.

## Unmounted-surface exclusion — 2026-11-04

Restored CreatorsRow rail/sheet and FindGolfersSheet to their pre-Brief-2 name markup by removing only the ProMemberName import and wrappers. Existing VerifiedBadge behavior is retained. Every other surface stays as built. `ws1WatchTop.test.tsx` and `ms1MessagesHeadToHead.test.tsx` remain untouched.

These two surfaces are excluded because they have no production callers (Golfers to watch was removed in ER1). The Brief 2 surface test file already covers only search, comment, reply, and business exclusions: neither excluded surface has an import, fixture, case, or assertion to remove. Therefore **no tests rewritten, renamed, or deleted**, and **no old/new assertions**. Test inventory before and after this rollback: **6,730 tests / 592 files**; delta **0 tests / 0 files**. This reconciles to the last green baseline **6,704 / 588** plus the already named **26 tests / 4 files**.

Commands: `bunx vitest run --maxWorkers=2 --shard=n/4`. Full outputs retained in `docs/verification/pro-2/unmounted-exclusion/`.

| Shard | Passed | Failed | Files executed |
|---|---:|---:|---:|
| 1/4 | 1,738 | 0 | 148 |
| 2/4 | 1,591 | 0 | 148 |
| 3/4 | 1,718 | 1 | 148 |
| 4/4 | Not run — STOP | — | — |

Executed **5,048 tests / 444 files**, with **5,047 passed / 1 failed**. Full-suite inventory remains **6,730 / 592**, not a full-suite passing claim. `ws1WatchTop.test.tsx` passes unchanged: **44/44** in shard 2. Historical failures above were introduced regressions, not pre-existing failures. Known pre-existing failures: none; this newly observed failure is not classified as pre-existing.

### STOP — unexpected shard 3 failure

```text
FAIL src/test/likesSheetTiers.test.tsx > LikesSheet H.4 standing segment > one familiarity call and one legends read for the whole sheet; no history shows handicap alone
AssertionError: expected [ { …(2) }, …(1) ] to have a length of 1 but got 2

- Expected
+ Received

- 1
+ 2

❯ src/test/likesSheetTiers.test.tsx:63:25
61|     const { container } = renderSheet({ authorName: 'Ben', courseId: '…
62|     await waitFor(() => expect(container.querySelectorAll('[data-liker…
63|     expect(st.rpcCalls).toHaveLength(1);
  |                         ^
64|     expect(st.rpcCalls[0].args).toEqual({ p_user_ids: ['a', 'b', 'c'],…
65|     expect(st.legendCalls).toBe(1);
```

Stopped after shard 3; shard 4 was not run. Full failing output: `docs/verification/pro-2/unmounted-exclusion/shard3.log`. No changes to LikesSheet, its tests, or any other surface were made in this pass. No tests rewritten, renamed or deleted; old/new assertions: none.

Latest observed harness build: `=== build 2026-11-04T20:09:46Z ===` / `build OK`. No browser checks run after STOP. Pre-Brief-2 markup was independently confirmed from read-only history for both reverted files. All protected areas remain unchanged.

## Approved test-only PRO-read isolation — 2026-11-04

**Every test file touched under this approval:** `src/test/likesSheetTiers.test.tsx` only. No other existing test failed or needed the broader approved repair. No product code changed.

The existing RPC mock now returns `{ data: [], error: null }` immediately for `get_pro_members`, before recording calls in `st.rpcCalls`. All other RPC behavior remains unchanged.

Old mock line:
```ts
rpc: async (fn: string, args: any) => { st.rpcCalls.push({ fn, args }); return { data: st.famRows, error: null }; },
```
New mock line:
```ts
rpc: async (fn: string, args: any) => { if (fn === 'get_pro_members') return { data: [], error: null }; st.rpcCalls.push({ fn, args }); return { data: st.famRows, error: null }; },
```

**Rewritten, renamed or deleted tests: none. Old/new assertions: none.** Only the authorized mock line changed. In particular, `expect(st.rpcCalls).toHaveLength(1)` and `expect(st.rpcCalls[0].args).toEqual({ p_user_ids: ['a', 'b', 'c'], p_course_id: 'c1' })` remain unchanged. Neither `ws1WatchTop.test.tsx` nor `ms1MessagesHeadToHead.test.tsx` was edited.

Focused command: `bunx vitest run src/test/likesSheetTiers.test.tsx --maxWorkers=2` — **6/6**, one file.

| Command | Passed | Failed | Files |
|---|---:|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,738 | 0 | 148 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,591 | 0 | 148 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,719 | 0 | 148 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,682 | 0 | 148 |

**Full suite: 6,730 passed / 6,730 executed, 592 passed files; zero failures.** Before/after inventory: **6,730 / 592 → 6,730 / 592**, delta **0 / 0**. Reconciliation against the last full green baseline **6,704 / 588**: the previously named 25 Brief 2 tests in three files plus the one ThreadV2Page regression in one file produce **+26 tests / +4 files**. This pass adds/removes no cases or files.

Complete outputs, including retained warnings: `docs/verification/pro-2/rpc-mock-repair/focused.log` and `shard1.log` through `shard4.log`. No new failures or known pre-existing failures. Previous thread-name, dormant-CreatorsRow and LikesSheet mock failures are resolved; their historical output remains intact above and in the original logs.

Latest observed harness build: `=== build 2026-11-04T20:23:51Z ===` / `build OK`. This test-only pass did not run browser checks or change any previously recorded authenticated/visual verification limits. All protected areas remain unchanged.