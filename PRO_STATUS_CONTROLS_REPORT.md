# Pro status controls — STOPPED

## Fixture authorisation continuation — 2026-11-05

Only test files and this report/roadmap changed in this continuation; no product code changed.

### Exact authorised fixture additions

- `src/test/ep5Completion.test.tsx:13` added exactly:
```ts
vi.mock('@/lib/whs/useOwnHandicapState', () => ({ useOwnHandicapState: () => ({ linked: !!h.connection, connected: !!h.connection, settled: true, connection: h.connection, trend: undefined, anyError: false, pro: false, proKind: null, proTour: null, proClub: null }) }));
```
  Existing WHS mock, all assertions, case names and expected values remain unchanged.
- `src/test/overflowRightIsland.test.tsx:15` added exactly:
```ts
vi.mock('@/features/pro-verification/useMyProStatus', () => ({ useMyProStatus: () => ({ verified: false, pending: false, declined: false, kind: null, tour: null, tourCode: null, club: null, body: null, reviewReason: null, request: null, isLoading: false, unknown: false }) }));
```
  Existing chip mock, all assertions, case names and expected values remain unchanged.

### Missing tests added

- `proStatusControls.test.tsx`: four additions (14 → 18): two pro-kind Settings cases with a stored connection, exact kind note, disabled/off prompt switch, no callback or connection figures/actions; two amateur connection-state cases preserving actions, figures and enabled toggle.
- New `proStatusSurfaceCoverage.test.tsx`: nine additions: two pro empty-Rounds connection states; actionable amateur Rounds invite; two pro Golf connection states retaining other rows and blocking imperative handicap opening; two own Handicap/Manage route cases each checking both connection states and suppressed child mounts/no switch; two StatBrowse empty pro/amateur action cases using structure and navigation rather than translated words.
- Island coverage already exists: `proStatusControls.test.tsx` "shows PRO instead of index linked=%s" with `linked=true`, and "profile tap never opens a glance" (default linked=true). No duplicate island case added.
- No existing assertion, case name or expected value changed in this continuation. No test deleted, renamed or rewritten; only 13 cases added.

### Verification and STOP

Focused command:
`bunx vitest run src/test/ep5Completion.test.tsx src/test/overflowRightIsland.test.tsx src/test/proStatusControls.test.tsx src/test/proStatusSurfaceCoverage.test.tsx --maxWorkers=2`
**80 passed / four files**. Full output: `docs/verification/pro-status-fixtures/focused.log`.

Suite commands: `bunx vitest run --maxWorkers=2 --shard=n/4`, run in order with immediate stop on a nonzero exit:

| Shard | Passed | Failed | Executed | Files |
|---|---:|---:|---:|---:|
| 1 | 1,753 | 0 | 1,753 | 152 passed |
| 2 | 1,614 | 49 | 1,663 | 147 passed / 5 failed |
| 3 | Not run | — | — | — |
| 4 | Not run | — | — | — |

Executed totals: **3,367 passed + 49 failed = 3,416 tests / 304 files**. No full-suite pass claimed.
Full failing shard output retained at `docs/verification/pro-status-fixtures/shard2.log`; shard 1 retained beside it.

Untouched failing files: `ep4LinksPrivacy.test.tsx` (1), `st3SettingsPrivacy.test.tsx` (13), `hb6Group1.test.tsx` (20), `headerB1.test.tsx` (6), `islandsNav.test.tsx` (9). None edited or rerun after this failure.

Tool errors:
- `ep4LinksPrivacy` / `st3SettingsPrivacy`: `Error: [vitest] No "useHandicapTrend" export is defined on the "@/lib/whs/hooks" mock. Did you forget to return it from "vi.mock"?` Dependency path: `src/lib/whs/useHandicapChipState.ts:29` → shared own hook.
- `hb6Group1` / `headerB1`: `Error: [vitest] No "isGuestUser" export is defined on the "@/features/guest/useIsGuest" mock. Did you forget to return it from "vi.mock"?` Dependency path: `src/hooks/useProfileData.ts:11` → pro status → own hook.
- `islandsNav.test.tsx:133:25` and its sibling cases at 144, 150, 168, 190, 203, 208, 215, 234: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Handicap index 12.4"`.

`headerB1` missing-helper failure was previously recorded under FIX_LIVE_DOT_1; the other files are newly observed in this continuation. Untouched files do not establish pre-existing causes; no flake exemption applied.

Inventory reconciliation (expected, not fully executed): **6,835 / 602 baseline** + `proOwnHandicapState` 3 + original `proStatusControls` 14 = **6,852 / 604**; intervening `fixTourNotif1` 7 and `fixLiveDot1` 3 = **6,862 / 606** before this continuation; current four Settings additions + nine new surface cases = **6,875 / 607**. All case deltas named; fixture additions add no cases. The actual `fixTourNotif1` source currently expands to six cases, whereas the historical report counted seven; therefore the source-based expected inventory is **6,874 / 607**, with that historical one-case discrepancy explicitly retained rather than silently reconciled. Full suite inventory remains unverified because shards 3–4 were stopped.

Latest harness build: **build OK, 2026-11-05T11:56:53Z**. Browser/member checks not run in this test-only continuation. Report retained because the requested all-green deletion condition was not met. No SQL, migrations, deployed RPC/edge edits, feed_config or native/Median changes; round_pool_cap remains untouched.

