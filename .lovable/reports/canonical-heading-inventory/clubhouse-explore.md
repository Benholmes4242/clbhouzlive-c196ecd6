# Clubhouse / feed / Explore / Watch typography inventory

Read-only source audit. Comparison is the **task’s Courses canon**, not misleading legacy comments: eyebrow 11/700/.16em/uppercase/1/white-or-ink; title 21/700/−.035em/1.05/ink. Sizes are px. `inherited` means no local declaration resolved to a guaranteed value; it is explicitly not assumed to match. Tailwind defaults: text-sm 14/20px, base 16/24px, lg 18/28px; medium 500, semibold 600. Tables record distinct source treatments, not every repeated runtime item. Shared variants are counted once unless different consumers materially change them. Sheet-own titles are SHEET TITLE even when implemented as a div. Page identity and empty-state headings map to SECTION TITLE because the supplied taxonomy has no PAGE TITLE role.

**Token resolution:** `src/lib/tokens/type.ts`: KICKER 9/700/.19em/uppercase (no line-height); TITLE 17/700/−.032em/1.2. Actual analytical KICKER (`src/features/courses/components/holes/analytical/tokens.tsx:274`) is 11/700/.16em/uppercase, A.INK; LABEL :257 is 11/700/.13em/A.DIM. Discover overrides KICKER colour to #fff/.70, not ink; do not infer its values from its stale “10px” comments. A.INK=#F8FAFC, A.MUTE=rgba(248,250,252,.62), A.DIM=.42, A.AMBER=#F7931E. Body and alpha ink are classified muted.

## Inventory

### Clubhouse/feed

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Clubhouse/feed | Friends empty | src/components/clubhouse/FriendsEmptyState.tsx:185 | Your clubhouse | 13 | 700 | .14em | inherited | amber #F7931E | SECTION EYEBROW | size 13 vs 11; tracking .14em vs .16em; line-height inherited vs 1; amber vs white/ink |
| Clubhouse/feed | Friends empty | src/components/clubhouse/FriendsEmptyState.tsx:198 | Build your fourball / Fourball complete | 26 | 700 | -.01em | 1.15 | white | SECTION TITLE | title 26 vs 21; tracking -.01em vs -.035em; line-height 1.15 vs 1.05 |
| Clubhouse/feed | Course stats | src/components/feed/CourseStatsSheet.tsx:170 | kickerStyle | 9 | 700 | .16em | inherited | amber | SHEET EYEBROW | size 9 vs 11; line-height inherited vs 1; amber vs white/ink |
| Clubhouse/feed | Course stats | src/components/feed/CourseStatsSheet.tsx:171 | h2 / TITLE | 17 | 700 | -.032em | 1.2 | white #F8FAFC | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Clubhouse/feed | Course stats | src/components/feed/CourseStatsSheet.tsx:48 | sectionLabel below figure | 8.5 | 700 | .14em | inherited | muted rgba ink .42 | FIGURE LABEL | — |
| Clubhouse/feed | Post golf context | src/components/feed/PostGolfContext.tsx:105 | facts.kicker above hole title | 9.5 | 700 | .16em | inherited | muted | SECTION EYEBROW | size 9.5 vs 11; line-height inherited vs 1; muted vs white/ink |
| Clubhouse/feed | Score post | src/components/feed/ScorePostBody.tsx:64 | cellLabel | 10 | 700 | .12em | inherited | muted A.DIM | FIGURE LABEL | — |
| Clubhouse/feed | Round feat | src/components/feed/roundTilePlot.tsx:316 | data-feed-round-feat | 9 | 700 | .14em | inherited | other: SC_FILL_GOLD gold | CHIP/BADGE | — |
| Clubhouse/feed | More options | src/components/clubhouse/MoreOptionsDrawer.tsx:272 | AlertDialogTitle: Block {usernameLabel}? | 18 | 600 | 0 | 28px | ink (foreground/inherited) | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 28px vs 1.05 |
| Clubhouse/feed | More options | src/components/clubhouse/MoreOptionsDrawer.tsx:298 | AlertDialogTitle: Delete Post? | 18 | 600 | 0 | 28px | ink (foreground/inherited) | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 28px vs 1.05 |
| Clubhouse/feed | Owner menu | src/components/posts/PostOwnerMenu.tsx:219 | AlertDialogTitle: Delete Post? | 18 | 600 | 0 | 28px | ink (foreground/inherited) | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 28px vs 1.05 |

