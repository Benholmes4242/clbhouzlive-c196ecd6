# Guest Stage 2.5 — STOPPED

## Diff (signInOrLinkIdToken, AuthForm.tsx)
- After a successful `linkIdentity`: `onWillNavigate?.()` before `await refreshGuestConversion(true)` (line 126).
- After `signInWithIdToken`: `if (!res.error && res.data?.session) onWillNavigate?.();` (line 136).
- useCallback deps `[]` → `[onWillNavigate]`.
- onWillNavigate calls: 126, 136, 309 (email, Stage 2.4), 416 (Apple), 545 (Google).

## Tests: new `src/test/guestStage25.test.tsx` (real Auth + real AuthForm)
- a (Apple linked, poll held): PASS
- b (Google fallback, avatar harvest held): PASS
- c (Apple signed-out visitor, name persist held): FAIL at line 142, `expect(g.route).not.toHaveBeenCalled()`; received one call `["m1", null]`.
- d (Apple linked, refresh fails): FAIL at line 160, `expected "spy" to be called at least once` (toast.error).

## Suite
4,725 passed, 2 failed, 4,727 across 482 files (baseline 4,723/481; +4 tests/+1 file = guestStage25). The two failures are c and d; nothing else failed.

## Errors in the brief
1. Fix 3 is too late. The Supabase client emits SIGNED_IN inside `signInWithIdToken`, before its promise resolves. Auth's effect can therefore commit and claim the redirect before the line after the await runs. Test c reproduces this: the redirect fires while the name persist is still pending. Acceptance A ("before the first await that can turn the user into a member") cannot be met for the non-linked paths by claiming after the call. The claim has to go before `signInWithIdToken`, and then be released on error (a release mechanism, which the brief forbids). Test b passing is timing-dependent, not proof.
2. 5d assumes an error toast. The Apple and Google handlers have `try/finally` with no `catch`, so a thrown `refreshGuestConversion` rejects out of the native callback with no toast. The stay-on-/auth and no-navigation parts hold; the toast does not exist on this path.

## hasNavigated after a failed conversion (5d)
Yes, it stays true. Auth's redirect effect and both `visibilitychange` checks (existing session and OAuth handshake, Auth.tsx:48) are then blocked for that mount. A retry through AuthForm still navigates, because AuthForm's handlers navigate themselves and don't check the flag. An SFSafariViewController OAuth return that relies on the visibilitychange path would not navigate until /auth remounts. Not fixed, as instructed.

## Other awaited steps missed
- Email, non-linked: `verifyOtp` also emits SIGNED_IN before it resolves, and line 309 claims after it. Same race as point 1.
- Google, both paths: the name persist (`update ... is('first_name', null)`) runs before the avatar harvest and is also awaited before the old line 545.
