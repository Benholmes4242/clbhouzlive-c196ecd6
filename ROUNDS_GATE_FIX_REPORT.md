# Rounds gate correction — stop report

## Result
The approved source/test corrections are complete. All three prior gate failures pass in both runs. Work stopped after the full suite exposed an unrelated, unchanged onboarding test failure; no corrections or reruns followed.

## Commands and counts
- `bunx vitest run src/test/roundsGate.test.ts src/test/roundsGateAnalytics.test.tsx src/test/roundsGateLookLock.test.tsx src/test/roundsGateShortScreen.test.tsx`: **43/43 passed**, four files (5 + 11 + 25 + 2 cases).
- `bunx vitest run`: **4,111 passed, 1 failed, 4,112 total**, 435 passed files / 1 failed file / 436 total files.
- Previous run: 4,107 passed / 3 failed / 4,110 total across 436 files. Delta is exactly two new restored-position cases, one in each edited test file. Relative to last green 4,085/435, the intervening gate build added 25 cases/one file, and this correction adds two cases/no files.
- Automatic preview diagnostic: `=== build 2026-10-28T20:46:09Z ===` / `build OK`. No manual build or typecheck run.

## Exact surviving failure
`src/test/ob1Welcome.test.tsx:109:980`

Case: `OB1.2 first sign-in fixes > cropper has no slider, grid or reset and Use photo hands the file to the existing upload`

```text
AssertionError: expected "spy" to be called with arguments: [ 'profilePhotoBlob', Any<File> ]

Number of calls: 0
```

This file was not edited. It passed in the immediately preceding full run; the same failure appeared historically during neutral-glass work, so it is a recurrence, not an established failure at this task's starting baseline. The three starting failures were the two analytics call-count failures and the unmounted-root failure documented in the previous gate report; all three are now passing.

## Every project file changed
1. `src/features/explore-magazine/RoundsGate.tsx`: capture `startTop` at effect mount; lock only for absolute distance greater than 80; remove initial `onScroll()` and retain `checkRow()`; update header. Timer, observer, fallback, latches and cleanup are otherwise unchanged.
2. `src/test/roundsGateAnalytics.test.tsx`: reset document scrollers and resolver cache before/after each case; add the 300 → 380 → 381 regression. Existing 1-call and 2-call assertions unchanged.
3. `src/test/roundsGateLookLock.test.tsx`: reset document scrollers before each case; give fixture optional gate visibility/key and shared tree; remount gate through React rerender; add the root 300 → 380 → 381 regression.
4. `roadmap.md`: record approval, corrected prior failures, counts and current stop.
5. `ROUNDS_GATE_FIX_REPORT.md`: this report.

Only the two named test files were edited. No other tests were edited, deleted or renamed.

## Authorized rewritten test
`src/test/roundsGateLookLock.test.tsx` — `never unlocks on scrolling back, restores overflow on unmount and resets on remount`.

All assertions retained:
- `expect(root.querySelector('[data-rounds-locked]')).not.toBeNull()` after scrolling back.
- `expect(root.style.overflow).toBe('')` after gate unmount.
- `expect(root.style.overflowY).toBe('auto')` after gate unmount.
- `expect(root.querySelector('[data-rounds-locked]')).toBeNull()` after remount.

Why: the brief authorizes unmounting/remounting the gate with React rerender and a new gate key, avoiding reuse of an unmounted Testing Library root. No assertion was changed or removed.

## New cases (+2)
- Analytics: `starts unlocked at 300px and reports scroll lock only beyond 80px from arrival`.
- Root lock: `starts unlocked at 300px and locks only beyond 80px from the root arrival position`.

Both prove mount at 300 stays unlocked, 380 stays unlocked, and 381 locks. Analytics additionally proves no premature viewed event and the eventual `scroll` trigger.

Project memory records the approved mount-relative threshold. No SQL, migrations, deployed RPC/edge edits, feed_config, round_pool_cap or native/Median changes. Authenticated live-page verification remains unavailable for external-unmanaged authentication and was not attempted after the test stop.