# Pro status controls — STOPPED

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