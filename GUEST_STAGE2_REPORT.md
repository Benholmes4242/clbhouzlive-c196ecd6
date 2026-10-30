# Guest browsing Stage 2 — Preview enabled, verification stopped

## 1. Preview results (section 4)

Fresh Chromium context at localhost:8080, 1280 × 1800. Anonymous sign-in succeeded: user `e646c4d2-6a61-4341-a9d8-7c76e49a0afc`, `is_anonymous: true`. This was a real anonymous session, not sample data. Production hosts remain disabled through the existing isPreviewHost predicate; nothing was published.

Clubhouse, Explore, Courses and Tour opened and rendered; after scrolling each had a guest dialog. However the shared side-effect write below also opens a closable server card, so the observed dialog is **not proof that each surface reached its own scroll lock**. Screenshots were inspected for Clubhouse and Courses. Course cards are not anchors; the script found no anchor course URL. Course detail, holes and rounds were not exercised before the test stop.

Every observed failing network request, grouped by exact endpoint/status/message (repeated calls retained in `/tmp/browser/guest-stage2/network.json`):

| Classification | Table/function | Status | Message | Observed |
|---|---|---|---|---|
| (a) Missing guest profile | user_profiles | 406 | JSON object requested, multiple (or no) rows returned | Initial load and all four surfaces; repeated reads |
| (b) Read-adjacent write rejected | user_top_ten_lists | 403 | guests_cannot_write | Initial load and all four surfaces |
| Other schema issue | business_accounts | 400 | column business_accounts.business_type does not exist | Initial Clubhouse load |

No client data was hidden to work around category (b), and no server exemption was changed. The Top Ten write needs Ben/Claude's decision; it is not an analytics exemption assumed by the client. The original failed response remains available to callers. Category (a) is consistent with the approved absence of guest profiles, not evidence that a guest profile should be created.

The live no-write tap checks for like/comment/follow/post/review/message are **not completed**; inherited entry gates remain, but tests/source are not substitutes for this network proof.

Email conversion, confirmed is_anonymous=false, refresh/readback, same-id profile/role/clbhouz follow, and onboarding save are **not verified**. No real email was sent; no email address or confirmation code was supplied. Ben can inspect the guest id above, but it remains anonymous, not a claimed successful conversion. The project reports external_unmanaged: a normal member session cannot be minted with the managed-session tool, and authenticated member-write verification is unavailable here. No credentials were requested.

Apple/Google linking cannot run in browser preview. On a later phone build Ben must check each provider: fresh anonymous user id; linking retains that id; refreshSession completes and JWT is_anonymous becomes false; server-created profile, user role and clbhouz follow exist; onboarding saves successfully; existing-identity fallback signs into the existing account without a same-user conversion claim. Test cancellation, refresh errors, and retry without duplicate role/follow. Production phone builds remain guest-off at Stage 2, so this needs a preview-enabled phone test build.

## 2. Implemented

- guestConfig evaluates isPreviewHost once at module load; header identifies Stage 3 as the everywhere switch. Bootstrap/outcome now support preview as well as native.
- Successful same-user Apple/Google link refreshes before profile name/photo writes. Confirmed email-change flow refreshes before navigation. refreshGuestConversion rejects absent/still-anonymous sessions and waits for the server-created profile row (10 reads, 300ms between attempts); it never inserts a fallback profile.
- Anonymous welcome/signup routes are blocked, with a direct Welcome guard as a backstop. Welcome's existing profile loading/error barrier stays in place for converted members.
- Supabase's fetch observes only the exact code 42501/message guests_cannot_write, preserves response and data, and delegates to a registered session-aware gate handler. Guests see existing closable action='other' copy and trigger='server'; members are untouched. A server action card suppresses shared error toasts while it remains open. Other permission failures do not gate.
- Server trigger/role/follow facts in the Stage 2 brief supersede Stage 1 audit finding 2; no SQL, migration, grants, server settings, deployed function, feed_config, cap or native configuration was touched.

## 3. Tests and stop

