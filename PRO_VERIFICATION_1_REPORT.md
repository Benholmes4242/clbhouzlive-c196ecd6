# PRO_VERIFICATION_1 — status: STOPPED (shard 3)

## Type errors fixed (build now clean, tsgo reports none)
- `src/features/explore-magazine/roundsPageHold.ts:16` — `gate: 'signedOut' | 'loading' | 'gated' | 'connected'` → adds `'proPending'` (only `'loading'` is tested by the rule; behaviour unchanged).
- `src/test/proVerification1.test.tsx:22` (new file, this build) — fixture `request: null as Record<string, unknown> | null` → `null as unknown`.
- `src/test/proVerification1.test.tsx:324` (new file) — removed non-existent `businessName` field from a fixture row.

## Tests
- Focused (`proVerification1.test.tsx`, `roundsGate.test.ts`): 44/44 passed.
- Shard 1: 1,719 passed · Shard 2: 1,583 passed (earlier run this build).
- Shard 3: 1,717 passed, **3 failed** — STOP.
- Shard 4: 1,678 passed / 147 files.

## Failure (caused by this build)
`src/features/explore-magazine/__tests__/gateScopeSwitch.test.tsx` — all three CB39 cases:
`TypeError: Cannot read properties of undefined (reading 'onAuthStateChange')` at `src/hooks/useSupabaseSession.tsx:51:54`.
Cause: §7 makes ScoresLeaderboardsPage call `useMyProStatus`, which reads `useProfileData` → `useSupabaseSession`; that test's supabase mock has no `auth`. Not edited (needs authorisation). Proposed test-only fix: mock `@/features/pro-verification/useMyProStatus` in that file to return a not-pro status.
Full output: `docs/verification/pro-1/shard3.log`.

## Close-out (2026-11-04)

**Authorised test-only change:** `src/features/explore-magazine/__tests__/gateScopeSwitch.test.tsx` — added a `vi.mock('@/features/pro-verification/useMyProStatus')` returning a member with no pro status (`unknown: false`). No assertion changed. The three earlier shard-3 failures are resolved.

**Product fix — pro status never gates while loading:**
- `proRules.ts`: `ProGateStatus` gains `'unknown'`; `proGateStatus` returns it when not verified and `unknown` is set (verified still wins).
- `useMyProStatus.ts`: new `unknown` field = signed in and (profile unresolved, or request query pending). A failed request read is settled → `'none'` (fail open, unchanged).
- `RoundsGate.tsx` `roundsGateState`: `'unknown'` returns `'loading'` unless the connection already resolves to connected. `useAmateurBoardState` uses the same predicate, so minimums never apply on a guess.

**Tests added** (`src/test/proVerification1.test.tsx`, 3): unknown + no connection → loading; unknown + connection → connected; unknown → verified sequence never contains gated. No test rewritten or deleted.

**Suite** (`--maxWorkers=2`, `--shard=n/4`): 1,719 / 1,583 / 1,724 / 1,678 = **6,704 tests, 588 files**, zero failures. Delta vs last close-out (6,653 / 587): +51 tests, +1 file — the new `proVerification1.test.tsx` file and Brief 1 additions (incl. ledger kind/link cases and these 3). Logs: `docs/verification/pro-1/final/`.

Brief 1 complete. Brief 2 not started (awaiting re-send with mock).
