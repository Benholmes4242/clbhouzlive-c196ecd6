# Sign-in code step (replaces "Check your email" sheet)

## Files
- src/pages/auth/AuthForm.tsx — sheet removed; OTP state/handlers passed to AuthHeroScreen
- src/pages/auth/components/AuthHeroScreen.tsx — in-place `code` panel (back, heading, email + Change, six boxes, Verify, footer); no guest band on code step
- src/pages/auth/components/OtpSheetContent.tsx — markup restyle only; OTP logic unchanged
- src/pages/auth/components/auth-hero.css — code panel styles + 640px rules
- Deleted: src/pages/auth/components/AuthBottomSheet.tsx
- New: src/test/authCodeStep.test.tsx (5 cases)
- Mock-only updates (brief-authorised for sheet removal): signinFix1, guestSignIn, cb87SignupAnalytics, guestStage25 (unused sheet/OTP mocks removed). No assertions changed.

## Tests
Shards: 2,236 / 2,105 / 2,203 / 2,227 = 8,771 passed, 0 failed (baseline 8,766 + 5).
Build: clean.

## Unverified
Real device keyboard and emailed-code end to end.
