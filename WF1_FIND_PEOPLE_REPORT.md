# WF1 — Find people page (wf1-find-people.html, signed off)

## Diff
- **New `src/pages/FindPeoplePage.tsx`** — /find-people. Edit-profile-style header (back, centred "Find people" 17px/700), 44px search field 14px below (radius 14, #1E1E23, 1px rgba(255,255,255,0.08), white caret, placeholder "Search golfers and businesses"), chips 12px below (32px, chosen ink): Suggested / Golfers / Businesses, `?tab=` keeps the choice. Rows: padding 11/16, hairline rgba(255,255,255,0.06); SquircleAvatar 44 (businesses: logo on a white tile, or white tile with canvas-colour initials); name 15px/600 + VerifiedBadge when is_verified; reason 13px mute; figures 12px dim tabular. Follow pill 32px, padding 0/14, 1px rgba(255,255,255,0.22), 13.5px/600; Following = mute with a 0.1-alpha border, tappable to unfollow. Rows stay in place after following until the next load. Invite footer pinned bottom: hairline, canvas ground, padding 12/16/calc(16px + safe area), "Invite friends who aren't on clbhouz" 13.5px mute centred, ink 44px full-width pill → `openInviteSheet('find_people')`.
- **New `src/features/find-people/findPeopleRules.ts`** — pure: grouping per tab (Suggested: From {club} with the your_club business first + Follow all, Played with you, Plays your courses, Popular on clbhouz with ≤3 popular businesses; Golfers: From {club}, Played with you, Follows you, Plays your courses, Followed by people you know, Popular, Playing lately, New to clbhouz; Businesses: Your club, Near {club}, Coaches and academies, Popular — club groups hidden with no home club), every reason line, figures (`{hcp} hcp · {rounds} rounds` via formatHcp, dropping null handicap / 0 rounds), miles (1 decimal under 10, whole above), d MMM dates, club-name derivation, business initials.
- **New `src/features/find-people/usePeopleSuggestions.ts`** — reads `get_people_suggestions` / `get_suggested_businesses` (WF1_PEOPLE_V1). NOT `get_suggested_golfers` (see note below).
- **`src/App.tsx`** — /find-people route; /golferstofollow → `GolfersToFollowRedirect` (replace, keeps the query string). **`src/pages/GolfersToFollowV2.tsx` deleted** — nothing else imported it.
- **`src/features/chrome-v2/registry.ts`** — /find-people added (chrome none, dark); /golferstofollow entry kept for the redirect.
- **Entry points** — FriendsEmptyState, ClubsCard, SuggestedGolfersBlock now navigate to /find-people.
- **Locales** — `findPeople.*` added to en, en-XA, de, es, ja, ko common.json.
- **Account glance menu** — left alone: its rows are Your courses / Invite friends / Manage businesses / Settings; there is no people/friends row to replace.

## Search hook reused
`useGlobalSearchV2` (scopes `people` and `clubs`) — the app's existing global search. Typing swaps the groups for results in the same row design; golfers navigate via `navPerson`, businesses via `navClub`.

## Follow mutations
Canonical `useToggleFollow` for both personal and business actors (optimistic, guest-gated). Follow all runs the group's rows in turn, then reads "Following all".

## Tests
- New `src/test/wf1FindPeople.test.tsx` — 23 tests: redirect keeps query; each tab's grouping/order; empty groups hidden; tab empty state; every golfer and business reason line; figures with/without handicap; verified badges; follow/Following/unfollow for golfer and business; Follow all follows every row in turn; search swaps groups for results; invite footer opens the sheet. No existing test changed (none referenced the old page or route).
- Full suite, sharded 4 ways: **5,613/5,613 passed across 527 files** (baseline 5,590/526 → +23/+1, exactly the new file). Shard 4 reported 1 pre-existing unhandled jsdom "Could not parse CSS stylesheet" noise in cb110CourseReviewsLanding/reviewCourseNoReopen (tests green; predates WF1).
- `npx tsc --noEmit` clean. (One mid-build TS2741 — missing `targetUserId` on the Follow-all business call — was fixed and re-verified; shard 4 ran before that type-only fix, and the WF1 file re-passed after it.)

## Note (as briefed)
The Activity "Golfers to follow" block still uses `get_suggested_golfers`, which returns handicaps without a visibility check. `get_people_suggestions` nulls handicap_index unless the viewer may see it; the two surfaces keep separate reads.

No SQL, no migrations, no migration files, no RPC/edge-function edits, feed_config untouched, round_pool_cap stays 30, no native/Median changes.
