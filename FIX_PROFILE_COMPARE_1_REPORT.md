# FIX_PROFILE_COMPARE_1 report

## §1 Compare in place
- Index tap on another member's profile (signed-in, non-guest viewer) calls `compareBus.emit({ targetUserId: profileUserId, from: 'profile' })`; no navigation. `'profile'` added to `CompareSource`.
- One `CompareMount` mounts for that viewer on another member's profile. The own-profile block mounts its CompareMount only when that one is absent, so two never mount at once.
- CompareMount now mounts its sheet on first open and keeps it mounted afterwards, so another member's profile reads no compare data until compare is asked for. Opening and closing push no history (close only strips `?compare=` with replace, as before).
- Self unchanged: own index still goes to `/handicap` (the own handicap tab). Guests keep the existing resolver path. The ROUNDS cell keeps its existing route (out of scope; it is owner-only).

## §2 The loop
The removed effect sent any non-self `activeSection === 'handicap'` to `compareRouteFor(id)`, which is `/profile?tab=handicap&compare=<id>`. `/profile` and `/profile/:username` render the same page component at the same router position, so React reuses one page instance across both URLs, and its state (activeSection, the redirect effect's inputs) carries over. While the new profile's id was still resolving, `profile.id` (previous member) and `profileUserId` could disagree. That let the effect fire against a profile that was not the one now shown, re-issuing the handicap URL each time the tab state came back round. I worked this out by reading the code; I did not reproduce the loop in the browser. Now: on another member's profile, `?tab=handicap` / `?tab=stats` is stripped with `setSearchParams(..., { replace: true })`. The tab resets to the profile's default and compare opens in place (guarded on `profile.id === profileUserId`). Separately, activeSection resets to the URL's tab (default when none) whenever the viewed `profileUserId`/username changes; an open form-tile round closes too. Stored `/handicap?compare=…` links are untouched.

## §3 Form tiles
- `HeroHandicapDisplay` tiles call a new `onOpenRound(scoreId)` prop instead of `navigate('/round/:id')`; `profile_form_tile_tap` analytics kept. `navigate` prop left optional for existing callers.
- `ProfileHero` passes `onOpenRound` through. `ProfilePageV2` uses `useScorecardOpener().openByScore(scoreId, null, profileUserId)`; tapping the same tile while open closes it.
- One `RoundDetailSheet` on the page now serves form tiles (own and other profiles) and the own-profile deep link. It mounts only while a round is open. Its close (button / drag) clears both; nothing navigates.
- Why `/round/:id` landed on Activity (unchanged): `RoundPage` treats any arrival without `backgroundLocation` as a cold push. It renders a `<Navigate replace>` that synthesises `/notificationmessages` (Activity) as the background, and closing a synthesised sheet goes to `/notificationmessages`. The tile's plain `navigate()` carried no `backgroundLocation`, so it took that path.

## §4 Tests
New file `src/test/fixProfileCompare1.test.tsx` (6 tests):
1. index on another member's profile emits compare in place, mounts one CompareMount and never navigates
2. ?tab=handicap on another member's profile strips the param with replace and opens compare in place
3. switching from one profile to another resets the tab to the default
4. form tile opens RoundDetailSheet with that score and the profile's user id, a second tap closes it, nothing navigates
5. own profile: index still goes to the own handicap surface
6. HeroHandicapDisplay form tile calls onOpenRound with the score id and never navigates

No existing test asserted the old navigation; no existing test was rewritten, renamed or deleted.

## §5 Files touched
- src/pages/ProfilePageV2.tsx
- src/components/profile/hero/HeroHandicapDisplay.tsx
- src/components/profile/hero/ProfileHero.tsx
- src/components/profile/handicap/whs/sections/compare/events.ts
- src/components/profile/handicap/whs/sections/compare/CompareMount.tsx
- src/test/fixProfileCompare1.test.tsx (new)
- FIX_PROFILE_COMPARE_1_REPORT.md (new)

Counts (`--maxWorkers=2 --shard=n/4`): 1,759 / 1,626 / 1,726 / 1,693 = 6,804 passed, 0 failed, 0 unhandled errors, 599 files. Before: 6,798 / 598 (FW1 close-out). Delta +6 tests / +1 file = fixProfileCompare1.test.tsx. No pre-existing failures. Build OK 2026-11-05T08:06:07Z. Logs: docs/verification/fix-profile-compare-1/.

Not verified in the browser: member sign-in is unavailable here (`external_unmanaged`), and compare and form tiles need a signed-in viewer.
