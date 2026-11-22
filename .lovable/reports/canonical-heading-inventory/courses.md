# Courses typography inventory

## REFERENCE SHEET — Courses browse tab (actual source)

The requested comparison canon is **11 / 700 / 0.16em / 1 uppercase ink** for eyebrows and **21 / 700 / −0.035em / 1.05 ink** for section/sheet titles. Tile comparison baseline supplied in the task: **15/700 title, 11.5 sub/meta, 13 body**. Actual browse source is not internally uniform; exceptions below are intentional observations, not silently treated as matches.

`A.INK = #F8FAFC`; `A.MUTE = rgba(248,250,252,.62)`; `A.BODY = rgba(248,250,252,.72)`; `A.DIM = rgba(248,250,252,.42)`; `A.AMBER = #F7931E`. “Inherited” means no local value: it is not a claim that line-height is 1. Normal tracking is 0 unless inherited from a parent. Weights in table are source values, including prohibited 800s. Reference-only text roles are free text here; the scoped inventory below uses the required eight-role vocabulary.

| Text role / variant | file:line | Size | Weight | Tracking | Line-height | Colour |
|---|---|---:|---:|---|---|---|
| Section eyebrow | src/components/courses/browse/SectionHead.tsx:33 | 11 | 700 | 0.16em, uppercase | 1 | white/ink #F8FAFC |
| Section title | src/components/courses/browse/SectionHead.tsx:36 | 21 | 700 | −0.035em | 1.05 | white/ink #F8FAFC |
| Region rail photo tile title (actual, not 15/700) | src/components/courses/browse/RegionRails.tsx:36 | 14 | **800** | 0 / inherited | 1.15 | white #fff via photo caption |
| Region rail region/county subline | src/components/courses/browse/RegionRails.tsx:37 | 10.5 | 400 / inherited | 0 | inherited | muted white .75 |
| “Best round 74” meta | src/components/courses/browse/RegionRails.tsx:66 | 10.5 | 400; gross **800** | 0 | inherited | muted white .85; gross white |
| “6 photos” / activity meta | src/components/courses/browse/RegionRails.tsx:88 | 10.5 | 400 / inherited | 0 | inherited | muted white .85 |
| Best-round golfer name | src/components/courses/browse/RegionRails.tsx:62 | 11 | 600 | 0 | 16px | white |
| “See all ›” | src/components/courses/browse/RegionRails.tsx:111 | 12 | 600 | 0 | 25px | muted A.MUTE |
| Count badge figure | src/components/courses/browse/RegionRails.tsx:56 | 10 | **800**, tabular | 0 | 12px | white |
| Selected played-tile course name (not on photo) | src/components/courses/browse/PlayedTile.tsx:106 | 18 | **800** | 0 | 22px | white/ink |
| Played-tile photo caption | src/components/courses/browse/PlayedTile.tsx:187 | 11.5 | 700 | 0 | inherited | white/ink |
| “N golfers played here lately” / faces line | src/components/courses/browse/PlayedTile.tsx:195 | 12 | 400; names 600 | 0 | inherited | muted .62; bold names ink |
| Review quote body in selected tile | src/components/courses/browse/PlayedTile.tsx:155 | 10.5 | 400 | 0 | 1.35 | muted ink .78 |
| Photo credit | src/components/courses/browse/PlayedTile.tsx:59 | 10 | 400 | 0 | 14px | muted white .85 |
| Rounds lately / latest review group label | src/components/courses/browse/PlayedTile.tsx:113 | 8.5 | **800** | .14em, uppercase | 10px | ink |
| Gross figure / golfer label pair | src/components/courses/browse/PlayedTile.tsx:123 | 18 figure; 11.5 name | 700 / 600 | 0 | 20px / 14px | ink |
| Pair supplementary date | src/components/courses/browse/PlayedTile.tsx:130 | 9.5 | 400 | 0 | 12px | muted A.DIM |
| Standout photo title | src/components/courses/browse/standout-rounds.css:6 | 17 | 700 | −.02em | 1.15 | ink |
| Standout region | src/components/courses/browse/standout-rounds.css:10 | 11.5 | 400 / inherited | 0 | inherited | muted ink .62 |
| Standout stamp | src/components/courses/browse/standout-rounds.css:11 | 8.5 | 700 | .14em uppercase | inherited (18px box, not line-height) | ink |
| Latest course photo title | src/components/courses/browse/LatestCoursesSection.tsx:159 | 17 | 700 | −.03em | 1.08 | white |
| Latest course photo figure / uppercase label | src/components/courses/browse/LatestCoursesSection.tsx:150 | 30 / 8 | 700 / 700 | −.05em / .16em | 1 / inherited | white / muted white .82 |
| Latest course credit | src/components/courses/browse/LatestCoursesSection.tsx:164 | 11 | 500 | 0 | inherited | muted white .78 |
| Ring course / variant labels | src/components/courses/browse/WhoPlayingSection.tsx:231 | 10.5 / 9.5 | 600 / 600 | 0 | 13px / 12px | ink or muted / muted .42 |
| List scope uppercase label | src/components/courses/browse/ListScopeHeader.tsx:21 | 10 | **800** | .18em | inherited | muted A.DIM |
| List figure | src/components/courses/browse/ListScopeHeader.tsx:42 | 22 | 700 | inherited | 1 | local figure ink |
| Ancillary browse description (not a universal 13px body token) | src/components/courses/courseBrowseTypography.ts:14 | 14 | 400 | inherited | 1.45 | muted INK_MUTE |

`PhotoFigureCard.tsx` now only exports geometry; do not treat its name as proof of a rendered photo title. `CoursesBrowsePage` lives in `src/components/courses/CoursesBrowsePage.tsx`, not `src/pages/CoursesBrowsePage.tsx`; course route containers delegate to it.

## Scoped inventory