The historical sections below describe the earlier implementation and stop, not the current continuation status.

## Status
Implementation is present, but not signed off. Stopped on shard 1 fixture failures. The new test's type errors are now fixed; no failing existing fixture was changed. Shards 2–4 and browser verification were not run.

## Implemented
- Shared `useOwnHandicapState` combines chip settlement with known pro status; stored WHS connections remain untouched.
- Verified-pro island takes precedence over hidden/connected branches and opens the own profile; tour/club caption and large PRO label.
- Pro Settings state with disabled off switch; own Handicap/Manage pages reuse its note without the switch.
- Hidden own Handicap tab, empty Rounds connection surface, Golf handicap controls, editor index/completion prompt, Scores standing slot and StatBrowse connect button.
- Verified editor row opens ProStatusSheet with facts, confirmation, authorised no-argument `remove_own_pro_status` call, toasts and profile/pro invalidations.
- Existing Activity ledger accepts `golfer_verification_removed` and uses stored title/message; existing link tests retain `/edit-profile`. No SQL/server changes.

## Failures — caused by new shared reads, not pre-existing
Full output: `docs/verification/pro-status-controls/shard1.log`.

1. `src/test/ep5Completion.test.tsx`: 22 cases failed. Fixture line 12 mocks WHS without the new read dependency.
   `Error: [vitest] No "useHandicapTrend" export is defined on the "@/lib/whs/hooks" mock. Did you forget to return it from "vi.mock"?`
   Stack: `src/lib/whs/useHandicapChipState.ts:29:73` → `useOwnHandicapState.ts:5:16` → `EditProfile.tsx:38:23`.
2. `src/test/overflowRightIsland.test.tsx`: seven member cases failed. Guest fixture line 10 lacks the profile-reader helper.
   `Error: [vitest] No "isGuestUser" export is defined on the "@/features/guest/useIsGuest" mock. Did you forget to return it from "vi.mock"?`
   Stack: `src/hooks/useProfileData.ts:11:19` → `useMyProStatus.ts:36:48` → `useOwnHandicapState.ts:6:18` → `ChromeIsland.tsx:368:15`.

No pre-existing failures observed in this run. The HH3-only flake exception does not apply to this brief.

## Build — clean after test-only type fix
Latest build log: `2026-11-05T11:16:21Z`: **build OK**.
The two selectors in `proStatusControls.test.tsx:48–49` changed from `{name:'Stop',exact:true}` to `{name:/^Stop$/}`: exact accessible-name matching is preserved, and the unsupported option is removed. No assertion, case name, or test count changed.
Focused command: `bunx vitest run src/test/proStatusControls.test.tsx --maxWorkers=2`: **14 passed / one file**. Full output: `docs/verification/pro-status-controls/type-fix-focused.log`. Expected suite inventory before/after this fix remains **6,852 / 604**; full suite not rerun because the existing fixture stop remains.

Historical failing build log: `2026-11-05T11:10:15Z`:
```text
src/test/proStatusControls.test.tsx(48,186): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
src/test/proStatusControls.test.tsx(49,156): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```

## Tests and count reconciliation
- Focused command: `bunx vitest run src/test/proOwnHandicapState.test.tsx src/test/proStatusControls.test.tsx src/test/proVerification1.test.tsx src/test/proVerification2.test.tsx src/test/ep3EditProfileGolf.test.tsx --maxWorkers=2`: **105 passed / five files**.
- Shard command: `bunx vitest run --maxWorkers=2 --shard=1/4`: **1,715 passed, 29 failed; 1,744 executed / 151 files**. Shards 2–4 not executed; no full-suite pass total claimed.
- Before: **6,835 tests / 602 files** (tilted-pile full suite). Expected after: **6,852 / 604**, adding `proOwnHandicapState.test.tsx` (three) and `proStatusControls.test.tsx` (14). No removed tests. Full inventory remains unverified because the run stopped.

## Existing tests rewritten under this brief's rule changes
- `proVerification2.test.tsx`, old "connected owner keeps both Tour and Handicap": `{tour:true, handicap:true}` → "connected pro owner keeps Tour but no Handicap": `{tour:true, handicap:false}`. Verified pro now hides Handicap regardless of connection.
- `proVerification2.test.tsx`, old "teaching pro gets no Tour tab": `{tour:false, handicap:true}` → "teaching pro gets neither Tour nor Handicap tab": `{tour:false, handicap:false}`. Same rule for teaching pros.
- `proVerification1.test.tsx`, old "a verified row never opens the sheet; every other state does": `expect(screen.queryByRole('dialog')).toBeNull()` → "a verified row opens status; every other state opens details": `expect(screen.getByRole('dialog')).toBeInTheDocument()` plus the status removal button. Verified branch now uses QueryClientProvider for the real sheet. Other-state assertion unchanged.

No existing test deleted. The three renamed cases above preserve counts. No fixture/assertion changes in either failing existing file.

## Remaining
Obtain authorisation for settled amateur pro/own-state fixture mocks without assertion changes in affected existing tests. Complete missing per-surface tests and hosted member flow if possible, then four shards and mock verification. No SQL/migrations, deployed RPC/edge, feed_config, native/Median changes; round_pool_cap unchanged.