### Posts

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Posts | Review | src/components/posts/ReviewBottomSheet.tsx:497 | review context above name | 9.5 | 700 | .16em | inherited | muted DIM | SHEET EYEBROW | size 9.5 vs 11; line-height inherited vs 1; muted vs white/ink |
| Posts | Review | src/components/posts/ReviewBottomSheet.tsx:509 | review-sheet-title / course name | 22 | 700 | -.02em | 1.15 | ink INK | SHEET TITLE | title 22 vs 21; tracking -.02em vs -.035em; line-height 1.15 vs 1.05 |
| Posts | Emoji picker | src/components/posts/EmojiPicker.tsx:35 | Add Emoji | 14 | 500 | 0 | 20px | other: gray-900 | SHEET TITLE | title 14 vs 21; weight 500 vs 700; tracking 0 vs -.035em; line-height 20px vs 1.05; gray-900 on light legacy surface |
| Posts | Scheduled list | src/components/post/scheduled/ScheduledPostsList.tsx:52 | Scheduled Posts | 18 | 600 | 0 | 28px | white/ink #F2F4F7 | SECTION TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 28px vs 1.05 |
| Posts | Gallery picker | src/components/post/GalleryPicker.tsx:160 | h3 | 14 | 600 | 0 | 20px | inherited ink | SECTION TITLE | title 14 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 20px vs 1.05 |
| Posts | Gallery preview | src/components/post/gallery-picker/MultiSelectPreview.tsx:16 | Selected Media ({n}) | 16 | 600 | 0 | 24px | inherited ink | SECTION TITLE | title 16 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 24px vs 1.05 |

### Fullscreen/media

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Fullscreen/media | Course gallery | src/components/fullscreen-feed/course-gallery.css:40 | .course-gallery-kicker (hole group header, not photo eyebrow) | 9.5 | 700 | .16em | inherited | muted rgba ink .68 | ROW/GROUP LABEL | — |
| Fullscreen/media | Course gallery | src/components/fullscreen-feed/course-gallery.css:46 | .course-gallery-stats span | 8.5 | 700 | .12em | inherited | muted rgba ink .68 | FIGURE LABEL | — |
| Fullscreen/media | Fullscreen stack | src/components/fullscreen-feed/fullscreen-stack.css:12 | .fs-following | 10 | 700 | .14em | inherited | muted rgba ink .62 | CHIP/BADGE | — |
| Fullscreen/media | Fullscreen stack | src/components/fullscreen-feed/fullscreen-stack.css:19 | .fs-stats span | 8.5 | 700 | .1em | 10px | muted rgba ink .62 | FIGURE LABEL | — |
| Fullscreen/media | Immersive viewer | src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx:493 | Want to play / Played (viewer record) | 8.5 | 700 | .12em | 1 | amber own want-to-play / white played | CHIP/BADGE | — |

