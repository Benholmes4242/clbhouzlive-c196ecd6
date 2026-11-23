# Standout rounds — no course initials behind the name when there is no photo

## Change
`StandoutPhotoHeader` (`src/components/courses/browse/StandoutRoundsSection.tsx:32`) now passes `flatWhenEmpty` to `CourseImageFallback`. A photo-less course gets the flat MEMBER_CELL tone under the scrim, no initials, no gradient. Stamp, scrim, course name, place line and size unchanged.

The same one-prop change (`flatWhenEmpty`, nothing else) was applied to every other usage with text drawn over the fallback.

## CourseImageFallback usages with overlaid text

| File:line | Overlaid text | Before | After |
|---|---|---|---|
| courses/browse/StandoutRoundsSection.tsx:32 | stamp, course name, place | initials | flat |
| courses/browse/RegionRails.tsx:47 | count, course name, region, best golfer | initials | flat |
| courses/browse/HardestSection.tsx:59 | to-par figure, label, course name | initials | flat |
| courses/browse/ByRegionSection.tsx:150 | Your patch chip, region name, facts | initials | flat |
| courses/CourseCardBackground.tsx:21 | CourseCard paints course name over it | initials | flat |
| explore-tab-new/courseled/StandoutTile.tsx:238 | score chip, date, name | initials | flat |
| explore-tab-new/courseled/ReviewTile.tsx:244 | review overlay text | initials | flat |
| explore-tab-new/courseled/MomentTile.tsx:178 | course name (:307) and overlay | initials | flat |
| explore-tab-new/courseled/HowTheyPlayedSection.tsx:244 | name block over scrim | initials | flat |
| explore-tab-new/courseled/FriendsPlayedRail.tsx:236 | source chip and overlay | initials | flat |
| explore-tab-new/courseled/CreatorCard.tsx:78 | creator name/overlay | initials | flat |
| explore-tab-new/courseled/CoursesPlayedSection.tsx:299 | name block over scrim | initials | flat |
| profile/hero/ProfileTopTenRail.tsx:270 | big position figure, name, rank line | initials | flat |
| profile/hero/ProfileTopTenRail.tsx:289 | position chip | initials | flat |
| features/amateur/AmateurHero.tsx:284 | hero text | flat already | unchanged |
| profile/clubs/ClubsCard.tsx:273 | club overlay | flat already | unchanged |
| features/explore-magazine/ExploreCard.tsx:1491 | on-photo text | flat when `onPhoto` already | unchanged |

Left as monogram (text sits beside, not over, the thumbnail; or scrim only): CoursesPlayedSection.tsx:371 (scrim only, text in strip below) and :636, CourseBoardRows.tsx:160, WhoPlayingSection.tsx:228, ProfileTopTenRail.tsx:312/:365, YourHundredSection.tsx:152, TheArgumentSection.tsx:57, Top100CompareChart.tsx:15, Top100OneRatingAway.tsx:9, ClubsCard.tsx:424, AddCourseModal.tsx:130/:434. The `whs/CourseImageFallback` used by BusinessNearbyCourses, BusinessFollowersCard and RateNudge is a different component with no initials; untouched.

## Test
New `src/test/standoutFallbackInitials.test.tsx` (1 case): with `course_image: null` and the Farleigh name, no leaf element's text equals `initialsForCourse(name)`, no `<img>`, and `[data-standout-course]` equals the full name. Confirmed failing against the old line, passing with the fix. No existing test changed.

## Captures
`captures/before_390.png`, `before_320.png`, `after_390.png`, `after_320.png` — fixture page (removed) rendering the real RoundCard + StandoutPhotoHeader, one photo-less Farleigh row plus one photo row. Before: leaf "FB" behind the name. After: no initials; no page overflow at either width. (The logo island in the captures is app chrome over the fixture, not part of the card.)

## Shards (all four, since 13 production files changed)
| Shard | Files | Tests | rc |
|---|---|---|---|
| 1 | 223 | 2,462 | 0 |
| 2 | 223 | 2,483 | 0 |
| 3 | 223 | 2,504 | 0 |
| 4 | 222 | 2,747 | 0 |
| Total | 891 | 10,196 | |

Before: 10,195 / 890. Delta +1 test, +1 file = the new test.
