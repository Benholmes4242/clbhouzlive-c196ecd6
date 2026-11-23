# Brief 7 — pre-edit census

Baseline: 10,127 tests / 880 files. Located amber-resolving render uses and default branches: A 52, B 21, C 16.

All source areas were searched through direct colour, alias, CSS-variable and shared-style consumers. Counts include retained/default/conditional branches. The photo-caption producer trace is closed: holeViewerItems names course holes. Projected/Posted What it takes uses personal scoring and remains B. C entries are unchanged pending ruling. Warning amber is included because it is the kicker colour, not a figure or status badge.

## A — non-viewer data; change to ink

| File:line | Text | Current colour decision |
|---|---|---|
| src/components/courses/course-detail/about/TheVerdict.tsx:56 | “The verdict” | T2; field/course assessment. |
| src/components/courses/course-detail/about/DefendsPar.tsx:126 | “How it defends par” | T2; course/field data. |
| src/components/courses/course-detail/about/WhatPeopleSay.tsx:146 | “What people say” | T2; first-rating state, but the eyebrow names community reviews. |
| src/components/courses/course-detail/about/WhatPeopleSay.tsx:175 | “What people say” | T2; community-review state. |
| src/components/courses/course-detail/about/CourseLatelySection.tsx:89 | “LATELY” | T2; course activity. |
| src/components/courses/course-detail/NearbySection.tsx:28 | “NEARBY” | Direct T2 style. |
| src/components/courses/course-detail/reviews/SingleReview.tsx:62 | “The first rating” | Direct T2 style; not restricted to viewer authorship. |
| src/components/courses/course-detail/reviews/NobodyHasRated.tsx:25-26 | “NOBODY HAS RATED IT” | Direct T2 style. |
| src/components/courses/course-detail/reviews/FewReviews.tsx:64 | “{count} golfers have rated it” | Local `kicker = VERDICT_KICKER` at `:41`. |
| src/components/courses/course-detail/reviews/FewReviews.tsx:91 | “What they scored” | Same alias. |
| src/components/courses/course-detail/reviews/FewReviews.tsx:98 | “Everyone else” | Same alias; other reviewers. |
| src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:43 | “NOBODY HAS PLAYED IT YET” | T3; course-wide empty state despite residing in You tab. |
| src/components/courses/course-detail/you/NotConnectedInvitation.tsx:209 | `courseDetail.youTab.fieldVerdict.kicker` | T3; `FieldVerdictSection` takes field `overPar`, `rounds`, `courseName` at `:205`; not viewer performance. |
| src/components/courses/course-detail/you/UpForGrabsSection.tsx:59-62 | “Up for grabs” | T3 in `boardHolders` branch; open course boards, not owned records. |
| src/components/course-media-tab/CourseMediaTabNew.tsx:237 | “Through members’ eyes” | Direct T2 style. |
| src/components/course-media-tab/CourseMediaEmptyStates.tsx:24 | “From the members” | Direct T2 style. |
| src/components/profile/handicap/whs/sections/course-legends/flat/FieldChampions.tsx:53 | “The cabinet” | Direct T2; field cabinet. |
| src/components/profile/handicap/whs/sections/course-legends/flat/FieldChampions.tsx:79 | “What it takes” | Direct T2; field qualification information. |
| src/components/profile/handicap/whs/sections/course-legends/flat/NobodyHasPlayed.tsx:73 | “Nothing has been taken here” | Direct T2; course-wide empty cabinet. |
| src/features/explore-magazine/LeaderboardsSection.tsx:41-42 | “The boards” | T6; passes `contest`, independent of viewer ownership. |
| src/features/explore-magazine/ScoresLeaderboardsPage.tsx:534-537 | “The climb” | T6; passes `contest`; public most-improved board. |
| src/features/explore-magazine/RoundsGate.tsx:134 | “Members with a handicap” | T7; general access/information eyebrow, not member performance. |
| src/features/explore-magazine/watch/WatchFeaturedDeck.tsx:190 | “FEATURED THIS WEEK” | T8; editorial Watch section header. |
| src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:197 | `kicker ?? [tourLabel, stateLabel].filter(Boolean).join(' · ')` | Spreads **M** without a colour override → `#F7931E`. Includes ordinary overview, recap override, and tournament-upcoming consumers. |
| src/features/tourhub/leaderboard/LeaderboardTab.tsx:455 | `{kicker}`: full tour label plus state line | Spreads **M** → `#F7931E`. Composition is at `LeaderboardTab.tsx:382`. |
| src/features/tourhub/tournament-v2/sections/HeroSection.tsx:98 | `{tourLabel}` | Spreads **M** → `#F7931E`. **Retained old hero**, not the rebuilt tournament hero; current page explicitly describes it as retired at `TournamentPage.tsx:93`. |
| src/features/tourhub/news/WireFeedSlide.tsx:86-87 | `{masthead}`: `news.amateurNews` or `news.fromWire` | Inline `color: AMBER` → **T**. Text selection at `WireFeedSlide.tsx:71`. This is the editorial beat masthead, not an action label. |
| src/features/tourhub/news/WireFeedSlide.tsx:96 | `{story.kicker}` | Spreads **M** → `#F7931E`; rendered only when the story supplies a kicker. Photo overlay above headline. |
| src/features/tourhub/components/overview-v3/HybridHeroBands/SituationBand.tsx:19-20 | “The situation” | Inline `color: AMBER` → **T**. |
| src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx:204 | `overview.hero.ourPicks`: “OUR TOURNAMENT PICKS” | Inline `color: AMBER` → **T**. `up` changes size only; amber is unconditional. |
| src/features/tourhub/components/overview-v3/HybridHeroBands/LivePicksBlock.tsx:67 | `overview.hero.ourPicks`: “OUR TOURNAMENT PICKS” | Inline `color: AMBER` → **T**. Editorial picks, not the viewer’s selection. |
| src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx:89 | “THE LEADERS' GROUP” | `live ? mutedStyle : {... color: L.amber}`. `L.amber` → `LEADERS_GROUP.amber` in `HybridHeroBands/leadersGroupTokens.ts:4` → **T**. **Only non-live branch is amber**; preserve live styling. |
| src/features/tourhub/schedule-v2/ScheduleTab.tsx:132-136 | `{{year}} SEASON` | `{ ...SEASON_KICKER, color: AMBER }` → **T**. Typography declaration at `ScheduleTab.tsx:88-95`; other consumer at `:108` explicitly uses `INK_MUTE`. |
| src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx:66 | “WHY WE PICKED THEM” | `.pick-panel-kicker` → `color:var(--pick-amber)` at `HybridHeroBands/pickPanels.css:2` → **P**. |
| src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:28 | “OUR RECORD” | Same `.pick-panel-kicker` declaration → **P**. Component explicitly documents editorial record, not “Your pick”, at `OurRecordSheet.tsx:2-4`. |
| src/features/tourhub/player-v2/sections/HeroSection.tsx:28 | “NEXT START · OUR PICKS ARE IN” | `.pv-next small` shares `color:var(--pick-amber)` with `.pv-you > small` at `player-v2/playerPage.css:31` → **P**. Professional player’s next start, not viewer data. |
| src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:34 | Uppercase tour name/code plus `stateLine` | `.tv-tour` at `tournament-v2/tournamentPage.css:3`: `color:var(--tv-amber)` → **V**. Rebuilt non-upcoming tournament photo hero. |
| src/features/tourhub/leaderboard/LiveBoard.tsx:34 | `rebuilt.leaderboard`: “LEADERBOARD” | `.tour-board-kicker` at `leaderboard/leaderboard.css:34` → **L**. **Fallback branch:** suppressed by `headerLead`/`boardHead`; inside FullBoardSheet, `leaderboard.css:36` overrides it to board ink already. |
| src/features/tourhub/components/EditorialEmpty.tsx:56-62 | `{eyebrow}` | `color: tint === 'slate' ? INK_SOFT : DEEP_AMBER`; `DEEP_AMBER = '#B45309'` at `EditorialEmpty.tsx:18`. **Latent dark-amber branch:** all four located consumers explicitly pass `tint="slate"`, so none currently renders this amber branch. |
| src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:76 | NEXT UP | recapNextUp.css:17 → --recap-next-up-accent (#F7931E). |
| src/components/courses/course-detail/about/AboutThisPlace.tsx:53 | courseDetail.place.kicker | AboutSection title → VERDICT_KICKER → A.AMBER |
| src/components/courses/course-detail/about/CourseHonoursSection.tsx:36 | HONOURS | AboutSection title → VERDICT_KICKER → A.AMBER |
| src/components/courses/course-detail/about/CourseFactsAndTees.tsx:122 | courseDetail.tees.kicker | AboutSection title → VERDICT_KICKER → A.AMBER |
| src/components/courses/course-detail/reviews/WhatTheyScored.tsx:19 | What they scored | AboutSection sectionEyebrow → VERDICT_KICKER → A.AMBER |
| src/components/course-media-tab/AdminHoleTagging.tsx:95 | Admin | VERDICT_KICKER → A.AMBER |
| src/components/business/hero/ClubProfileHero.tsx:235 | p.placeLine | MASTHEAD_KICKER → A.AMBER; business place context |
| src/components/shared/media/MediaPreviewViewer.tsx:380 | The {holeOrdinal} | VERDICT_KICKER → A.AMBER; only production caption builder holeViewerItems.ts:48 names a course hole |
| src/features/admin/components/health/JobsLens.tsx:118 | Needs attention | KICKER override H.amber → warning #F9C874; system job summary |
| src/features/admin/components/health/StatusLens.tsx:38 | {n} thing(s) need(s) you | PALETTE.warn.kicker #F9C874; system issue summary (warn branch only) |
| src/features/guest/GuestJoinCard.tsx:88 | copy.kicker (Join the community / Explore / Courses / Tour / course name / Join to join in) | guestGate.css:67 → #f7931e; shared guest dialog, not excluded auth-screen brand treatment |
| src/components/courses/CourseMasthead.tsx:123,131 | kicker (default component branch) | kickerColor default A.AMBER; explicit ink overrides unaffected |
| src/features/clubhouse-tour/TourSlot.tsx | tour/state photo kicker | tourSlot.css:7 --feed-tour-amber (#F7931E); LIVE modifier separately green |

## B — clearly viewer-owned; retain amber

| File:line | Text | Current colour decision |
|---|---|---|
| src/components/profile/handicap/whs/sections/course-legends/flat/ProjectedChampions.tsx:59 | “What it takes” | Viewer-specific projected range / own record gap; confirmed in source, not field qualification. |
| src/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions.tsx:144 | “What it takes” | Viewer-specific projected range / own record gap; confirmed in source, not field qualification. |
| src/components/courses/course-detail/you/many/ManySections.tsx:48 | “Your verdict” | T3; viewer’s course history. |
| src/components/courses/course-detail/you/many/ManySections.tsx:108 | “Your years here” | T3. |
| src/components/courses/course-detail/you/many/ManySections.tsx:169 | “The {n} time/times you broke {threshold}” | T3. |
| src/components/courses/course-detail/you/many/ManySections.tsx:224 | “You against the field” | T3. |
| src/components/courses/course-detail/you/many/ManySections.tsx:306 | Dynamic `{kicker}` | T3; personal section alongside the other viewer-history sections. Literal alternatives need a final producer read before implementation. |
| src/components/courses/course-detail/you/many/ManySections.tsx:353 | “Within reach” | T3; title “What you could take”. |
| src/components/courses/course-detail/you/many/ManySections.tsx:395 | “Your record here” | T3. |
| src/components/courses/course-detail/reviews/TheScore.tsx:113 | “You” | Explicit `A.AMBER`; guarded by `hasYou` at `:109`; displays `viewerScore`. |
| src/components/courses/course-detail/you/YourRoundsHere.tsx:101 | “Best” | `ABOUT_KICKER` overridden with `A.AMBER_DEEP`; viewer’s best round. |
| src/components/courses/course-detail/you/YourRoundsSheet.tsx:189 | “Best” | `ABOUT_KICKER` overridden with `A.AMBER`; viewer’s best round. |
| src/features/pro-profile/ProAskSection.tsx:98-101 | “YOUR QUESTION · WAITING FOR {FIRST}” | T10; rendered from `data.my_waiting`, inside `!owner` branch. |
| src/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions.tsx:107 | “Your cabinet here” | Direct T2. |
| src/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions.tsx:164 | “Your defence” | Direct T2. |
| src/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere.tsx:46 | “Elsewhere” | Direct T2; title and lede explicitly describe boards **you** are closest to across courses **you** played, `:47-48`. |
| src/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere.tsx:52 | `{championsBoardName(category)}` | Explicit `A.AMBER`; personal target-board card, followed by “You {value} · {leader} to beat” at `:54`. |
| src/features/tourhub/players-v2/you/YouAndTourCard.tsx:48 | YOU AND THE TOUR | AMBER_SEG (#F7931E), own useMyHoleScoring(user.id) |
| src/features/tourhub/player-v2/sections/PlayerShots.tsx:13 | YOU AGAINST {{object}} | playerPage.css:31 --pick-amber; own signed-in scoring |
| src/components/courses/course-detail/you/many/FormLast20Section.tsx:38 | Your form here | Sec → VERDICT_KICKER → A.AMBER; viewer last twenty rounds |
| src/components/achievements/AchievementToast.tsx:75 | toast.unlockedOverline | text-primary → --primary 31 93% 54%; viewer-only user_achievements subscription |

## C — unclear; retain pending ruling

| File:line | Text | Current colour decision |
|---|---|---|
| src/components/profile/hero/ProfileCoverBand.tsx:205-206 | `{subline}` — home club | T4 spread with no colour override. Same component supports profile identities without an ownership-based colour branch. |
| src/components/profile/rounds/ProfileRoundsTab.tsx:163 | “Every round” | T5; no ownership-based colour override. |
| src/components/profile/rounds/sections/SeasonSection.tsx:42 | “Your season” / “{possessive} season” | T5 remains amber for both; `isOwnProfile` changes copy, not colour. |
| src/components/profile/rounds/sections/YearSection.tsx:59 | “The year” | T5 remains amber; component accepts `isOwnProfile` at `:18,33`. |
| src/components/profile/rounds/sections/CoursesPlayedSection.tsx:62 | `profile.rounds.courses.kicker{Own/Friend/Other}` | T5; voice selected at `:45`, not colour. |
| src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:56-57 | `common:handicap.ageingOut.kicker` | Explicit `CHART.AMBER`; component takes a connection, no ownership colour guard. `WhsHandicapTab` loads by supplied `userId` at `:33`; forwards to dashboard at `:127`; dashboard mounts this section at `:119`. Cannot safely assume own-only. |
| src/components/profile/handicap/whs/sections/course-legends/flat/ProjectedChampions.tsx:47 | “You have never played here” | T2; personal absence / opportunity rather than actual member performance. |
| src/components/course-media-tab/CourseMediaEmptyStates.tsx:42 | “Only you can see this” | T2; personal visibility context, not clearly personal data. |
| src/components/courses/course-detail/you/NotConnectedInvitation.tsx:156 | “Birdies here” | T3; waiting/unconnected state (`if (waiting)` at `:154`), ambiguous between personal progress and course opportunity. |
| src/features/explore-magazine/ExploreCard.tsx:1056-1065 | `{kickerPartsValue.scope}` | Explicit `isOwnRound ? A.AMBER : 'rgba(248,250,252,0.62)'`; `isOwnRound = item.kind === 'round' && item.who?.is_viewer === true` at `:1018`. Preserve under the brief’s explicit conditional-colour C example. |
| src/features/tourhub/players-v2/front/FrontPage.tsx:207 | YOUR PLAYERS | Kick amber prop; follows, not own player figures |
| src/features/tourhub/overview/sections/WorldRankings.tsx:236-237 | YOUR PLAYERS | Unconditional AMBER in followed-player section |
| src/features/tourhub/leaderboard/LiveBoard.tsx:33 | YOUR PLAYERS | tour-board-kicker --tour-board-amber; follows; white FullBoardSheet override |
| src/features/pro-profile/ProProfileBuildOne.tsx:45 | pro_tour · home club | MASTHEAD_KICKER → A.AMBER; same amber on own and visitor pro profiles |
| src/features/chrome-v2/ConnectGlance.tsx:32 | Official handicap index | index-glance.css:12 --glance-amber; no-data connect prompt, not actual own handicap |
| src/pages/HandicapPage.tsx:164 | NEXT ROUND | Unconditional AMBER; friend row opens another member profile |

