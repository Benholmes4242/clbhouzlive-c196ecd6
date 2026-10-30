# GUEST BROWSING — Stage 1 + "The sign-in" correction — STOP REPORT

Status: **STOPPED** on one unexpected full-suite failure (section 6). Everything
else in both briefs is built. The switch `GUEST_BROWSING_ENABLED` is `false`.
No SQL, no migrations, no server/edge/feed_config/native changes.

## 1. The sign-in break

Root cause (as the brief said): `src/features/guest/guestConversion.ts:18`
returned `{ guestUserId, surface }`, but the module variable is `guestSurface`.
Runtime: `ReferenceError: surface is not defined`, thrown from
`peekGuestConversion()` inside AuthForm's sign-in success path, so every
Apple/Google/email sign-in died before navigation.

Fix: `return { guestUserId, surface: guestSurface };`

Compiler output for the old line (tsgo, `tsconfig.app.json`):
`src/features/guest/guestConversion.ts(18,25): error TS18004: No value exists in scope for the shorthand property 'surface'. Either declare one or provide an initializer.`

Why it was reported as clean: the earlier "clean typecheck" was taken before
the conversion helper had this shape; after the `.ts → .tsx` route-guard rename
the next typecheck did report TS18004. The preview's build log
(`/tmp/observability/build-errors.log`) holds no TS18004 entry, because the
preview build (Vite/esbuild) strips types and does not type-check — it bundles
an undefined identifier without complaint. The current typecheck is clean.

### AuthForm no longer depends on guest code
- Switch off: `signInOrLinkIdToken` and `trackGuestConversionIfPending` return
  before touching any guest module; `isGuestConverting()` returns false first;
  email always uses `signInWithOtp` + `verifyOtp({ type: 'email' })`.
- Switch on: every guest call is in `try/catch` and logs `console.warn('[guest-convert] …')`;
  a fault falls back to ordinary sign-in and navigation still happens.
- Apple/Google: guest → `linkIdentity({ provider, token })`; on error falls back
  to `signInWithIdToken` (linked: false).
- Email from the join card (`/auth?guest=1`): `updateUser({ email })` on the
  guest, confirmation via `verifyOtp({ type: 'email_change' })`; if the email
  already belongs to an account, normal `signInWithOtp` sign-in.
- `guest_converted` carries `guest_user_id`, `method`, `linked`, `surface`.

## 2. Entry points gated (this turn and Stage 1)
Bottom-nav POST; ChromeIsland (guest pill replaces account tile, bell,
handicap cell); RoundsGate (guest never sees it); FeedCard like / comment /
"Add a comment…" row / share / follow; fullscreen FeedActionRail
like/comment/share/follow/more; useToggleFollow; useStartConversation
(messages); RequestCourseSheetHost; ReportSheet and ClaimCourseSheet (sheet
gate: closes and opens the card); blocked routes (rate a course, own profile,
edit profile, settings, handicap connect, messages, notifications, business
create) open the card **on the page the guest came from** with the matching
action copy.
Write-layer backstops (throw before the request is sent): `toggle_post_like`
(useLikeMutation, before the optimistic update), `add_comment_v2`.

Not yet individually gated (reachable only through a blocked route or a gated
door, listed for Stage 2 completeness): comment edit/delete/like inside the
comments sheet (sheet opens only via the gated comment door), PostOwnerMenu
(owner-only, guests own nothing), ClaimYourCourseSheet (business profile, not
a free-look surface), course shortlist toggle, `mark_surface_seen`,
`record_post_impressions`, analytics inserts (deliberately ungated — they are
reads-adjacent tracking).

## 3. Server audit (read-only; nothing changed)
Method: import graph from each of the five free-look entry pages, then every
`.rpc()`, `.from()` and `functions.invoke()` reachable from them.

| Surface | Files reached | RPCs | Tables | Edge functions |
|---|---|---|---|---|
| Clubhouse | 354 | 27 | 33 | 1 |
| Explore | 384 | 32 | 33 | 1 |
| Courses | 233 | 9 | 15 | 0 |
| Course page | 447 | 37 | 35 | 6 |
| Tour | 396 | 23 | 45 | 5 |

Findings that need Ben's decision before Stage 2:
1. **The server cannot tell a guest from a member.** No migration references
   `is_anonymous`. Anonymous Supabase users carry the `authenticated` role, so
   every `TO authenticated` policy and every `auth.uid()`-scoped RPC accepts a
   guest. The client gates are the only barrier today. Writes reachable from
   the five surfaces: RPCs `add_comment_v2, delete_comment_v2, edit_comment_v2,
   toggle_comment_like_v2, toggle_post_like, submit_report, mark_surface_seen,
   record_post_impressions, upsert_whs_course_alias`; tables `posts, follows,
   user_follows, user_friends, user_blocks, content_reactions, hidden_comments,
   reports, post_reports, post_dismissals, course_shortlists, course_ratings,
   user_profiles, course_hole_media, course_place_media, course_review_media,
   review_responses, post_media, post_courses, mentions, stream_assets,
   analytics_events, business_analytics_events, sr_course_map`; edge functions
   `request-course-claim, process-image, cloudflare-stream-*, cleanup-review-media,
   generate-predictions, geocode-club, get-club-media`.
