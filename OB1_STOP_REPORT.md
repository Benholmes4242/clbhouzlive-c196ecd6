# OB1 — first-sign-in setup stop report

## Result
OB1 is not complete. No source or test correction followed the new failures.

- Targeted command: `bunx vitest run src/test/ob1Welcome.test.tsx` — **36 passed / 3 failed / 39 tests**, one file.
- Full command: `bunx vitest run` — **3,907 passed / 4 failed / 3,911 tests**, **419 passed / 2 failed / 421 files**.
- Before: **3,872 tests / 420 files**, including the separately owned Media gallery failure.
- Delta: **+39 tests / +1 file**, solely `src/test/ob1Welcome.test.tsx`. No existing test edited, deleted, renamed or retargeted. No exact old onboarding URL assertion was found in the existing test inventory.
- Outside OB1 and the gallery: **3,832 / 3,832 passed**. Gallery: **39 passed / 1 failed / 40**. OB1: **36 passed / 3 failed / 39**.
- Automatic preview typecheck has no surviving OB1 error; its remaining error belongs to the separately owned gallery test. No manual build/typecheck was run.

## New failures — stop
1. `src/test/ob1Welcome.test.tsx:50:322`, `identity screen prefills and saves exact names and custom username through existing save`:
   `AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…}, …(1) ]`
   `Number of calls: 0`.
2. `src/test/ob1Welcome.test.tsx:65:311`, `Skip on screen 3 saves completion and keeps progress`:
   `AssertionError: expected "spy" to be called with arguments: [ 'onboarding_skipped', { step: 3 } ]`.
   The empty suggestions fixture auto-advanced to screen 4 before the click; observed skip event carries step 4.
3. `src/test/ob1Welcome.test.tsx:71:295`, `step viewed and completed analytics use the completed choice`:
   `AssertionError: expected "spy" to be called with arguments: [ 'onboarding_step_completed', …(1) ]`.
   No identity completion event was observed after the test click.

The identity tests wait for the seeded input value, not explicitly for availability/Continue to become enabled. This is a suspected test-timing issue, not a verified diagnosis or authorization to change assertions.

## Pre-existing failures — Media gallery ownership
- `src/test/courseGallery.test.tsx:53:95`, `eligible tagger video without duration shows its poster while its gallery square keeps the processing fallback`:
  `AssertionError: expected [] to deeply equal [ '/poster.jpg', '/poster.jpg' ]`.
- `src/test/courseGallery.test.tsx(50,40)`:
  `error TS2322: Type '{ url: string; mediaType: string; posterUrl: string; streamId: string; }' is not assignable to type 'TagShot'.`
  `Type 'string' is not assignable to type '"image" | "video"'.`
- Those gallery sources/tests/report were not edited for OB1. The unchanged `holeMediaTidy` poster test remains passing.

## Implemented diff
- New `/welcome` screen with five progress segments, keyed copy, photo/name/username, course search/card, grouped suggestions, optional handicap authorities/credentials, and connected/unconnected first look.
- New identity-scoped progress helpers and saved course/follow state in localStorage with guarded storage access.
- Post-auth helper, AuthCallback and account-type redirect now target `/welcome`. Old `/edit-profile?onboarding=1` redirects through ManageProfile; normal editing branches remain.
- Profile saves have opt-in `welcomeFields` identity/course payloads. They do not finish onboarding or write unrelated privacy/additional-club/manual-handicap fields. Existing upload path remains.
- Full-catalogue `useCourseSearch` adds opt-in `includeClub`; defaults preserve existing query selection.
- Shared WHS controller has opt-in preselected country and immediate-success completion. Normal controller stages remain its default. Waitlist exposes settled/error/refetch state for OB1 decisions.
- Coach row moved into its own ManageCard directly after the Home club card.
- OB1 CSS is locally scoped and uses semantic tokens defined in global CSS. English and enabled preview-locale copy added to auth namespace. Geist retained; title tracking remains zero under the platform constraint rather than the mock's negative tracking.
- Live course tile count uses the existing exact head-count catalogue source also used by course administration; failure/null reads “Every course” / “Courses to explore”. No fixed count.

## Username check
Same profile-form syntax: `/^[a-z0-9_.]{3,20}$/`. Same availability read: `user_profiles`, exact head count, escaped case-insensitive username match, excluding current user. Initial name seed removes unsupported characters and diacritics, lowercases, trims to twenty, and appends the first free numeric suffix. Custom edits report availability/taken state instead of silently suffixing. Unique-violation handling remains in the existing profile save path. OB1 checks through a keyed query rather than the profile form's 400ms timer.

## Connect embedding
`WelcomeHandicap` mounts the existing `WhsConnectScreen` in embedded layout with `initialCountryId` and `completeOnSuccess`. It starts at credentials, preserves callConnectWhs/error classification/safe WHS instrumentation/cache invalidation, and invokes OB1 step-five transition upon success instead of showing the existing syncing or WelcomeAboard screens. No deployed functions changed. CountryScreen remains the expanded sheet; unsupported rows retain existing join/leave waitlist behavior.

## ManageProfile onboarding-only branches retained
- `isNewUser` query/profile detection and username lock decisions.
- Forced profile tab/hidden tab bar, hidden back control and setup heading.
- Existing skip write, guard, success/failure instrumentation and navigation.
- Username availability, first/last-to-display-name synchronization and username validation.
- Save with onboarding/custom-username options, onboarding cache update and home navigation.
- Onboarding-specific disabled-save logic and PageRoot bottom-nav choice.
- The old onboarding URL now returns the welcome redirect; these legacy branches were not deleted.

## Added test inventory (39)
Routing: unfinished/finished post-auth, callback, account-type, old edit URL (5).
Identity: profile name priority; three metadata shapes; name seed; suffix cap; name gate; availability/validity gate; exact save; taken-name suffix (10).
Course: search/club save; no-course; two-round gate; three-round gate; hidden cells (5).
Social: settled empty auto-skip; club/other grouping; Follow all (3).
Handicap: connected auto-skip; live catalogue groups; waitlist join; credential success; no-manual/no-handicap (5).
Completion/resume: four Skip cases; screen-five completion; resume step; identity scoping; unavailable storage (8).
Coach placement; analytics choice; partial-save scope (3).

First-look sentence gates, no-club course save and additional read-error/settled cases are not fully covered yet. Live authenticated onboarding, persistent readback, photo upload, real follow/connect, and visual reference checks are unverified for external-unmanaged authentication; no credentials requested.

## Protected scope
No SQL, migrations, migration files, deployed RPC/edge edits, feed_config changes, cap changes, native/Median configuration changes, or publishing.