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
---

## Stage 2.1 (accepted)
Three fixes (guest own-profile read, Top Ten mount-time upsert, `business_accounts.category`), test-mode switch, `guestStage21.test.tsx` (+6). 4,690/476 green.

## Stage 2.2

### 1 — Guest flag in every guest-skipped key (`[..., userId, isGuest]`)
- `useProfileData.ts`: `['profile', user?.id, isGuest]` (setQueryData uses the same key; prefix invalidations unchanged).
- `useProfileData.tsx` (legacy, not resolved by `@/hooks/useProfileData` — `.ts` wins): effect deps add `user?.is_anonymous`.
- `TopTenContext`: load effect deps `[loadUserId, loadIsGuest]`; guests get an empty list without a read.
- `useFeatsWindow`: `['explore','feats-window', userId, window, isGuest]`.
- `LatestCoursesSection`/`LatestHolesSection`: `['gam_rpc', <rpc>, 'infinite', user?.id, isGuest]`.
- `useCircleLatestRounds`: `isGuest` after `userId`.
- Test `guestStage22.test.tsx`: guest → member (same id, no reload, no invalidate) fetches profile, fires `get_feats_window`, `get_latest_course_media`, `get_latest_hole_media`.

Existing tests updated because the documented key changed (brief §1 authorises; named here):
- `latestHolesSection.test.tsx:75` `queryKey: ['gam_rpc','get_latest_hole_media','infinite']` → `[..., 'infinite', expect.anything(), false]`.
- `latestCoursesSection.test.tsx:94` same for `get_latest_course_media`.
- `coursesRailsUnlimited.test.tsx:78,120,162` exact cache lookups `['gam_rpc', spec.name, 'infinite']` → `[..., 'infinite', 'admin', false]` (the test's mocked user is `admin`).

### 2 — Readers of `user_top_ten_lists`
Only `src/context/TopTenContext.tsx` (load: `.maybeSingle()`, missing row → `EMPTY10`, no error; save: upsert after a real change, never for guests). No profile page, edge function or other client code reads the table. No `.single()`.

### 3 — The three showcase reads: what actually failed
Probed directly with a fresh anonymous session (curl, 30 Oct 19:48 UTC):

| RPC | Guest access token | Anon key only |
|---|---|---|
| `get_feats_window` | **200**, rows | 401 `42501` "permission denied for view whs_friend_matches", hint null |
| `get_latest_course_media` | **200**, rows | 401 `42501` "permission denied for function get_latest_course_media", hint null |
| `get_latest_hole_media` | **200**, rows | 401 `42501` "permission denied for function get_latest_hole_media", hint null |

**The server already serves guests.** The 401s seen in 2.1 carried only the anon key — the requests ran before the guest session existed (the race the brief anticipated). Claude's server fix is not needed for these; the separate fix is to hold these reads until the guest session is ready. Client gate kept as instructed. (Probe created one extra anonymous auth user.)

While gated:
- Rare Air (`ScoresLeaderboardsPage` §5): **was** holding its pending placeholder height forever (disabled query = pending). Fixed: a disabled (pending + idle) read is not a load, so the section is absent, as for a member with zero rounds.
- `LatestCoursesSection` / `LatestHolesSection`: `isLoading` false, `visible` false → render nothing, no skeleton, section-ready signalled.
- Circle rounds `whs_score_holes`: correctly gated.

### 4 — Scroll lock on a short page
Rule (`shouldScrollLock`): 1.5 viewports OR ≤120px from the end, only once `scrollTop > 0`.
**Found and fixed:** on the preview the shared resolver had cached `<html>` (asked before `#root` became the scroll container), so the non-Clubhouse gate listened on `window` and **never fired** on any surface. The gate now listens on `#root` directly. The shared resolver's stale cache affects other callers too — reported, not changed.
Explore is short for a guest (1,891px at 390×844) because Rare Air, Latest-style showcase reads and RoundsGate content are absent. Member height: not measured (no member session — `external_unmanaged`).
Tests `guestScrollLockShortPage.test.tsx` (+6): rule ×3, short page locks at its end, unscrollable page never locks, Clubhouse still locks at the fourth post.

### 5 — `geocode-club` 502
Not reproduced in this run (course page loaded with no failed requests). Member comparison not possible: no member session in this sandbox.

### 6 — Proof (preview, real anonymous session, 390×844)
| Surface | Locked at (root scrollTop) | guest_gate_shown | Failed requests |
|---|---|---|---|
| Clubhouse | first scroll step (fourth post already in view) | `clubhouse`, `scroll` | 0 |
| Explore | 960 (end rule; max 1,047) | `explore`, `scroll` | 0 |
| Courses | 1,320 | `courses`, `scroll` | 0 |
| Tour | 1,320 | `tour`, `scroll` | 0 |
| Course page | 1,320 | `course:<id>`, `scroll` | 0 |
| Course holes / rounds | **never by scroll** — they open as sheets that scroll inside themselves, not `#root` | — | 0 |

Earlier run found `mark_surface_seen` 403 (guest write on leaving Explore). Fixed: `useDiscoverLastSeen` never sends it for guests (+1 test in `guestStage22`). Never a `server` trigger.

Gated taps (none sent a write; each opened the action card): comment (`comment`), "Add a comment…" (`comment`), follow (`follow`), Post or review (`post`), share/send (`share`), rate on course page (`rate`); like verified in 2.1. Notifications bell: **not rendered for guests** (island shows Log in / Join free). Message: member profiles redirect guests to Clubhouse, so not tappable in preview; gated in code at `useStartConversation.ts:55`.
Telemetry writes still sent by guests: `video_perf_rollups` POST (2xx), `secure-site-access-check`, `get-club-media` (reads).

Passwordless: guest email join calls `updateUser({ email })` with no redirect link, then the same `setStep('otp')` 6-digit screen as members; verifies `verifyOtp` type `email_change`; falls back to `signInWithOtp` + type `email` when the address belongs to a member. No link-confirmation step exists in the flow.

Open for a ruling: holes/rounds sheets never scroll-lock.

### Ben's email-conversion steps
1. Open the preview in a fresh private window. Expect the Clubhouse with **Log in / Join free** in the top island; no sign-in prompt.
2. Scroll the Clubhouse to the fourth post: the join card appears. Choose **Email**.
3. Enter a new email. Expect the 6-digit code screen (same as members).
4. Email: the "Change email address" template, now showing a 6-digit code like sign-in. No link to click.
5. Enter the code. Expect onboarding (welcome) to start, no reload.
6. Finish onboarding with your name/username; expect it to save and land on Clubhouse with no join cards.
7. Check: your profile opens with the saved name; Following includes **clbhouz**; Explore now shows Rare Air and the Latest rails; Top 10 is empty, not an error.

### Suite
4,701/4,701 across 478 files (shards 2,302 + 2,399). vs 4,690/476: +5 `guestStage22.test.tsx`, +6 `guestScrollLockShortPage.test.tsx`, +2 files. No tests deleted.

---

## Stage 2.2 addendum (replaces §3) — the 401s were a client fault

### Cause (measured, fresh preview browser, gates removed, 390×844)
Every failing request carried the **anon key only** (JWT role `anon`, no `sub`) — no guest token existed at all:
- `get_latest_course_media` 401 `42501` "permission denied for function get_latest_course_media"
- `get_latest_hole_media` 401 `42501` "permission denied for function get_latest_hole_media"
- `get_feats_window` 401 `42501` "permission denied for view whs_friend_matches"
- `whs_score_holes` 401 (empty body)

- Same one supabase client everywhere; no raw fetch or proxy in these hooks.
- Not an expired token: localStorage held **no session**, and no `/auth/v1/signup` request was ever sent.
- **Root cause:** the guest bootstrap and canvas hold lived only in `RootGate`, which is mounted only at `/`. A cold deep link to `/courses`, `/amateur`, `/tourhub` or a course page rendered with no session and fetched as anon. Stage 2.1's runs started at `/`, which hid it.

### Fix
- New `GuestSessionHold` wraps every route in `AppInner`. On a preview/native cold start with no stored session, it shows the plain canvas and mounts **no route** until the anonymous session exists. If the attempt fails, today's signed-out behaviour takes over. `/auth`, `/legal`, `/privacy`, `/terms` and `/delete-account` are exempt and never mint a guest. Switch off: it passes children through and reads nothing.
- `signInAnonymously` is now single-flight (shared while in flight), so RootGate plus the hold mint one guest.
- Removed the client gate on `get_feats_window`, `get_latest_course_media` and `get_latest_hole_media`. Their keys keep `[..., userId, isGuest]`, so conversion re-reads the viewer figures. The circle-rounds `whs_score_holes` gate stays.
- After: all three, plus the remaining `whs_score_holes` reads, carry the guest's access token (role `authenticated`, `is_anonymous: true`) and return 200 with data. The first request leaves after the signup returns.

### Explore re-measured
Guest Explore is now 2,257px tall (it was 1,891px with the feats missing). The 1.5-viewport rule fires first, at 1,320px, before the end rule (max scroll 1,413px). Courses, Tour, course page: 1,320px. Clubhouse: fourth post. All `guest_gate_shown` events have trigger `scroll`; 0 failed requests on every surface.

### Tests
- New `guestSessionHold.test.tsx` (+7): a deep link mounts nothing until the session exists, then the page reads as a guest; two holds share one sign-in; auth never holds or mints; four rule cases.
- `guestStage22.test.tsx` (my own tests from this stage, rewritten because the gate is removed):
  - "get_feats_window fires after conversion" (asserted `toBe(0)` for the guest) → "fires for a guest, and again after conversion" (1 → 2).
  - "get_latest_course_media and get_latest_hole_media fire after conversion" (0 for the guest) → fire for the guest, then again after conversion (1 → 2).
  - Count unchanged at 5.

### Suite
4,708/4,708 across 479 files (shards 2,309 + 2,399). vs 4,701/478: +7 tests and +1 file, both from `guestSessionHold.test.tsx`.

## Stage 2.3 — scroller cache, course sheets, hold timeout (FINISHED)

### Changes
- `src/lib/getScrollParent.ts`: `getDocumentScrollParent()` returns `#root` whenever it exists, with no overflow check; caches only `#root`; the `document.scrollingElement` fallback is used only while `#root` is absent and is never cached.
- `src/features/guest/useGuestSurfaceGate.ts`: page gate uses the shared resolver again (direct `#root` read removed). New `useGuestSheetScrollGate(courseId, open)` — same rule on the sheet's own scroller (1.5 sheet heights or within 120px of its end, only after a scroll), same `course:<id>` key as the page, opens the card at once if the course is already locked.
- Wired into `AllHolesSheet.tsx`, `YourHolesSheet.tsx`, `YourRoundsSheet.tsx` (callback ref on each sheet's scroll region).
- Layering: sheets sit at 1400/1401, above the nav (100) and card (98/99). While a course sheet is open, `GuestJoinCard` raises shade/card to 1402/1403 and `GlobalBottomNavigation` raises the nav to 1404 (only when a guest card is up), via `registerGuestCourseSheet` / `useGuestCourseSheetOpen` in `guestGateStore.ts`. Nothing changes for members.
- `src/features/guest/guestSession.ts`: 8s timeout (`GUEST_SIGN_IN_TIMEOUT_MS`); on timeout tracks `guest_session_failed { reason: 'timeout' }` and fails the attempt (signed-out behaviour); a late success is signed out.

### Tests
- New `src/test/guestStage23.test.tsx` (+8): scroller cache ×2, sheet threshold, locked course shows card on sheet open, sheet lock locks course, other course unaffected, hold timeout, late success signed out.

### Suite
- 4,715 passed, 1 failed, 4,716 across 480 files (baseline 4,708/479; +8 tests/+1 file = guestStage23).
- FAILURE (new, caused by §1): `src/test/pageScroller.test.ts:66` "falls back to the scrolling element when #root is not a scroll container" — `AssertionError: expected 'root' not to be 'root'`. This test encodes the old overflow-checked rule that §1 removes, while the brief also says "the existing scroll tests must pass unchanged". The two clauses contradict; not edited. Awaiting ruling.

### Stage 2.3 finish
- Approved test change, `src/test/pageScroller.test.ts`:
  - old: `it('falls back to the scrolling element when #root is not a scroll container')` with `mountRoot('visible')` and `expect(resolved?.id).not.toBe('root')`
  - new: `it('returns #root even when its overflow is hidden')` with `mountRoot('hidden')` and `expect(resolved?.id).toBe('root')`
- Bug found in the preview and fixed: after tapping Tour from a locked course sheet, the course's scroll card followed to Tour. `GuestGateHost.tsx` now clears a scroll card whose surface is not the current one. +2 tests in `guestStage23.test.tsx`: the card clears when another tab is opened; the raised layer is on only while a course sheet is registered.
- Suite: 4,718/4,718 across 480 files (4,716 + those 2).

### Preview check (guest, 390×844), screenshots in Files `guest-stage23/`
- Every sheet's content was short for a guest (all-holes 623/623px: "Only 9 rounds…"; your-holes and your-rounds are empty), so no sheet could scroll to its own lock in the preview. Sheet-threshold locking is proven only by unit tests. Each sheet was therefore checked after locking the course page by scrolling (#root locked at 1,400px).
- `1_allholes_locked`, `2_yourholes_locked`, `3_yourrounds_locked`: shade 1402 and card 1403 above the sheet (1400/1401), nav 1404; for all five tabs, elementFromPoint at each tab's centre hits that tab. Signed-off card, no close button.
- `4_othertab`: Tour tapped; no dialog, shade or card left, body overflow restored, #root scrolled to 300.
- `5_return`: back on the course, the card shows at the top. `6_return_sheet`: opening All 18 holes shows the card straight away (raised layers).
- Today's layering: with an unlocked course sheet open (`1_allholes_open`, guest with no card) the nav stays at z 100 beneath the sheet, unchanged. A member session could not be signed in (`external_unmanaged`); with the switch off, `openGuestCard` is a no-op, so the raise cannot happen. That path is covered by code and tests, not seen in the browser.

## Stage 2.4 — every way into sign-in (FINISHED)

### Changes
- `src/pages/Auth.tsx`: only a non-anonymous user counts as signed in. The redirect effect, the signed-in hold and both visibilitychange checks (existing session, OAuth handshake) ignore guests, so a guest sees AuthForm and `resolvePostAuthRoute` is never called for an anonymous user.
- `src/pages/auth/AuthForm.tsx`: the email path calls `onWillNavigate()` before `refreshGuestConversion`. The refresh turns the guest into a member, so Auth's redirect could otherwise fire alongside AuthForm's own navigation; now only one fires.
- `src/features/guest/guestRoutes.tsx`: `lastAllowedPath` records only free-look surfaces and `/post/:id` (`isGuestReturnPath`), never /auth, legal or gate pages; with none recorded it stays `/`. Test seam `__resetGuestReturnPath`.
- `src/pages/auth/AuthCallback.tsx`: an anonymous session goes straight to `/`, not through `/welcome`.
- Loop audit, one exit each: Welcome → `/` for a guest (a surface, so no further redirect); guard → last surface or `/`; RootGate sends a session-less visitor to /auth, which shows the form (no user, no redirect); the hold exempts /auth, and its 8s timeout fails into today's signed-out behaviour.

### Tests (+5 in new `src/test/guestStage24.test.tsx`)
- a guest on /auth sees the sign-in form and is not navigated (navigations `['/auth']`)
- a guest on /auth?guest=1&start=email reaches the email join step (`['/auth?guest=1&start=email']`)
- after a guest signs in as a member, Auth redirects once (`['/auth','/']`, resolver called once)
- a guest on a blocked route from /auth goes to the last surface, not /auth (`/settings` → `/courses`)
- with no surface browsed, a blocked route from /auth goes to `/`
- Note: AuthForm is mocked in these tests, so "email join step" means Auth hands AuthForm the join query; AuthForm's internal steps stay covered by `guestSignIn.test.tsx`.
- Suite: 4,723/4,723 across 481 files (4,718/480 + guestStage24).

### Preview proof (real anonymous session, 390×844; Files `guest-stage24/`)
- Join card "ALREADY A MEMBER? LOG IN" → /auth email form (`1_card_login`); "Continue with email" → /auth?guest=1&start=email email form (`2_card_email`).
- Island "Log in" → /auth (`3_island_login`); island "Join free" opens the card (`4a_joinfree`), then "Continue with email" → join email form (`4_island_email`).
- Each time Back returns to /courses still browsing as a guest (session `is_anonymous: true`; `3b_back`). No page errors, no replaceState error. Codes were not submitted, so a live conversion was not run.
- These four taps are now part of every guest proof.