2. **Every guest gets a public profile row.** `handle_new_user` (latest in
   `20260611211440_…sql`) inserts `user_profiles` with username `golfer…`,
   display name `Golfer`, `is_public = true`; `assign_default_user_role` adds a
   `user` role. Guests would appear in member counts, search, directories and
   any "members" figure unless filtered server-side.
3. **Automatic clbhouz follow** (FOLLOW_CLBHOUZ_V1, applied by hand, not in the
   repository) fires "on first sign-in in the database". If it keys on
   `last_sign_in_at`, anonymous sign-in triggers it. Unverifiable from code.
4. Anonymous sign-in must be enabled in the auth settings for Stage 2; I did not
   read or change that setting.

## 4. Switch-off behaviour
`signedOutOutcome({ enabled: false, … })` is always `'auth'`: a signed-out phone
goes to `/auth` exactly as today. The bootstrap never calls
`signInAnonymously` when off. All sign-in methods unchanged (tested). RootGate's
guest logic now lives in `src/features/guest/guestSession.ts` so it is testable.

## 5. Tests
New: `guestSignIn.test.tsx` (11: conversion memory; switch-off ×3 methods never
touch guest code; throwing helper ×3 methods still navigate; Apple link; Google
fallback; email change; email already on an account), `guestEntryPoints.test.tsx`
(12: RootGate outcome off/on/failed; bootstrap off/once/skips/failure; blocked
route actions; sheet gate on/off; write backstop on/off).
`guestBrowsing.test.tsx` (23) from Stage 1. `cb87SignupAnalytics.test.tsx`
unchanged, 7/7. No existing test edited.

## 6. Full suite — THE STOP
`bunx vitest run --maxWorkers=2 --shard=N/3`:
- 1/3: 1,535/1,535, 158 files
- 2/3: 1,418/1,418, 158 files
- 3/3: 1,713 passed, **1 failed**, 1,714, 156 files, plus 1 unhandled error

Total **4,667 tests across 472 files: 4,666 passed, 1 failed.**
Against last green 4,621/469: +46 tests, +3 files = guestBrowsing 23 +
guestSignIn 11 + guestEntryPoints 12. Reconciles exactly.

Failure (new; caused by Stage 1, not pre-existing):
`src/features/explore-magazine/__tests__/gateScopeSwitch.test.tsx:57:63` —
"CB39 scope switch > is absent in the gated state" —
`AssertionError: expected null not to be null`, with the unhandled
`TypeError: Cannot read properties of undefined (reading 'onAuthStateChange')`
at `src/hooks/useSupabaseSession.tsx:51:54`.

Cause: RoundsGate now calls `useIsGuest()`, which calls `useSupabaseSession()`
**even with the switch off**. That test's supabase mock has no `auth`, so the
gate crashes. In the real app this is harmless, but it breaks the "switch off
= exactly today" rule: RoundsGate opens a session listener it never had.

Proposed fix (code only, no test edit — awaiting your go-ahead): in
`useIsGuest`, return `false` before calling `useSupabaseSession()` when
`GUEST_BROWSING_ENABLED` is false. The switch is a build-time constant, so hook
order cannot change between renders in the app.

No pre-existing failures were observed.

## 7. Files changed
- src/features/guest/guestConversion.ts
- src/features/guest/useGuestActionGate.ts
- src/features/guest/guestRoutes.tsx
- src/features/guest/guestSession.ts (new)
- src/pages/auth/AuthForm.tsx
- src/App.tsx
- src/components/feed/FeedCard.tsx
- src/components/moderation/ReportSheet.tsx
- src/components/courses/course-detail/ClaimCourseSheet.tsx
- src/components/media-system/hooks/useLikeMutation.ts
- src/features/comments-v2/hooks/useCommentsV2.ts
- src/test/guestSignIn.test.tsx (new)
- src/test/guestEntryPoints.test.tsx (new)
- src/test/guestBrowsing.test.tsx (Stage 1)
- plus the Stage 1 files from the previous turn (guestConfig, guestGateStore,
  guestCopy, guestAnalytics, useIsGuest, GuestGateHost, GuestJoinCard,
  ChromeIsland, GlobalBottomNavigation, RoundsGate, RequestCourseSheetHost,
  useStartConversation, useToggleFollow, FeedActionRail, page context setters)

Not verified: a real native cold start, real anonymous sign-in and real
identity linking (the switch is off and anonymous sign-in is a server setting).
