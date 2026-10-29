# EP4.1 + EP5 report

## Part 1 — approved mock-only correction
`src/test/ep4LinksPrivacy.test.tsx`: replaced `useDeleteAccount: () => ({})` with all ten real hook fields: showDeleteConfirm/setShowDeleteConfirm, showBusinessWarning/setShowBusinessWarning, ownedBusinessNames: [], deleteConfirmText/setDeleteConfirmText, isDeleting, initiateDelete and confirmDelete. No assertion, case name or source changes in Part 1.

`bunx vitest run`: **4,340 passed / 4,340 total, 449 files**, zero failures. Previous report: 4,339 passed + one failed = 4,340. The existing failure in the bidirectional handicap test (`ep4LinksPrivacy.test.tsx:137:49`, missing settings-handicap; underlying `SettingsTabContent.tsx:417:80`, undefined ownedBusinessNames.length) is cleared. Its assertions execute unchanged. No other pre-existing failures observed.

## Part 2 — behavior and diff
- Added `completionRules.ts` for seven ordered criteria and arrival intents, and `EditProfileCompletion.tsx` for the card using existing home-club, Top 10 and coach caches. Missing coach is applicable only with a display handicap (including zero); pending home clubs count complete. Loading required inputs suppresses the card; failed coach reads cannot show stale completion. Complete profiles render no card.
- Card uses existing editor material, exact 18px radius/14×16px inset, segmented progress, singular/plural title and first three missing actions. Each action calls its existing picker/sheet/editor via opt-in refs; no duplicated write path. Local save overlays and shared cache refresh keep it current.
- `EditProfile.tsx` opens Username/Home club for the two recognised src intents once the page is available. Unknown src does nothing; Settings query preserved. ManageProfile has no existing src analytics to port. Back remains navigate(-1).
- `/edit-profile` now renders EditProfile. Added `EditProfileAlias.tsx`: `/edit-profile-v2` replaces the URL while preserving query and hash. ManageProfile stays in the codebase, unrouted, source and tests untouched.
- Hidden-nav list now contains `/edit-profile`, not v2; removed `isOnboardingEditProfile` because the exact route hides navigation on every tab. Registry retains one exact `/edit-profile` entry with unchanged none/light/nonbleed spec; removed v2 entry.
- Listed entrypoints already target the canonical URL and remain unchanged: ProfilePageV2 Edit (useEditProfileRoute) and Settings, PostingAsMenu, ProfileRoundsTab, CreateProfileRedirect query preservation, activity nudges and leftOverride targets.

## Files touched
Source: `src/App.tsx`, `src/components/GlobalBottomNavigation.tsx`, `src/features/chrome-v2/registry.ts`, `src/pages/EditProfile.tsx`, `src/features/edit-profile/EditProfileCard.tsx`, `EditProfileYou.tsx`, `EditProfileGolf.tsx`, `edit-profile.css`, new `completionRules.ts`, `EditProfileCompletion.tsx`, `EditProfileAlias.tsx`, and `src/features/coach/CoachSheets.tsx` (opt-in action ref only).

Tests: `src/test/ep4LinksPrivacy.test.tsx`, `src/test/ep1EditProfile.test.tsx`, new `src/test/ep5Completion.test.tsx`.

Documentation: `roadmap.md`, this report, and EP5 project memory/index. Root AGENTS.md remains unchanged: its existing feature-header ownership rule applies; completion ownership is documented in the new feature headers.

## Test changes, old → new
`ep4LinksPrivacy.test.tsx`: mock-only change above; all 26 case names/assertions unchanged.

`ep1EditProfile.test.tsx`: 14 → 14 cases. Mount route and Settings-query test input change from `/edit-profile-v2` to `/edit-profile`.
- “bottom nav hides and chrome registry has an exact entry”: assertions matching `HIDDEN_ROUTES … '/edit-profile-v2'` and `exact: '/edit-profile-v2' … chrome: 'none'` → the same assertions for `/edit-profile`. EP5 explicitly replaces the hidden route.
- “/edit-profile still routes to ManageProfile” → “/edit-profile routes to the new EditProfile page”: assertion matching `<ManageProfilePage />` in the canonical route → `<EditProfilePage />`. EP5 explicitly authorises the switch-over.
- No other EP1 assertions changed. No cases deleted. No ManageProfile tests edited.

`ep5Completion.test.tsx`: **36 added cases**: seven individual missing-rule cases, pending home club, conditional coach/zero handicap, ordered three-chip cap, exact done/total bar, complete/loading absence, singular/plural/live update, four independent loading inputs, stale coach failure, seven existing-action destinations, two arrival nudges, unknown src, Settings intent, canonical route, query/hash alias, CreateProfileRedirect, history Back, shared Edit entrypoint, hidden-nav/registry wiring and retained Settings/PostingAsMenu/rounds/nudge/leftOverride destinations.

Final `bunx vitest run`: **4,376 passed / 4,376 total across 450 files**, zero failures. Delta from Part 1: **+36 cases/+1 file**, entirely `ep5Completion.test.tsx`. From last green before EP4: 4,314 + EP4 26 + EP5 36 = 4,376. No deleted cases; only one existing case renamed as quoted above.

## Verification and limits
Automatic build log: **build OK, 2026-10-29T06:03:24Z**. No manual project build/typecheck run. Public Playwright navigation from `/edit-profile-v2?tab=settings` ended at `/edit-profile?tab=settings`, showing the new editor header, active Settings and loading content with no bottom navigation or runtime errors. Screenshot reviewed. This is an unauthenticated loading shell, not a populated-profile visual or persistence verification.

Managed authenticated checks are unavailable (`external_unmanaged`); real-member completion/photo/coach save-and-readback and populated phone mock comparison remain unverified. Regression tests exercise existing actions with controlled inputs, not a live member session.

No SQL, migration files, deployed RPC/edge changes, feed_config, round_pool_cap or native/Median settings changed.