### Explore

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Explore | Rounds shared sections | src/features/explore-magazine/Section.tsx:66 | Section eyebrow, contest branch | 11 | 700 | .16em | 1 | amber A.AMBER if contest; otherwise muted A.DIM | SECTION EYEBROW | colour amber/muted vs white/ink |
| Explore | Rounds shared sections | src/features/explore-magazine/Section.tsx:77 | Section title | 19 | 700 | -.02em | 1.1 | ink A.INK | SECTION TITLE | title 19 vs 21; tracking -.02em vs -.035em; line-height 1.1 vs 1.05 |
| Explore | Shared shelves | src/features/explore-magazine/ExploreShelf.tsx:23 | SHELF_HEADING / heading span :96 | 16 | 700 | -.015em | inherited | ink A.INK | SECTION TITLE | title 16 vs 21; tracking -.015em vs -.035em; line-height inherited vs 1.05 |
| Explore | Discover section primitive | src/components/explore-tab-new/courseled/tokens.tsx:164 | SECTION_TITLE / DiscoverSectionHeading | 17 | 700 | -.02em | 1.2 | muted #fff/.70 | SECTION TITLE | title 17 vs 21; tracking -.02em vs -.035em; line-height 1.2 vs 1.05; muted vs ink |
| Explore | Discover eyebrow-only groups | src/components/explore-tab-new/courseled/tokens.tsx:186 | Eyebrow / EYEBROW_TEXT; subline is prose, not title | 11 | 700 | .16em | 1 | muted #fff/.70 | ROW/GROUP LABEL | — |
| Explore | Find golfers | src/components/explore-tab-new/FindGolfersSheet.tsx:498 | The members / KICKER | 11 | 700 | .16em | inherited | muted #fff/.70 | SHEET EYEBROW | line-height inherited vs 1; muted vs white/ink |
| Explore | Find golfers | src/components/explore-tab-new/FindGolfersSheet.tsx:499 | Find golfers / TITLE_METRICS | 17 | 700 | -.032em | 1.2 | ink A.INK | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Explore | Find golfers | src/components/explore-tab-new/FindGolfersSheet.tsx:628 | reasonLabel / KICKER; no title underneath | 11 | 700 | .16em | inherited | muted #fff/.70 | ROW/GROUP LABEL | — |
| Explore | Region | src/components/explore-tab-new/RegionSheet.tsx:38 | Region | 11 | 600 | .06em | inherited | ink #F8FAFC | SHEET EYEBROW | weight 600 vs 700; tracking .06em vs .16em; line-height inherited vs 1 |
| Explore | Region | src/components/explore-tab-new/RegionSheet.tsx:50 | Browse by region / TITLE_METRICS | 17 | 700 | -.032em | 1.2 | ink #F8FAFC | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Explore | Latest reviews | src/components/explore-tab-new/courseled/LatestReviewsSheet.tsx:215 | caption / KICKER | 11 | 700 | .16em | inherited | muted A.DIM | SHEET EYEBROW | line-height inherited vs 1; muted vs white/ink |
| Explore | Latest reviews | src/components/explore-tab-new/courseled/LatestReviewsSheet.tsx:217 | Latest reviews / TITLE_METRICS | 17 | 700 | -.032em | 1.2 | ink A.INK | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Explore | Board see all / shared shell | src/components/explore-tab-new/courseled/ExploreSheetShell.tsx:37 | h2 / title | 14.5 | 700 | 0 | inherited | ink A.INK | SHEET TITLE | title 14.5 vs 21; tracking 0 vs -.035em; line-height inherited vs 1.05 |
| Explore | Courses played see all | src/components/explore-tab-new/courseled/CoursesPlayedSeeAllSheet.tsx:81 | DiscoverSectionHeading title | 17 | 700 | -.02em | 1.2 | muted #fff/.70 | SHEET TITLE | title 17 vs 21; tracking -.02em vs -.035em; line-height 1.2 vs 1.05; muted vs ink |
| Explore | Courses played detail | src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx:509 | h3 | 15 | 800 | 0 | 1.25 | ink A.INK | SECTION TITLE | title 15 vs 21; weight 800 vs 700; tracking 0 vs -.035em; line-height 1.25 vs 1.05 |
| Explore | How they played detail | src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx:201 | h3 | 15 | 800 | 0 | 1.25 | ink A.INK | SECTION TITLE | title 15 vs 21; weight 800 vs 700; tracking 0 vs -.035em; line-height 1.25 vs 1.05 |
| Explore | Leaderboards | src/features/explore-magazine/LeaderboardsSection.tsx:57 | selected category label | 8.5 | 800 | .11em | 11px | ink selected / muted otherwise | CHIP/BADGE | — |
| Explore | Achievement callout | src/features/explore-magazine/AchievementCallout.tsx:480 | small amber achievement label | 9 | 800 | .12em | 1 | amber A.AMBER | CHIP/BADGE | — |

