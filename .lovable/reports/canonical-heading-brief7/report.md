# Brief 7 — close-out complete

## Status

Accepted continuation commit: `e4a3b9244f`. The sixteen C rulings and unchanged own-round layout remain accepted. The authorised test-only selector correction is complete; no production fault or production change was involved in this close-out.

**10,139 / 10,139 tests passed across 882 files**, in four fresh, separate, sequential shards. Compared with the fully passing brand/font baseline `9e144b5eba` (**10,127 tests / 880 files**), the Brief 7 delta is **+12 cases / +2 files**. Close-out itself changes **zero test counts**: before and after this selector fix the inventory is **10,139 / 882**. The colour file alone also passed **10 / 10**.

The real-photo ProfileCoverBand home-club line is on the cover, computes to `rgb(248, 250, 252)`, and passes at **18.51:1** contrast at the requested 10th-percentile background luminance. No scrim changed. The own-round amber scope remains **dormant by design**, not a failing/skipped case.

## Authorised test fix and its cause

`src/test/eyebrowColourCanon.test.tsx:86`, **YOUR PLAYERS followed-pros eyebrow computes to ink**, previously selected the child span. `WorldRankings.tsx:236` declares `color: INK` on the row div, with `INK = '#F8FAFC'` from `tourhub/_shared/tokens.ts:39`. The span inherits that colour in the browser but has no own colour declaration; jsdom's computed-style read on the span returned `''`. This was the accepted **test selector fault**, not a production-colour fault.

The sole assertion edit is:

```diff
-expect(colour(container, '[data-your-players] > div > span:first-child')).toBe('rgb(248, 250, 252)');
+expect(colour(container, '[data-your-players] > div')).toBe('rgb(248, 250, 252)');
```

The expectation, test name, other test cases and mocks are unchanged in this close-out. No tests were deleted, renamed or rewritten. `close-out-test-fix.diff` contains the exact one-line authorised change.

Command: `./node_modules/.bin/vitest run src/test/eyebrowColourCanon.test.tsx` — **10 passed / 1 file**, 5.78s. Full local output: `/tmp/brief7-close-out/eyebrow-colour.log`; no raw log is committed.

### Other selector audit — no additional fixes needed

Each selector was checked against its actual production declaration, not merely a passing inherited colour. The remaining nine cases already read the declaration-bearing element. No other selector was edited.

| Case | Selector | Colour declaration source | Result |
|---|---|---|---|
| Tour overview photo kicker | `[data-overview-photo-kicker-row] > span` | `PhotoBand.tsx:197`, outer span has `color: INK`; not its inner span | Passed |
| Courses public verdict | `section > div > div > span` | `AboutSection.tsx:142`, span has `VERDICT_KICKER_INK` | Passed |
| Explore public competition | `section > div` | `Section.tsx:66`, div declares contest `A.INK` | Passed |
| Profile course-wide cabinet | `.champions-empty-kicker` | `FieldChampions.tsx:53`, div has `VERDICT_KICKER_INK` | Passed |
| Business place | `[data-club-place]` | `ClubProfileHero.tsx:235`, span has `color: A.INK` | Passed |
| Viewer-owned course verdict | `section > div` | `manyBits.tsx:41`, div has `color: kickerColor` | Passed |
| Season own-profile | `section > div:first-child` | `SeasonSection.tsx:43`, div declares own/visitor colour | Passed |
| Season visitor-profile | `section > div:first-child` | Same declaration-bearing div | Passed |
| Explore non-own review scope | `[data-explore-kicker-scope]` | `ExploreCard.tsx:1062`, span declares `A.INK` on non-own branch | Passed |
| YOUR PLAYERS (authorised correction) | `[data-your-players] > div` | `WorldRankings.tsx:236`, row div declares `INK` | Passed |

## Census and count reconciliation

Pre-edit, accepted census: **A 52 / B 21 / C 16 = 89 unique uses/default branches**. The complete pre-edit list remains in `census.md` and `census.json`.

After the rulings: **A 59 unconditional ink / B 24 unconditional amber / 6 explicitly resolved own-versus-non-own conditionals / C 0**, still **89 unique uses**. Counting conditional branches separately gives **65 ink branches / 30 amber branches**; those 95 branches are not 95 different labels. The confirmed original B list is unchanged.

| C ruling | Count | Final handling |
|---|---:|---|
| Own/visitor profile-round and ageing-out eyebrows | 5 | Own amber; visitor ink |
| Explore scope branch | 1 | Existing own-round condition retained; non-own ink |
| Personal projection, private own media, own-index slot | 3 | B; amber retained |
| Identity, opportunity, followed players, friend NEXT ROUND | 7 | A; ink |

## Complete final census and per-use changes

Locations below retain the accepted pre-edit file:line references so they can be matched directly to the original census. The exact edited current file:line declarations are recorded in the source-diff appendix. No excluded tags, figures, buttons, body text or auth-screen brand treatment are enumerated here.

