# Batch D — Clubhouse, round and composer audit

Read-only source/caller closure; no code/tests/SQL/migrations changed. `F` = mounted `/` ClubhouseWrapped → Clubhouse → CardFeed → FeedCard; `H` = F → HomeRail → featured round → ScorePostBody; `V` = F → global fullscreen → ImmersiveFullscreenChrome; `R` = F round action or `/round/:whsScoreId` → RoundDetailSheet; `P` = owner-edit/global entry → GlobalPostComposer → StageComposer; `PC/PR/PS/PV/PX` = P → course picker / rounds picker / scheduling / video fields / success.

**42 new selected-grey rows:** E1 0, E2 7, K1 0, K2 7, K3 5, K4 7, K5 13, K6 3; **three E2 declaration changes**. Three qualifying D rows are separately listed. Fifteen B/C reference variants retain their roles (K2 13, K3 2); new+references = 57 selected reachable rows. No unresolved role/path remains.

| File:line | Text/key | Route / parent | Role | Old → planned / keep |
|---|---|---|---|---|
| src/components/feed/ScorePostBody.tsx:74; style:64 | amateur.stream.stat.net — NET | H → score figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:82; style:64 | amateur.stream.stat.gross — GROSS (main) | H → score figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:93; style:64 | amateur.stream.stat.gross — GROSS (secondary) | H → score figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:99; style:64 | amateur.stream.stat.handicap — HANDICAP | H → handicap figure | K2 | keep A.DIM; .12em |
| src/components/feed/ScorePostBody.tsx:110; style:64 | amateur.stream.stat.awards — AWARDS | H → award count | K2 | keep A.DIM; .12em |
| src/components/feed/roundTilePlot.tsx:345–346 | OUT | F/H → 18-hole plot footer | K3 | keep T40; .14em |
| src/components/feed/roundTilePlot.tsx:345–346 | IN | F/H → 18-hole plot footer | K3 | keep T40; .14em |
| src/components/feed/FeedCommentPreview.tsx:181–203 | See all {total} comments | F → comment-preview action | K4 | keep MID #A7AAAE; .19em |
| src/components/feed/PostGolfContext.tsx:105 | facts.kicker | F/V → expanded on-media HoleCard | K6 | keep rgba(248,250,252,.62); .16em |
| src/components/feed/PostGolfContext.tsx:112; feed-media-chrome.css:5 | STROKE INDEX | F/V → HoleCard statistic | K2 | keep rgba(248,250,252,.62); .1em |
| src/components/feed/PostGolfContext.tsx:112; feed-media-chrome.css:5 | FIELD LOSES | F/V → HoleCard statistic | K2 | keep rgba(248,250,252,.62); .1em |
| src/components/feed/PostGolfContext.tsx:192–193 | ROUND | F/V → attached-round opening row | K4 | keep rgba(248,250,252,.42); .14em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:14; composerGolf.css:3 | ON THE COURSE | P → StageComposer:1182 → course form block | K5 | keep --pf-dim; .18em |
| src/features/post-v2/components/golf/GolfPostSections.tsx:192; composerGolf.css:3 | PLAYED WITH | P → StageComposer:1197 → editable people field | K5 | keep --pf-dim; .18em |
| src/features/post-v2/components/golf/GolfPostSections.tsx:199; composerGolf.css:66 | IN CAPTION | P → tagged-person state | K4 | keep rgba(248,250,252,.42); .08em |
| src/features/post-v2/StageComposer.tsx:1209; composerGolf.css:3 | SHARING | P → sharing settings form block | K5 | keep --pf-dim; .18em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:40,44; composerGolf.css:102 | THIS WEEK | PR → chronological round-list group | E2 | rgba(248,250,252,.42) → --pf-ink (#F8FAFC); .16em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:40,44; composerGolf.css:102 | EARLIER | PR → chronological round-list group | E2 | rgba(248,250,252,.42) → --pf-ink (#F8FAFC); .16em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:45; composerGolf.css:106 | Localised short weekday, MON–SUN | PR → round date cell | K3 | keep rgba(248,250,252,.42); .1em |
| src/features/post-v2/components/golf/ComposerGolf.tsx:45; composerGolf.css:106 | Localised short month, JAN–DEC | PR → round date cell | K3 | keep rgba(248,250,252,.42); .1em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:40; videoCreator.css:3 | TITLE | PV → title form label | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:40; videoCreator.css:10 | LONG FORM | PV → video type qualifier | K4 | keep --video-dim; .12em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:40; videoCreator.css:10 | SHORT | PV → alternate video type qualifier | K4 | keep --video-dim; .12em |
| src/features/post-v2/components/video/VideoComposerFields.tsx:67; videoCreator.css:3 | VIDEO | PV → cover/chapters form field | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:22; videoCreator.css:3 | DESCRIPTION | PV → description form label | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | CREDITS | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | LINKS | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | THANKS TO | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsPage.tsx:17,26; videoCreator.css:3 | GEAR IN THIS VIDEO | PV → editable collection | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/video/VideoDetailsSheets.tsx:52; videoCreator.css:3 | THEIR ROLE | PV → credit editor | K5 | keep --video-dim; .18em |
| src/features/post-v2/components/CourseTagSheet.tsx:44,50; src/styles/post-flow.css:12 | postFlow.yourClub — YOUR CLUB | PC → course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/CourseTagSheet.tsx:44,50; src/styles/post-flow.css:12 | postFlow.yourCourses — YOUR COURSES | PC → course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/CourseTagSheet.tsx:44,50; src/styles/post-flow.css:12 | postFlow.popular — POPULAR ON clbhouz | PC → course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em; source brand unchanged |
| src/features/post-v2/components/CourseTagSheet.tsx:51; src/styles/post-flow.css:12 | postFlow.results — RESULTS | PC → searched course-list group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:25; src/styles/post-flow.css:34 | postFlow.bestTime — BEST TIME | PS → earned best-time chart group | E2 | --pf-dim → --pf-ink, first span only; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:25; src/styles/post-flow.css:34 | postFlow.last30Days — LAST 30 DAYS | PS → chart sampling-period meta | K3 | keep --pf-dim; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:32; src/styles/post-flow.css:46 | postFlow.date — DATE | PS → date input group | K5 | keep --pf-dim; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:33; src/styles/post-flow.css:46 | postFlow.time — TIME | PS → time input group | K5 | keep --pf-dim; .16em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:32; src/styles/post-flow.css:48,51 | postFlow.today — TODAY | PS → day selection control | K4 | keep --pf-dim / selected --pf-on-dim; .1em |
| src/features/post-v2/components/ScheduleSheetV2.tsx:32; src/styles/post-flow.css:48,51 | format(d, EEE), MON–SUN | PS → other day selection controls | K4 | keep --pf-dim / selected --pf-on-dim; .1em |
| src/features/post-v2/components/PostSuccessV2.tsx:77; src/styles/post-flow.css:73 | composer:postFlow.tapElsewhere — TAP ANYWHERE ELSE TO CLOSE | PX → posted-card success | K6 | keep --pf-dim; .16em |
| src/features/post-v2/components/ImmersiveSuccessShell.tsx:97–115 | TAP ANYWHERE TO CLOSE | PX → successful no-card fallback | K6 | keep rgba(255,255,255,.4); .14em |

## Qualifying dead rows

| File:line | Text/key | Route / actual reach | Role | Old → planned / keep |
|---|---|---|---|---|
| src/features/post-v2/components/golf/GolfPostSections.tsx:114 | WHERE | Imported WhereSection has no production JSX caller; Stage mounts ComposerCourseBlock:1182 | D | keep GP.dim; .14em |
| src/features/post-v2/components/golf/GolfPostSections.tsx:132 | WHERE (alternate) | Same uncalled component | D | keep GP.dim; .14em |
| src/components/clubhouse/FriendsEmptyState.tsx:521–537 | FOLLOWING | Friends-only ClubhouseEmptyState branch; Clubhouse fixed FEED_TAB=foryou:114 | D | keep INK_FAINT rgba(255,255,255,.40); .10em |

## Prior A–C reference rows (not newly classified)

- FOLLOWING: FullscreenBottomStack.tsx:80 / fullscreen-stack.css:12, **K3**, keep .62, see C.
- FullscreenBottomStack.tsx:42 / fullscreen-stack.css:19, **K2**, keep .62: HOLE, PAR, YARDS, STROKE INDEX, FIELD LOSES, OVERALL, DESIGN, CONDITION, CLUBHOUSE, FACILITIES, MEMBERS — eleven separately keyed variants (`fullscreen.stats.*`), see C.
- PostGolfContext.tsx:77, **K2**: PAR {par}, {yards} YDS; keep .62, see C.
- CommentsSheetV2.tsx:439–440, **K3**: comments.count; keep A.DIM, see B/C.
- Scorecard/results/Likes/VideoAbout/PlayedWithPanel/invite/ShotTagChoices/review-search/Tour/Courses retain A–C component-owned role/defaults. Editable PlayedWithSection and CourseTagSheet are different components, not those recorded display/tagger/search groups.

## Closed exclusions and rendering proof

- Clubhouse runtime owner is App.tsx:235,268, not the null `/` Route:616. `/clubhouse`:617 redirects to `/`. HomeRail currently renders only featuredRound, not every named cadence kind.
- ReviewBottomSheetPortal is App.tsx:1197; RoundPage mounts canonical RoundDetailSheet at :218 (primary/overlay App mounts :717,:864). Ordinary PostDeepLinkPage opens fullscreen at :198; score posts redirect to `/round` at :121. CommentDeepLinkV2, not a guessed legacy page, owns comment deep links.
- FeedOverlayLayer has no current production mount; references in current owners are comments. Its legacy REVIEW label is white anyway.
- CourseGalleryChrome requires truthy courseGallery in FullscreenFeedOverlay:1125. Only course-media/hooks/useCourseGallery:125–126 supplies it, from CourseMediaTabNew. Ordinary feed opens default courseGallery=null; replaceGallery returns unless already active. Gallery PLACE/MEMBER SHOTS/LATEST/jump/hole labels are Courses, see B, not a feed branch.
- FriendsEmptyState Following is the only qualifying grey label; Your clubhouse/Suggested for you are amber, Follow is inverted ink, tee'd-up count is .06em, secondary actions have white text (only icons muted).
- Drafts Cancel/Delete, cover Cancel/Apply: ink or inverted danger; no grey selected labels. Adjust ZOOM is .045em; actions ink. Scheduled-post controls lack qualifying typography; nested Schedule is counted above.
- Success LIVE IN THE CLUBHOUSE is green; SCHEDULED/POSTING inherit ink; failed Label has negative tracking. Remaining tap-close labels are K6 above. Scheduling axis has no >=.08em tracking; CTA/presets are ink/inverted; state opacity is not a fresh E heading.
- Actor identities, round-video/mark-hole controls and hints add no other qualifying grey labels. Course-picker From your rounds and result count are separate meta spans; colour only the first E2 span. BEST TIME and LAST 30 DAYS share a parent but are separate spans; only BEST TIME changes.
- Fullscreen stats reduce tracking to .04em below340px; on-media HoleCard stats to .06em at their narrow breakpoint. They still qualify at the wider presentation. Other typography remains unchanged.

## Every changed-component caller and new shared reach

| Shared component / E2 declaration | Every direct production caller | Reach |
|---|---|---|
| ComposerRoundsSheet / .composer-rounds-grp | StageComposer.tsx:1046 only | Personal global composers from every opening origin; `/post-v2`; business instances guard personal rounds |
| CourseTagSheet / .pf-group first span | StageComposer.tsx:961 only | Global composer from all origins; `/post-v2` |
| ScheduleSheetV2 / .pf-best-head first span | StageComposer.tsx:984; ScheduledPostsSheetV2.tsx:162 | Global composer including rescheduling; `/post-v2` |
| StageComposer | GlobalPostComposer.tsx:57; PostV2Page.tsx:10 | Global overlay; `/post-v2` |

Global opening-command census: MoreOptionsDrawer.tsx:113; PostOwnerMenu.tsx:101 (FeedCard:969,1046); RoundDetailSheet.tsx:357 (all recorded A–C round callers); ComposerFlowSheet.tsx:67; LedgerRow.tsx:239; BusinessProfilePage.tsx:398,406; BusinessInsightsPageV2.tsx:131,162; BusinessHomeHeader.tsx:316; BusinessDoNextCard.tsx:63; BusinessCreateFinish.tsx:42. Store development edit/draft helpers are not extra production routes. Outside D this reaches Watch/Explore/Courses round callers, business profile/home/Insights/create-finish, global navigation composer and direct `/post-v2`; attached-round groups are personal-only at StageComposer:1183.

Planned declarations: `.composer-rounds-grp` own ink; new `.pf-group > span:first-child` own ink without changing its meta sibling; new `.pf-best-head > span:first-child` own ink without changing LAST 30 DAYS. No GP.dim/PF-DIM/VIDEO-DIM/sectionLabel repoint; no props/flags.