### Watch

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Watch | New videos | src/features/watch-v2/components/HubVideoRow.tsx:306 | SectionHeader / LONG FORM | 11 | 700 | .14em | inherited | amber #F7931E | SECTION EYEBROW | tracking .14em vs .16em; line-height inherited vs 1; amber #F7931E vs white/ink |
| Watch | New videos | src/features/watch-v2/components/HubVideoRow.tsx:306 | SectionHeader / New videos | 20 | 700 | -.02em | 1.15 | ink A.INK | SECTION TITLE | title 20 vs 21; tracking -.02em vs -.035em; line-height 1.15 vs 1.05 |
| Watch | Quick clips | src/features/watch-v2/components/HubClipsRow.tsx:203 | SectionHeader / UNDER 90 SECONDS | 11 | 700 | .14em | inherited | muted A.MUTE | SECTION EYEBROW | tracking .14em vs .16em; line-height inherited vs 1; muted A.MUTE vs white/ink |
| Watch | Quick clips | src/features/watch-v2/components/HubClipsRow.tsx:203 | SectionHeader / Quick clips | 20 | 700 | -.02em | 1.15 | ink A.INK | SECTION TITLE | title 20 vs 21; tracking -.02em vs -.035em; line-height 1.15 vs 1.05 |
| Watch | Keep browsing | src/features/watch-v2/components/HubMixedGrid.tsx:103 | SectionHeader / EVERYTHING | 11 | 700 | .14em | inherited | muted A.MUTE | SECTION EYEBROW | tracking .14em vs .16em; line-height inherited vs 1; muted A.MUTE vs white/ink |
| Watch | Keep browsing | src/features/watch-v2/components/HubMixedGrid.tsx:103 | SectionHeader / Keep browsing | 20 | 700 | -.02em | 1.15 | ink A.INK | SECTION TITLE | title 20 vs 21; tracking -.02em vs -.035em; line-height 1.15 vs 1.05 |
| Watch | Featured deck | src/features/explore-magazine/watch/WatchFeaturedDeck.tsx:190 | .featured-kicker (featured.css:3) | 11 | 800 | .2em | inherited | amber var(--featured-amber) | SECTION EYEBROW | weight 800 vs 700; tracking .2em vs .16em; line-height inherited vs 1; amber vs white/ink |
| Watch | Featured deck | src/features/explore-magazine/watch/WatchFeaturedDeck.tsx:190 | .featured-title (featured.css:4) | 22 | 700 | -.02em | inherited | ink var(--featured-ink) | SECTION TITLE | title 22 vs 21; tracking -.02em vs -.035em; line-height inherited vs 1.05 |
| Watch | Watch feed rail | src/features/explore-magazine/watch/WatchFeed.tsx:134 | h2 | 17 | 800 | -.3px | inherited | ink A.INK | SECTION TITLE | title 17 vs 21; weight 800 vs 700; tracking -.3px vs -.035em; line-height inherited vs 1.05 |
| Watch | Watch feed main | src/features/explore-magazine/watch/WatchFeed.tsx:495 | h2 | 17 | 750 | -.01em | inherited | ink A.INK | SECTION TITLE | title 17 vs 21; weight 750 vs 700; tracking -.01em vs -.035em; line-height inherited vs 1.05 |
| Watch | Creators sheet | src/features/explore-magazine/watch/CreatorsRow.tsx:127 | Creators | 17 | 700 | -.01em | inherited | ink A.INK | SHEET TITLE | title 17 vs 21; tracking -.01em vs -.035em; line-height inherited vs 1.05 |
| Watch | Grid page identity | src/pages/WatchGridPage.tsx:93 | PageTitle (page-title.css:4) | 30 | 700 | 0 | 1.1 | ink var(--island-back-ink) | SECTION TITLE | title 30 vs 21; tracking 0 vs -.035em; line-height 1.1 vs 1.05 (page identity, not a section, mapped to required taxonomy) |

### Video details

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Video details | About video | src/features/video-details/VideoAboutSheet.tsx:30 | h2 (video-viewer.css:11) | 17 | 800 | 0 | 1.3 | ink var(--video-about-ink) | SHEET TITLE | title 17 vs 21; weight 800 vs 700; tracking 0 vs -.035em; line-height 1.3 vs 1.05 |
| Video details | About video | src/features/video-details/VideoAboutSheet.tsx:27 | .video-about-kicker; standalone section labels | 10.5 | 800 | .18em | inherited | muted var(--video-about-dim) | ROW/GROUP LABEL | — |
| Video details | Round score | src/features/video-details/RoundVideoScore.tsx:15 | SCORECARD / video-about-kicker | 10.5 | 800 | .18em | inherited | muted | ROW/GROUP LABEL | — |