Before-colour resolution legend: T1 is analytical `A.AMBER`/`A.AMBER_DEEP` (`#F7931E`); T2 is `AboutSection.VERDICT_KICKER` → T1; T3 is the `Sec` wrapper → T2; T4/M is `MASTHEAD_KICKER` → T1 (CourseMasthead has a separate default override); T5 is profile-round `KICKER` → `CHART.AMBER` (`#F7931E`); T6 is Explore Section's `contest` branch → T1; T7 is `--rounds-gate-amber`; T8 is `--featured-amber`; T10 is `--pro-profile-amber`. Tour T is the shared `AMBER` literal, P is `--pick-amber`, L is `--tour-board-amber`, and V is `--tv-amber`; all resolve to `#F7931E`. The two Admin warning kickers resolve to `#F9C874`, and the latent EditorialEmpty branch resolves to `#B45309`. Every unconditional A's after value is exact `#F8FAFC`, not pure white or dim handicap ink.

### Unconditional ink — 59

| Accepted file:line | Text | Accepted class | Before / decision | After |
|---|---|---|---|---|
| src/components/courses/course-detail/about/TheVerdict.tsx:56 | “The verdict” | A | T2; field/course assessment. | rgb(248, 250, 252) |
| src/components/courses/course-detail/about/DefendsPar.tsx:126 | “How it defends par” | A | T2; course/field data. | rgb(248, 250, 252) |
| src/components/courses/course-detail/about/WhatPeopleSay.tsx:146 | “What people say” | A | T2; first-rating state, but the eyebrow names community reviews. | rgb(248, 250, 252) |
| src/components/courses/course-detail/about/WhatPeopleSay.tsx:175 | “What people say” | A | T2; community-review state. | rgb(248, 250, 252) |
| src/components/courses/course-detail/about/CourseLatelySection.tsx:89 | “LATELY” | A | T2; course activity. | rgb(248, 250, 252) |
| src/components/courses/course-detail/NearbySection.tsx:28 | “NEARBY” | A | Direct T2 style. | rgb(248, 250, 252) |
| src/components/courses/course-detail/reviews/SingleReview.tsx:62 | “The first rating” | A | Direct T2 style; not restricted to viewer authorship. | rgb(248, 250, 252) |
| src/components/courses/course-detail/reviews/NobodyHasRated.tsx:25-26 | “NOBODY HAS RATED IT” | A | Direct T2 style. | rgb(248, 250, 252) |
| src/components/courses/course-detail/reviews/FewReviews.tsx:64 | “{count} golfers have rated it” | A | Local `kicker = VERDICT_KICKER` at `:41`. | rgb(248, 250, 252) |
| src/components/courses/course-detail/reviews/FewReviews.tsx:91 | “What they scored” | A | Same alias. | rgb(248, 250, 252) |
| src/components/courses/course-detail/reviews/FewReviews.tsx:98 | “Everyone else” | A | Same alias; other reviewers. | rgb(248, 250, 252) |
| src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:43 | “NOBODY HAS PLAYED IT YET” | A | T3; course-wide empty state despite residing in You tab. | rgb(248, 250, 252) |
| src/components/courses/course-detail/you/NotConnectedInvitation.tsx:209 | `courseDetail.youTab.fieldVerdict.kicker` | A | T3; `FieldVerdictSection` takes field `overPar`, `rounds`, `courseName` at `:205`; not viewer performance. | rgb(248, 250, 252) |
| src/components/courses/course-detail/you/UpForGrabsSection.tsx:59-62 | “Up for grabs” | A | T3 in `boardHolders` branch; open course boards, not owned records. | rgb(248, 250, 252) |
| src/components/course-media-tab/CourseMediaTabNew.tsx:237 | “Through members’ eyes” | A | Direct T2 style. | rgb(248, 250, 252) |
| src/components/course-media-tab/CourseMediaEmptyStates.tsx:24 | “From the members” | A | Direct T2 style. | rgb(248, 250, 252) |
| src/components/profile/handicap/whs/sections/course-legends/flat/FieldChampions.tsx:53 | “The cabinet” | A | Direct T2; field cabinet. | rgb(248, 250, 252) |
| src/components/profile/handicap/whs/sections/course-legends/flat/FieldChampions.tsx:79 | “What it takes” | A | Direct T2; field qualification information. | rgb(248, 250, 252) |
| src/components/profile/handicap/whs/sections/course-legends/flat/NobodyHasPlayed.tsx:73 | “Nothing has been taken here” | A | Direct T2; course-wide empty cabinet. | rgb(248, 250, 252) |
| src/features/explore-magazine/LeaderboardsSection.tsx:41-42 | “The boards” | A | T6; passes `contest`, independent of viewer ownership. | rgb(248, 250, 252) |
| src/features/explore-magazine/ScoresLeaderboardsPage.tsx:534-537 | “The climb” | A | T6; passes `contest`; public most-improved board. | rgb(248, 250, 252) |
| src/features/explore-magazine/RoundsGate.tsx:134 | “Members with a handicap” | A | T7; general access/information eyebrow, not member performance. | rgb(248, 250, 252) |
| src/features/explore-magazine/watch/WatchFeaturedDeck.tsx:190 | “FEATURED THIS WEEK” | A | T8; editorial Watch section header. | rgb(248, 250, 252) |
| src/components/profile/hero/ProfileCoverBand.tsx:205-206 | `{subline}` — home club | C | T4 spread with no colour override. Same component supports profile identities without an ownership-based colour branch. | rgb(248, 250, 252) |
| src/components/courses/course-detail/you/NotConnectedInvitation.tsx:156 | “Birdies here” | C | T3; waiting/unconnected state (`if (waiting)` at `:154`), ambiguous between personal progress and course opportunity. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:197 | `kicker ?? [tourLabel, stateLabel].filter(Boolean).join(' · ')` | A | Spreads **M** without a colour override → `#F7931E`. Includes ordinary overview, recap override, and tournament-upcoming consumers. | rgb(248, 250, 252) |
| src/features/tourhub/leaderboard/LeaderboardTab.tsx:455 | `{kicker}`: full tour label plus state line | A | Spreads **M** → `#F7931E`. Composition is at `LeaderboardTab.tsx:382`. | rgb(248, 250, 252) |
| src/features/tourhub/tournament-v2/sections/HeroSection.tsx:98 | `{tourLabel}` | A | Spreads **M** → `#F7931E`. **Retained old hero**, not the rebuilt tournament hero; current page explicitly describes it as retired at `TournamentPage.tsx:93`. | rgb(248, 250, 252) |
| src/features/tourhub/news/WireFeedSlide.tsx:86-87 | `{masthead}`: `news.amateurNews` or `news.fromWire` | A | Inline `color: AMBER` → **T**. Text selection at `WireFeedSlide.tsx:71`. This is the editorial beat masthead, not an action label. | rgb(248, 250, 252) |
| src/features/tourhub/news/WireFeedSlide.tsx:96 | `{story.kicker}` | A | Spreads **M** → `#F7931E`; rendered only when the story supplies a kicker. Photo overlay above headline. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/HybridHeroBands/SituationBand.tsx:19-20 | “The situation” | A | Inline `color: AMBER` → **T**. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx:204 | `overview.hero.ourPicks`: “OUR TOURNAMENT PICKS” | A | Inline `color: AMBER` → **T**. `up` changes size only; amber is unconditional. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/HybridHeroBands/LivePicksBlock.tsx:67 | `overview.hero.ourPicks`: “OUR TOURNAMENT PICKS” | A | Inline `color: AMBER` → **T**. Editorial picks, not the viewer’s selection. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx:89 | “THE LEADERS' GROUP” | A | `live ? mutedStyle : {... color: L.amber}`. `L.amber` → `LEADERS_GROUP.amber` in `HybridHeroBands/leadersGroupTokens.ts:4` → **T**. **Only non-live branch is amber**; preserve live styling. | rgb(248, 250, 252) |
| src/features/tourhub/schedule-v2/ScheduleTab.tsx:132-136 | `{{year}} SEASON` | A | `{ ...SEASON_KICKER, color: AMBER }` → **T**. Typography declaration at `ScheduleTab.tsx:88-95`; other consumer at `:108` explicitly uses `INK_MUTE`. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx:66 | “WHY WE PICKED THEM” | A | `.pick-panel-kicker` → `color:var(--pick-amber)` at `HybridHeroBands/pickPanels.css:2` → **P**. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:28 | “OUR RECORD” | A | Same `.pick-panel-kicker` declaration → **P**. Component explicitly documents editorial record, not “Your pick”, at `OurRecordSheet.tsx:2-4`. | rgb(248, 250, 252) |
| src/features/tourhub/player-v2/sections/HeroSection.tsx:28 | “NEXT START · OUR PICKS ARE IN” | A | `.pv-next small` shares `color:var(--pick-amber)` with `.pv-you > small` at `player-v2/playerPage.css:31` → **P**. Professional player’s next start, not viewer data. | rgb(248, 250, 252) |
| src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:34 | Uppercase tour name/code plus `stateLine` | A | `.tv-tour` at `tournament-v2/tournamentPage.css:3`: `color:var(--tv-amber)` → **V**. Rebuilt non-upcoming tournament photo hero. | rgb(248, 250, 252) |
| src/features/tourhub/leaderboard/LiveBoard.tsx:34 | `rebuilt.leaderboard`: “LEADERBOARD” | A | `.tour-board-kicker` at `leaderboard/leaderboard.css:34` → **L**. **Fallback branch:** suppressed by `headerLead`/`boardHead`; inside FullBoardSheet, `leaderboard.css:36` overrides it to board ink already. | rgb(248, 250, 252) |
| src/features/tourhub/components/EditorialEmpty.tsx:56-62 | `{eyebrow}` | A | `color: tint === 'slate' ? INK_SOFT : DEEP_AMBER`; `DEEP_AMBER = '#B45309'` at `EditorialEmpty.tsx:18`. **Latent dark-amber branch:** all four located consumers explicitly pass `tint="slate"`, so none currently renders this amber branch. | rgb(248, 250, 252) |
| src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:76 | NEXT UP | A | recapNextUp.css:17 → --recap-next-up-accent (#F7931E). | rgb(248, 250, 252) |
| src/features/tourhub/players-v2/front/FrontPage.tsx:207 | YOUR PLAYERS | C | Kick amber prop; follows, not own player figures | rgb(248, 250, 252) |
| src/features/tourhub/overview/sections/WorldRankings.tsx:236-237 | YOUR PLAYERS | C | Unconditional AMBER in followed-player section | rgb(248, 250, 252) |
| src/features/tourhub/leaderboard/LiveBoard.tsx:33 | YOUR PLAYERS | C | tour-board-kicker --tour-board-amber; follows; white FullBoardSheet override | rgb(248, 250, 252) |
| src/components/courses/course-detail/about/AboutThisPlace.tsx:53 | courseDetail.place.kicker | A | AboutSection title → VERDICT_KICKER → A.AMBER | rgb(248, 250, 252) |
| src/components/courses/course-detail/about/CourseHonoursSection.tsx:36 | HONOURS | A | AboutSection title → VERDICT_KICKER → A.AMBER | rgb(248, 250, 252) |
| src/components/courses/course-detail/about/CourseFactsAndTees.tsx:122 | courseDetail.tees.kicker | A | AboutSection title → VERDICT_KICKER → A.AMBER | rgb(248, 250, 252) |
| src/components/courses/course-detail/reviews/WhatTheyScored.tsx:19 | What they scored | A | AboutSection sectionEyebrow → VERDICT_KICKER → A.AMBER | rgb(248, 250, 252) |
| src/components/course-media-tab/AdminHoleTagging.tsx:95 | Admin | A | VERDICT_KICKER → A.AMBER | rgb(248, 250, 252) |
| src/components/business/hero/ClubProfileHero.tsx:235 | p.placeLine | A | MASTHEAD_KICKER → A.AMBER; business place context | rgb(248, 250, 252) |
| src/components/shared/media/MediaPreviewViewer.tsx:380 | The {holeOrdinal} | A | VERDICT_KICKER → A.AMBER; only production caption builder holeViewerItems.ts:48 names a course hole | rgb(248, 250, 252) |
| src/features/admin/components/health/JobsLens.tsx:118 | Needs attention | A | KICKER override H.amber → warning #F9C874; system job summary | rgb(248, 250, 252) |
| src/features/admin/components/health/StatusLens.tsx:38 | {n} thing(s) need(s) you | A | PALETTE.warn.kicker #F9C874; system issue summary (warn branch only) | rgb(248, 250, 252) |
| src/features/guest/GuestJoinCard.tsx:88 | copy.kicker (Join the community / Explore / Courses / Tour / course name / Join to join in) | A | guestGate.css:67 → #f7931e; shared guest dialog, not excluded auth-screen brand treatment | rgb(248, 250, 252) |
| src/components/courses/CourseMasthead.tsx:123,131 | kicker (default component branch) | A | kickerColor default A.AMBER; explicit ink overrides unaffected | rgb(248, 250, 252) |
| src/features/clubhouse-tour/TourSlot.tsx | tour/state photo kicker | A | tourSlot.css:7 --feed-tour-amber (#F7931E); LIVE modifier separately green | rgb(248, 250, 252) |
| src/features/pro-profile/ProProfileBuildOne.tsx:45 | pro_tour · home club | C | MASTHEAD_KICKER → A.AMBER; same amber on own and visitor pro profiles | rgb(248, 250, 252) |
| src/pages/HandicapPage.tsx:164 | NEXT ROUND | C | Unconditional AMBER; friend row opens another member profile | rgb(248, 250, 252) |

### Unconditional amber — 24

| Accepted file:line | Text | Accepted class | Before / decision | After |
|---|---|---|---|---|
| src/components/profile/handicap/whs/sections/course-legends/flat/ProjectedChampions.tsx:59 | “What it takes” | B | Viewer-specific projected range / own record gap; confirmed in source, not field qualification. | amber (unchanged) |
| src/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions.tsx:144 | “What it takes” | B | Viewer-specific projected range / own record gap; confirmed in source, not field qualification. | amber (unchanged) |
| src/components/courses/course-detail/you/many/ManySections.tsx:48 | “Your verdict” | B | T3; viewer’s course history. | amber (unchanged) |
| src/components/courses/course-detail/you/many/ManySections.tsx:108 | “Your years here” | B | T3. | amber (unchanged) |
| src/components/courses/course-detail/you/many/ManySections.tsx:169 | “The {n} time/times you broke {threshold}” | B | T3. | amber (unchanged) |
| src/components/courses/course-detail/you/many/ManySections.tsx:224 | “You against the field” | B | T3. | amber (unchanged) |
| src/components/courses/course-detail/you/many/ManySections.tsx:306 | Dynamic `{kicker}` | B | T3; personal section alongside the other viewer-history sections. Literal alternatives need a final producer read before implementation. | amber (unchanged) |
| src/components/courses/course-detail/you/many/ManySections.tsx:353 | “Within reach” | B | T3; title “What you could take”. | amber (unchanged) |
| src/components/courses/course-detail/you/many/ManySections.tsx:395 | “Your record here” | B | T3. | amber (unchanged) |
| src/components/courses/course-detail/reviews/TheScore.tsx:113 | “You” | B | Explicit `A.AMBER`; guarded by `hasYou` at `:109`; displays `viewerScore`. | amber (unchanged) |
| src/components/courses/course-detail/you/YourRoundsHere.tsx:101 | “Best” | B | `ABOUT_KICKER` overridden with `A.AMBER_DEEP`; viewer’s best round. | amber (unchanged) |
| src/components/courses/course-detail/you/YourRoundsSheet.tsx:189 | “Best” | B | `ABOUT_KICKER` overridden with `A.AMBER`; viewer’s best round. | amber (unchanged) |
| src/features/pro-profile/ProAskSection.tsx:98-101 | “YOUR QUESTION · WAITING FOR {FIRST}” | B | T10; rendered from `data.my_waiting`, inside `!owner` branch. | amber (unchanged) |
| src/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions.tsx:107 | “Your cabinet here” | B | Direct T2. | amber (unchanged) |
| src/components/profile/handicap/whs/sections/course-legends/flat/PostedChampions.tsx:164 | “Your defence” | B | Direct T2. | amber (unchanged) |
| src/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere.tsx:46 | “Elsewhere” | B | Direct T2; title and lede explicitly describe boards **you** are closest to across courses **you** played, `:47-48`. | amber (unchanged) |
| src/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere.tsx:52 | `{championsBoardName(category)}` | B | Explicit `A.AMBER`; personal target-board card, followed by “You {value} · {leader} to beat” at `:54`. | amber (unchanged) |
| src/components/profile/handicap/whs/sections/course-legends/flat/ProjectedChampions.tsx:47 | “You have never played here” | C | T2; personal absence / opportunity rather than actual member performance. | amber (unchanged) |
| src/components/course-media-tab/CourseMediaEmptyStates.tsx:42 | “Only you can see this” | C | T2; personal visibility context, not clearly personal data. | amber (unchanged) |
| src/features/tourhub/players-v2/you/YouAndTourCard.tsx:48 | YOU AND THE TOUR | B | AMBER_SEG (#F7931E), own useMyHoleScoring(user.id) | amber (unchanged) |
| src/features/tourhub/player-v2/sections/PlayerShots.tsx:13 | YOU AGAINST {{object}} | B | playerPage.css:31 --pick-amber; own signed-in scoring | amber (unchanged) |
| src/components/courses/course-detail/you/many/FormLast20Section.tsx:38 | Your form here | B | Sec → VERDICT_KICKER → A.AMBER; viewer last twenty rounds | amber (unchanged) |
| src/components/achievements/AchievementToast.tsx:75 | toast.unlockedOverline | B | text-primary → --primary 31 93% 54%; viewer-only user_achievements subscription | amber (unchanged) |
| src/features/chrome-v2/ConnectGlance.tsx:32 | Official handicap index | C | index-glance.css:12 --glance-amber; no-data connect prompt, not actual own handicap | amber (unchanged) |

### Resolved ownership conditionals — 6

| Accepted file:line | Text | Accepted class | Before / decision | After |
|---|---|---|---|---|
| src/components/profile/rounds/ProfileRoundsTab.tsx:163 | “Every round” | C | T5; no ownership-based colour override. | own: amber; non-own: rgb(248, 250, 252) |
| src/components/profile/rounds/sections/SeasonSection.tsx:42 | “Your season” / “{possessive} season” | C | T5 remains amber for both; `isOwnProfile` changes copy, not colour. | own: amber; non-own: rgb(248, 250, 252) |
| src/components/profile/rounds/sections/YearSection.tsx:59 | “The year” | C | T5 remains amber; component accepts `isOwnProfile` at `:18,33`. | own: amber; non-own: rgb(248, 250, 252) |
| src/components/profile/rounds/sections/CoursesPlayedSection.tsx:62 | `profile.rounds.courses.kicker{Own/Friend/Other}` | C | T5; voice selected at `:45`, not colour. | own: amber; non-own: rgb(248, 250, 252) |
| src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:56-57 | `common:handicap.ageingOut.kicker` | C | Explicit `CHART.AMBER`; component takes a connection, no ownership colour guard. `WhsHandicapTab` loads by supplied `userId` at `:33`; forwards to dashboard at `:127`; dashboard mounts this section at `:119`. Cannot safely assume own-only. | own: amber; non-own: rgb(248, 250, 252) |
| src/features/explore-magazine/ExploreCard.tsx:1056-1065 | `{kickerPartsValue.scope}` | C | Explicit `isOwnRound ? A.AMBER : 'rgba(248,250,252,0.62)'`; `isOwnRound = item.kind === 'round' && item.who?.is_viewer === true` at `:1018`. Preserve under the brief’s explicit conditional-colour C example. | own: amber; non-own: rgb(248, 250, 252) |

## Ownership derivation and declaration splits

- `ProfileRoundsTab` **already has `isOwnProfile`**, contrary to the brief’s parenthetical assumption. It is supplied by `ProfilePageV2`, whose `isSelf` is `isOwnAccount = user?.id === profileUserId`. That exact existing authenticated ownership flag now selects the log eyebrow’s colour; no new session read was added.
- `SeasonSection`, `YearSection` and `CoursesPlayedSection` use their existing `isOwnProfile` props. Only the local `KICKER` spread receives a colour override. The shared rounds token is not repointed.
- `WhsHandicapTab` already knows the signed-in session user; it passes `!!sessionUser?.id && userId === sessionUser.id` to `HandicapDashboard`, which passes it to `AgeingOutSection`. The friend path derives `ownerUserId === user.id` in `HandicapPage` and threads that boolean through `FriendHandicapDashboard`. Missing ownership defaults to non-owner ink, never guessed amber. Existing read-only semantics, index figures and query ownership are unchanged.
- `ExploreCard` retains `item.kind === 'round' && item.who?.is_viewer === true`; only its non-own scope-colour branch changes from `rgba(248,250,252,0.62)` to `A.INK`.
- The follow-list LiveBoard eyebrow opts into the existing local ink modifier (`tour-board-kicker--field`), leaving the shared base declaration intact. FrontPage removes only the amber prop on its YOUR PLAYERS call; WorldRankings overrides only the follow-list heading.
- Identity kickers locally override `MASTHEAD_KICKER`; the shared token is unchanged. The no-club prompt stays `W_55`. The waiting Birdies here opportunity opts into the existing `Sec.kickerColor` prop.
- Accepted initial A/B splits remain: `VERDICT_KICKER_INK` versus the personal/unresolved `VERDICT_KICKER`; three public `Sec` callers opt into ink; `.pv-next small` locally overrides the shared personal label selector; the leaderboard fallback opts into local ink; shared colour variables remain unchanged.

## Own-round Explore scope — dormant by design

`ExploreCard.tsx:1014` takes `onPhoto` from `rendersOnPhoto(item, size)`. `cardTreatment.ts:35–39` returns false for **every round** and every pair. The scope kicker is mounted only in the `onPhoto` branch at `ExploreCard.tsx:1562–1595`, so an own-round scope kicker never reaches the live DOM.

The own-round amber scope branch is dormant by design, so a genuine rendering test cannot see it without changing the accepted layout. This is an explicit coverage limitation, not a failure. No component was changed to expose a hidden label, and no false on-photo mock was used. The additional genuine non-own **review** scope test passed. **Ben confirmed Keep it hidden at 10:05 UTC on 23 November 2026**: this scope question is resolved, and the dormant own-round amber branch is explicitly unverified rather than represented as a passing or skipped test. Details are in `.lovable/reviews/brief7-explore-scope.md`.

## Test changes and totals

No existing tests were deleted or renamed. Exactly two existing colour assertions changed across the initial brief and continuation; all other assertions in those files remain unchanged.

| Test file:line | Assertion before | Assertion after | Why |
|---|---|---|---|
| `src/test/whatsBeenPlayedV4.test.tsx:186` (accepted initial change) | `expect((container.querySelector('[data-masthead-kicker]') as HTMLElement).style.color).toBe('rgb(247, 147, 30)');` | Same assertion with `rgb(248, 250, 252)` | Public CourseMasthead default is ink. |
| `src/test/profileHeroClubWhite.test.tsx:41` | `expect(kicker.style.color).toBe(toRgb(A.AMBER));` | `expect(kicker.style.color).toBe(toRgb(A.INK));` | Expressly authorised identity-line colour ruling. |

The old test names mentioning amber/default behaviour are deliberately retained, because only their colour expectations were authorised to change. Their geometry, prompt and white-vs-pure-white assertions are unchanged. The tour sheet source expectation is unchanged: its shared base rule still resolves amber, while the changed usages opt into the existing local ink modifier.

`eyebrowColourCanon.test.tsx` retains its six accepted cases and adds four cases. Its canonical i18next mock retains `initReactI18next` and the exact `t` defaultValue-or-empty behaviour; only `i18n.language` was added for the real ExploreCard. The additional hook mocks spread all original module exports. No translated words are asserted.

| Added test name | Concrete assertion | Result |
|---|---|---|
| SeasonSection own-profile eyebrow computes to amber | `rgb(247, 147, 30)` | Passed |
| SeasonSection visitor-profile eyebrow computes to ink | `rgb(248, 250, 252)` | Passed |
| ExploreCard visible non-own review scope computes to ink | `rgb(248, 250, 252)` | Passed |
| YOUR PLAYERS followed-pros eyebrow computes to ink | `rgb(248, 250, 252)` | Passed after authorised declaration-bearing selector fix |
| own-profile ageing-out eyebrow computes to amber (`eyebrowAgeingOwnership.test.tsx`) | `rgb(247, 147, 30)` | Passed |
| visitor-profile ageing-out eyebrow computes to ink (`eyebrowAgeingOwnership.test.tsx`) | `rgb(248, 250, 252)` | Passed |

The original **+6** cases in `eyebrowColourCanon.test.tsx` are individually reconciled here; the four continuation cases and two ageing-out cases are named above:

| Original added test name | Concrete assertion | Current result |
|---|---|---|
| Tour overview photo kicker computes to ink | `rgb(248, 250, 252)` | Passed |
| Courses public verdict kicker computes to ink | `rgb(248, 250, 252)` | Passed |
| Explore public competition eyebrow computes to ink | `rgb(248, 250, 252)` | Passed |
| Profile course-wide cabinet kicker computes to ink | `rgb(248, 250, 252)` | Passed |
| Business place kicker computes to ink | `rgb(248, 250, 252)` | Passed |
| B: viewer-owned course verdict kicker still computes to amber | `rgb(247, 147, 30)` | Passed |

Total reconciliation: **10,127 + 6 accepted original colour cases + 4 continuation colour cases + 2 new ageing-out cases = 10,139 tests**. Files: **880 + eyebrowColourCanon.test.tsx + eyebrowAgeingOwnership.test.tsx = 882**. Test-case counts do not change for either authorised earlier colour-expectation edit or the close-out selector edit. The requested dormant own-round rendering test was not created or counted as passing/skipped.

## Photo-kicker contrast table

Accepted initial captures are actual-component fixtures at **390×844 CSS px, DPR 1**, using the existing Hazeltine National photograph from the project asset pointer. Its public published copy was fetched into `/tmp` and fulfilled locally because localhost asset URLs initially lacked the photo. The final captures replaced the fallback attempts. The review capture uses the actual outer app shell; a first direct-root fixture was discarded because global root-first-child CSS removed its real padding.

Text was hidden without changing its box, image, fade or scrim; screenshot pixels beneath its existing text rectangle were converted to linear-sRGB relative luminance. Two metrics are retained: the requested ratio **at background luminance L10**, and a conservative **10th percentile of per-pixel contrast ratios** (corresponding to brighter patches). These are not interchangeable. One photo fixture per changed implementation does not certify every live photograph.

| Photo surface | Colour | L10 background | Contrast at background L10 | Conservative contrast P10 | Status |
|---|---|---:|---:|---:|---|
| overview | rgb(248, 250, 252) | 0.00421 | 18.51:1 | 14.11:1 | Pass at requested L10 |
| upcoming | rgb(248, 250, 252) | 0.00393 | 18.61:1 | 12.90:1 | Pass at requested L10 |
| recap | rgb(248, 250, 252) | 0.00757 | 17.43:1 | 8.83:1 | Pass at requested L10 |
| recap NEXT UP | rgb(248, 250, 252) | 0.01494 | 15.45:1 | 14.11:1 | Pass |
| club | rgb(248, 250, 252) | 0.00395 | 18.60:1 | 14.11:1 | Pass at requested L10 |
| business | rgb(248, 250, 252) | 0.00398 | 18.59:1 | 13.67:1 | Pass at requested L10 |
| clubhouse | rgb(248, 250, 252) | 0.00875 | 17.08:1 | 10.84:1 | Pass at requested L10 |
| wire | rgb(248, 250, 252) | 0.00846 | 17.17:1 | 7.05:1 | Pass at requested L10 |
| tournament | rgb(248, 250, 252) | 0.00421 | 18.51:1 | 14.25:1 | Pass at requested L10 |
| retained-hero | rgb(248, 250, 252) | 0.01272 | 16.00:1 | 2.45:1 | Pass at requested L10; **bright-patch weakness held for ruling** |
| hole-viewer | rgb(248, 250, 252) | 0.05263 | 9.78:1 | 7.80:1 | Pass at requested L10 |
| review | rgb(248, 250, 252) | 0.00894 | 17.03:1 | 12.86:1 | Pass at requested L10 |
| ProfileCoverBand home-club line (new 390px capture) | rgb(248, 250, 252) | 0.00421 | **18.51:1** | **13.62:1** | Pass at requested L10 and conservative P10 |
| Pro identity / non-own Explore photo scope | Source set to ink | — | — | — | Previous coverage limitation; not additional close-out capture targets |

All accepted fixtures reported no horizontal page overflow and no page errors. The retained old Tour hero’s **2.45:1 conservative weak patch** remains documented; it passes the requested background-L10 metric at 16.00:1. **No measured fixture fails the requested 4.5:1-at-background-L10 criterion.** The separate conservative weakness is listed without changing a scrim.

The new profile fixture renders the **actual ProfileCoverBand** under real QueryClient/MemoryRouter providers, using the **real Hazeltine National project photograph as coverUrl**, not a generated placeholder or a recreated band. This does not claim a hosted member's stored cover was read. The image decoded at **792×528**, filled the **390×285.08px** band, and the home-club text rectangle was **x20 / y193.89 / w327.95 / h13.19**, wholly on the cover. Screenshot inspection confirmed the actual line, full photo and unchanged fade. **No page errors or horizontal overflow.**

New artifacts: `photos/profile-cover-390.png`, `profile-contrast.json`, and the appended `profile-home-club` row in `photo-contrast.json`. Browser script/full local output: `/tmp/browser/brief7-close-out/profile_contrast.py` and `/tmp/browser/brief7-close-out/profile-check.log`. The disposable `__brief7_closeout.html`/`.jsx` were removed, and no app route, production component, test fixture page or new image asset remains.

## Shards — current code (all passed)

Each command ran separately, sequentially after the previous command completed. **No retries, skips, timeout exceptions or standalone pf3a fallback were needed.** `pf3aVideoComposerMounted.test.tsx` passed in shard 2 (3.854s).

| Shard | Exact command | Tests passed | Files passed | Duration | Full local output |
|---|---|---:|---:|---:|---|
| 1/4 | `./node_modules/.bin/vitest run --shard=1/4` | 2,459 | 221 | 189.18s | `/tmp/brief7-close-out/shard-1.log` |
| 2/4 | `./node_modules/.bin/vitest run --shard=2/4` | 2,470 | 221 | 200.78s | `/tmp/brief7-close-out/shard-2.log` |
| 3/4 | `./node_modules/.bin/vitest run --shard=3/4` | 2,476 | 221 | 168.54s | `/tmp/brief7-close-out/shard-3.log` |
| 4/4 | `./node_modules/.bin/vitest run --shard=4/4` | 2,734 | 219 | 155.96s | `/tmp/brief7-close-out/shard-4.log` |
| **Total** | **Four separate sequential commands** | **10,139** | **882** | **714.46s** | **Raw logs stay local, outside repo** |

The prior pre-continuation shard results are not combined into this pass. The fresh runs include `eyebrowColourCanon.test.tsx` (10 cases, shard 3) and `eyebrowAgeingOwnership.test.tsx` (2 cases, shard 4).

## Preview and scope

Latest checked preview diagnostics after the test fix and temporary-page removal show **build OK** (`2026-11-23T10:24:51Z`). No manual build/typecheck, SQL, migrations, edge-function changes, feed_config edits or pool-cap changes were made. No ownership lookup was added. Close-out changes only the authorised test selector and reports/artifacts; production source is byte-identical to `e4a3b9244f`. Theme, fonts, copy, dimensions, tracking, weight, state gates and photo scrims are unchanged.

An architecture-note save to root AGENTS.md was refused by its size budget; the file was left byte-identical. No protected rule was compressed or moved. Local AgeingOut ownership documentation remains in its header.

## Exact source changes (initial brief plus continuation)

`source-changes.diff` records every changed declaration with exact file and hunk line numbers against the fully passing brand/font baseline `9e144b5eba`. It preserves the accepted initial/continuation ownership plumbing and authorised test changes. The subsequent close-out selector change is recorded separately in `close-out-test-fix.diff`; accepted source declarations are not rewritten just to update stale comments.

## Close-out outcome and remaining coverage limits

- All requested close-out tasks completed: declaration-bearing test selector, other-case audit, colour file pass, four fresh sequential shard passes, real-cover profile contrast, report and commit.
- Final unique-use census stays **A 59 / B 24 / 6 resolved ownership conditionals / C 0**. The pre-edit census and prior confirmed B list remain intact.
- Own-round Explore scope stays hidden by accepted design; its amber branch is dormant, explicitly unverified and not represented as a failing/skipped rendering case.
- The retained old Tour hero's separate **2.45:1 conservative bright-patch metric** remains listed; no requested background-L10 failure and no scrim change.
- Real-component photo fixtures, not hosted member data or physical-iPhone checks. This close-out adds the requested ProfileCoverBand target; previously noted pro/Explore photo recapture limits are not claimed as verified.
