# Canonical heading Brief 8 — implementation and close-out

Accepted implementation: `049206da51`; before version: `3ccd28163d` (`049206d^`). Close-out changes **no production code and no tests**. No SQL, migrations, feed_config changes or pool-cap changes.

## Outcome and limits

- Five requested Champions states captured before/after at 390×844 and 320×844 using actual components and identical read-only fixtures. Historical rendering uses the exact fourteen changed production modules from `049206d^`; all other production modules and CSS are unchanged between these commits. No branch switch or application-source replacement was used.
- All checked 320px headings, including the accepted eighteen original state/width samples, six Champions samples (five live states plus a retained-helper specimen), and five long-name samples, have **zero mid-word breaks**. Per-character DOM ranges detect a line change inside each Unicode word; screenshots of every long-name heading and Champions h2 confirm the line boundaries.
- No measured heading or page horizontal overflow. Existing rails retain their own horizontal scrolling. No scrims, colours, figures, interactions, identity routing or data rules changed.
- The three longest catalogue names produce **four-line** TheVerdict and FewReviews headings; the Royal County Down example produces a **three-line** TheVerdict. These are reported unchanged for Ben, not clamped or repaired.
- Fixture captures are not hosted signed-in/physical-iPhone checks. You many shows four actual ManySections, not every conditional CourseYouTab section. Original paired Media-populated captures contain three hole tiles with an empty raw-post grid; the separately retained media-ready-grid sample includes three post tiles and the Views place rail. Champions helper WhatItTakes remains dormant in the actual Posted screen; its ninth shared-title declaration is captured separately, never reinstated.

## Inventory classification

Every inventory row in the five in-scope areas is below. Inventory line references are historical and several reported values were stale even before Brief 8. Eyebrows are classified as labels in this four-role close-out table, with the eyebrow subtype noted. Section/sheet labels adopt SECTION_EYEBROW only when they sit above a genuine title. Colours remain the actual pre-brief values.