### Composer

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Composer | Actor | src/features/post-v2/components/ActorSheet.tsx:20 | BottomSheet / Posting as | 17 | 700 | -.032em | 1.2 | ink CT.ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Composer | Adjust | src/features/post-v2/components/AdjustSheet.tsx:169 | BottomSheet / Adjust | 17 | 700 | -.032em | 1.2 | ink CT.ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Composer | Cover | src/features/post-v2/components/CoverFrameSheet.tsx:33 | BottomSheet / Cover frame | 17 | 700 | -.032em | 1.2 | ink CT.ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Composer | Drafts | src/features/post-v2/components/DraftsSheetV2.tsx:27 | BottomSheet / Drafts - {count} | 17 | 700 | -.032em | 1.2 | ink CT.ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Composer | Scheduled posts | src/features/post-v2/components/ScheduledPostsSheetV2.tsx:92 | BottomSheet / Scheduled posts | 17 | 700 | -.032em | 1.2 | ink CT.ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Composer | Video metadata | src/features/post-v2/components/video/VideoDetailsSheets.tsx:46 | BottomSheet / Add a credit / Add a link / Add a club or brand / Add gear | 17 | 700 | -.032em | 1.2 | ink CT.ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Composer | Schedule | src/features/post-v2/components/ScheduleSheetV2.tsx:24 | PostFlowHeader / .pf-header h3 (src/styles/post-flow.css:4) | 17 | 800 | inherited | inherited | ink | SHEET TITLE | title 17 vs 21; weight 800 vs 700; tracking inherited vs -.035em; line-height inherited vs 1.05 |
| Composer | Course tag | src/features/post-v2/components/CourseTagSheet.tsx:47 | PostFlowHeader / .pf-header h3 (src/styles/post-flow.css:4) | 17 | 800 | inherited | inherited | ink | SHEET TITLE | title 17 vs 21; weight 800 vs 700; tracking inherited vs -.035em; line-height inherited vs 1.05 |
| Composer | Post or review | src/features/composer-flow/ComposerFlowSheet.tsx:74 | .post-or-review-header h1 (post-or-review.css:11) | 24 | 700 | 0 | inherited | ink | SHEET TITLE | title 24 vs 21; tracking 0 vs -.035em; line-height inherited vs 1.05 |
| Composer | Post or review choice cards | src/features/composer-flow/ComposerFlowSheet.tsx:118 | .post-or-review-box-head h2 | 18 | 700 | 0 | inherited | ink | SECTION TITLE | title 18 vs 21; tracking 0 vs -.035em; line-height inherited vs 1.05 |
| Composer | Review course / keyboard search | src/features/composer-flow/KeyboardSearchSheet.tsx:29 | .rcs-head h1 (review-course-search.css:8) | 22 | 700 | 0 | inherited | ink #F8FAFC | SHEET TITLE | title 22 vs 21; tracking 0 vs -.035em; line-height inherited vs 1.05 |
| Composer | Review course groups | src/features/composer-flow/ReviewCourseSearchSheet.tsx:79 | .rcs-section h2 | 10.5 | 700 | .16em | 1 | muted ink .42 | ROW/GROUP LABEL | — |
| Composer | Posted celebration | src/features/post-v2/components/PostSuccessV2.tsx:70 | .pf-headline / success.posted | 30 | 800 | inherited | 1.1 | ink | SHEET TITLE | title 30 vs 21; weight 800 vs 700; tracking inherited vs -.035em; line-height 1.1 vs 1.05; intentional celebration |
| Composer | Scheduled celebration | src/features/post-v2/components/PostSuccessV2.tsx:90 | .pf-headline / scheduledHeadline | 30 | 800 | inherited | 1.1 | ink | SHEET TITLE | title 30 vs 21; weight 800 vs 700; tracking inherited vs -.035em; line-height 1.1 vs 1.05; intentional celebration |

