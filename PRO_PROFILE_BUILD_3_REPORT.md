# Pro profile build 3 — close-out stopped

## Requested change
`ProAskSection` now uses one `showInvitation` predicate for both the visitor invitation card and header omission: enabled, total exactly 0, no own waiting question. The card retains its Ask button; every other enabled visitor state retains the header entrypoint. Owner behavior is unchanged.

No SQL, migrations, RPC/edge deployment, native/Median changes, feed_config edits or cap changes were made.

## STOP — unexpected shard 4 failure
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

## Surviving preview type errors
The preview's automatic check at `2026-11-06T16:58:00Z` also reported:

```text
src/test/proAskSection.test.tsx(80,54): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
src/test/proAskSection.test.tsx(87,75): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```

Both are in the newly added test's role queries. No repair was made after the completed-edit stop; the close-out is not build-clean or complete.

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

## Unverified and next scope
The new cases, fresh four-shard suite and live visitor view are unverified. Authentication is externally managed; no member session bypass or guest mint was attempted. Close-out requires authorization to resolve the unexpected parity failure and the new test's type errors before continuing verification. No work continues after this report.