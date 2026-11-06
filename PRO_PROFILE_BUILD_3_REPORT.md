# Pro profile build 3 — push-router close-out

## Latest close-out result
Approved router parity work is complete. `pro_question_asked` opens `/profile?ask=inbox`; `pro_question_answered` opens `/profile/{pro_id}?ask=section` (missing id: `/profile`); `pro_round_posted` opens `/profile/{pro_id}` (missing id: `/profile`). Both client and push routers now handle all three types. The prior unexpected parity failure is resolved without changing its assertion.

### Deployment
`process-push-queue` successfully deployed through `supabase.deploy_edge_functions` with `function_names: ["process-push-queue"]`.
Tool result: `Successfully deployed edge functions: process-push-queue`.
Submitted source SHA-256: `ed6ef8676cbe5d8ad5ad7a8c25219bb2ae99ef6745ad77f9a79768b629bd2896`.
The function's existing import of `_shared/notifRoute.ts` includes the approved router changes. No queue invocation or real push delivery was attempted; deployment success is distinct from live delivery verification. Entrypoint authentication, CORS and sending logic were not changed.

### Fresh test results
Commands were run separately and sequentially, inspecting each result before continuing:

| Command | Passed | Failed | Executed | Files |
|---|---:|---:|---:|---:|
| `bunx vitest run --shard=1/4 --maxWorkers=2` | 1,889 | 0 | 1,889 | 161 |
| `bunx vitest run --shard=2/4 --maxWorkers=2` | 1,773 | 1 known FM1 | 1,774 | 161 |
| `bunx vitest run --shard=3/4 --maxWorkers=2` | 1,876 | 0 | 1,876 | 161 |
| `bunx vitest run --shard=4/4 --maxWorkers=2` | 1,813 | 0 | 1,813 | 161 |
| **Total** | **7,351** | **1 known FM1** | **7,352** | **644** |

Expected inventory: **7,348 + 4 = 7,352 tests / 644 files**, matching the fresh executed total exactly. Delta comes only from the three named parity fixtures and one named client test below; no files or cases were removed. There were no unexpected failures. The known FM1 failure remains `fw1FeaturedDeck.test.tsx:151:18`, `reserves no right padding on the meta line`, `AssertionError: expected undefined to be defined`; its test and production code were untouched.

Focused command: `bunx vitest run src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts src/test/proAskSection.test.tsx --maxWorkers=2` — **117/117 passed** (85 parity-file cases + 32 Ask cases). Logs retained under `/tmp/pro-build3-push/`: `focused.log`, `shard1.log`, `shard2.log`, `shard3.log`, `shard4.log`.

### Approved changes and test ledger
Production files changed in this follow-up:
- `src/features/activity-v2/utils/activityLinks.ts`: add the explicit `pro_round_posted` branch beside Ask notifications.
- `supabase/functions/_shared/notifRoute.ts`: mirror all three pro notification branches beside verification, documenting client ownership in the requested comment style.

`src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts` adds only:
1. `pro_question_asked resolves identically in both routers` — fixture `{ question_id: 'question-1', pro_id: ACTOR }`.
2. `pro_question_answered resolves identically in both routers` — same realistic question/pro payload.
3. `pro_round_posted resolves identically in both routers` — fixture `{ pro_id: ACTOR, event_id: 'event-1', round_no: 2, to_par: -3, holes_played: 18 }`.
4. `pro_round_posted opens the pro profile on the client` — asserts `/profile/${ACTOR}`.

The three fixtures use the existing unchanged parameterized parity assertion. Parity file inventory: **81 → 85 cases**. Existing parity fixtures, assertions and test names changed/deleted/rewritten: **none**. No new source/test files were added in this follow-up; the initial Build 3 added-file list remains below. Report and roadmap updated. The only earlier test-line repair remains the documented exact-option removal, with old/new code preserved below.

No SQL, migrations, feed_config, cap, native or Median changes. Only the explicitly approved push-queue function was deployed. Live authenticated Ask views and device push receipt remain unverified; no guest mint or identity bypass was attempted.

## Historical verification record
The sections below preserve earlier stop evidence and accounting; the fresh results above supersede their incomplete-suite status.

## Requested change
`ProAskSection` now uses one `showInvitation` predicate for both the visitor invitation card and header omission: enabled, total exactly 0, no own waiting question. The card retains its Ask button; every other enabled visitor state retains the header entrypoint. Owner behavior is unchanged.

No SQL, migrations, RPC/edge deployment, native/Median changes, feed_config edits or cap changes were made.

## Historical STOP — unexpected shard 4 failure (now resolved)
Command: `bunx vitest run --shard=4/4 --maxWorkers=2`

```text
FAIL src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts > notifRoute handled-type coverage > handles the same notification types in both files
AssertionError: expected { missingFromPort: [ …(2) ], …(1) } to deeply equal { Object (missingFromPort, extraInPort) }

- Expected
+ Received
  {
    "extraInPort": [],
-   "missingFromPort": [],
+   "missingFromPort": [
+     "pro_question_asked",
+     "pro_question_answered",
+   ],
  }
❯ src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts:312:46
```

Shard 4: **1,808 passed / 1 failed = 1,809 executed**, 160 passed files / 1 failed file = 161 files. Full runner output retained at `/tmp/pro-build3-closeout/outstanding-shard4.log`.

