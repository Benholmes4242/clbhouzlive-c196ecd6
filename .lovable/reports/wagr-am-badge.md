# WAGR AM badge — final verification

## Outcome and scope
All four app shards passed, each run in its own command. **8,693 executed / 8,693 passed / 0 failed / 0 skipped.**

No source or test changes were made for BRIEF_WAGR_AM_BADGE_FINISH. This finish updates only this report and roadmap.md. The prior authorised test narrowing was preserved by suspension checkpoint `119d424f15`; original badge implementation is `b5d688d28f`. Neither checkpoint was reverted or squashed.

No SQL, migrations, policies, feed_config, font, badge-design or ChromeIsland changes.

## Files changed across the badge and authorised test fix
- `src/features/amateur-ranking/amateurMembersCache.ts` — microtask-batched public verified-amateur reads, 500-id chunks, five-minute stale window, cached misses and generation-safe invalidation.
- `src/features/amateur-ranking/useAmateurMembers.ts` — member Set/loading, failed reads without badges or UI exceptions.
- `src/features/pro-verification/ProOrVerifiedMark.tsx`
- `src/features/pro-verification/InlineProMemberName.tsx`
- `src/features/pro-verification/ProLabel.tsx` — shared names use PRO first, otherwise AM, otherwise existing fallback.
- `src/components/profile/hero/ProfileCoverBand.tsx`
- `src/components/profile/hero/ProfileHero.tsx` — large AM in existing grouped badge slot before Creator; PRO wins.
- `src/features/admin/components/MembersList.tsx` — small AM for visible non-PRO amateurs; index retained.
- `src/features/admin/hooks/useVerifications.ts`
- `src/features/amateur-ranking/SettingsWagrCard.tsx`
- `src/features/amateur-ranking/WagrLinkSheet.tsx` — invalidate verified-amateur identities after successful review, removal or request.
- `src/test/amateurMembersCache.test.tsx` — seven new cases.
- `src/test/wagrAmBadge.test.tsx` — nineteen new cases.
- Six existing test files below — eight authorised count-only assertion sites; no fixture, mock, source, test name or other assertion changed.
- `roadmap.md`, `.lovable/reports/wagr-am-badge-stop.md`, this final report — tracking and results.

## Each narrowed assertion and affected case
### src/test/proVerification2.test.tsx:43 and :45
Case: **Brief 2 public pro identity › invalidating own status refetches visible identities**.

Old assertions: `await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(1));` and `await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(2));`.

New assertions: `await waitFor(() => expect(f.rpc.mock.calls.filter(c => c[0] === 'get_pro_members')).toHaveLength(1));` and `await waitFor(() => expect(f.rpc.mock.calls.filter(c => c[0] === 'get_pro_members')).toHaveLength(2));`.

Why: isolate the PRO read and its refetch rather than counting the required AM read.

### src/test/proVerification2B.test.tsx:88 and :118
Cases under **Brief 2B mounted member names**:
- rail: verified-only labels with one batched screen read
- find people: verified-only labels with one batched screen read
- suggested block: verified-only labels with one batched screen read
- suggested row: verified-only labels with one batched screen read
- friend requests: verified-only labels with one batched screen read
- course members: verified-only labels with one batched screen read
- picks members: verified-only labels with one batched screen read
- people shelf: verified-only labels with one batched screen read
- grid card: verified-only labels with one batched screen read
- mixed follow rail labels members but never businesses

Both old assertions: `expect(h.rpc.mock.calls.filter((c: unknown[]) => c[0] !== 'get_people_to_follow_by_kind')).toHaveLength(1);`.

Both new assertions: `expect(h.rpc.mock.calls.filter((c: unknown[]) => c[0] === 'get_pro_members')).toHaveLength(1);`.

Why: isolate the batched PRO read rather than include the new AM read. The shared parameterised assertion applies to all nine named surfaces.

### src/test/proVerification2Surfaces.test.tsx:24
Cases under **Brief 2 opted-in member rows**:
- search labels only the verified personal identity and batches siblings
- comment labels only the verified personal identity and batches siblings
- reply labels only the verified personal identity and batches siblings

Old: `expect(f.rpc).toHaveBeenCalledTimes(1);`.

New: `expect(f.rpc.mock.calls.filter(c => c[0] === 'get_pro_members')).toHaveLength(1);`.

Why: isolate the PRO batch; the same parameterised assertion serves all three cases.

### src/test/exploreSheetShell.test.tsx:86
Case: **Explore sheet canonical shell › competition DONE closes, footnote follows rows, and only sheet rows use16px insets**.

Old: `expect(data.rpc.mock.calls.filter(([name]) => name !== 'get_pro_members')).toHaveLength(1);`.

New: `expect(data.rpc.mock.calls.filter(([name]) => name !== 'get_pro_members' && name !== 'get_verified_amateurs')).toHaveLength(1);`.

Why: preserve the single competition-data read assertion while excluding both badge readers.

### src/test/competitionBoards.test.tsx:73
Case: **CB1 competition boards › card shows three of the field; sheet shows every row from the same single call, tinting only the viewer**.

Old: `expect(f.rpc.mock.calls.filter(([name]) => name !== 'get_pro_members')).toHaveLength(1);`.

New: `expect(f.rpc.mock.calls.filter(([name]) => name !== 'get_pro_members' && name !== 'get_verified_amateurs')).toHaveLength(1);`.

Why: preserve the single competition-data read assertion while excluding both badge readers.

### src/test/likesSheetTiers.test.tsx:65
Case: **LikesSheet H.4 standing segment › one familiarity call and one legends read for the whole sheet; no history shows handicap alone**.

Old: `expect(st.rpcCalls).toHaveLength(1);`.

New: `expect(st.rpcCalls.filter(c => c.fn !== 'get_verified_amateurs')).toHaveLength(1);`.

Why: exclude the new AM read from the familiarity count; this mock already excludes PRO reads. The following argument assertion remains unchanged.

No tests were deleted or renamed. Only the named count assertions were rewritten; all other assertions remain unchanged.

## Exact commands and shard totals
Each command ran separately, sequentially; no concurrent shard run.

```text
bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-am-finish/shard-1.json
bunx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-am-finish/shard-2.json
bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-am-finish/shard-3.json
bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-am-finish/shard-4.json
```

| Shard | Executed | Passed | Failed |
|---|---:|---:|---:|
| 1/4 | 2,224 | 2,224 | 0 |
| 2/4 | 2,083 | 2,083 | 0 |
| 3/4 | 2,189 | 2,189 | 0 |
| 4/4 | 2,197 | 2,197 | 0 |
| Full app suite | 8,693 | 8,693 | 0 |

All commands exited 0 and all JSON reports returned success=true.

## Count reconciliation
- Last passing full-suite baseline before AM badges: **8,667**.
- Badge implementation added **26**: amateurMembersCache.test.tsx **7**, wagrAmBadge.test.tsx **19**.
- Inventory before authorised test fix: **8,693**; after test fix: **8,693**; after this finish: **8,693**. No count delta from narrowing or final verification.
- Earlier initial shard attempt: **8,693 executed / 8,688 passed / 5 failed**. Five failed cases across five files; six aggregate-count assertion sites were subsequently narrowed because the shared PRO assertions serve multiple cases and the mixed rail site carries the same aggregate assumption. No different-kind failure was repaired.
- Timed-out follow-up attempts did not establish a passing full-suite result; this four-command run does.

## Verification limits
This finish verifies the app test suite only, not authenticated live-member rendering. No deployment or real ranking sync was performed. Old WAGR Settings screenshots remain outstanding as a separate task, not part of this finish brief.