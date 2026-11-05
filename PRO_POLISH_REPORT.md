# Pro polish — implementation and stopped verification

## Delivered
- `useOwnHandicapState` exposes `proPending` and `noHandicap`; pending/verified hiding preserves stored connections and does not grant a pending PRO label.
- Island: small PRO, mapped uppercase short caption, teaching PGA PRO; pending returns before divider/connect/glance.
- Own-handicap hiding extended through Profile Rounds invitation, Scores standing slot, Edit profile index/completion/golf rows, Handicap/Manage and StatBrowse. Handicap/Manage show pending explanatory card without PRO or connection actions.
- Settings pending explanatory card and outlined BEING CHECKED; disabled/off connect switch. Verified card unchanged.
- Privacy pro/pending Leaderboards and New rounds are disabled/display-only; existing values and setters are untouched; pro note replaces the amateur note.
- Admin Verified chip count from `get_admin_verified()` with no args; nonempty sections in PROS/BEING CHECKED/GOLFERS/BUSINESSES order. Existing visible-row `useProMembers` batching adds small labels, suppresses No hcp, prints tour/Teaching pro and PRO index.
- Pending Inbox door passes exact request id; Inbox consumes existing verification payload only, behind existing access gate. Business door selects existing business verification in the done Inbox, the available admin business verification surface; it does not fabricate a request when none exists.
- Canonical business category labels and existing shared verified tick are reused, rather than changing frozen category definitions/tick globally to the mock's stand-ins.

## Verification and mandatory stop
Focused command:
`bunx vitest run src/test/proPolish.test.tsx src/test/proPolishAdmin.test.tsx src/test/proStatusControls.test.tsx src/test/proStatusSurfaceCoverage.test.tsx src/test/proOwnHandicapState.test.tsx src/test/membersListRules.test.ts --maxWorkers=2`

**66/66 passed across 6 files.** Full output: `docs/verification/pro-polish/focused.log`.

Fresh suite commands: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed | Failed | Files |
|---|---:|---:|---|
| 1 | 1,829 | 0 | 155 passed |
| 2 | 1,658 | 1 | 154 passed / 1 failed |
| 3 | Not run | — | Stopped |
| 4 | Not run | — | Stopped |

Executed aggregate: **3,487 passed, 1 failed**; this is not a passing full-suite total.

Failure unchanged from CH1/FIX6:
```text
FAIL src/test/ch1ChampionsTidy.test.tsx > CH1 Champions tidy > field keeps What it takes without the You link
AssertionError: expected null not to be null
❯ src/test/ch1ChampionsTidy.test.tsx:78:66
expect(subtree?.querySelector('.champions-field-panel')).not.toBeNull();
```
Full failing-shard output: `docs/verification/pro-polish/shard2.log`; shard 1 output: `docs/verification/pro-polish/shard1.log`. No CH1 test/source edit or isolated rerun. Stopped as required; no browser checks after failure.

## Test inventory and exact changed assertions
Baseline source inventory: **6,997 tests / 617 files**, not a verified green baseline (FIX6 stopped on CH1).
Expected new inventory: **7,027 / 619**, delta **+30 / +2**, reconciled:
- `proPolish.test.tsx`: +19 (11 mapped/other tour cases, teaching caption, pending hook authority/connection preservation, pending island absence, verified small HotelPlanner cell, pending Scores absence, pending Settings inert controls, verified/pending Privacy inert controls).
- `proPolishAdmin.test.tsx`: +7 (no-argument RPC; error propagation; chip count; section order/subline/date; empty sections; exact Inbox request navigation; All-list visible batch/pro treatment).
- `proStatusSurfaceCoverage.test.tsx`: +4 (pending Rounds; pending Handicap and Manage; pending StatBrowse).
No test deleted. Existing case inventory retained except the authorised teaching caption case name update below.

`src/test/proStatusControls.test.tsx`:
- Parameterised `shows PRO instead of index linked=%s` (two cases): old `expect(...textContent).toContain('Alps Tour')`; new `expect(...textContent).toContain('ALPS TOUR')`. Required uppercase island caption; index-absence assertion unchanged.
- Renamed `teaching pro shows club even when chip hidden` → `teaching pro shows PGA PRO even when chip hidden`: old `expect(...textContent).toContain('Sundridge Park')`; new `expect(...textContent).toContain('PGA PRO')`. Explicit teaching island caption supersedes club caption.
- Hook fixture adds `proPending:false,noHandicap:f.pro` without changing other assertions.

`src/test/proStatusSurfaceCoverage.test.tsx`: hook fixture adds `proPending:h.pending,noHandicap:h.pro||h.pending`; pending state defaults false. Existing assertions and names unchanged; four new cases above.

No other existing test file was edited. No existing failure was repaired.

## Changed product files
`src/lib/whs/useOwnHandicapState.ts`; `src/features/pro-verification/proRules.ts`, `pro-status-controls.css`, `ProHandicapNote.tsx`; `src/features/chrome-v2/ChromeIsland.tsx`; `src/components/settings/SettingsHandicapCard.tsx`, `SettingsPrivacyCard.tsx`, `SettingsTabContent.tsx`; `src/pages/EditProfile.tsx`, `HandicapPage.tsx`, `manage/HandicapManagePage.tsx`; `src/components/courses/StatBrowse.tsx`; `src/components/profile/rounds/ProfileRoundsTab.tsx`; `src/features/explore-magazine/ConnectStandingInvite.tsx`; `src/features/admin/hooks/useAdminVerified.ts`; `src/features/admin/components/MembersList.tsx`, `AdminVerifiedCard.tsx`, `adminVerified.css`; `src/features/admin/pages/InboxPage.tsx`; `src/index.css`.

Architecture ownership documented in relevant module headers. AGENTS save skipped at enforced size budget; no standing rule compressed. Preference saved separately under project memory; roadmap maintained.

## Remaining / unverified
- Shards 3–4 and passing full-suite total blocked by CH1 assertion above; exact fixture authorisation required to repair that unrelated test.
- Hosted signed-in/admin catalogue → request-open/business-open reads and interactions not exercised end-to-end. Unit test proves request URL intent, not hosted Inbox sheet opening. No fabricated live state.
- Pending EditProfile parent integration, SettingsTabContent pending handoff, amateur privacy parity, and full Inbox focus-consumption tests remain explicit coverage gaps; existing related tests were not changed to disguise coverage.
- No browser geometry/screenshot claims. Latest preview build log read: **build OK**, 2026-11-05T18:08:44Z; no manual build/typecheck run.
- No SQL, migrations, deployed RPC/edge functions, feed_config, cap, guest browsing, review wizard, news/round plots or native/Median changes.