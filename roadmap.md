# Roadmap

- [x] Remove centred labels and secondary controls from story headers.
- [x] Preserve Discover News/Gallery tab and scroll across story/media round trips without URL or local storage.
- [x] Keep every story origin intact and make cold amateur story links fall back to Discover News.
- [x] Verify fresh Discover entry still opens Scores and round-trip restoration works.
- [x] Make the story tournament strip full-width and identical to the News index.
- [x] Verify the longest tournament at 320pt and audit article blocks for overflow.
- [x] Remove the Gallery hero and place Clips 18px below the fixed header.
- [x] Open review tiles into a review-first, course-bounded fullscreen media set.
- [x] Add poster-first Gallery autoplay with a two-video page-wide limit and accessibility/data gates.
- [ ] Verify Gallery behavior, viewer boundaries, 320px spacing, and autoplay cost.

## Scores two halves (BRIEF_SCORES_TWO_HALVES)
- [x] Course board axes in get_board_courses (p_sort) + rating/rating_count
- [x] ScoresTab: no hero, sticky filter, MEMBERS + COURSES halves, 10 member boards, 6 course boards
- [x] Course board rows + selected course drives How they played
- [ ] Signed-in runtime check (anon RPCs return empty; auth=external_unmanaged)

## Scores analytics card (BRIEF_SCORES_ANALYTICS_CARD)
- [ ] Move course title inside the card and label the filtered low-round window
- [ ] Reuse the Course page course card, chart, By par, and six-row hole preview
- [ ] Preserve no-round/sample/viewer-only gates and add the full-analytics terminal row
- [ ] Verify matching bars, 390px height, and 320px fit

## Scores section heads (BRIEF_SCORES_SECTION_HEAD)
- [x] Replace the sticky filter panel with a non-sticky applied-filter chip rail and Edit action
- [x] Make each selected board name the headline beneath a category/count eyebrow
- [x] Remove both universal column-header rows and match the two halves' construction
- [x] Verify 320px headline fit, board switching, and filter scroll-away behavior
- [x] Audit boards whose figures may need local labels without universal headers

## Scores three headlines (BRIEF_SCORES_THREE_HEADLINES)
- [x] Replace Members/Courses eyebrows with shared headline-and-count rows
- [x] Use board-aware member/round units for both headline and terminal action
- [x] Add the matching Course Analytics heading and 26px section gaps
- [x] Verify board switching, count agreement, and 320pt headline fit