One row is one source heading/label occurrence or a clearly named shared variant, not a runtime count. Conditional render branches are recorded separately. Sheet subtitle under a title is not reclassified as an eyebrow. A kicker with no title beneath it is ROW/GROUP LABEL, even when a prop/comment calls it an eyebrow. Card course names are tile titles, not section headings; see list (i). Shared primitive implementations are not expanded into a second set of per-consumer rows.

### Course analytics / scorecard

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Course analytics / scorecard | CardScorecardSheet | src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1052 | h3 · {tH('roundResults.scope.fieldHeading')} | 16 | 400 | 0 | inherited | white/ink | SHEET TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course analytics / scorecard | scorecardParts | src/features/courses/_shared/scorecard/scorecardParts.tsx:532 | h2 · {courseTap ? ( <button type="button" data-scorecard-course-name="true" onClick={(e) => { e.stopPropagation(); courseTap(); }} style={{ | 22 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 22 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Course analytics / scorecard | CourseAnalyticsPanels | src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:863 | h2 · {t('courses:courseDetail.holes.sheetTitle')} | 17 | 700 | 0 | inherited | white/ink | SHEET TITLE | title 17 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course analytics / scorecard | CourseCardPanel | src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1405 | h2 · {courseName && courseName.trim() ? shortCourseName(courseName) : t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })} | 22 | 700 | -0.025em | 1.1 | white/ink | SHEET TITLE | title 22 vs 21; tracking -0.025em vs -0.035em; line-height 1.1 vs 1.05 |

### Course media

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Course media | AdminHoleTagging | src/components/course-media-tab/AdminHoleTagging.tsx:97 | h2 · {capitalPhotoCount(rows.length)} untagged {rows.length === 1 ? 'shot' : 'shots'} here | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Course media | CourseMediaCanonGrid | src/components/course-media-tab/CourseMediaCanonGrid.tsx:215 | h3 · {t('courses:media.emptyFlatTitle')} | 16 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |
| Course media | CourseMediaEmptyStates | src/components/course-media-tab/CourseMediaEmptyStates.tsx:25 | h2 · {capitalPhotoCount(photoCount)} {photoCount === 1 ? 'photograph' : 'photographs'} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Course media | CourseMediaEmptyStates | src/components/course-media-tab/CourseMediaEmptyStates.tsx:43 | h2 · {capitalPhotoCount(own.length)} of yours {own.length === 1 ? 'is' : 'are'} not live | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Course media | CourseMediaEmptyStates | src/components/course-media-tab/CourseMediaEmptyStates.tsx:66 | DialogTitle · {move ? 'Move from the' : 'Retag the'} {row.hole_no}{ordinalSuffix(row.hole_no)} | 16 | 400 | 0 | inherited | white/ink | SHEET TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | CourseMediaEmptyStates | src/components/course-media-tab/CourseMediaEmptyStates.tsx:82 | DialogTitle · Remove from the {row.hole_no}{ordinalSuffix(row.hole_no)}? | 16 | 400 | 0 | inherited | white/ink | SHEET TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | CourseMediaEmptyStates | src/components/course-media-tab/CourseMediaEmptyStates.tsx:109 | h3 · {t('media.empty.title', { defaultValue: 'Be the first to show it' })} | 15 | 600 | 0 | inherited | white/ink | SECTION TITLE | title 15 vs 21; weight 600 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | CourseMediaTabNew | src/components/course-media-tab/CourseMediaTabNew.tsx:238 | h2 · {t('media.empty.headTitle', { defaultValue: "How it really looks, from the golfers who've played it" })} | 16 | 400 | 0 | inherited | white/ink | SECTION TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | CourseMediaTabNew | src/components/course-media-tab/CourseMediaTabNew.tsx:245 | h3 · {t('media.v2.unsortedTitle', { defaultValue: "Sort them by hole or by place" })} | 16 | 400 | 0 | inherited | white/ink | SECTION TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | CourseMediaTabNew | src/components/course-media-tab/CourseMediaTabNew.tsx:248 | h3 · {t(hasTags ? 'media.v2.everything' : 'media.v2.allShots', { defaultValue: hasTags ? 'Everything' : 'All shots' })} | 17 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 17 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | CoursePlaceTiles | src/components/course-media-tab/CoursePlaceTiles.tsx:31 | h3 · {t('media.v2.around', { defaultValue: "Around the club" })} | 17 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 17 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | HolePhotoFastPaths | src/components/course-media-tab/HolePhotoFastPaths.tsx:39 | DialogTitle · Add a photo or video of the {holeOrdinal(hole)} | 16 | 700 | 0 | 1.2 | white/ink | SHEET TITLE | title 16 vs 21; tracking 0 vs -0.035em; line-height 1.2 vs 1.05 |
| Course media | HoleWalk | src/components/course-media-tab/HoleWalk.tsx:35 | h3 · {t('media.v2.holeByHole', { defaultValue: 'Hole by hole' })} | 17 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 17 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Course media | ShotTagCard | src/components/course-media-tab/ShotTagCard.tsx:56 | h2 · {t('media.v3.title', { defaultValue: "What's in this shot?" })} | 19 | 700 | 0 | 1.2 | white/ink | SHEET TITLE | title 19 vs 21; tracking 0 vs -0.035em; line-height 1.2 vs 1.05 |
| Course media | ShotTagChoices | src/components/course-media-tab/ShotTagChoices.tsx:16 | h3 · {t('media.v3.holes', { defaultValue: 'A hole on the course' })} | 9.5 | 700 | .14em | inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Course media | ShotTagChoices | src/components/course-media-tab/ShotTagChoices.tsx:21 | h3 · {t('media.v3.around', { defaultValue: 'Around the club' })} | 9.5 | 700 | .14em | inherited | muted (42% ink) | ROW/GROUP LABEL | — |

### Courses ancillary / routes

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Courses ancillary / routes | ReviewFeaturedSlot | src/components/courses/ReviewFeaturedSlot.tsx:43 | DiscoverSectionHeading · {t('statBrowse.reviews.heading')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Courses ancillary / routes | CourseDirectorySheet | src/components/courses/CourseDirectorySheet.tsx:161 | h2 · {t('statBrowse.directory.title')} | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Courses ancillary / routes | CourseSearchSheet | src/components/courses/CourseSearchSheet.tsx:212 | h3 · {t('searchSheet.title')} | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Courses ancillary / routes | CoursesContent | src/components/courses/CoursesContent.tsx:369 | h1 · {`${username}'s Courses`} | 24 | 600 | -0.025em | 32px | white/ink | SECTION TITLE | title 24 vs 21; weight 600 vs 700; tracking -0.025em vs -0.035em; line-height 32px vs 1.05 |
| Courses ancillary / routes | CoursesErrorBoundary | src/components/courses/CoursesErrorBoundary.tsx:60 | h2 · {i18n.t('common:errors.coursesLoadTitle')} | 18 | 600 | 0 | 28px | white/ink | SECTION TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -0.035em; line-height 28px vs 1.05 |
| Courses ancillary / routes | FriendsCoursesSignedOutEmpty | src/components/courses/FriendsCoursesSignedOutEmpty.tsx:16 | h2 · {t('friends.signInTitle')} | 14 | 600 | 0 | 20px | white/ink | SECTION TITLE | title 14 vs 21; weight 600 vs 700; tracking 0 vs -0.035em; line-height 20px vs 1.05 |
| Courses ancillary / routes | RequestCourseSheet | src/components/courses/RequestCourseSheet.tsx:119 | h2 · {t('request.sheet.successTitle')} | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Courses ancillary / routes | RequestCourseSheet | src/components/courses/RequestCourseSheet.tsx:135 | h2 · {t('request.sheet.title')} | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Courses ancillary / routes | RatingFilterChips | src/components/courses/review/RatingFilterChips.tsx:83 | h2 · {t('review.filter.title')} | 16 | 700 | 0 | inherited | white/ink | SHEET TITLE | title 16 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Courses ancillary / routes | UserCoursesEmptyStates | src/components/courses/user/UserCoursesEmptyStates.tsx:17 | h1 · {t('userCourses.signInTitle')} | 30 | 700 | 0 | 36px | white/ink | SECTION TITLE | title 30 vs 21; tracking 0 vs -0.035em; line-height 36px vs 1.05 |
| Courses ancillary / routes | UserCoursesEmptyStates | src/components/courses/user/UserCoursesEmptyStates.tsx:40 | h1 · {t('userCourses.loading')} | 30 | 700 | 0 | 36px | white/ink | SECTION TITLE | title 30 vs 21; tracking 0 vs -0.035em; line-height 36px vs 1.05 |
| Courses ancillary / routes | UserCoursesEmptyStates | src/components/courses/user/UserCoursesEmptyStates.tsx:54 | h1 · {t('userCourses.notFound')} | 30 | 700 | 0 | 36px | white/ink | SECTION TITLE | title 30 vs 21; tracking 0 vs -0.035em; line-height 36px vs 1.05 |
| Courses ancillary / routes | CourseDetailPage | src/pages/CourseDetailPage.tsx:54 | h1 · Course not found | 24 | 700 | 0 | 32px | white/ink | SECTION TITLE | title 24 vs 21; tracking 0 vs -0.035em; line-height 32px vs 1.05 |

### Detail · Course

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Detail · Course | AboutSection | src/components/courses/course-detail/about/AboutSection.tsx:152 | DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | AboutThisPlace | src/components/courses/course-detail/about/AboutThisPlace.tsx:53 | AboutSection · {t('courseDetail.place.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | AboutThisPlace | src/components/courses/course-detail/about/AboutThisPlace.tsx:53 | AboutSection · {t('courseDetail.place.title')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | AllHolesSheet | src/components/courses/course-detail/about/AllHolesSheet.tsx:365 | AboutSection → DiscoverSectionHeading · {t('courseDetail.allHolesSheet.holes')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | AllHolesSheet | src/components/courses/course-detail/about/AllHolesSheet.tsx:375 | AboutSection → DiscoverSectionHeading · {t('courseDetail.allHolesSheet.pars')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | AllHolesSheet | src/components/courses/course-detail/about/AllHolesSheet.tsx:380 | AboutSection → DiscoverSectionHeading · {t('courseDetail.allHolesSheet.ladder')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | CourseFactsAndTees | src/components/courses/course-detail/about/CourseFactsAndTees.tsx:122 | AboutSection · {t('courseDetail.tees.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | CourseFactsAndTees | src/components/courses/course-detail/about/CourseFactsAndTees.tsx:122 | AboutSection · {t('courseDetail.tees.title')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | CourseHonoursSection | src/components/courses/course-detail/about/CourseHonoursSection.tsx:36 | AboutSection · {t('courseDetail.honours.kicker', 'HONOURS')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | CourseHonoursSection | src/components/courses/course-detail/about/CourseHonoursSection.tsx:36 | AboutSection · {t('courseDetail.honours.title', 'The honours board')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | CourseLatelySection | src/components/courses/course-detail/about/CourseLatelySection.tsx:89 | AboutSection · {t('courseDetail.lately.kicker', 'LATELY')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | CourseLatelySection | src/components/courses/course-detail/about/CourseLatelySection.tsx:89 | AboutSection · {t('courseDetail.lately.title', "Who's been out here")} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | DefendsPar | src/components/courses/course-detail/about/DefendsPar.tsx:126 | AboutSection · {t('courseDetail.defends.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | DefendsPar | src/components/courses/course-detail/about/DefendsPar.tsx:126 | AboutSection · {t('courseDetail.defends.title')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | HowItPlays | src/components/courses/course-detail/about/HowItPlays.tsx:335 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | HowItPlays | src/components/courses/course-detail/about/HowItPlays.tsx:362 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | HowItPlays | src/components/courses/course-detail/about/HowItPlays.tsx:384 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | Photos | src/components/courses/course-detail/about/Photos.tsx:49 | AboutSection → DiscoverSectionHeading · {t('courseDetail.sections.photos')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | RecordBook | src/components/courses/course-detail/about/RecordBook.tsx:166 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | RecordBook | src/components/courses/course-detail/about/RecordBook.tsx:186 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | RecordBook | src/components/courses/course-detail/about/RecordBook.tsx:261 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | TheVerdict | src/components/courses/course-detail/about/TheVerdict.tsx:56 | AboutSection · {t('courseDetail.verdict.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | TheVerdict | src/components/courses/course-detail/about/TheVerdict.tsx:56 | AboutSection · {title} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | WhatPeopleSay | src/components/courses/course-detail/about/WhatPeopleSay.tsx:132 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | WhatPeopleSay | src/components/courses/course-detail/about/WhatPeopleSay.tsx:146 | AboutSection · {t('courseDetail.reviewsHead.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | WhatPeopleSay | src/components/courses/course-detail/about/WhatPeopleSay.tsx:146 | AboutSection · {t('courseDetail.reviewsHead.youFirst')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | WhatPeopleSay | src/components/courses/course-detail/about/WhatPeopleSay.tsx:175 | AboutSection · {t('courseDetail.reviewsHead.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | WhatPeopleSay | src/components/courses/course-detail/about/WhatPeopleSay.tsx:175 | AboutSection · {title} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | WhereItIs | src/components/courses/course-detail/about/WhereItIs.tsx:51 | AboutSection → DiscoverSectionHeading · {t('courseDetail.sections.whereItIs')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | WhoPlaysHere | src/components/courses/course-detail/about/WhoPlaysHere.tsx:74 | AboutSection → DiscoverSectionHeading · {t('courseDetail.sections.whoPlaysHere')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Course | ClaimCourseSheet | src/components/courses/course-detail/ClaimCourseSheet.tsx:699 | h2 · {t('courseDetail.claim.sheet.title', { clubName })} | 21 | 700 | 0 | 1.25 | white/ink | SHEET TITLE | tracking 0 vs -0.035em; line-height 1.25 vs 1.05 |
| Detail · Course | NearbySection | src/components/courses/course-detail/NearbySection.tsx:29 | h2 · {t('courseDetail.nearby.title')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | AllHolesSheet | src/components/courses/course-detail/about/AllHolesSheet.tsx:342 | h2 · {t('courseDetail.allHolesSheet.title')} | 20 | 700 | -0.03em | 1.15 | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.03em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Course | ClaimCourseSheet | src/components/courses/course-detail/ClaimCourseSheet.tsx:296 | Claim sheet kicker | 9.5 | 700 | 0.14em | inherited | muted (42% ink) | SHEET EYEBROW | eyebrow 9.5 vs 11; tracking 0.14em vs 0.16em; line-height inherited vs 1; eyebrow muted (42% ink) vs white/ink |
| Detail · Course | NearbySection | src/components/courses/course-detail/NearbySection.tsx:28 | Nearby kicker | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Course | TheVerdict | src/components/courses/course-detail/about/TheVerdict.tsx:62 | Over par (under 62px / 800 figure) | 13.5 | 700 | 0 | inherited | muted (72% ink) | FIGURE LABEL | — |
| Detail · Course | AllHolesSheet | src/components/courses/course-detail/about/AllHolesSheet.tsx:53 | Course name above sheet title | 9 | 700 | 0.19em | inherited | muted (42% ink) | SHEET EYEBROW | eyebrow 9 vs 11; tracking 0.19em vs 0.16em; line-height inherited vs 1; eyebrow muted (42% ink) vs white/ink |

### Detail · Reviews

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Detail · Reviews | CourseReviewsTab | src/components/courses/course-detail/CourseReviewsTab.tsx:551 | AboutSection → DiscoverSectionHeading · Your review | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Reviews | CourseReviewsTab | src/components/courses/course-detail/CourseReviewsTab.tsx:567 | AboutSection → DiscoverSectionHeading · Your review | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Reviews | CourseReviewsTab | src/components/courses/course-detail/CourseReviewsTab.tsx:580 | AboutSection → DiscoverSectionHeading · {myReview ? 'Everyone else' : 'Reviews'} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · Reviews | WhatTheyScored | src/components/courses/course-detail/reviews/WhatTheyScored.tsx:19 | AboutSection · What they scored | 11 | 700 | 0.16em | 1 | amber (#F7931E) | ROW/GROUP LABEL | — |
| Detail · Reviews | FewReviews | src/components/courses/course-detail/reviews/FewReviews.tsx:66 | h2 · {courseName} sits at {community.score?.toFixed(1)} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Reviews | FewReviews | src/components/courses/course-detail/reviews/FewReviews.tsx:85 | h2 · The score builds from here | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Reviews | FewReviews | src/components/courses/course-detail/reviews/FewReviews.tsx:92 | h2 · Where the score comes from | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Reviews | NobodyHasRated | src/components/courses/course-detail/reviews/NobodyHasRated.tsx:28 | h2 · You would be the first | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Reviews | SingleReview | src/components/courses/course-detail/reviews/SingleReview.tsx:63 | h2 · {courseName} is on the board | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · Reviews | FewReviews | src/components/courses/course-detail/reviews/FewReviews.tsx:91 | What they scored | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Reviews | FewReviews | src/components/courses/course-detail/reviews/FewReviews.tsx:98 | Everyone else (no title follows) | 11 | 700 | 0.16em | 1 | amber (#F7931E) | ROW/GROUP LABEL | — |
| Detail · Reviews | FewReviews | src/components/courses/course-detail/reviews/FewReviews.tsx:97 | People you know | 10 | 800 | 0 | inherited | other (medal gold) | CHIP/BADGE | — |
| Detail · Reviews | NobodyHasRated | src/components/courses/course-detail/reviews/NobodyHasRated.tsx:25 | Nobody has rated it | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · Reviews | SingleReview | src/components/courses/course-detail/reviews/SingleReview.tsx:62 | The first rating | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |

### Detail · You

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Detail · You | CourseYouTab | src/components/courses/course-detail/CourseYouTab.tsx:501 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.circle.heading')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | AgainstYourGolfSection | src/components/courses/course-detail/you/AgainstYourGolfSection.tsx:64 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.againstYourGolf.heading')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | BirdiesHere | src/components/courses/course-detail/you/BirdiesHere.tsx:55 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.birdiesHere')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | NotConnectedInvitation | src/components/courses/course-detail/you/NotConnectedInvitation.tsx:99 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.connect.fieldShotsHeading', { courseName } | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | NotConnectedInvitation | src/components/courses/course-detail/you/NotConnectedInvitation.tsx:156 | Sec · {t('courseDetail.youTab.sections.birdiesHere')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | NotConnectedInvitation | src/components/courses/course-detail/you/NotConnectedInvitation.tsx:156 | Sec · {t('courseDetail.youTab.birdiesWaiting.title')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | NotConnectedInvitation | src/components/courses/course-detail/you/NotConnectedInvitation.tsx:166 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.birdiesHere')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | NotConnectedInvitation | src/components/courses/course-detail/you/NotConnectedInvitation.tsx:209 | Sec · {t('courseDetail.youTab.fieldVerdict.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | NotConnectedInvitation | src/components/courses/course-detail/you/NotConnectedInvitation.tsx:209 | Sec · {t('courseDetail.youTab.fieldVerdict.title', { shots } | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ProjectionSection | src/components/courses/course-detail/you/ProjectionSection.tsx:118 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | ProjectionSection | src/components/courses/course-detail/you/ProjectionSection.tsx:164 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | ProjectionSection | src/components/courses/course-detail/you/ProjectionSection.tsx:213 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | UnclaimedCourseSection | src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:43 | Sec · {t('courseDetail.youTab.unclaimed.kicker')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | UnclaimedCourseSection | src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:43 | Sec · {t('courseDetail.youTab.unclaimed.title')} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | UpForGrabsSection | src/components/courses/course-detail/you/UpForGrabsSection.tsx:59 | Sec · {t('courseDetail.youTab.sections.upForGrabs')} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | UpForGrabsSection | src/components/courses/course-detail/you/UpForGrabsSection.tsx:59 | Sec · {openCount > 0 ? t('courseDetail.youTab.grabs.boardsTitle', { count: openCount, unclaimed: formatNumber(openCount) } | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | UpForGrabsSection | src/components/courses/course-detail/you/UpForGrabsSection.tsx:108 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.upForGrabs')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | WhereYouStandHere | src/components/courses/course-detail/you/WhereYouStandHere.tsx:109 | AboutSection → DiscoverSectionHeading · Where you stand here | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | WonAndLostSection | src/components/courses/course-detail/you/WonAndLostSection.tsx:44 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.wonAndLost.heading')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | YourFormHere | src/components/courses/course-detail/you/YourFormHere.tsx:129 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | YourFormHere | src/components/courses/course-detail/you/YourFormHere.tsx:171 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | YourMomentsSection | src/components/courses/course-detail/you/YourMomentsSection.tsx:51 | AboutSection → DiscoverSectionHeading · {t('courseDetail.you.moments')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | YourRatingSection | src/components/courses/course-detail/you/YourRatingSection.tsx:30 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | YourRatingSection | src/components/courses/course-detail/you/YourRatingSection.tsx:38 | AboutSection → DiscoverSectionHeading · {heading} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | YourRoundsHere | src/components/courses/course-detail/you/YourRoundsHere.tsx:58 | AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.yourRounds')} | 16 | 700 | -0.01em | 1.2 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Detail · You | FormLast20Section | src/components/courses/course-detail/you/many/FormLast20Section.tsx:38 | Sec · Your form here | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | FormLast20Section | src/components/courses/course-detail/you/many/FormLast20Section.tsx:38 | Sec · {`Last ${LAST_N} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:48 | Sec · Your verdict | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:48 | Sec · {p.season && p.bestSeason ? `${p.year} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:108 | Sec · Your years here | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:108 | Sec · {gain ? 'Where the gain actually came' : null} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:168 | Sec · {`The ${words(n)} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:168 | Sec · {g.everyMadeBeforeTurn ? `${n === 1 ? 'It was' : 'Every one of them was'} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:224 | Sec · You against the field | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:224 | Sec · {allAhead ? `You beat the field on all ${words(n)} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:306 | Sec · {kicker} | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:306 | Sec · {title} | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:353 | Sec · Within reach | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:353 | Sec · What you could take | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:395 | Sec · Your record here | 11 | 700 | 0.16em | 1 | amber (#F7931E) | SECTION EYEBROW | eyebrow amber (#F7931E) vs white/ink |
| Detail · You | ManySections | src/components/courses/course-detail/you/many/ManySections.tsx:395 | Sec · Everything else you have put in | 19 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | YourHolesSheet | src/components/courses/course-detail/you/YourHolesSheet.tsx:172 | h2 · {t('courseDetail.yourHolesSheet.title')} | 20 | 700 | -0.03em | 1.15 | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.03em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | YourRoundsSheet | src/components/courses/course-detail/you/YourRoundsSheet.tsx:113 | h2 · {t('courseDetail.yourRoundsSheet.title')} | 20 | 700 | -0.03em | 1.15 | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.03em vs -0.035em; line-height 1.15 vs 1.05 |
| Detail · You | YourRoundsSheet | src/components/courses/course-detail/you/YourRoundsSheet.tsx:55 | Course name above sheet title | 9 | 700 | 0.19em | inherited | muted (42% ink) | SHEET EYEBROW | eyebrow 9 vs 11; tracking 0.19em vs 0.16em; line-height inherited vs 1; eyebrow muted (42% ink) vs white/ink |
| Detail · You | YourHolesSheet | src/components/courses/course-detail/you/YourHolesSheet.tsx:42 | Course name above sheet title | 9 | 700 | 0.19em | inherited | muted (42% ink) | SHEET EYEBROW | eyebrow 9 vs 11; tracking 0.19em vs 0.16em; line-height inherited vs 1; eyebrow muted (42% ink) vs white/ink |

### Review v2

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Review v2 | ReviewComposerV2 | src/features/review-v2/ReviewComposerV2.tsx:1157 | h1 · {t('review.wizard.stepOne.headingStep1')} | 24 | 700 | 0 | 1.15 | white/ink | SECTION TITLE | title 24 vs 21; tracking 0 vs -0.035em; line-height 1.15 vs 1.05 |
| Review v2 | ReviewHoleTags | src/features/review-v2/components/ReviewHoleTags.tsx:110 | h2 · Put them on a hole | 11 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 11 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Review v2 | ReviewReceipt | src/features/review-v2/components/ReviewReceipt.tsx:95 | h2 · {t(key('yourScore'))} | 16 | 400 | 0 | inherited | white/ink | SECTION TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Review v2 | ReviewReceipt | src/features/review-v2/components/ReviewReceipt.tsx:99 | h2 · {t(key('didEyebrow'))} | 16 | 400 | 0 | inherited | white/ink | SECTION TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Review v2 | ReviewReceipt | src/features/review-v2/components/ReviewReceipt.tsx:104 | h2 · {t(key('nextEyebrow'))} | 16 | 400 | 0 | inherited | white/ink | SECTION TITLE | title 16 vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Review v2 | ReviewScoreHeadings | src/features/review-v2/components/ReviewScoreHeadings.tsx:13 | h1 · {t('review.wizard.step3.heading')} | 22 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 22 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Review v2 | EditLossSheet | src/features/review-v2/components/EditLossSheet.tsx:51 | Remove from your review? | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Review v2 | RemoveReviewSheetV2 | src/features/review-v2/components/RemoveReviewSheetV2.tsx:85 | Remove review? | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Review v2 | ReviewScoreHeadings | src/features/review-v2/components/ReviewScoreHeadings.tsx:23 | Review breakdown label, beside average; no title below | 10 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

### Top 100

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Top 100 | Top100RaceSection | src/components/courses/top100/Top100RaceSection.tsx:30 | SectionHead · Your hundred | 11 | 700 | 0.16em | 1 | white/ink | SECTION EYEBROW | matches |
| Top 100 | Top100RaceSection | src/components/courses/top100/Top100RaceSection.tsx:30 | SectionHead · The race | 21 | 700 | -0.035em | 1.05 | white/ink | SECTION TITLE | matches |
| Top 100 | Top100RaceSection | src/components/courses/top100/Top100RaceSection.tsx:31 | SectionHead · Your hundred | 11 | 700 | 0.16em | 1 | white/ink | SECTION EYEBROW | matches |
| Top 100 | Top100RaceSection | src/components/courses/top100/Top100RaceSection.tsx:31 | SectionHead · The race | 21 | 700 | -0.035em | 1.05 | white/ink | SECTION TITLE | matches |
| Top 100 | Top100ListProgressSheet | src/components/top100/sheets/Top100ListProgressSheet.tsx:149 | Owner name (sheet identity title) | 14.5 | 700 | 0 | inherited | white/ink | SHEET TITLE | title 14.5 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Top 100 | Top100ListProgressSheet | src/components/top100/sheets/Top100ListProgressSheet.tsx:150 | Top 100 + scope (subtitle, not eyebrow above title) | 10.5 | 700 | 0.14em | inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Top 100 | Top100RaceSection | src/components/courses/top100/Top100RaceSection.tsx:49 | ExploreSheetShell · amateur.leaderboards.top100 | 14.5 | 700 | 0 | inherited | white/ink | SHEET TITLE | title 14.5 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |

## Area count summary

Counts exclude the reference sheet. “Headings” counts the five compared roles, not chips, group labels or figure labels.

| Area | Headings recorded | Headings differing | All inventory rows |
|---|---:|---:|---:|
| Course analytics / scorecard | 4 | 4 | 4 |
| Course media | 14 | 14 | 16 |
| Courses ancillary / routes | 13 | 13 | 13 |
| Detail · Course | 36 | 36 | 37 |
| Detail · Reviews | 11 | 11 | 14 |
| Detail · You | 45 | 45 | 45 |
| Review v2 | 8 | 8 | 9 |
| Top 100 | 6 | 2 | 7 |
| **Total** | **137** | **133** | **145** |

## (i) Tile, subline, meta and body size differences from the supplied reference

Comparison here is against 15px/700 photo title, 11.5px sub/meta and 13px body, **not** the drifting actual RegionRails values.

- **CourseMediaCanonGrid**: body 14px (`src/components/course-media-tab/CourseMediaCanonGrid.tsx:196`).
- **CourseMediaEmptyStates**: body 12px (`src/components/course-media-tab/CourseMediaEmptyStates.tsx:116`).
- **CourseMediaTabNew**: body 14px (`src/components/course-media-tab/CourseMediaTabNew.tsx:218`), 14px (`src/components/course-media-tab/CourseMediaTabNew.tsx:259`).
- **CourseSearchSheet**: body 14px (`src/components/courses/CourseSearchSheet.tsx:275`).
- **CoursesContent**: body 12px (`src/components/courses/CoursesContent.tsx:110`), 14px (`src/components/courses/CoursesContent.tsx:177`), 11px (`src/components/courses/CoursesContent.tsx:180`), 14px (`src/components/courses/CoursesContent.tsx:372`).
- **CoursesErrorBoundary**: body 14px (`src/components/courses/CoursesErrorBoundary.tsx:61`).
- **FriendsCoursesSignedOutEmpty**: body 14px (`src/components/courses/FriendsCoursesSignedOutEmpty.tsx:17`).
- **RequestCourseCTA**: body 17px (`src/components/courses/RequestCourseCTA.tsx:92`).
- **ReviewFeaturedSlot**: body 15px (`src/components/courses/ReviewFeaturedSlot.tsx:68`).
- **ReviewRailSlot**: body 14px (`src/components/courses/ReviewRailSlot.tsx:288`).
- **StatBrowse**: body 14px (`src/components/courses/StatBrowse.tsx:922`).
- **AboutMediaStrip**: body 12px (`src/components/courses/course-detail/AboutMediaStrip.tsx:401`).
- **ClaimCourseSheet**: body 13.5px (`src/components/courses/course-detail/ClaimCourseSheet.tsx:528`), 13.5px (`src/components/courses/course-detail/ClaimCourseSheet.tsx:643`), 13.5px (`src/components/courses/course-detail/ClaimCourseSheet.tsx:657`), 14px (`src/components/courses/course-detail/ClaimCourseSheet.tsx:707`).
- **ClaimUnderReviewNotice**: body 12px (`src/components/courses/course-detail/ClaimUnderReviewNotice.tsx:12`).
- **CourseReviewsTab**: body 14px (`src/components/courses/course-detail/CourseReviewsTab.tsx:518`).
- **CourseYouTab**: body 15px (`src/components/courses/course-detail/CourseYouTab.tsx:407`).
- **AllHolesSheet**: body 11px (`src/components/courses/course-detail/about/AllHolesSheet.tsx:256`).
- **CourseHonoursSection**: body 13.5px (`src/components/courses/course-detail/about/CourseHonoursSection.tsx:37`).
- **CourseLatelySection**: body 13.5px (`src/components/courses/course-detail/about/CourseLatelySection.tsx:92`).
- **DefendsPar**: body 12.5px (`src/components/courses/course-detail/about/DefendsPar.tsx:127`).
- **WhatPeopleSay**: body 12.5px (`src/components/courses/course-detail/about/WhatPeopleSay.tsx:147`).
- **verdictBits**: body 12.5px (`src/components/courses/course-detail/about/verdictBits.tsx:32`).
- **NobodyHasRated**: body 12.5px (`src/components/courses/course-detail/reviews/NobodyHasRated.tsx:31`).
- **SingleReview**: body 12.5px (`src/components/courses/course-detail/reviews/SingleReview.tsx:71`).
- **AgainstYourGolfSection**: body 11px (`src/components/courses/course-detail/you/AgainstYourGolfSection.tsx:74`).
- **BirdiesHere**: body 11px (`src/components/courses/course-detail/you/BirdiesHere.tsx:86`).
- **WonAndLostSection**: body 11px (`src/components/courses/course-detail/you/WonAndLostSection.tsx:51`).
- **YourHolesSheet**: body 11px (`src/components/courses/course-detail/you/YourHolesSheet.tsx:220`), 11px (`src/components/courses/course-detail/you/YourHolesSheet.tsx:251`), 11px (`src/components/courses/course-detail/you/YourHolesSheet.tsx:280`).
- **manyBits**: body 12.5px (`src/components/courses/course-detail/you/many/manyBits.tsx:48`).
- **youBits**: body 11px (`src/components/courses/course-detail/you/youBits.tsx:49`).
- **CourseStatusToggle**: body 14px (`src/components/courses/phase5/CourseStatusToggle.tsx:52`).
- **PersonalReviewCard**: body 13.5px (`src/components/courses/phase5/PersonalReviewCard.tsx:95`).
- **ReviewResponseBlock**: body 12.5px (`src/components/courses/review/ReviewResponseBlock.tsx:167`).
- **SiLadder**: body 11.5px (`src/features/courses/_shared/SiLadder.tsx:233`), 11.5px (`src/features/courses/_shared/SiLadder.tsx:239`).
- **CardScorecardSheet**: body 14px (`src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1055`).
- **RoundResults**: body 12.5px (`src/features/courses/_shared/scorecard/RoundResults.tsx:254`).
- **scorecardParts**: body 12.5px (`src/features/courses/_shared/scorecard/scorecardParts.tsx:591`).
- **CourseAnalyticsPanels**: body 13.5px (`src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:532`).
- **CourseCardPanel**: body 13.5px (`src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1352`).
- **tokens**: body 12.5px (`src/features/courses/components/holes/analytical/tokens.tsx:414`), 13.5px (`src/features/courses/components/holes/analytical/tokens.tsx:687`).
- **ReviewComposerV2**: body 13.5px (`src/features/review-v2/ReviewComposerV2.tsx:1160`).
- **PendingReviewCard**: body 12.5px (`src/features/review-v2/components/PendingReviewCard.tsx:126`).

- **Legacy course cards**: `src/components/courses/CourseCard.tsx` photo title uses 18/20px on mobile and 20/24px at md (text-lg/text-xl/text-2xl), no explicit title weight in that h3. `CourseListItem.tsx` uses 24px/600 title and 18px location; `network/NetworkHighlightCarousel.tsx` 16px/600 title, 12px subline. `UnifiedCourseCard.tsx` title is 15/700 (matches size/weight); inspect location separately rather than assuming all card variants match.
- **About/You**: `course-detail/about/CourseHonoursSection.tsx:29` and `CourseLatelySection.tsx` ledes 13.5px; `DefendsPar.tsx` 12.5px. `you/many/manyBits.tsx:48` Lede 12.5/1.5, while Said is 13/1.5. `reviews/FewReviews.tsx:43` prose 12.5/1.55; `NobodyHasRated.tsx` and `SingleReview.tsx` 12.5/1.5. Review row prose in `reviews/reviewFlatBits.tsx:183` is 13/1.6 (size matches).
- **Media**: `src/components/course-media-tab/media-v2.css:3` empty-state body 14/1.5; add-card title 12.5/600 and subline 11.5/400 at lines 27–28; hole photo count 11.5/600 at line 20 matches reference meta size. Media section headings are not photo tile titles.
- **Top 100 list progress**: `src/components/top100/sheets/Top100ListProgressSheet.tsx:296` course row title 13/600 and line 298 location 10.5px; lines 370,386 support 11.5px. Sheet own owner-name title is 14.5px and separately inventoried.
- **Review receipt**: `src/features/review-v2/components/reviewReceipt.css:10–11` status title 15/700, support 12px; impact title line 40 is 14/1.4. These are status/receipt blocks, not a sheet title automatically.

## (ii) Sheets likely to wrap at 21px / 320px viewport

Estimate only, no browser layout run. Use text length × 10.5px; normal 20px gutters leave 280px (~26 chars), 16px gutters leave 288px (~27 chars); a close/done control reduces this further. Locale and dynamic course names materially change the result.

- **Claim course** — `courseDetail.claim.sheet.title` with `{clubName}` (`ClaimCourseSheet.tsx:699`). 40px gutters + 36px reserved close area leaves ~244px (~23 chars); most “Claim …” names longer than ~17 extra chars wrap.
- **Review edit-loss** — “Remove from your review?” (`EditLossSheet.tsx:51`): 24 chars ≈252px versus 288px available: **does not normally wrap**. Included as a checked near-threshold negative; translations can.
- **Remove review** — “Remove review?” (`RemoveReviewSheetV2.tsx:95`): ~147px. Icon 40 + two 12px gaps + close 30 + 32px gutters leaves ~194px: **does not normally wrap** in English.
- **Course website** — course name in the website header (`CourseWebsiteSheet.tsx`); dynamic names over ~20–23 chars with navigation/close controls are candidates. The sr-only SheetTitle is accessibility text and not a visible wrapping title.
- **Course analytics holes sheet** — course-dependent/localized heading (`CourseAnalyticsPanels.tsx:863`); estimate against the actual header buttons, roughly 230–280px. Long course titles exceed 22–26 chars.
- **Course directory / course search / course request** — `statBrowse.directory.title`, `searchSheet.title`, `request.sheet.title` and `request.sheet.successTitle`: flag only localized strings exceeding ~23–27 chars; English short titles are not blanket wrap failures.
- **Top 100 progress** — owner display name (`Top100ListProgressSheet.tsx:149`), >~20 chars with avatar and Done. Actual style has ellipsis: at 21px it truncates rather than wrapping unless the no-wrap rule is removed.
- **Top 100 race see-all** — `amateur.leaderboards.top100` through ExploreSheetShell, about 246px after Done: >23 chars. English “Top 100” fits.
- **Your rounds / Your holes / All holes** — `courseDetail.yourRoundsSheet.title`, `courseDetail.yourHolesSheet.title`, `courseDetail.allHolesSheet.title`: short English titles fit, but same-line round-count text reduces 280px by its width + 12px gap. Long localized titles may cross the threshold. Course-name eyebrows are independently ellipsized, not wrapping titles.

## (iii) Celebration sheets with deliberately larger titles

No clearly identified celebration **sheet** in this scope with a deliberately oversized sheet title. RequestCourseSheet's success state uses the same canonical-library TITLE token (17px), not a larger celebration heading. ReviewReceipt is a full-page receipt/status surface, not a celebration sheet. The 48/800 community scores and 62/800 verdict figure are **figures**, not celebration titles; they still violate the 400–700 weight rule. Do not count them as headings to inflate mismatch counts.

## Shared heading components and import-consumer counts

Counts below are matching import lines from `rg`, across `src`, excluding the declaring file implicitly; they are not JSX render counts. A multi-component import is counted once. Relative and alias imports both included where the component name appears on the import line.

| Shared component | Import lines | Implementation / resolved values |
|---|---:|---|
| SectionHead | 12 | `src/components/courses/browse/SectionHead.tsx` — 11/700/.16em/1 + 21/700/−.035em/1.05 ink |
| AboutSection | 57 | `src/components/courses/course-detail/about/AboutSection.tsx` — title branch amber 11/700/.16em/1 + 19/700/−.02em/1.15; heading branch delegates to DiscoverSectionHeading |
| DiscoverSectionHeading | 7 | `src/components/ui/DiscoverSectionHeading.tsx` — 16/700/−.01em/1.2 ink; right slot 11/700 muted |
| ExploreSheetShell | 5 | `src/components/explore-tab-new/courseled/ExploreSheetShell.tsx` — 14.5/700 title; 10.5/700/.14em uppercase muted subtitle |
| Sec | 5 | `src/components/courses/course-detail/you/many/manyBits.tsx` — VERDICT_KICKER + TAB_TITLE; no-title kicker is a group label |
| Panel | 21 | `src/features/courses/components/holes/analytical/tokens.tsx` — analytical panel; kicker is not automatically section eyebrow |

## Scope / routing / interpretation notes

- Inspected source in all six requested component/feature roots and course-named page containers. `CourseHolesPage` redirects to `?sheet=holes` / `your-holes`; `CourseRoundsPage` redirects to `?tab=you&sheet=rounds`; `CourseReviewsRedirect` delegates rather than owning a visible heading. No duplicate visual heading is invented for redirects.
- `src/lib/tokens/type.ts` actual KICKER is **9/700/.19em**, no line-height; actual TITLE **17/700/−.032em/1.2**. Comments calling these canonical do not override this task's 11/21 comparison canon. Analytical KICKER is **11/700/.16em** ink, no line-height; analytical LABEL **11/700/.13em** muted; analytical TITLE **13/700** ink, tracking/line-height unspecified.
- AboutSection `sectionEyebrow` with no actual title below it remains ROW/GROUP LABEL under this task's structural role definition. This is why “What they scored” in WhatTheyScored is not counted as an eyebrow mismatch just because the prop says otherwise.
- Amber eyebrow on general course verdict, nearby, tees, honours, lately, public reviews and field-only You previews is outside the allowed self-data exception. An identical amber kicker describing exclusively the viewing member's own results can meet the colour-exception rule but still differs from the white/ink Courses heading reference. Table comparison records visual drift, not an automatic policy verdict.
- Prohibited weights also appear in figures and badges (community score, verdict figure, People you know, analytical Extremes). These should not be hidden by considering only heading mismatch counts. Medal gold is classified separately from amber.
- This is a static source audit, not measured computed CSS or locale/browser screenshots. “Inherited” is an explicit unresolved cascade value, not an exact line-height claim. Shared/import counts are lexical import-line counts. Very large scorecard/legacy subtrees have representative rather than exhaustive micro-label coverage; no tests, builds, SQL or project writes were performed.
