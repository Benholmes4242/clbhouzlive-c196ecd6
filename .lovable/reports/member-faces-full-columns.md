# FIX_MEMBER_FACES_FULL_COLUMNS

fillMissingFaces(rows, ids, extraColumns?) selects the four face columns plus each extra on PUBLIC_PROFILE_COLUMNS (allowlist from generated public_profiles Row). readMemberFaces unchanged.

| File | Now filled | Still absent (reason) |
|---|---|---|
| useCommunityLibrary | is_verified | — |
| useMomentsOfTheWeek | is_verified | — |
| useCommunityVideos | — (reads no extras) | — |
| postWith | first_name | — |
| golfPostReads | first_name, home_club | — |
| useCircleLatestRounds | primary_club_id | handicap_visibility, eg_visible (not on projection) |
| useInboxStarters, usePlayedWith | is_verified_golfer | — |
| lib/whs/api rivals | header_photo_url | mobile_crop_* (not on projection) |
| lib/whs/api friends | — (photo only) | — |
| useBusinessAccessRequests | — | primary_club_id held back: home_club_visibility is not on the projection, so the club could show against a member's visibility setting |
| usePostLikes | — (reads no extras; PRO comes from useProMembers by id) | — |
| others | face columns only | — |

useBusinessTeam members: embed kept; null embeds filled via readMemberFaces.
useCommentsContext: post-author read now readMemberFaces; failed read stays null.

Tests: new memberFacesFullColumns.test.tsx (+4). No test changed or deleted.
Suite 9,028 (2,238/2,235/2,233/2,322), was 9,024; +4 reconciles.
Device checks: unchecked (no sign-in).