This is not the authorized known Featured failure. The parity test and routing implementation were not repaired. The fresh four-shard rerun and focused run were not started after this stop.

## Preview type errors — resolved in type-only follow-up
The preview's automatic check at `2026-11-06T16:58:00Z` also reported:

```text
src/test/proAskSection.test.tsx(80,54): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
src/test/proAskSection.test.tsx(87,75): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```

Both were in the newly added test's role queries. The subsequent explicit type-error repair removed only the unsupported `exact` option; a string `name` already matches exactly by default. Preview build OK at `2026-11-06T17:02:52Z`. The unexpected parity failure remains untouched, so full close-out is still incomplete.

Only the new case `enabled with nothing has only the invitation Ask entrypoint` changed in this follow-up, preserving both assertions and their meaning:
```tsx
// Old
await screen.findByRole('button', { name: 'Ask', exact: true });
expect(within(card as HTMLElement).getByRole('button', { name: 'Ask', exact: true })).toBeTruthy();
// New
await screen.findByRole('button', { name: 'Ask' });
expect(within(card as HTMLElement).getByRole('button', { name: 'Ask' })).toBeTruthy();
```
Reason: `ByRoleOptions` does not support `exact`; removing it preserves exact-name selection. No original Build 3 test was rewritten. Test inventory remains **7,348 / 644**, delta **0** in this follow-up.

Focused follow-up command: `bunx vitest run src/test/proAskSection.test.tsx --maxWorkers=2` — **32/32 passed**, one file. Output: `/tmp/pro-build3-closeout/type-fix-focused.log`. No shards were rerun; the unexpected parity failure still blocks them.

## Shard accounting
Earlier Build 3 results below are carried from the preceding conversation, not rerun or independently recovered from original logs this turn.

| Shard | Previous Build 3 passes | Previous failures | Fresh all-four rerun |
|---|---:|---:|---|
| 1 | 1,889 | 0 | Not run — stopped |
| 2 | 1,773 | 1 known FM1 | Not run — stopped |
| 3 | 1,876 | 0 | Not run — stopped |
| 4 | 1,808 (run this turn) | 1 unexpected parity failure | Not run — stopped |

Mixed-run evidence: **7,346 passed + 2 failures = 7,348 executed cases**. This is not a fresh full-suite result: shards 1–3 precede this fix. The two new close-out cases have not been executed in their shard, so this mixed sum does not verify the updated inventory.

Inventory reconciliation: last full-suite baseline **7,307 / 643 files**, plus nine FM1 cases in the existing Featured test file = **7,316 / 643**; initial Build 3 adds 30 cases in one new test file = **7,346 / 644**; this close-out adds two cases to that same file = expected **7,348 / 644**. No test files or cases were removed. The exact observed mixed-run sum also equals 7,348, but is not interchangeable with the expected new inventory or a verified fresh total.

## Known failure kept separate
`src/test/fw1FeaturedDeck.test.tsx:151:18`, `FM1 sound group > reserves no right padding on the meta line`:

```text
AssertionError: expected undefined to be defined
```

This belongs to FM1_MUTE_1 and remains untouched. It was reported in earlier Build 3 shard 2; shard 2 was not rerun this turn.

## Files added and changed
Initial Build 3 added:
- `src/features/pro-profile/ProAskSection.tsx`
- `src/features/pro-profile/ProAskSheets.tsx`
- `src/features/pro-profile/proAskRules.ts`
- `src/features/pro-profile/useProAsk.ts`
- `src/test/proAskSection.test.tsx`

Initial integration changed `ProProfileBuildOne.tsx`, `pro-profile.css`, and `features/activity-v2/utils/activityLinks.ts`; no generated table types needed editing.

This close-out changes only the Ask section's invitation/header condition and adds the `within` test import plus two cases. It also updates `roadmap.md` and adds this report. No new application or test files were added this turn.

Production old/new condition:
```tsx
// Header before
: data.enabled
// Header after
: data.enabled && !showInvitation

// Shared predicate added
const showInvitation = !owner && data.enabled && data.total === 0 && data.my_waiting.length === 0;

// Invitation body before
if (!owner && data.enabled && data.total === 0 && data.my_waiting.length === 0) {
// Invitation body after
if (showInvitation) {
```

## Test ledger
Initial `proAskSection.test.tsx`: 30 new tests, reported focused **30/30** before this close-out. Covers visitor/owner states, useful counts/toggles/guest gate, own waiting, all-answers entry, explainer, ask validation/privacy/write success/errors, questions/answer/edit/decline/switch/profile doors, and Activity deep links.

This close-out adds:
1. `enabled with nothing has only the invitation Ask entrypoint` — header has no button; invitation card contains its Ask button.
2. `enabled with answers retains the header Ask entrypoint` — header button retains `pro-ask-door`.

File count: **30 → 32 cases**. Existing tests deleted, renamed or rewritten: **none**. Existing test assertions changed: **none**, so there is no old/new existing-test assertion code to list. The import addition is not an assertion rewrite.

## Remaining verification limits
The Ask cases and repaired parity check pass; all four fresh shards completed with only the separately owned known FM1 failure. Live visitor views and device push delivery remain unverified because authenticated checks are externally managed and no queue invocation was requested. No guest session was minted and no real push was sent for verification.