### Comments

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Comments | Comments | src/features/comments-v2/CommentsSheetV2.tsx:427 | comments.sheetTitle | 19 | 700 | -.4px | inherited | ink INK | SHEET TITLE | title 19 vs 21; tracking -.4px vs -.035em; line-height inherited vs 1.05 |
| Comments | Comments count | src/features/comments-v2/CommentsSheetV2.tsx:439 | comments.count below title | 9.5 | 700 | .16em | inherited | muted A.DIM | FIGURE LABEL | — |
| Comments | Report comment | src/features/comments-v2/components/ReportCommentSheetV2.tsx:79 | REPORT COMMENT | 11 | 700 | .14em | inherited | amber | SHEET EYEBROW | tracking .14em vs .16em; line-height inherited vs 1; amber vs white/ink |
| Comments | Report comment | src/features/comments-v2/components/ReportCommentSheetV2.tsx:90 | Why are you reporting this? / TITLE_SCALE | 17 | 700 | -.032em | 1.2 | ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Comments | Report comment | src/features/comments-v2/components/ReportCommentSheetV2.tsx:142 | Details step title / TITLE_SCALE | 17 | 700 | -.032em | 1.2 | ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Comments | Report comment | src/features/comments-v2/components/ReportCommentSheetV2.tsx:197 | Thanks for letting us know / TITLE_SCALE | 17 | 700 | -.032em | 1.2 | ink | SHEET TITLE | title 17 vs 21; tracking -.032em vs -.035em; line-height 1.2 vs 1.05 |
| Comments | Comment dialog | src/features/comments-v2/CommentsSheetV2.tsx:576 | AlertDialogTitle / Edit comment | 18 | 600 | 0 | 28px | ink | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 28px vs 1.05 |
| Comments | Comment dialog | src/features/comments-v2/CommentsSheetV2.tsx:607 | AlertDialogTitle / Delete comment? | 18 | 600 | 0 | 28px | ink | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -.035em; line-height 28px vs 1.05 |

### Amateur ranking

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Amateur ranking | Link WAGR | src/features/amateur-ranking/WagrLinkSheet.tsx:51 | .wagr-heading (wagr-settings.css:15) | 22 | 700 | -.02em | normal | ink var(--ep-ink) | SHEET TITLE | title 22 vs 21; tracking -.02em vs -.035em; line-height normal vs 1.05 |
| Amateur ranking | Unlink WAGR | src/features/amateur-ranking/SettingsWagrCard.tsx:41 | .wagr-heading | 22 | 700 | -.02em | normal | ink var(--ep-ink) | SHEET TITLE | title 22 vs 21; tracking -.02em vs -.035em; line-height normal vs 1.05 |

### Guest

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Guest | Join gate | src/features/guest/GuestJoinCard.tsx:89 | .guest-gate-head (guestGate.css:75) | 26 | 800 | -.025em | 1.12 | ink #F8FAFC with amber headline spans | SECTION TITLE | title 26 vs 21; weight 800 vs 700; tracking -.025em vs -.035em; line-height 1.12 vs 1.05 |

| Guest | Join gate | src/features/guest/GuestJoinCard.tsx:88 | .guest-gate-kicker / copy.kicker | 11 | 700 | .14em | inherited | amber #F7931E | SECTION EYEBROW | tracking .14em vs .16em; line-height inherited vs 1; amber vs white/ink |

## Area count summary

Distinct source treatments; repeated runtime cards are not multiplied. Headings = five compared roles; labels/chips excluded.

| Area | Elements | Headings recorded | Headings differing |
|---|---:|---:|---:|
| Clubhouse/feed | 11 | 8 | 8 |
| Posts | 6 | 6 | 6 |
| Fullscreen/media | 5 | 0 | 0 |
| Explore | 18 | 14 | 14 |
| Watch | 12 | 12 | 12 |
| Video details | 3 | 1 | 1 |
| Composer | 14 | 13 | 13 |
| Comments | 8 | 7 | 7 |
| Amateur ranking | 2 | 2 | 2 |
| Guest | 2 | 2 | 2 |
| **Total** | **81** | **65** | **65** |

## (i) Tile / supporting text size differences from Courses

Reference: photo tile title 15/700; tile sub/meta 11.5; body 13. These are comparisons, not requests to turn body or card titles into section headings.