Targeted command: `bunx vitest run src/test/guestStage2.test.tsx src/test/guestBrowsing.test.tsx src/test/guestSignIn.test.tsx src/test/guestEntryPoints.test.tsx src/test/guestSwitchOff.test.tsx src/test/cb87SignupAnalytics.test.tsx src/test/gateScopeSwitch.test.tsx src/test/ep52SheetsCropperCoach.test.tsx --maxWorkers=2`.
Result: 74/74 across 7 files. Important: the guessed root gateScopeSwitch path does not exist; it was **not** run in that targeted result. The real nested file was exercised by full shard 3.

Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4` for N=1,2,3,4.

| Shard | Passed | Failed | Total | Files |
|---|---:|---:|---:|---:|
| 1 | 1130 | 0 | 1130 | 119 |
| 2 | 1164 | 0 | 1164 | 119 |
| 3 | 1122 | 1 | 1123 | 119 |
| 4 | 1267 | 0 | 1267 | 118 |
| Total | **4683** | **1** | **4684** | **475** |

Baseline 4673 across474 + guestStage2.test.tsx11 =4684 across475. No tests deleted or removed. Existing file inventories unchanged. Separate ep52SheetsCropperCoach.test.tsx passes8/8 unchanged; CB87 passes7/7 unchanged.

**STOP — regression under preview-enabled switching:** `src/features/explore-magazine/__tests__/gateScopeSwitch.test.tsx:57:63`, `CB39 scope switch > is absent in the gated state`: `AssertionError: expected null not to be null`, at `expect(container.querySelector('[data-rounds-gate]')).not.toBeNull()`.
Associated unhandled error: `src/hooks/useSupabaseSession.tsx:51:54`: `TypeError: Cannot read properties of undefined (reading 'onAuthStateChange')`.
The switch now evaluates true on the jsdom preview/local host and RoundsGate's guest hook reaches an auth mock without auth. This is the previously discussed failure category, but it is a regression against the last green baseline, **not** labelled a pre-existing passing-baseline failure. No test or app change was made after this failure. No other pre-existing test failure was observed.

Automatic validation latest entry: `/tmp/observability/build-errors.log`, `2026-10-30T14:10:43Z`: `build OK` (includes type validation). Intermediate missing import/listener type errors were corrected before testing. No manual build/typecheck was run.

## 4. Existing test changes (implicitly authorised changed rules)

- guestBrowsing switch case renamed `ships OFF by default` → `ships preview-only`; assertion `expect(src).toContain('GUEST_BROWSING_ENABLED = false')` → `expect(src).toContain('GUEST_BROWSING_ENABLED = isPreviewHost()')`. Reason: Stage2 explicitly replaces the switch rule.
- guestBrowsing allowed-path test: `/welcome` removed from the true list. Blocked-path test: `/welcome`, `/signup` added to the false list. Assertions remain `expect(isGuestAllowedPath(p)).toBe(true/false)`. Reason: guest must never enter onboarding.
- guestSignIn mock adds refreshGuestConversion and successful default; no old assertion changed. New module tests cover actual refresh/profile order. No react-i18next mock was changed.

New file guestStage2 contains11 cases: preview on, production off, preview bootstrap once, welcome/signup blocked, refresh/profile/continuation order, member no refresh, anonymous refreshed JWT blocked, exact refusal card/analytics, member unaffected, other permission errors preserved, original failing response retained.

## 5. Every changed file

1. src/features/guest/guestConfig.ts
2. src/features/guest/guestSession.ts
3. src/App.tsx
4. src/features/guest/guestRoutes.tsx
5. src/pages/Welcome.tsx
6. src/features/guest/guestAnalytics.ts
7. src/features/guest/guestServerResponse.ts (new)
8. src/integrations/supabase/client.ts
9. src/features/guest/useGuestActionGate.ts
10. src/lib/toast.ts
11. src/features/guest/refreshGuestConversion.ts (new)
12. src/pages/auth/AuthForm.tsx
13. src/test/guestBrowsing.test.tsx
14. src/test/guestSignIn.test.tsx
15. src/test/guestStage2.test.tsx (new)
16. roadmap.md
17. GUEST_STAGE2_REPORT.md (new)

AGENTS.md edit was rejected by its size budget and was not applied; local new-module headers document the ownership. No sheet file changed.

**Not green; production remains off.** Remaining: resolve the authorised-scope test/mock conflict, finish course/holes/rounds and six tap network checks, real email confirmation/onboarding readback, member write checks, and phone provider checks. The live Top Ten guest write and missing business_type column require server/schema decisions rather than hiding data.