| Inventory row | Source / occurrence | Classification | Actual disposition |
|---|---|---|---|
| 49 | `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx:1052` · CardScorecardSheet · h3 · {tH('roundResults.scope.fieldHeading')} | label | Explicit TILE_KICKER label at :1052, unchanged; inventory SHEET TITLE/16/400 was wrong. |
| 50 | `src/features/courses/_shared/scorecard/scorecardParts.tsx:532` · scorecardParts · h2 · {courseTap ? ( <button type="button" data-scorecard-course-name="true" onClick={(e) => { e.stopPropagation(); courseTap(); }} style={{ | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 51 | `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx:863` · CourseAnalyticsPanels · h2 · {t('courses:courseDetail.holes.sheetTitle')} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 52 | `src/features/courses/components/holes/analytical/CourseCardPanel.tsx:1405` · CourseCardPanel · h2 · {courseName && courseName.trim() ? shortCourseName(courseName) : t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 58 | `src/components/course-media-tab/AdminHoleTagging.tsx:97` · AdminHoleTagging · h2 · {capitalPhotoCount(rows.length)} untagged {rows.length === 1 ? 'shot' : 'shots'} here | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 59 | `src/components/course-media-tab/CourseMediaCanonGrid.tsx:215` · CourseMediaCanonGrid · h3 · {t('courses:media.emptyFlatTitle')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 60 | `src/components/course-media-tab/CourseMediaEmptyStates.tsx:25` · CourseMediaEmptyStates · h2 · {capitalPhotoCount(photoCount)} {photoCount === 1 ? 'photograph' : 'photographs'} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 61 | `src/components/course-media-tab/CourseMediaEmptyStates.tsx:43` · CourseMediaEmptyStates · h2 · {capitalPhotoCount(own.length)} of yours {own.length === 1 ? 'is' : 'are'} not live | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 62 | `src/components/course-media-tab/CourseMediaEmptyStates.tsx:66` · CourseMediaEmptyStates · DialogTitle · {move ? 'Move from the' : 'Retag the'} {row.hole_no}{ordinalSuffix(row.hole_no)} | label | Confirmation-alert title, not a section/sheet heading; shared DialogTitle unchanged. |
| 63 | `src/components/course-media-tab/CourseMediaEmptyStates.tsx:82` · CourseMediaEmptyStates · DialogTitle · Remove from the {row.hole_no}{ordinalSuffix(row.hole_no)}? | label | Confirmation-alert title, not a section/sheet heading; shared DialogTitle unchanged. |
| 64 | `src/components/course-media-tab/CourseMediaEmptyStates.tsx:109` · CourseMediaEmptyStates · h3 · {t('media.empty.title', { defaultValue: 'Be the first to show it' })} | tile title | CourseMediaNoShots invitation tile remains 15/600; unchanged. |
| 65 | `src/components/course-media-tab/CourseMediaTabNew.tsx:238` · CourseMediaTabNew · h2 · {t('media.empty.headTitle', { defaultValue: "How it really looks, from the golfers who've played it" })} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 66 | `src/components/course-media-tab/CourseMediaTabNew.tsx:245` · CourseMediaTabNew · h3 · {t('media.v2.unsortedTitle', { defaultValue: "Sort them by hole or by place" })} | tile title | Icon-and-copy unsorted invitation tile title; local CSS and copy unchanged. |
| 67 | `src/components/course-media-tab/CourseMediaTabNew.tsx:248` · CourseMediaTabNew · h3 · {t(hasTags ? 'media.v2.everything' : 'media.v2.allShots', { defaultValue: hasTags ? 'Everything' : 'All shots' })} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 68 | `src/components/course-media-tab/CoursePlaceTiles.tsx:31` · CoursePlaceTiles · h3 · {t('media.v2.around', { defaultValue: "Around the club" })} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 69 | `src/components/course-media-tab/HolePhotoFastPaths.tsx:39` · HolePhotoFastPaths · DialogTitle · Add a photo or video of the {holeOrdinal(hole)} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 70 | `src/components/course-media-tab/HoleWalk.tsx:35` · HoleWalk · h3 · {t('media.v2.holeByHole', { defaultValue: 'Hole by hole' })} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 71 | `src/components/course-media-tab/ShotTagCard.tsx:56` · ShotTagCard · h2 · {t('media.v3.title', { defaultValue: "What's in this shot?" })} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Optional 1 OF N position above it is an eyebrow label, now canonical; remains dim. |
| 72 | `src/components/course-media-tab/ShotTagChoices.tsx:16` · ShotTagChoices · h3 · {t('media.v3.holes', { defaultValue: 'A hole on the course' })} | label | Choice group label stays 9.5/700/.14em; unchanged. |
| 73 | `src/components/course-media-tab/ShotTagChoices.tsx:21` · ShotTagChoices · h3 · {t('media.v3.around', { defaultValue: 'Around the club' })} | label | Choice group label stays 9.5/700/.14em; unchanged. |
| 97 | `src/components/courses/course-detail/about/AboutSection.tsx:152` · AboutSection · DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 98 | `src/components/courses/course-detail/about/AboutThisPlace.tsx:53` · AboutThisPlace · AboutSection · {t('courseDetail.place.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 99 | `src/components/courses/course-detail/about/AboutThisPlace.tsx:53` · AboutThisPlace · AboutSection · {t('courseDetail.place.title')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 100 | `src/components/courses/course-detail/about/AllHolesSheet.tsx:365` · AllHolesSheet · AboutSection → DiscoverSectionHeading · {t('courseDetail.allHolesSheet.holes')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 101 | `src/components/courses/course-detail/about/AllHolesSheet.tsx:375` · AllHolesSheet · AboutSection → DiscoverSectionHeading · {t('courseDetail.allHolesSheet.pars')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 102 | `src/components/courses/course-detail/about/AllHolesSheet.tsx:380` · AllHolesSheet · AboutSection → DiscoverSectionHeading · {t('courseDetail.allHolesSheet.ladder')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 103 | `src/components/courses/course-detail/about/CourseFactsAndTees.tsx:122` · CourseFactsAndTees · AboutSection · {t('courseDetail.tees.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 104 | `src/components/courses/course-detail/about/CourseFactsAndTees.tsx:122` · CourseFactsAndTees · AboutSection · {t('courseDetail.tees.title')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 105 | `src/components/courses/course-detail/about/CourseHonoursSection.tsx:36` · CourseHonoursSection · AboutSection · {t('courseDetail.honours.kicker', 'HONOURS')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 106 | `src/components/courses/course-detail/about/CourseHonoursSection.tsx:36` · CourseHonoursSection · AboutSection · {t('courseDetail.honours.title', 'The honours board')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 107 | `src/components/courses/course-detail/about/CourseLatelySection.tsx:89` · CourseLatelySection · AboutSection · {t('courseDetail.lately.kicker', 'LATELY')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 108 | `src/components/courses/course-detail/about/CourseLatelySection.tsx:89` · CourseLatelySection · AboutSection · {t('courseDetail.lately.title', "Who's been out here")} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 109 | `src/components/courses/course-detail/about/DefendsPar.tsx:126` · DefendsPar · AboutSection · {t('courseDetail.defends.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 110 | `src/components/courses/course-detail/about/DefendsPar.tsx:126` · DefendsPar · AboutSection · {t('courseDetail.defends.title')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 111 | `src/components/courses/course-detail/about/HowItPlays.tsx:335` · HowItPlays · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 112 | `src/components/courses/course-detail/about/HowItPlays.tsx:362` · HowItPlays · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 113 | `src/components/courses/course-detail/about/HowItPlays.tsx:384` · HowItPlays · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 114 | `src/components/courses/course-detail/about/Photos.tsx:49` · Photos · AboutSection → DiscoverSectionHeading · {t('courseDetail.sections.photos')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 115 | `src/components/courses/course-detail/about/RecordBook.tsx:166` · RecordBook · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 116 | `src/components/courses/course-detail/about/RecordBook.tsx:186` · RecordBook · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 117 | `src/components/courses/course-detail/about/RecordBook.tsx:261` · RecordBook · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 118 | `src/components/courses/course-detail/about/TheVerdict.tsx:56` · TheVerdict · AboutSection · {t('courseDetail.verdict.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 119 | `src/components/courses/course-detail/about/TheVerdict.tsx:56` · TheVerdict · AboutSection · {title} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 120 | `src/components/courses/course-detail/about/WhatPeopleSay.tsx:132` · WhatPeopleSay · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 121 | `src/components/courses/course-detail/about/WhatPeopleSay.tsx:146` · WhatPeopleSay · AboutSection · {t('courseDetail.reviewsHead.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 122 | `src/components/courses/course-detail/about/WhatPeopleSay.tsx:146` · WhatPeopleSay · AboutSection · {t('courseDetail.reviewsHead.youFirst')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 123 | `src/components/courses/course-detail/about/WhatPeopleSay.tsx:175` · WhatPeopleSay · AboutSection · {t('courseDetail.reviewsHead.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 124 | `src/components/courses/course-detail/about/WhatPeopleSay.tsx:175` · WhatPeopleSay · AboutSection · {title} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 125 | `src/components/courses/course-detail/about/WhereItIs.tsx:51` · WhereItIs · AboutSection → DiscoverSectionHeading · {t('courseDetail.sections.whereItIs')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 126 | `src/components/courses/course-detail/about/WhoPlaysHere.tsx:74` · WhoPlaysHere · AboutSection → DiscoverSectionHeading · {t('courseDetail.sections.whoPlaysHere')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 127 | `src/components/courses/course-detail/ClaimCourseSheet.tsx:699` · ClaimCourseSheet · h2 · {t('courseDetail.claim.sheet.title', { clubName })} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 128 | `src/components/courses/course-detail/NearbySection.tsx:29` · NearbySection · h2 · {t('courseDetail.nearby.title')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 129 | `src/components/courses/course-detail/about/AllHolesSheet.tsx:342` · AllHolesSheet · h2 · {t('courseDetail.allHolesSheet.title')} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 130 | `src/components/courses/course-detail/ClaimCourseSheet.tsx:296` · ClaimCourseSheet · Claim sheet kicker | label | Claim panel label at old :296, not the actual header eyebrow; local LABEL unchanged. Actual header eyebrow at :698 is separately canonicalized. |
| 131 | `src/components/courses/course-detail/NearbySection.tsx:28` · NearbySection · Nearby kicker | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 132 | `src/components/courses/course-detail/about/TheVerdict.tsx:62` · TheVerdict · Over par (under 62px / 800 figure) | label | Unchanged small group/figure/chip label; not a section title. |
| 133 | `src/components/courses/course-detail/about/AllHolesSheet.tsx:53` · AllHolesSheet · Course name above sheet title | label | Inventory pointed at a small figure/group-label declaration. Actual course-name header at AllHoles :340 /YourRounds :111 /YourHoles :170 is the sheet eyebrow: 9/700/.19em/inherited → 11/700/.16em/1, preserving muted colour and existing name ellipsis. |
| 139 | `src/components/courses/course-detail/CourseReviewsTab.tsx:551` · CourseReviewsTab · AboutSection → DiscoverSectionHeading · Your review | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 140 | `src/components/courses/course-detail/CourseReviewsTab.tsx:567` · CourseReviewsTab · AboutSection → DiscoverSectionHeading · Your review | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 141 | `src/components/courses/course-detail/CourseReviewsTab.tsx:580` · CourseReviewsTab · AboutSection → DiscoverSectionHeading · {myReview ? 'Everyone else' : 'Reviews'} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 142 | `src/components/courses/course-detail/reviews/WhatTheyScored.tsx:19` · WhatTheyScored · AboutSection · What they scored | label | Kicker-only group label; no title follows. Scalar eyebrow values and colour remain unchanged. |
| 143 | `src/components/courses/course-detail/reviews/FewReviews.tsx:66` · FewReviews · h2 · {courseName} sits at {community.score?.toFixed(1)} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 144 | `src/components/courses/course-detail/reviews/FewReviews.tsx:85` · FewReviews · h2 · The score builds from here | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 145 | `src/components/courses/course-detail/reviews/FewReviews.tsx:92` · FewReviews · h2 · Where the score comes from | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 146 | `src/components/courses/course-detail/reviews/NobodyHasRated.tsx:28` · NobodyHasRated · h2 · You would be the first | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 147 | `src/components/courses/course-detail/reviews/SingleReview.tsx:63` · SingleReview · h2 · {courseName} is on the board | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 148 | `src/components/courses/course-detail/reviews/FewReviews.tsx:91` · FewReviews · What they scored | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 149 | `src/components/courses/course-detail/reviews/FewReviews.tsx:98` · FewReviews · Everyone else (no title follows) | label | No title follows; unchanged group label. |
| 150 | `src/components/courses/course-detail/reviews/FewReviews.tsx:97` · FewReviews · People you know | label | Existing medal-gold chip label, unchanged (inventory weight 800 was stale after the weight series). |
| 151 | `src/components/courses/course-detail/reviews/NobodyHasRated.tsx:25` · NobodyHasRated · Nobody has rated it | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 152 | `src/components/courses/course-detail/reviews/SingleReview.tsx:62` · SingleReview · The first rating | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 158 | `src/components/courses/course-detail/CourseYouTab.tsx:501` · CourseYouTab · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.circle.heading')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 159 | `src/components/courses/course-detail/you/AgainstYourGolfSection.tsx:64` · AgainstYourGolfSection · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.againstYourGolf.heading')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 160 | `src/components/courses/course-detail/you/BirdiesHere.tsx:55` · BirdiesHere · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.birdiesHere')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 161 | `src/components/courses/course-detail/you/NotConnectedInvitation.tsx:99` · NotConnectedInvitation · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.connect.fieldShotsHeading', { courseName } | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 162 | `src/components/courses/course-detail/you/NotConnectedInvitation.tsx:156` · NotConnectedInvitation · Sec · {t('courseDetail.youTab.sections.birdiesHere')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 163 | `src/components/courses/course-detail/you/NotConnectedInvitation.tsx:156` · NotConnectedInvitation · Sec · {t('courseDetail.youTab.birdiesWaiting.title')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 164 | `src/components/courses/course-detail/you/NotConnectedInvitation.tsx:166` · NotConnectedInvitation · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.birdiesHere')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 165 | `src/components/courses/course-detail/you/NotConnectedInvitation.tsx:209` · NotConnectedInvitation · Sec · {t('courseDetail.youTab.fieldVerdict.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 166 | `src/components/courses/course-detail/you/NotConnectedInvitation.tsx:209` · NotConnectedInvitation · Sec · {t('courseDetail.youTab.fieldVerdict.title', { shots } | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 167 | `src/components/courses/course-detail/you/ProjectionSection.tsx:118` · ProjectionSection · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 168 | `src/components/courses/course-detail/you/ProjectionSection.tsx:164` · ProjectionSection · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 169 | `src/components/courses/course-detail/you/ProjectionSection.tsx:213` · ProjectionSection · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 170 | `src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:43` · UnclaimedCourseSection · Sec · {t('courseDetail.youTab.unclaimed.kicker')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 171 | `src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:43` · UnclaimedCourseSection · Sec · {t('courseDetail.youTab.unclaimed.title')} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 172 | `src/components/courses/course-detail/you/UpForGrabsSection.tsx:59` · UpForGrabsSection · Sec · {t('courseDetail.youTab.sections.upForGrabs')} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 173 | `src/components/courses/course-detail/you/UpForGrabsSection.tsx:59` · UpForGrabsSection · Sec · {openCount > 0 ? t('courseDetail.youTab.grabs.boardsTitle', { count: openCount, unclaimed: formatNumber(openCount) } | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 174 | `src/components/courses/course-detail/you/UpForGrabsSection.tsx:108` · UpForGrabsSection · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.upForGrabs')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 175 | `src/components/courses/course-detail/you/WhereYouStandHere.tsx:109` · WhereYouStandHere · AboutSection → DiscoverSectionHeading · Where you stand here | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 176 | `src/components/courses/course-detail/you/WonAndLostSection.tsx:44` · WonAndLostSection · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.wonAndLost.heading')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 177 | `src/components/courses/course-detail/you/YourFormHere.tsx:129` · YourFormHere · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 178 | `src/components/courses/course-detail/you/YourFormHere.tsx:171` · YourFormHere · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 179 | `src/components/courses/course-detail/you/YourMomentsSection.tsx:51` · YourMomentsSection · AboutSection → DiscoverSectionHeading · {t('courseDetail.you.moments')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 180 | `src/components/courses/course-detail/you/YourRatingSection.tsx:30` · YourRatingSection · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 181 | `src/components/courses/course-detail/you/YourRatingSection.tsx:38` · YourRatingSection · AboutSection → DiscoverSectionHeading · {heading} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 182 | `src/components/courses/course-detail/you/YourRoundsHere.tsx:58` · YourRoundsHere · AboutSection → DiscoverSectionHeading · {t('courseDetail.youTab.sections.yourRounds')} | section title | Already canonical before 049206d; unchanged shared DiscoverSectionHeading (inventory 16px was stale). |
| 183 | `src/components/courses/course-detail/you/many/FormLast20Section.tsx:38` · FormLast20Section · Sec · Your form here | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 184 | `src/components/courses/course-detail/you/many/FormLast20Section.tsx:38` · FormLast20Section · Sec · {`Last ${LAST_N} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 185 | `src/components/courses/course-detail/you/many/ManySections.tsx:48` · ManySections · Sec · Your verdict | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 186 | `src/components/courses/course-detail/you/many/ManySections.tsx:48` · ManySections · Sec · {p.season && p.bestSeason ? `${p.year} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 187 | `src/components/courses/course-detail/you/many/ManySections.tsx:108` · ManySections · Sec · Your years here | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 188 | `src/components/courses/course-detail/you/many/ManySections.tsx:108` · ManySections · Sec · {gain ? 'Where the gain actually came' : null} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 189 | `src/components/courses/course-detail/you/many/ManySections.tsx:168` · ManySections · Sec · {`The ${words(n)} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 190 | `src/components/courses/course-detail/you/many/ManySections.tsx:168` · ManySections · Sec · {g.everyMadeBeforeTurn ? `${n === 1 ? 'It was' : 'Every one of them was'} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 191 | `src/components/courses/course-detail/you/many/ManySections.tsx:224` · ManySections · Sec · You against the field | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 192 | `src/components/courses/course-detail/you/many/ManySections.tsx:224` · ManySections · Sec · {allAhead ? `You beat the field on all ${words(n)} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 193 | `src/components/courses/course-detail/you/many/ManySections.tsx:306` · ManySections · Sec · {kicker} | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 194 | `src/components/courses/course-detail/you/many/ManySections.tsx:306` · ManySections · Sec · {title} | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 195 | `src/components/courses/course-detail/you/many/ManySections.tsx:353` · ManySections · Sec · Within reach | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 196 | `src/components/courses/course-detail/you/many/ManySections.tsx:353` · ManySections · Sec · What you could take | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 197 | `src/components/courses/course-detail/you/many/ManySections.tsx:395` · ManySections · Sec · Your record here | label | Eyebrow label: SECTION_EYEBROW 11/700/0.16em/uppercase/1; existing colour preserved. |
| 198 | `src/components/courses/course-detail/you/many/ManySections.tsx:395` · ManySections · Sec · Everything else you have put in | section title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. Shared TAB_TITLE consumer: old 19/700/−.02em/1.15 → canon, without editing its module. |
| 199 | `src/components/courses/course-detail/you/YourHolesSheet.tsx:172` · YourHolesSheet · h2 · {t('courseDetail.yourHolesSheet.title')} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 200 | `src/components/courses/course-detail/you/YourRoundsSheet.tsx:113` · YourRoundsSheet · h2 · {t('courseDetail.yourRoundsSheet.title')} | sheet title | Canonical SECTION_TITLE, 21/700/−0.035em/1.05; existing colour preserved. |
| 201 | `src/components/courses/course-detail/you/YourRoundsSheet.tsx:55` · YourRoundsSheet · Course name above sheet title | label | Inventory pointed at a small figure/group-label declaration. Actual course-name header at AllHoles :340 /YourRounds :111 /YourHoles :170 is the sheet eyebrow: 9/700/.19em/inherited → 11/700/.16em/1, preserving muted colour and existing name ellipsis. |
| 202 | `src/components/courses/course-detail/you/YourHolesSheet.tsx:42` · YourHolesSheet · Course name above sheet title | label | Inventory pointed at a small figure/group-label declaration. Actual course-name header at AllHoles :340 /YourRounds :111 /YourHoles :170 is the sheet eyebrow: 9/700/.19em/inherited → 11/700/.16em/1, preserving muted colour and existing name ellipsis. |

Total classified inventory rows: **116**. Added header eyebrows absent/mislocated in the inventory: ClaimCourseSheet header, analytics sheet kicker, CourseCardPanel sheet eyebrow, scorecard location, and ShotTagCard optional position. All use the canonical eyebrow metrics locally, not by repointing figure/group-label tokens.

## Every implementation change

Canonical title: 21px, 700, −0.035em, 1.05; eyebrow: 11px, 700, 0.16em, uppercase, 1; title gap 5px. Original font stack and colour values are retained. The exact patch below supplies every changed declaration, file and old/new line hunk; file-line entries also identify the current token-bearing sites.

| File | Current canonical declaration lines | Change summary |
|---|---|---|
| `src/components/course-media-tab/CourseMediaCanonGrid.tsx` | 216 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/course-media-tab/CourseMediaTabNew.tsx` | 239, 249 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/course-media-tab/CoursePlaceTiles.tsx` | 32 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/course-media-tab/HolePhotoFastPaths.tsx` | 40 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/course-media-tab/HoleWalk.tsx` | 36 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/course-media-tab/ShotTagCard.tsx` | 56, 57 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx` | 699, 702, 703 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/courses/course-detail/about/AboutSection.tsx` | 64, 75, 76 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/courses/course-detail/about/AllHolesSheet.tsx` | 341, 342, 343 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/courses/course-detail/you/YourHolesSheet.tsx` | 171, 172, 173 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/components/courses/course-detail/you/YourRoundsSheet.tsx` | 112, 113, 114 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx` | 527, 532 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx` | 856, 866 | Local heading/eyebrow token spreads; no colour or shared label-token change. |
| `src/features/courses/components/holes/analytical/CourseCardPanel.tsx` | 1404, 1409, 1410 | Local heading/eyebrow token spreads; no colour or shared label-token change. |

### Meta and wrapping

- AboutSection title branch: previously kicker/meta shared a row and h2 was below that entire row. Now kicker and h2 sit in a flexible `minWidth:0` title column; meta sits outside it, `flexShrink:0`, `whiteSpace:nowrap`, and the row uses `alignItems:"last baseline"`. Title wraps in its own column, never underneath meta. Existing 12px column gap and 5px eyebrow/title gap remain.
- TAB_TITLE adds minWidth:0 and overflowWrap:anywhere as a safety net. Nothing in close-out changes it.
- AllHolesSheet ladder opts into local wrapHeading; shared DiscoverSectionHeading remains untouched. AllHoles/YourRounds/YourHoles header rows and Media place/hole header rows align on the last baseline.
- Accepted meta-wrap 320 specimen: “Where the score comes from” is two lines with “186 rounds”; one line with meta temporarily hidden for measurement. Meta shrink is 0 and its baseline meets the final title line. At 390 both versions are one line. This is a shared-wrapper specimen, not a new production section.
- Sheet course-name ellipsis, CourseCardPanel shortCourseName, and scorecard existing two-line WebKit clamp remain. Scorecard title gap changes 7→5; analytics/card sheet gap changes 3→5.

### Nine Champions TAB_TITLE declarations

| Source | Heading | Capture status |
|---|---|---|
| `PostedChampions.tsx:108` | `<h2 data-yours-count={yours.length} data-board-count={keys.length} style={TAB_TITLE}>{numberWord(yours.length)} of the {numberWord(keys.length, false)} are yours</h2>` | Captured in its actual requested state at both widths and both versions. |
| `PostedChampions.tsx:145` | `{gap != null && gap > 0 && <h2 style={TAB_TITLE}>{numberWord(gap)} {title}</h2>}` | Supplemental champions-retained specimen only; dormant WhatItTakes, not restored to PostedChampions. |
| `PostedChampions.tsx:165` | `<h2 style={TAB_TITLE}>{rival && closing ? <><InlineProMemberName userId={rival.userId}>{rival.name}</InlineProMemberName> is closing</> : title}</h2>` | Captured in its actual requested state at both widths and both versions. |
| `ProjectedChampions.tsx:48` | `<h2 data-reached-count={reached.length} style={TAB_TITLE}>Your golf reaches {numberWord(reached.length, false)} of these</h2>` | Captured in its actual requested state at both widths and both versions. |
| `ProjectedChampions.tsx:60` | `<h2 style={TAB_TITLE}>{heading}</h2>` | Captured in its actual requested state at both widths and both versions. |
| `FieldChampions.tsx:54` | `<h2 style={TAB_TITLE}>{numberWord(taken)} taken, {numberWord(untouched, false)} never touched</h2>` | Captured in its actual requested state at both widths and both versions. |
| `FieldChampions.tsx:80` | `<h2 style={TAB_TITLE}>{numberWord(Math.round(Math.abs(comparison.recordToPar)))} {comparison.recordToPar < 0 ? 'under' : 'over'} par, on a course that plays {numberWord(Math.round(Math.abs(comparison.fieldOverPar)), false)} {comparison.fieldOverPar < 0 ? 'under' : 'over'}</h2>` | Captured in its actual requested state at both widths and both versions. |
| `ChampionsElsewhere.tsx:47` | `<h2 data-card-count={cards.length} style={TAB_TITLE}>{numberWord(cards.length)} {cards.length === 1 ? 'board you are' : 'boards you are'} closest to</h2>` | Captured in its actual requested state at both widths and both versions. |
| `NobodyHasPlayed.tsx:74` | `<h2 style={TAB_TITLE}>All {spelled} boards are open</h2>` | Captured in its actual requested state at both widths and both versions. |

### Parked tiles, labels and alerts

- TILE_KICKER at CardScorecardSheet:1052; THE CARD, TEES, labels beneath figures, board/cabinet names, ShotTagChoices, and all chart labels unchanged.
- Media invitation “Be the first to show it” (15/600), unsorted icon-and-copy tile, course cards and nearby tiles remain tile typography.
- Media Retag/Move/Remove confirmation alerts and general DialogTitle are unchanged. HolePhotoFastPaths capture dialog and ShotTagCard are actual requested sheets, not confirmation alerts, so their titles were canonicalized.
- Figure sizes, body typography, existing gold/amber/ink rules, shared LABEL and TILE_KICKER tokens, camera/viewer controls, and course-name truncation rules unchanged.

### Exact production patch

```diff
diff --git a/src/components/course-media-tab/CourseMediaCanonGrid.tsx b/src/components/course-media-tab/CourseMediaCanonGrid.tsx
index d08e9cae05..7231514d6b 100644
--- a/src/components/course-media-tab/CourseMediaCanonGrid.tsx
+++ b/src/components/course-media-tab/CourseMediaCanonGrid.tsx
@@ -14,6 +14,7 @@
  */
 
 import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
+import { SECTION_TITLE } from '@/lib/tokens/type';
 import { useTranslation } from 'react-i18next';
 import { useNavigate } from 'react-router-dom';
 import { Loader2, AlertCircle } from 'lucide-react';
@@ -212,7 +213,7 @@ export const CourseMediaCanonGrid = forwardRef<HTMLDivElement, CourseMediaCanonG
     const courseLabel = courseName || t('courses:media.emptyCourseFallback');
     return (
       <div style={{ padding: '24px 20px 40px' }}>
-        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
+        <h3 style={{ ...SECTION_TITLE, margin: 0, overflowWrap: 'anywhere', color: A.INK }}>
           {t('courses:media.emptyFlatTitle')}
         </h3>
         <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: A.MUTE }}>
diff --git a/src/components/course-media-tab/CourseMediaTabNew.tsx b/src/components/course-media-tab/CourseMediaTabNew.tsx
index b79751f00a..1a6988db1c 100644
--- a/src/components/course-media-tab/CourseMediaTabNew.tsx
+++ b/src/components/course-media-tab/CourseMediaTabNew.tsx
@@ -1,4 +1,5 @@
 import { VERDICT_KICKER_INK, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
+import { SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 import React, { useEffect, useRef, useState } from 'react';
 import { useTranslation } from 'react-i18next';
 import { useSupabaseSession } from '@/hooks/useSupabaseSession';
@@ -235,7 +236,7 @@ const CourseMediaTabNew: React.FC<CourseMediaTabNewProps> = ({ courseId, courseN
     <div className="animate-in fade-in duration-200 flex flex-col" style={{ background: A.CANVAS, minHeight: '100%' }}>
       <header className="media-v2-top">
         <span style={VERDICT_KICKER_INK}>{t('media.v2.kicker', { defaultValue: "Through members' eyes" })}</span>
-        <h2>{t('media.empty.headTitle', { defaultValue: "How it really looks, from the golfers who've played it" })}</h2>
+        <h2 style={{ ...SECTION_TITLE, margin: `${SECTION_TITLE_GAP}px 0 0`, overflowWrap: 'anywhere' }}>{t('media.empty.headTitle', { defaultValue: "How it really looks, from the golfers who've played it" })}</h2>
         {hasTags && <p>{t('media.empty.headSub', { defaultValue: 'By hole and around the club. Tap any shot to open it.' })}</p>}
       </header>
       {(photoState === 'B' || photoState === 'C') && <CourseMediaNoShots courseName={courseName} hasHoles={photoState === 'B'} onAdd={addShot.open} />}
@@ -245,7 +246,7 @@ const CourseMediaTabNew: React.FC<CourseMediaTabNewProps> = ({ courseId, courseN
         <div className="media-v2-unsorted-intro"><span className="media-v2-unsorted-icon"><Tag size={17} /></span><div><h3>{t('media.v2.unsortedTitle', { defaultValue: "Sort them by hole or by place" })}</h3><p>{t('media.v2.unsortedBody', { defaultValue: "Tag a shot to a hole, the clubhouse, the food, the practice ground or anything else, and this page builds itself." })}</p></div></div>
         <Button className="media-v2-primary" disabled={fastPending} onClick={() => untaggedCount ? void beginBatch() : addShot.open()}>{untaggedCount ? t('media.v2.tagYour', { count: untaggedCount, defaultValue: untaggedCount === 1 ? "Tag your 1 shot" : `Tag your ${untaggedCount} shots` }) : t('media.v2.add', { defaultValue: "Add a photo or video" })}</Button>
       </section>}
-      {countsReady && mediaCounts.total > 0 && photoState !== 'B' && photoState !== 'C' && <div className="media-v3-everything media-v2-head" data-media-everything><h3>{t(hasTags ? 'media.v2.everything' : 'media.v2.allShots', { defaultValue: hasTags ? 'Everything' : 'All shots' })}</h3><Button variant="ghost" className="media-v3-add" aria-label={t('media.v3.add', { defaultValue: 'Add a photo or video' })} onClick={() => navigate(`/courses/${courseId}/rate`)}><Plus size={17} strokeWidth={2.4} /></Button></div>}
+      {countsReady && mediaCounts.total > 0 && photoState !== 'B' && photoState !== 'C' && <div className="media-v3-everything media-v2-head" data-media-everything><h3 style={{ ...SECTION_TITLE, minWidth: 0, overflowWrap: 'anywhere' }}>{t(hasTags ? 'media.v2.everything' : 'media.v2.allShots', { defaultValue: hasTags ? 'Everything' : 'All shots' })}</h3><Button variant="ghost" className="media-v3-add" aria-label={t('media.v3.add', { defaultValue: 'Add a photo or video' })} onClick={() => navigate(`/courses/${courseId}/rate`)}><Plus size={17} strokeWidth={2.4} /></Button></div>}
       {countsReady && mediaCounts.photos > 0 && mediaCounts.videos > 0 && photoState !== 'B' && photoState !== 'C' && <div className="media-v3-filters"><RailChips ariaLabel={t('media.v3.filters', { defaultValue: 'Media filters' })} options={[
         { id: 'all', label: t('media.v3.all', { defaultValue: 'All' }), value: mediaCounts.total },
         { id: 'photos', label: t('media.v3.photos', { defaultValue: 'Photos' }), value: mediaCounts.photos },
diff --git a/src/components/course-media-tab/CoursePlaceTiles.tsx b/src/components/course-media-tab/CoursePlaceTiles.tsx
index ad56402256..471a2b69c6 100644
--- a/src/components/course-media-tab/CoursePlaceTiles.tsx
+++ b/src/components/course-media-tab/CoursePlaceTiles.tsx
@@ -1,4 +1,5 @@
 import { useTranslation } from 'react-i18next';
+import { SECTION_TITLE } from '@/lib/tokens/type';
 import { Button } from '@/components/ui/button';
 import { COURSE_PLACES, type CoursePlace } from '@/lib/courseMedia/places';
 import type { PlaceMedia } from './hooks/useCoursePlaceMedia';
@@ -28,7 +29,7 @@ export function CoursePlaceTiles({ rows, onOpen }: { rows: readonly PlaceMedia[]
   if (!groups.length) return null;
   const count = groups.reduce((sum, group) => sum + group.shots.length, 0);
   return <section className="media-v2-places">
-    <div className="media-v2-head"><h3>{t('media.v2.around', { defaultValue: "Around the club" })}</h3><span className="media-v2-label">{t('media.v2.shots', { count, defaultValue: "{{count}} shots" })}</span></div>
+    <div className="media-v2-head" style={{ alignItems: 'last baseline' }}><h3 style={{ ...SECTION_TITLE, minWidth: 0, overflowWrap: 'anywhere' }}>{t('media.v2.around', { defaultValue: "Around the club" })}</h3><span className="media-v2-label">{t('media.v2.shots', { count, defaultValue: "{{count}} shots" })}</span></div>
     <div className="media-v3-place-rail">{groups.map(({ id, icon: Icon, shots }) => {
       const label = t(`media.v2.places.${id}`, { defaultValue: PLACE_LABELS[id] });
       const age = placeAge(shots[0].added_at);
diff --git a/src/components/course-media-tab/HolePhotoFastPaths.tsx b/src/components/course-media-tab/HolePhotoFastPaths.tsx
index d6ffbac84d..4923f01820 100644
--- a/src/components/course-media-tab/HolePhotoFastPaths.tsx
+++ b/src/components/course-media-tab/HolePhotoFastPaths.tsx
@@ -5,6 +5,7 @@
  * thumbnail never writes; only the primary submit calls onTag.
  */
 import { useTranslation } from 'react-i18next';
+import { SECTION_TITLE } from '@/lib/tokens/type';
 import { PLACE_LABELS } from './ShotTagChoices';
 import { ShotTagCard } from './ShotTagCard';
 import type { CoursePlace } from '@/lib/courseMedia/places';
@@ -36,7 +37,7 @@ export function HoleKnownPhotoPath({ hole, photos, sources = [], pending, upload
 }) {
   const input = useRef<HTMLInputElement>(null);
   return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent style={theme} className="hole-photo-fast hole-photo-fast-sheet" onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onPointerDownOutside={event => { if (pending) event.preventDefault(); }}>
-    <DialogTitle className="hole-photo-fast-title">Add a photo or video of the {holeOrdinal(hole)}</DialogTitle>
+    <DialogTitle className="hole-photo-fast-title" style={{ ...SECTION_TITLE, overflowWrap: 'anywhere' }}>Add a photo or video of the {holeOrdinal(hole)}</DialogTitle>
     <DialogDescription className="hole-photo-fast-lede">The hole is already set. Pick a photo or video and it is done.</DialogDescription>
       <div className="hole-photo-fast-pile">{photos.map(url => { const source = sources.find(s => s.url === url); const video = source?.mediaType === 'video'; return <Button key={url} variant="ghost" className="hole-photo-fast-photo hole-media-preview" aria-label={video ? 'Choose video' : 'Choose photograph'} disabled={pending} onClick={() => onChoose(url)}><HoleMediaThumbnail url={url} {...source} alt={video ? 'Your video' : 'Your photograph'} /></Button>; })}</div>
       <input ref={input} type="file" accept="image/*,video/*" hidden disabled={pending} onChange={event => { const file = event.target.files?.[0]; if (file) onLibrary(file); event.target.value = ''; }} />
diff --git a/src/components/course-media-tab/HoleWalk.tsx b/src/components/course-media-tab/HoleWalk.tsx
index 2ab5d7b078..250015f163 100644
--- a/src/components/course-media-tab/HoleWalk.tsx
+++ b/src/components/course-media-tab/HoleWalk.tsx
@@ -1,4 +1,5 @@
 import { useTranslation } from 'react-i18next';
+import { SECTION_TITLE } from '@/lib/tokens/type';
 import { Plus } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { ReadyShotCover } from './ReadyShotCover';
@@ -32,7 +33,7 @@ export function HoleWalk({ available, holes, rows, onAddFirst, onChooseFirst, on
   if (!walk.photographed) return null;
   return <div className="hole-walk"><section>
     <div className="media-v2-hole-head">
-      <div className="media-v2-head"><h3>{t('media.v2.holeByHole', { defaultValue: 'Hole by hole' })}</h3><span className="media-v2-label">{t('media.v2.coverage', { shot: walk.photographed, holes: holes.length, defaultValue: `${walk.photographed} of ${holes.length} holes` })}</span></div>
+      <div className="media-v2-head" style={{ alignItems: 'last baseline' }}><h3 style={{ ...SECTION_TITLE, minWidth: 0, overflowWrap: 'anywhere' }}>{t('media.v2.holeByHole', { defaultValue: 'Hole by hole' })}</h3><span className="media-v2-label">{t('media.v2.coverage', { shot: walk.photographed, holes: holes.length, defaultValue: `${walk.photographed} of ${holes.length} holes` })}</span></div>
       <div className="media-v2-coverage">{walk.tiles.map(item => <Button key={item.hole.hole_no} variant="ghost" data-shot={item.photos.length > 0}
         aria-label={t('media.v2.coverageHole', { hole: item.hole.hole_no, defaultValue: `Coverage hole ${item.hole.hole_no}` })}
         onClick={event => item.photos.length ? onOpen?.(item.hole.hole_no, event.currentTarget, 'coverage') : onAddFirst(item.hole.hole_no)}><i /><span>{item.hole.hole_no}</span></Button>)}</div>
diff --git a/src/components/course-media-tab/ShotTagCard.tsx b/src/components/course-media-tab/ShotTagCard.tsx
index 328fdbd4ad..dbb7a798ee 100644
--- a/src/components/course-media-tab/ShotTagCard.tsx
+++ b/src/components/course-media-tab/ShotTagCard.tsx
@@ -1,4 +1,5 @@
 import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 /** Media v3 has one presentation for single, member batch and admin batch.
  * Adapters own selection, writes, pending locks and undo; this shell owns the
  * simultaneous grids and read-only canonical thumbnail viewer. */
@@ -52,8 +53,8 @@ export function ShotTagCard({ shot, position, credit, holes, hole, place, onHole
           <HoleMediaThumbnail {...shot} alreadyEligible alt={shot.mediaType === 'video' ? 'Current video' : 'Current photograph'} />
         </Button>
         <div className="media-v3-tag-heading">
-          {position && <span className="media-v2-label" data-tag-position>{t('media.v3.position', { ...position, defaultValue: `${position.i} OF ${position.n}` })}</span>}
-          <h2>{t('media.v3.title', { defaultValue: "What's in this shot?" })}</h2>
+          {position && <span className="media-v2-label" style={SECTION_EYEBROW} data-tag-position>{t('media.v3.position', { ...position, defaultValue: `${position.i} OF ${position.n}` })}</span>}
+          <h2 style={{ ...SECTION_TITLE, margin: `${position ? SECTION_TITLE_GAP : 0}px 0 0`, overflowWrap: 'anywhere' }}>{t('media.v3.title', { defaultValue: "What's in this shot?" })}</h2>
         </div>
         <Button variant="ghost" className="media-v3-tag-close" aria-label={t('media.v3.close', { defaultValue: 'Close' })} disabled={pending} onClick={close}><X size={15} /></Button>
       </div>
diff --git a/src/components/courses/course-detail/ClaimCourseSheet.tsx b/src/components/courses/course-detail/ClaimCourseSheet.tsx
index cbf43c7fa4..453021111a 100644
--- a/src/components/courses/course-detail/ClaimCourseSheet.tsx
+++ b/src/components/courses/course-detail/ClaimCourseSheet.tsx
@@ -14,6 +14,7 @@
  * mentioned in copy — that comparison was removed from the product.
  */
 import React, { useMemo, useRef, useState } from 'react';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 import { useTranslation } from 'react-i18next';
 import { useNavigate } from 'react-router-dom';
 import { useQuery } from '@tanstack/react-query';
@@ -695,11 +696,11 @@ const ClaimCourseSheet: React.FC<ClaimCourseSheetProps> = ({
         </button>
 
         <div data-claim-header="">
-          <div style={LABEL}>{t('courseDetail.claim.sheet.kicker')}</div>
+          <div style={{ ...LABEL, ...SECTION_EYEBROW }}>{t('courseDetail.claim.sheet.kicker')}</div>
           <h2
             style={{
-              fontSize: 21, fontWeight: 700, color: INKC, lineHeight: 1.25,
-              marginTop: 7, paddingRight: 36,
+              ...SECTION_TITLE, color: INKC, overflowWrap: 'anywhere',
+              marginTop: SECTION_TITLE_GAP, paddingRight: 36,
             }}
           >
             {t('courseDetail.claim.sheet.title', { clubName })}
diff --git a/src/components/courses/course-detail/about/AboutSection.tsx b/src/components/courses/course-detail/about/AboutSection.tsx
index 582b47152f..9e46ede594 100644
--- a/src/components/courses/course-detail/about/AboutSection.tsx
+++ b/src/components/courses/course-detail/about/AboutSection.tsx
@@ -21,6 +21,7 @@
 import React from 'react';
 import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
 import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 
 /** §1 — the page gutter for every section on the tab. */
 export const GUTTER = 20;
@@ -60,11 +61,7 @@ export const aboutFig = (size: number, color: string = A.INK): React.CSSProperti
 
 /** BRIEF_COURSE_TAB_1A — the canonical amber section kicker (11/700/0.16em). */
 export const VERDICT_KICKER: React.CSSProperties = {
-  fontSize: 11,
-  fontWeight: 700,
-  letterSpacing: '0.16em',
-  textTransform: 'uppercase',
-  lineHeight: 1,
+  ...SECTION_EYEBROW,
   color: A.AMBER,
   fontFamily: SANS,
 };
@@ -75,11 +72,10 @@ export const VERDICT_KICKER_INK: React.CSSProperties = { ...VERDICT_KICKER, colo
 
 /** BRIEF_COURSE_TAB_1A — the section title under that kicker (19/700/-0.02em). */
 export const TAB_TITLE: React.CSSProperties = {
-  margin: '5px 0 0',
-  fontSize: 19,
-  fontWeight: 700,
-  letterSpacing: '-0.02em',
-  lineHeight: 1.15,
+  ...SECTION_TITLE,
+  margin: `${SECTION_TITLE_GAP}px 0 0`,
+  minWidth: 0,
+  overflowWrap: 'anywhere',
   color: A.INK,
   fontFamily: SANS,
 };
@@ -134,12 +130,15 @@ export const AboutSection: React.FC<AboutSectionProps> = ({
         <div
           style={{
             display: 'flex',
-            alignItems: 'baseline',
+            alignItems: 'last baseline',
             justifyContent: 'space-between',
             gap: 12,
           }}
         >
-          {kicker ? <span style={VERDICT_KICKER_INK}>{kicker}</span> : <span aria-hidden="true" />}
+          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
+            {kicker ? <span style={{ ...VERDICT_KICKER_INK, display: 'block' }}>{kicker}</span> : null}
+            <h2 id={id} style={TAB_TITLE}>{title}</h2>
+          </div>
           {meta ? (
             <span
               className="tabular-nums lining-nums"
@@ -149,7 +148,6 @@ export const AboutSection: React.FC<AboutSectionProps> = ({
             </span>
           ) : null}
         </div>
-        <h2 id={id} style={TAB_TITLE}>{title}</h2>
       </div>
     ) : heading ? (
       <div style={{ padding: `0 ${GUTTER}px` }}>
diff --git a/src/components/courses/course-detail/about/AllHolesSheet.tsx b/src/components/courses/course-detail/about/AllHolesSheet.tsx
index ca86a98353..10265bbf59 100644
--- a/src/components/courses/course-detail/about/AllHolesSheet.tsx
+++ b/src/components/courses/course-detail/about/AllHolesSheet.tsx
@@ -1,4 +1,5 @@
 import { useGuestSheetScrollGate } from '@/features/guest/useGuestSurfaceGate';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 import { PopulationCaption } from '@/features/courses/components/holes/analytical/PopulationCaption';
 import React from 'react';
 import { useTranslation } from 'react-i18next';
@@ -337,9 +338,9 @@ const AllHolesSheet: React.FC<AllHolesSheetProps> = ({ open, onClose, courseId,
       style={{ height: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}
     >
       <header style={{ flex: '0 0 auto', padding: '2px 20px 16px', borderBottom: `1px solid ${A.HAIRLINE}` }}>
-        <div style={{ ...ABOUT_KICKER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
-        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 5 }}>
-          <h2 id="all-holes-sheet-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: A.INK }}>
+        <div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
+        <div style={{ display: 'flex', alignItems: 'last baseline', justifyContent: 'space-between', gap: 12, marginTop: SECTION_TITLE_GAP }}>
+          <h2 id="all-holes-sheet-title" style={{ ...SECTION_TITLE, margin: 0, minWidth: 0, overflowWrap: 'anywhere', color: A.INK }}>
             {t('courseDetail.allHolesSheet.title')}
           </h2>
           <span style={{ ...FIGURE, flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: 0, color: A.DIM }}>
@@ -379,6 +380,7 @@ const AllHolesSheet: React.FC<AllHolesSheetProps> = ({ open, onClose, courseId,
             {ladder ? (
               <AboutSection
                 heading={t('courseDetail.allHolesSheet.ladder')}
+                wrapHeading
                 meta={t('courseDetail.allHolesSheet.outOfStep', { count: ladder.flagged.length })}
               >
                 <PopulationCaption includesYou={hasYou} style={{ marginBottom: 10 }} />
diff --git a/src/components/courses/course-detail/you/YourHolesSheet.tsx b/src/components/courses/course-detail/you/YourHolesSheet.tsx
index d2b3c107f1..1e43035f72 100644
--- a/src/components/courses/course-detail/you/YourHolesSheet.tsx
+++ b/src/components/courses/course-detail/you/YourHolesSheet.tsx
@@ -1,4 +1,5 @@
 import { useGuestSheetScrollGate } from '@/features/guest/useGuestSurfaceGate';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 import React from 'react';
 import { useTranslation } from 'react-i18next';
 import { BottomSheet } from '@/components/ui/BottomSheet';
@@ -167,9 +168,9 @@ const YourHolesSheet: React.FC<Props> = ({ open, onClose, courseId, courseName }
       style={{ height: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}
     >
       <header style={{ flex: '0 0 auto', padding: '2px 20px 16px', borderBottom: `1px solid ${A.HAIRLINE}` }}>
-        <div style={{ ...ABOUT_KICKER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
-        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 5 }}>
-          <h2 id="your-holes-sheet-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: A.INK }}>
+        <div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
+        <div style={{ display: 'flex', alignItems: 'last baseline', justifyContent: 'space-between', gap: 12, marginTop: SECTION_TITLE_GAP }}>
+          <h2 id="your-holes-sheet-title" style={{ ...SECTION_TITLE, margin: 0, minWidth: 0, overflowWrap: 'anywhere', color: A.INK }}>
             {t('courseDetail.yourHolesSheet.title')}
           </h2>
           <span style={{ ...FIGURE, flexShrink: 0, fontSize: 11, fontWeight: 700, color: A.DIM }}>
diff --git a/src/components/courses/course-detail/you/YourRoundsSheet.tsx b/src/components/courses/course-detail/you/YourRoundsSheet.tsx
index 4d46b494a5..92173245eb 100644
--- a/src/components/courses/course-detail/you/YourRoundsSheet.tsx
+++ b/src/components/courses/course-detail/you/YourRoundsSheet.tsx
@@ -1,4 +1,5 @@
 import { useGuestSheetScrollGate } from '@/features/guest/useGuestSurfaceGate';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 import React from 'react';
 import { ChevronRight } from 'lucide-react';
 import { useTranslation } from 'react-i18next';
@@ -108,9 +109,9 @@ const YourRoundsSheet: React.FC<Props> = ({ open, onClose, courseId, courseName,
         style={{ height: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}
       >
         <header style={{ flex: '0 0 auto', padding: '2px 20px 16px', borderBottom: `1px solid ${A.HAIRLINE}` }}>
-          <div style={{ ...ABOUT_KICKER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
-          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 5 }}>
-            <h2 id="your-rounds-sheet-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: A.INK }}>
+          <div style={{ ...ABOUT_KICKER, ...SECTION_EYEBROW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
+          <div style={{ display: 'flex', alignItems: 'last baseline', justifyContent: 'space-between', gap: 12, marginTop: SECTION_TITLE_GAP }}>
+            <h2 id="your-rounds-sheet-title" style={{ ...SECTION_TITLE, margin: 0, minWidth: 0, overflowWrap: 'anywhere', color: A.INK }}>
               {t('courseDetail.yourRoundsSheet.title')}
             </h2>
             <span style={{ ...FIGURE, flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: 0, color: A.DIM }}>
diff --git a/src/features/courses/_shared/scorecard/scorecardParts.tsx b/src/features/courses/_shared/scorecard/scorecardParts.tsx
index a50bbe1e72..9c4fed5fa7 100644
--- a/src/features/courses/_shared/scorecard/scorecardParts.tsx
+++ b/src/features/courses/_shared/scorecard/scorecardParts.tsx
@@ -24,7 +24,7 @@ import { TREND_UP, TREND_DOWN, TOPAR_EVEN_DARK } from '@/features/tourhub/_share
 import {
   A, SANS, NUM, KICKER, Panel, StatRow,
 } from '@/features/courses/components/holes/analytical/tokens';
-import { LABEL as LABEL_METRICS, TITLE as TITLE_METRICS } from '@/lib/tokens/type';
+import { LABEL as LABEL_METRICS, TITLE as TITLE_METRICS, SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 
 export const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.MUTE };
 export const TITLE: React.CSSProperties = { ...TITLE_METRICS, color: A.INK };
@@ -524,12 +524,12 @@ export const RoundSummaryHead: React.FC<RoundSummaryHeadProps> = ({
       {(courseLocation || top100Slot) && (
         <div data-scorecard-kicker="true" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
           {courseLocation && (
-            <span style={{ ...TILE_KICKER, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{courseLocation}</span>
+            <span style={{ ...TILE_KICKER, ...SECTION_EYEBROW, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{courseLocation}</span>
           )}
           {top100Slot}
         </div>
       )}
-      <h2 style={{ margin: 0, marginTop: 7, minWidth: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, color: TILE_INK }}>
+      <h2 style={{ ...SECTION_TITLE, margin: 0, marginTop: SECTION_TITLE_GAP, minWidth: 0, color: TILE_INK }}>
         {courseTap ? (
           <button
             type="button"
diff --git a/src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx b/src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx
index d53033a558..4ca4f2e69c 100644
--- a/src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx
+++ b/src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx
@@ -11,6 +11,7 @@
  * chart and the hole rows.
  */
 import { PopulationCaption } from './PopulationCaption';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 import { Extremes } from './Extremes';
 import React, { useMemo, useState } from 'react';
 import { useTranslation } from 'react-i18next';
@@ -852,7 +853,7 @@ export const CourseAnalyticsPanels: React.FC<Props> = ({
               gap: 10,
             }}
           >
-            <div style={KICKER}>{t('courses:holes.preview.eyebrow')}</div>
+            <div style={{ ...KICKER, ...SECTION_EYEBROW }}>{t('courses:holes.preview.eyebrow')}</div>
             {/* THE ROUNDS COUNT IS META (§B2), right-aligned, the same treatment
                 every other panel's sample size takes - not a sentence. */}
             {totalRounds > 0 && (
@@ -862,7 +863,7 @@ export const CourseAnalyticsPanels: React.FC<Props> = ({
           </div>
           <h2
             id="course-holes-sheet-title"
-            style={{ margin: '3px 0 6px', fontSize: 17, fontWeight: 700, color: A.INK }}
+            style={{ ...SECTION_TITLE, margin: `${SECTION_TITLE_GAP}px 0 6px`, overflowWrap: 'anywhere', color: A.INK }}
           >
             {t('courses:courseDetail.holes.sheetTitle')}
           </h2>
diff --git a/src/features/courses/components/holes/analytical/CourseCardPanel.tsx b/src/features/courses/components/holes/analytical/CourseCardPanel.tsx
index 8930a20b08..1854089c56 100644
--- a/src/features/courses/components/holes/analytical/CourseCardPanel.tsx
+++ b/src/features/courses/components/holes/analytical/CourseCardPanel.tsx
@@ -41,6 +41,7 @@
  * already loads. No new query.
  */
 import React, { useEffect, useMemo, useState } from 'react';
+import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
 import { useTranslation } from 'react-i18next';
 import { BottomSheet } from '@/components/ui/BottomSheet';
 import { useProfileData } from '@/hooks/useProfileData';
@@ -1400,16 +1401,14 @@ export const CourseCardPanel: React.FC<Props> = ({ courseId, courseName, embedde
         }}
       >
         <div style={{ padding: '0 16px 12px' }}>
-          <div style={SHEET_EYEBROW}>{t('courses:teeCard.eyebrow')}</div>
+          <div style={{ ...SHEET_EYEBROW, ...SECTION_EYEBROW }}>{t('courses:teeCard.eyebrow')}</div>
           {/* The heading names the COURSE - it must not restate the tee pill. */}
           <h2
             id="course-card-sheet-title"
             style={{
-              margin: '3px 0 0',
-              fontSize: 22,
-              fontWeight: 700,
-              letterSpacing: '-0.025em',
-              lineHeight: 1.1,
+              ...SECTION_TITLE,
+              margin: `${SECTION_TITLE_GAP}px 0 0`,
+              overflowWrap: 'anywhere',
               color: A.INK,
             }}
           >
```

## Wraps and mid-word audit

New wraps, including long-name samples, are listed below. Same text and data in each pair. No new three-line Champions title and no measured mid-word split.

| State | Width | Full title | Before lines | After lines |
|---|---:|---|---:|---:|
| champions-projected | 390 | It would take better than your best here | 1 | 2 |
| champions-projected | 320 | Your golf reaches zero of these | 1 | 2 |
| reviews-few | 320 | Sundridge Park (East) sits at 8.3 | 1 | 2 |
| you-many | 320 | Everything else you have put in | 1 | 2 |
| all-holes | 320 | Stroke index against how it plays | 1 | 2 |
| name-check | 320 | Missing Links Driving Range, Golf Course, Miniature Golf, Toptracer, Sports Bar sits at 8.3 | 3 | 4 |
| name-check | 320 | Runaway Bay Golf Club (Historically associated with SuperClubs Resorts) sits at 8.3 | 3 | 4 |
| meta-wrap | 320 | Where the score comes from | 1 | 2 |

Original accepted 390 AllHoles ladder also changes 1→2 lines, as recorded in captures/before and captures/after measurements. Media intro at 320 improves 3→2 lines. Existing many verdict and SingleReview title wraps remain unchanged.

### Longest-name source and every three/four-line case

A complete **public read-only REST** catalogue page walk returned 23,322 course-name rows on 23 Nov 2026. No SQL statement was executed. The three names below were sorted by actual name length and then name; they seed temporary read-only fixtures. Both founder examples were additionally checked. WhatPeopleSay uses its real source grammar, which prints the community score/count rather than interpolating the course name; all five WhatPeopleSay headings remain “8.3 from three golfers”, one line. No substitute copy was invented.

| Course name | TheVerdict before→after lines | WhatPeopleSay before→after | FewReviews sits-at before→after | Mid-word breaks |
|---|---|---|---|---|
| Missing Links Driving Range, Golf Course, Miniature Golf, Toptracer, Sports Bar | 4→4 | 1→1 | 3→4 | None |
| Chaudhary Group Golf Club (Also known as Miraaya Wellness and Golf Resort) | 4→4 | 1→1 | 4→4 | None |
| Runaway Bay Golf Club (Historically associated with SuperClubs Resorts) | 4→4 | 1→1 | 3→4 | None |
| St Andrews Links (Jubilee) | 2→2 | 1→1 | 2→2 | None |
| Royal County Down Golf Club (Championship) | 3→3 | 1→1 | 2→2 | None |

**Each three/four-line title, unchanged:**

- name-check · 320px · 4 lines: **Missing Links Driving Range, Golf Course, Miniature Golf, Toptracer, Sports Bar takes eight shots off the field**
- name-check · 320px · 4 lines: **Missing Links Driving Range, Golf Course, Miniature Golf, Toptracer, Sports Bar sits at 8.3**
- name-check · 320px · 4 lines: **Chaudhary Group Golf Club (Also known as Miraaya Wellness and Golf Resort) takes eight shots off the field**
- name-check · 320px · 4 lines: **Chaudhary Group Golf Club (Also known as Miraaya Wellness and Golf Resort) sits at 8.3**
- name-check · 320px · 4 lines: **Runaway Bay Golf Club (Historically associated with SuperClubs Resorts) takes eight shots off the field**
- name-check · 320px · 4 lines: **Runaway Bay Golf Club (Historically associated with SuperClubs Resorts) sits at 8.3**
- name-check · 320px · 3 lines: **Royal County Down Golf Club (Championship) takes eight shots off the field**

No mid-word case to list: every inspected Unicode word stays on one line. These checks do not prove every possible name/data/locale/device combination.

## Tests and reconciled count

No tests changed in close-out. Accepted implementation adds exactly six cases in `src/test/courseDetailHeadingCanon.test.tsx` (0→6):

- AboutSection title and eyebrow use the canonical metrics
- Sec title and own-data eyebrow use the canonical metrics
- AboutSection keeps unshrinking meta beside the title on its last baseline
- the Reviews nobody-rated one-off title and eyebrow use the canonical metrics
- the flat Media empty-section title uses the canonical title
- YourRoundsSheet title and course-name eyebrow use the canonical metrics

Title assertions quote concrete canon: `fontSize="21px"`, `fontWeight="700"`, `letterSpacing="-0.035em"`, `lineHeight="1.05"`. Eyebrows assert `11px` and `0.16em`. Meta case asserts `last baseline`, minWidth `0`, flexShrink `0`, nowrap. Real QueryClient/MemoryRouter/I18nextProvider are used, not a partial translation mock.

One authorised existing assertion changed in `src/test/eyebrowColourCanon.test.tsx:45`, case **Courses public verdict kicker computes to ink**. Before:

```tsx
expect(colour(container, 'section > div > div > span')).toBe('rgb(248, 250, 252)');
```
After:

```tsx
expect(colour(container, 'section > div > div > div > span')).toBe('rgb(248, 250, 252)');
```
Why: follow the newly inserted title column to the same declaration-bearing eyebrow span; colour expectation unchanged. Colour file stays 10 cases. No existing case deleted, renamed or rewritten beyond this one selector assertion.

**Before:** 10,139 /882 files. **After:** 10,145 /883 files, exactly +6 named cases /+1 file. No other test-count delta. Individual shard totals repartition when a test file enters the suite; they are not counts of new/deleted cases.

Focused command: `./node_modules/.bin/vitest run src/test/courseDetailHeadingCanon.test.tsx src/test/eyebrowColourCanon.test.tsx` → 16/16 across 2 files.

Four separate sequential commands, retained accepted runs (not rerun in close-out):

| Command | Passed tests | Passed files | Exit |
|---|---:|---:|---:|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,453 | 221 | 0 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,477 | 221 | 0 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,480 | 221 | 0 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,735 | 220 | 0 |
| **Total** | **10,145** | **883** | **0 failures** |

Full raw test logs remain local at `/tmp/brief8/shard-{1,2,3,4}.log`, focused-final.log; SHA-256:

- shard-1.log: `82a792a8f078b3bb7db4c79799ea23913c6f6b3363be10ab3a1fe794b9747718`
- shard-2.log: `da1b45ab00212ce94eede06a718b18a98f464a6f5d6301d45ca850c5820e7195`
- shard-3.log: `d7af807caad453b5b43031e8bb0fe1f4f5466916964af084d00989ef49115f33`
- shard-4.log: `65b4433f82ab9a9fb18ab5fd19855de8700cf7bf034dacf8823a55dbd703eb4e`

## Capture manifest and methodology

- Existing accepted captures: `captures/before/` (38 PNGs) and `captures/after/` (42 PNGs), including Course full-scroll chunks, Reviews few/single/nobody, You many/not-connected, Media populated/empty/ready grid, AllHoles/YourRounds/YourHoles/Claim/analytics/card-panel/scorecard/ShotTagCard and meta specimen.
- Close-out: `captures/closeout/{before,after}/`. Each requested Champions state has 390/320 top screenshots plus an element screenshot of every h2, so offscreen What it takes/Defence titles are visible. Retained helper specimen is separate. Each of the five long-name cases has a top shot and all four h2 element captures at 320 in both versions.
- `captures/closeout/measurements.json` records all heading strings, scalar metrics, line counts, word-boundary splits, errors and overflow for every audited sample; `course-names.json` records the three longest public names used.
- Browser capture scripts/raw browser logs stay local under /tmp/browser/brief8 and /tmp/browser/brief8-closeout. Initial historical module fetching interrupted with `Route.fetch: read ECONNRESET`; preview returned 200/build OK. Caching the fourteen transformed historical modules before opening pages completed the full audit without errors. This was a capture transport interruption, not a test failure or a production change.
- No session minted or sign-in needed: isolated fixture renderings exercise actual components with mocked reads; all writes are inert and REST/function requests are stubbed during capture. Public course-name census ran separately using the existing public reader.
- Temporary historical modules and pages are removed before commit. No builds/typechecks or suite reruns were added by close-out.

### Every close-out image

- `captures/closeout/before/champions-elsewhere-320-title-1.png`
- `captures/closeout/before/champions-elsewhere-320-top.png`
- `captures/closeout/before/champions-elsewhere-390-title-1.png`
- `captures/closeout/before/champions-elsewhere-390-top.png`
- `captures/closeout/before/champions-field-320-title-1.png`
- `captures/closeout/before/champions-field-320-title-2.png`
- `captures/closeout/before/champions-field-320-title-3.png`
- `captures/closeout/before/champions-field-320-top.png`
- `captures/closeout/before/champions-field-390-title-1.png`
- `captures/closeout/before/champions-field-390-title-2.png`
- `captures/closeout/before/champions-field-390-title-3.png`
- `captures/closeout/before/champions-field-390-top.png`
- `captures/closeout/before/champions-nobody-320-title-1.png`
- `captures/closeout/before/champions-nobody-320-top.png`
- `captures/closeout/before/champions-nobody-390-title-1.png`
- `captures/closeout/before/champions-nobody-390-top.png`
- `captures/closeout/before/champions-posted-320-title-1.png`
- `captures/closeout/before/champions-posted-320-title-2.png`
- `captures/closeout/before/champions-posted-320-title-3.png`
- `captures/closeout/before/champions-posted-320-top.png`
- `captures/closeout/before/champions-posted-390-title-1.png`
- `captures/closeout/before/champions-posted-390-title-2.png`
- `captures/closeout/before/champions-posted-390-title-3.png`
- `captures/closeout/before/champions-posted-390-top.png`
- `captures/closeout/before/champions-projected-320-title-1.png`
- `captures/closeout/before/champions-projected-320-title-2.png`
- `captures/closeout/before/champions-projected-320-title-3.png`
- `captures/closeout/before/champions-projected-320-top.png`
- `captures/closeout/before/champions-projected-390-title-1.png`
- `captures/closeout/before/champions-projected-390-title-2.png`
- `captures/closeout/before/champions-projected-390-title-3.png`
- `captures/closeout/before/champions-projected-390-top.png`
- `captures/closeout/before/champions-retained-320-title-1.png`
- `captures/closeout/before/champions-retained-320-top.png`
- `captures/closeout/before/champions-retained-390-title-1.png`
- `captures/closeout/before/champions-retained-390-top.png`
- `captures/closeout/before/name-check-0-320-title-1.png`
- `captures/closeout/before/name-check-0-320-title-2.png`
- `captures/closeout/before/name-check-0-320-title-3.png`
- `captures/closeout/before/name-check-0-320-title-4.png`
- `captures/closeout/before/name-check-0-320-top.png`
- `captures/closeout/before/name-check-1-320-title-1.png`
- `captures/closeout/before/name-check-1-320-title-2.png`
- `captures/closeout/before/name-check-1-320-title-3.png`
- `captures/closeout/before/name-check-1-320-title-4.png`
- `captures/closeout/before/name-check-1-320-top.png`
- `captures/closeout/before/name-check-2-320-title-1.png`
- `captures/closeout/before/name-check-2-320-title-2.png`
- `captures/closeout/before/name-check-2-320-title-3.png`
- `captures/closeout/before/name-check-2-320-title-4.png`
- `captures/closeout/before/name-check-2-320-top.png`
- `captures/closeout/before/name-check-3-320-title-1.png`
- `captures/closeout/before/name-check-3-320-title-2.png`
- `captures/closeout/before/name-check-3-320-title-3.png`
- `captures/closeout/before/name-check-3-320-title-4.png`
- `captures/closeout/before/name-check-3-320-top.png`
- `captures/closeout/before/name-check-4-320-title-1.png`
- `captures/closeout/before/name-check-4-320-title-2.png`
- `captures/closeout/before/name-check-4-320-title-3.png`
- `captures/closeout/before/name-check-4-320-title-4.png`
- `captures/closeout/before/name-check-4-320-top.png`
- `captures/closeout/after/champions-elsewhere-320-title-1.png`
- `captures/closeout/after/champions-elsewhere-320-top.png`
- `captures/closeout/after/champions-elsewhere-390-title-1.png`
- `captures/closeout/after/champions-elsewhere-390-top.png`
- `captures/closeout/after/champions-field-320-title-1.png`
- `captures/closeout/after/champions-field-320-title-2.png`
- `captures/closeout/after/champions-field-320-title-3.png`
- `captures/closeout/after/champions-field-320-top.png`
- `captures/closeout/after/champions-field-390-title-1.png`
- `captures/closeout/after/champions-field-390-title-2.png`
- `captures/closeout/after/champions-field-390-title-3.png`
- `captures/closeout/after/champions-field-390-top.png`
- `captures/closeout/after/champions-nobody-320-title-1.png`
- `captures/closeout/after/champions-nobody-320-top.png`
- `captures/closeout/after/champions-nobody-390-title-1.png`
- `captures/closeout/after/champions-nobody-390-top.png`
- `captures/closeout/after/champions-posted-320-title-1.png`
- `captures/closeout/after/champions-posted-320-title-2.png`
- `captures/closeout/after/champions-posted-320-title-3.png`
- `captures/closeout/after/champions-posted-320-top.png`
- `captures/closeout/after/champions-posted-390-title-1.png`
- `captures/closeout/after/champions-posted-390-title-2.png`
- `captures/closeout/after/champions-posted-390-title-3.png`
- `captures/closeout/after/champions-posted-390-top.png`
- `captures/closeout/after/champions-projected-320-title-1.png`
- `captures/closeout/after/champions-projected-320-title-2.png`
- `captures/closeout/after/champions-projected-320-title-3.png`
- `captures/closeout/after/champions-projected-320-top.png`
- `captures/closeout/after/champions-projected-390-title-1.png`
- `captures/closeout/after/champions-projected-390-title-2.png`
- `captures/closeout/after/champions-projected-390-title-3.png`
- `captures/closeout/after/champions-projected-390-top.png`
- `captures/closeout/after/champions-retained-320-title-1.png`
- `captures/closeout/after/champions-retained-320-top.png`
- `captures/closeout/after/champions-retained-390-title-1.png`
- `captures/closeout/after/champions-retained-390-top.png`
- `captures/closeout/after/name-check-0-320-title-1.png`
- `captures/closeout/after/name-check-0-320-title-2.png`
- `captures/closeout/after/name-check-0-320-title-3.png`
- `captures/closeout/after/name-check-0-320-title-4.png`
- `captures/closeout/after/name-check-0-320-top.png`
- `captures/closeout/after/name-check-1-320-title-1.png`
- `captures/closeout/after/name-check-1-320-title-2.png`
- `captures/closeout/after/name-check-1-320-title-3.png`
- `captures/closeout/after/name-check-1-320-title-4.png`
- `captures/closeout/after/name-check-1-320-top.png`
- `captures/closeout/after/name-check-2-320-title-1.png`
- `captures/closeout/after/name-check-2-320-title-2.png`
- `captures/closeout/after/name-check-2-320-title-3.png`
- `captures/closeout/after/name-check-2-320-title-4.png`
- `captures/closeout/after/name-check-2-320-top.png`
- `captures/closeout/after/name-check-3-320-title-1.png`
- `captures/closeout/after/name-check-3-320-title-2.png`
- `captures/closeout/after/name-check-3-320-title-3.png`
- `captures/closeout/after/name-check-3-320-title-4.png`
- `captures/closeout/after/name-check-3-320-top.png`
- `captures/closeout/after/name-check-4-320-title-1.png`
- `captures/closeout/after/name-check-4-320-title-2.png`
- `captures/closeout/after/name-check-4-320-title-3.png`
- `captures/closeout/after/name-check-4-320-title-4.png`
- `captures/closeout/after/name-check-4-320-top.png`