- **Clubhouse Friends empty** — `src/components/clubhouse/FriendsEmptyState.tsx:213`: supporting paragraph 15/1.5 rather than body 13.
- **Course statistics sheet** — `src/components/feed/CourseStatsSheet.tsx:191`: course location and rating 12.5, not meta 11.5.
- **Explore shelves** — `src/features/explore-magazine/ExploreShelf.tsx:132`: subline 12/500, not 11.5; right metadata :121 is 13/600. `Section.tsx:108` lede 11.5, smaller than body 13 (matches tile-sub reference but semantically prose).
- **Explore media / round cards** — `src/features/explore-magazine/ExploreCard.tsx:1386` photo name 16/700; :1520 overlay course title 17/700; :1740 round course 17/700 (vs photo title 15). :1397 uppercase secondary label 9 (vs 11.5). :1358 figure 40/800 is a statistic, not a title.
- **Watch feed** — `src/features/explore-magazine/watch/WatchFeed.tsx:470`: tile title 12/600, creator :471 11; :556/:584 other titles 12.5/600. :448 photo creator line 12.5/600, caption :449 11.5 (caption matches). Empty-body :703 13.5 vs 13.
- **Video teaser / About video** — `src/features/video-details/video-viewer.css:2`: video title 16/800; feed variant :7 15 but retains 800. Description :3 13.5 vs body 13; About description :13 13.5. Stats :12 12.5 vs 11.5. Person names :19 12/700, person roles 10.5; course-row small text :17 11.5 matches.
- **Composer entry choices** — `src/features/composer-flow/post-or-review.css:18–19`: title 18/700 and sub 12.5. Search rows `review-course-search.css:29–33`: name 15/700 (size/weight match), location 12 vs 11.5. Section helper :21 is 12 vs body 13; ask-row :42 13.5/650 (weight 650 also outside allowed set).
- **Composer lists** — `src/features/post-v2/components/ActorSheet.tsx:27–28`: actor 14/600; sub 12. `ScheduledPostsSheetV2.tsx:120–121`: caption title 14/500, meta 12. Success supporting copy `PostSuccessV2.tsx:397` 13.5/1.5.
- **Guest join** — `src/features/guest/guestGate.css:93`: body 14.5 vs 13.

## (ii) Sheets at risk of wrapping when titles become 21px at 320px

Heuristic only, not browser measurements. About 10.5px/character; 32–40px gutters and 28–34px close affordance leave roughly 246–288px (23–27 characters). Word boundaries/localisation can wrap sooner; ellipsis/nowrap can instead truncate.

| Sheet/title | Estimate | Assessment |
|---|---|---|
| WAGR: **Link your WAGR profile** | 22 × 10.5 ≈ 231px | Borderline only with additional controls/gaps; not a definite two-line title. |
| Report comment: **Why are you reporting this?** | 27 × 10.5 ≈ 284px vs 280px inner width | Likely two lines. |
| Report comment: **Thanks for letting us know** | 26 × 10.5 ≈ 273px vs 280px | Borderline; word breaks/locales can wrap. |
| Review / CourseStatsSheet: **{courseName}** | dynamic, >25–27 chars ≈ >263–284px | Long course names likely wrap; Review also has contextual header controls. |
| VideoAboutSheet: **details.title** | dynamic, >27 chars >284px | Likely two lines for ordinary long video titles; overflow-wrap explicitly enabled. |
| BoardSeeAllSheet: **title / BOARD_LABELS[board].i18n** | dynamic translated title; shell also has back/close chrome | Check translations over ~23 chars. |
| Scheduled success: **postFlow.scheduledHeadline {day,time}** | interpolated date/time can readily exceed 27 chars | Likely multiple lines, intentional success display. |
| Composer course search: **p.title / title override** | dynamic | Verify titles >23 chars; base “Review a course” is short. |

Short defaults (“Find golfers”, “Browse by region”, “Latest reviews”, “Scheduled posts”, “Cover frame”, “Posting as”, “Add a club or brand”, “Creators”, “Unlink WAGR?”, “Comments”) do not cross this rough threshold. No claim that every title above definitely wraps.

## (iii) Celebration sheets with deliberately larger titles

- `src/features/post-v2/components/PostSuccessV2.tsx:70`: posted success (`composer:success.posted`), `.pf-headline` 30/800/1.1 from `src/styles/post-flow.css:64`.
- Same file :90: scheduled-success date/time headline, same 30/800/1.1.
- The immersive shell (`ImmersiveSuccessShell.tsx`) supplies backdrop/animation, not a large heading itself; its :105 11px uppercase “Tap anywhere to close” is an instruction and excluded from heading roles.
- Report completion “Thanks for letting us know” remains TITLE_SCALE 17, **not** a deliberately enlarged celebration. Friends “Fourball complete” is an empty-state page variant, not a sheet.

