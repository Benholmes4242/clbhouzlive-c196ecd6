---
name: Home Club Authority
description: primary_club_id is canonical, picker-only entry (no free text, no country filter), pending-club waitlist and admin connect-on-resolve
type: feature
---

# Home club

## The field
- `user_profiles.primary_club_id` is CANONICAL (FK to `golf_clubs.id`). `home_club` text is the denormalised name, written in the SAME operation for fast header display. `home_club_id` is legacy and must never be written.
- Only writer in the client: `src/features/home-club/useSetHomeClub.ts` (plus the profile form's save path). Never add a free-text club input again — an unresolved name is the exact defect the picker exists to end.

## The picker (`src/features/home-club/`)
- `HomeClubPickerSheet` — search-only over `search_golf_clubs`, confirm step before writing, mounted once via `HomeClubPickerHost` + `homeClubPickerStore`.
- NO BROWSE OR FILTER BY COUNTRY, ever: `golf_clubs.country` is a continent-level bucket (USA / Continental Europe / Britain & Ireland), not a country. `region` + `sub_country` appear on result rows for disambiguation only.
- Doors into it: onboarding/profile editor `HomeClubCard`, the dismissible `HomeClubPrompt` on the member's own profile (session-dismissed, never shown to a member with a club or an open request), and the clubs card home-club row.

## Pending clubs (the waitlist)
- Missing clubs are requested through the existing `RequestCourseCTA` / `course_requests` flow with `homeClub` set; `course_requests.home_club_for_user_id` records who asked.
- The typed name lands in `home_club_pending_name` and shows to its owner (and admins) with a PENDING treatment. A pending club is NOT a club: no id, no joins to `golf_clubs`, never in suggestions or member counts.
- `resolve_home_club_request(request, club)` connects EVERY pending requester of the same typed name at once; `reject_home_club_request` clears the pending name so nobody is stranded.