## Shared heading components and import consumer counts

Counts obtained with `rg -l 'import …module…' src -g '*.tsx' -g '*.ts' | wc -l` (unique importing files, repository-wide, not JSX instance counts; relative imports whose path differs may need separate counting).

| Component / module | Importing files | Notes |
|---|---:|---|
| `features/explore-magazine/Section` | 2 | Shared eyebrow/title pair 11 + 19; eyebrow muted/amber. |
| `ExploreShelf` | 8 | Sentence-case shelf heading 16/700/−.015em; sub 12. |
| `components/ui/SectionHeader` | 15 | Scoped Watch consumers use section role 20/700/−.02em/1.15 and eyebrow 11/700/.14em. Prime 26; rail 19; neither is silently treated as section 21. |
| `ExploreSheetShell` | 5 | Title 14.5/700; see-all sheet family. |
| `features/post-v2/components/BottomSheet` (exact sibling `./BottomSheet` imports) | 7 | TITLE 17/700/−.032em/1.2. Other relative-depth import paths excluded from this count. |
| `features/chrome-v2/PageTitle` | 5 | 30/700/0/1.1 page identity. |
| `components/watch/proshop/Kicker` (path containing `proshop/Kicker`) | 0 | Encountered definition only: 9/700/.16em, no line-height; slate #64748B default, “amber” actually #0E1216, emerald #006747, light white/.55. Not inventoried as a rendered heading without a consumer. |

`ui/SheetTitle` and `AlertDialogTitle` use 18/600/28px before local CSS overrides. WAGR explicitly overrides to 22/700; do not report the inherited primitive defaults there. TITLE and KICKER are style tokens, not heading components.

## Colour / weight findings and coverage notes

- Amber on **CourseStatsSheet's course kicker**, **Report comment**, **Featured this week**, **Watch LONG FORM**, and **Guest gate** is generic editorial/action context, not the viewer’s own data; it conflicts with the stated amber rule. Friends “Your clubhouse” is a personalised framing label rather than a numeric own-data value; treat as a review point, not automatically authorised.
- Own Want-to-play viewer badge is own data and may stay amber. Own watch progress/course-context lines and earned personal achievement accents require the owning-data condition; no blanket amber exception for competitions or achievements. Shared `Section` uses `contest` as its amber switch, which by itself does not guarantee viewing-member ownership.
- Green LIVE prefix/dot is preserved: `src/styles/post-flow.css:61–63` uses `.pf-live`/`.pf-dot` green. Its 11/800/.16em label still breaches the 700 weight ceiling; this is not a reason to recolour it.
- Explicit >700 weights include Featured kicker 800, WatchFeed 800 and **750**, composer flow header 800, success 800, guest 800, leaderboard labels 800, Explore achievement labels 800, and selected course detail headings 800.
- Checked entry composition for `Clubhouse.tsx`, `ClubhouseWrapped.tsx`, `AmateurPage.tsx` (delegates to ExploreMagazine), `WatchGridPage.tsx`, HomeLanding and post deep-link entry. Do not count delegation wrappers as additional local headings. Marketing `pages/gate/home/*` is outside the requested in-app Clubhouse/home surface.
- Scoped media/media-system/videos, feed-cards/posts-tab, creator and stories contain substantial playback, card, engagement and utility plumbing. No synthetic section headings were assigned merely because a filename includes “title”, “kicker”, or an uppercase action. Story engagement controls and “Tap anywhere” are actions/instructions, not heading roles. `course-gallery-kicker` was specifically read in JSX (`CourseGalleryChrome.tsx:160`): it heads a hole group, not a photo title, so is ROW/GROUP LABEL despite its CSS name.
- This is broad source-treatment coverage, **not a guarantee of exhaustive routed-sheet or locale coverage**. Dynamic render branches, inherited global typography, shared out-of-scope children (e.g. profile round-detail/scorecard), and responsive guest styles still merit runtime validation. No files in the project were changed; no tests/builds/SQL were run.
