# Independent audit: profile surfaces

**Date:** 2 November 2026 (UTC). **Mode:** report only. Scope is the personal profile, Welcome, Edit profile, Settings, account/member preview sheets, and business create/edit. Guest browsing is not assessed beyond intersections. This report is the only project file created; no application/configuration/roadmap changes, SQL execution, migrations, deployed RPC/edge edits, or native/Median changes were made. `feed_config` and `round_pool_cap` were untouched. The brief is `/mnt/user-uploads/AUDITPROFILESURFACES_-_independent_audit_NO_pasted.md:3–29`.

## Evidence conventions

- Citations describe checked repository source, not installed database functions, hosted policies, populated data, or visually verified device behavior. Those are **not verifiable from the code**.
- “Import-reachable” means a static/literal dynamic-import path from `src/main.tsx:27,102` through `src/App.tsx`; it does not prove a guarded component renders. Imports/re-exports/CSS imports were traced separately from tests. A negative import-search finding has no source line containing “no import”; each inventory row therefore supplies the module anchor or disconnected importer, plus the search qualification.
- Git dates are latest recorded file-touch commit dates, not filesystem timestamps. The fourteen-day window is 19 October–2 November 2026 UTC. No tests were run, changed, deleted, renamed, or rewritten for this audit; consequently this is not a new suite-pass claim or a test-count change.
- Existing migration files were **read only** to distinguish recorded historical definitions from frontend callers; none were executed, created, or edited. Current deployment of those definitions is **not verifiable from the code**.

## 1. Routes → what mounts

### 1.1 Canonical roots and redirects

| Route | Import and mounted component / redirect chain |
|---|---|
| `/profile`, `/profile/:username` | Static `ProfileWrapped` import `src/App.tsx:281`; mounts `:628,657`; one-line re-export of `ProfilePageV2` in `src/pages/ProfileWrapped.tsx:1`. It is not a lazy wrapper around another profile implementation. |
| `/edit-profile` | Lazy `pages/EditProfile` at `src/App.tsx:301`; mounts under `ManagePageSkeleton` fallback at `:642`. |
| `/edit-profile?tab=settings` | Same editor; exact lowercase settings initializes Settings; renders `SettingsTabContent`, `src/pages/EditProfile.tsx:40,133`. No independent Settings page is implied. |
| `/edit-profile-v2` | Lazy alias `src/App.tsx:302,643` → `/edit-profile`, replace, preserving search and hash (`src/features/edit-profile/EditProfileAlias.tsx:3–5`). |
| `/create-profile` | Lazy redirect `src/App.tsx:358,627` → `/edit-profile`, preserving search, not hash (`src/components/redirects/CreateProfileRedirect.tsx:4–9`). |
| `/welcome` | Lazy `WelcomePage`, dedicated `WelcomeHold` fallback, `src/App.tsx:204–205,303,625`. |
| `/onboarding/account-type` | Replace to `/welcome`, without forwarding search/hash, `src/App.tsx:626`. |
| `/business/create` | Lazy `BusinessCreate`, `src/App.tsx:468,764`, not BusinessProfileEditor create mode. |
| `/business/create-v2` | Redirect import/route `src/App.tsx:28,763` → `/business/create`, replace, search preserved, hash omitted (`src/features/business-create/BusinessCreateRedirect.tsx:2–5`). |
| `/business/:id/edit` | Lazy `BusinessProfileEditor`, `src/App.tsx:467,768`; Settings is its exact `tab=settings` branch (`src/pages/BusinessProfileEditor.tsx:110–116,645`). |
| `/profile/handicap`, `/handicap/legends`, `/profile/quest`, `/profile/quest/index`, `/profile/quest/replay` | Replace to `/profile?tab=handicap`, `src/App.tsx:629,631,639–641`. |
| `/handicap`, `/handicap/:userId` | Lazy `HandicapRedirect`, `src/App.tsx:314,630,634`. Loading waits; unauthenticated → auth; self → handicapTabRoute; other → comparison (`src/pages/HandicapRedirect.tsx:24–31`). Header records compatibility with delivered notification paths, not proof of deployed rows (`:1–14`). |
| `/profile/:username/reviews` | Redirect to profile, discards Reviews intent/search/hash (`src/App.tsx:319–322,658`). |
| `/profile/:username/followers`, `/profile/:username/following` | Lazy `ProfileSocialListRoute`, direction supplied, `src/App.tsx:755–756`. |
| `/profile/:username/friends` | Redirect to followers with `tab=following&filter=friends`, `src/App.tsx:757`; `src/pages/FriendsRedirectToFollowing.tsx:15`. |
| `/achievementshub`, `/achievements`, `/achievements/:userId` | Replace to own `/profile`; supplied member identity is discarded, `src/App.tsx:785–787`. |

A standalone `/settings`, `/settings/profile`, `/settings/business`, `/manage`, `/onboarding`, or `/business/intro` mount was not found in the route inventory; catch-all mounts NotFound (`src/App.tsx:861`). `/settings/profile` and `/settings/business` are intercepted PostingAsMenu tokens, not necessarily browser links (`src/components/header/PostingAsMenu.tsx:230–244`). Chrome/guest classifications do not create routes (`src/features/chrome-v2/registry.ts:106,108`; `src/features/guest/guestRoutes.tsx:42`).

### 1.2 Username/ID chain and host preview

`ProfilePageV2` supports UUIDs despite the parameter name: base `user_profiles` lookup by ID or username, deleted-row handling, public fallback, then old-handle resolution for non-UUID misses (`src/pages/ProfilePageV2.tsx:184–218`). Rename navigation preserves subpath/search/hash (`:229–234`; `src/lib/profile/previousUsername.ts:14–17`). Without route parameter, session identity supplies the profile ID (`src/pages/ProfilePageV2.tsx:224–226`).

`functions/profile/[username].js` is crawler metadata, not a general redirect: ordinary requests call `next()` (`:9–11`); preview usernames are validated (`:13–14`), looked up by **username only** in `public_profiles` (`:18–24`), then metadata returned (`:26–40`). Thus ID-based SPA URLs can work while crawler metadata is generic; old-username repair is client-only in this source (`src/types/actor.ts:55`; `src/lib/profileRoutes.ts:39`; `functions/profile/[username].js:19–24`). Additional host-level redirect configuration/deployed behavior is **not verifiable from the code**; no `_redirects`, netlify/vercel/Wrangler configuration was found in the checkout search.

### 1.3 Shared route builders: definitions and all identified production consumers

| Builder | Authority and consumers |
|---|---|
| `getActorRoute` | Personal ID/business slug-or-ID/default home (`src/types/actor.ts:26–34`). Only consumer found: PostingAsMenu, business-only call; personal branch explicitly `/profile` (`src/components/header/PostingAsMenu.tsx:210–212`). |
| `getActorRouteByType` | Missing ID → home; business → business; every other type → personal ID path (`src/types/actor.ts:42–55`). Emitters: `src/pages/Clubhouse.tsx:673`; `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx:593`; `src/components/posts-tab/PostsTabContent.tsx:386`; `src/features/comments-v2/components/CommentCard.tsx:101`; `ReplyRow.tsx:63`; `src/features/activity-v2/components/LedgerRow.tsx:347–358`; business-only uses `src/features/social-lists-v2/SocialListPage.tsx:633`, `src/components/map/MapExpandedView.tsx:184`, `src/components/courses/course-detail/NearbySection.tsx:43`. Activity private wrapper `src/features/activity-v2/utils/activityLinks.ts:80–83`, called `:329,351–352,489`; parent consumed by LedgerRow `:272,308,324`. |
| `getPublicProfilePath` | Nullish username-or-ID (`src/lib/profileRoutes.ts:20–23`); consumer `src/components/posts/ReviewBottomSheet.tsx:348`. |
| `getProfilePathById` | Username-or-ID; deprecated creator flag ignored (`src/lib/profileRoutes.ts:34–39`). Consumers: `src/features/find-people/WhoToFollowRail.tsx:349`; `src/pages/FindPeoplePage.tsx:427`; `src/features/explore-magazine/watch/CreatorSpotlight.tsx:72`, `WatchLead.tsx:197`, `CreatorsRow.tsx:49`; `src/features/social-suggestions/SuggestedGolfersRail.tsx:82`, `SuggestedGolfersBlock.tsx:127`, `SuggestedGolferRow.tsx:91`; `src/components/courses/course-detail/CourseReviewsTab.tsx:502`. Block renders from Activity `src/features/activity-v2/ActivityPageV2.tsx:591`; row renders in `src/features/social-suggestions/NobodySawThatRound.tsx:148`. |
| `useEditProfileRoute` | Always canonical editor (`src/hooks/useEditProfileRoute.ts:5–6`). Hook consumers `src/pages/ProfilePageV2.tsx:130,170`; destinations `:156,920,936,963,1188`. PostingAsMenu hook `:39`, dispatch/destinations `:213–215,238–239,523`. |
| `handicapTabRoute` | `/profile?...`, `src/lib/handicap/handicapTabRoute.ts:11–16`. Consumers `src/components/friend-sheet/useMemberTapResolver.ts:65`; `src/pages/manage/HandicapManagePage.tsx:135`; `src/pages/HandicapRedirect.tsx:26,29`; `src/pages/RivalryCompareRedirect.tsx:23`; `src/components/profile/handicap/whs/connect/ManageScreen.tsx:368`; `src/features/activity-v2/utils/activityLinks.ts:429`. |
| `renamedProfilePath` | Preserves remainder/search/hash; `src/lib/profile/previousUsername.ts:14–17`; consumers `src/pages/ProfilePageV2.tsx:233`, `src/features/social-lists-v2/ProfileSocialListRoute.tsx:44`. |

No `getActorProfileRoute` definition/reference was found; actual similarly named authority is `getActorRouteByType` and the private activity wrapper (`src/types/actor.ts:42`; `src/features/activity-v2/utils/activityLinks.ts:80`). Empty username is not validated by the nullish profile builders; whether such rows exist is **not verifiable from the code** (`src/lib/profileRoutes.ts:22–23,39`).

### 1.4 Literal destinations and link locations

All source-family inventories below include dormant emitters explicitly; component reachability is not inferred from a destination string.

| Destination family | Identified literal emitters (`src/` paths) |
|---|---|
| Other-member profile | `pages/messaging-v2/PlayingOffRail.tsx:116`; `ConversationSettingsSheet.tsx:383`; `pages/PostDeepLinkPage.tsx:218`; `components/fullscreen-feed/ImmersiveFullscreenChrome.tsx:349`; `components/mentions/MentionText.tsx:93`; `features/comments-v2/components/CommentCard.tsx:146`, `ReplyRow.tsx:108`; `components/likes/LikesSheet.tsx:119`; `components/clubhouse/FriendsEmptyState.tsx:367`; `components/business/BusinessTeamTab.tsx:85`; `components/top100/sheets/Top100ListProgressSheet.tsx:160`; `components/shared/overlay/ReviewOverlayCore.tsx:108`; `components/loop-tab/LoopCard.tsx:330,343`; `features/tourhub/players-v2/picks/LinePicksCard.tsx:113`; `features/amateur/AmateurHero.tsx:355,391`; `features/explore-magazine/PeopleShelf.tsx:213`; `features/search-v2/lib/searchNavigation.ts:58`; `features/search-v2/components/SearchEmptyState.tsx:202`; `features/social-lists-v2/SocialListPage.tsx:638,641`; `features/admin/components/MemberRadar.tsx:524`; `features/activity-v2/components/FriendRequestsRail.tsx:204`; `features/activity-v2/utils/activityLinks.ts:327`; `features/coach/BusinessCoachCards.tsx:43`; `components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx:333`; course-legends `CourseLegendsDrilldown.tsx:583,600,614,670,719` in the same WHS sections directory. |
| Own profile | `components/header/PostingAsMenu.tsx:210–212,515`; `components/achievements/SeasonRecapModal.tsx:54`; `AchievementToast.tsx:46`; `pages/BusinessCreate.tsx:84`; `components/profile/handicap/whs/WhsConnectScreen.tsx:355,390`; `features/tourhub/news/NewsChromeBridge.tsx:77`; `features/activity-v2/utils/activityLinks.ts:307,453`. |
| Profile query/social | Courses `components/courses/user/useUserCoursesData.tsx:168`; Handicap `features/tourhub/players-v2/you/YouAndTourCard.tsx:43`; Top Ten activity target `features/activity-v2/utils/activityLinks.ts:502`; followers/friends `pages/ProfilePageV2.tsx:1119,1124`; own social redirect `components/profile/OwnProfileSocialRedirect.tsx:36`. |
| Edit/Settings | `components/profile/rounds/ProfileRoundsTab.tsx:168`; `pages/gate/HandoffPage.tsx:57`; `pages/ProfilePageV2.tsx:967`; `components/header/PostingAsMenu.tsx:218–220`; `features/tourhub/news/NewsChromeBridge.tsx:77`; completion nudges `features/activity-v2/utils/activityLinks.ts:430–432`; hook-backed emitters in §1.3. |
| Welcome | Resolver `lib/auth/postAuthRoute.ts:23` called by `pages/Auth.tsx:35,79,108` and `pages/auth/AuthForm.tsx:318,421,558`; callback `pages/auth/AuthCallback.tsx:69`; internal welcome `pages/Welcome.tsx:52,115`; alias `App.tsx:626`. Dead old emitter `pages/ManageProfile.tsx:238`. |
| Business create | `pages/MyBusinessesPage.tsx:92`; claim `components/courses/course-detail/ClaimCourseSheet.tsx:66`; alias `features/business-create/BusinessCreateRedirect.tsx:5`. |
| Business edit | `pages/BusinessProfilePage.tsx:342,363,398,406`; `pages/BusinessVerificationPage.tsx:186`; `components/business/verification/VerificationFlowSheet.tsx:1347`; `components/business/home/doNext.ts:186,206`; actor-aware `components/header/PostingAsMenu.tsx:213–220`. |
| Dormant profile destinations | `components/friend-sheet/FriendSheet.tsx:111` has no production opener (§2); old `pages/HandicapPage.tsx:99,489` is unrouted; `components/profile/ProfileAchievementsRail.tsx:147` is import-reachable from `pages/ProfilePageV2.tsx:98` but never rendered there. |

Stored/server-provided/external links cannot be certified from frontend literals alone and are **not verifiable from the code**. Pathname checks, upload allowlists, guest/chrome classification are not separate navigation emitters (`src/components/uploads/UploadProgressBanner.tsx:26–27`; `src/components/header/globalHeaderRules.ts:12–13`; `src/components/GlobalBottomNavigation.tsx:74–103`).

## 2. Live vs dead

### 2.1 Import-graph result

The scoped graph has 75 files without a production import path; the complete table follows. Source/test imports, re-exports, lazy literal imports and CSS imports were checked. Extensionless imports select `useProfileData.ts`, not the sibling `.tsx` (`src/pages/EditProfile.tsx:11`; alias `vite.config.ts:118–120`). The `.ts` updater persists while `.tsx` only changes local state (`src/hooks/useProfileData.ts:64–83`; `src/hooks/useProfileData.tsx:53–55`).

`ManageProfile` has no incoming production module import; canonical/alias routes point elsewhere (`src/App.tsx:301–302,642–643`). Tests nevertheless read its source text: `src/test/ob1Welcome.test.tsx:55,82`; `ep2EditProfileYou.test.tsx:209–210`; `ep3EditProfileGolf.test.tsx:74`; `ep4LinksPrivacy.test.tsx:149–150`. These are source assertions, not mounts or module imports.

**Full scoped inventory:** “None found” means no test module import in the parsed graph. Latest Git date is audit command evidence; the cited source anchor identifies the file, not a timestamp stored within it.

| File | Import evidence | Latest git edit (UTC) | Test imports |
|---|---|---|---|
| `src/hooks/useProfileData.tsx` | Shadowed by `.ts` for extensionless imports: `src/pages/EditProfile.tsx:11`; `vite.config.ts:118–120`; no explicit `.tsx` consumer found. | 2026-10-30T19:45:25Z | None found |
| `src/components/business/AddBusinessCard.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/business/AddBusinessCard.tsx:1` | 2026-08-10T06:56:45Z | None found |
| `src/pages/ManageProfile.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/pages/ManageProfile.tsx:1` | 2026-10-28T09:53:36Z | None found |
| `src/components/profile/EnhancedRegionalCoursesModal.tsx` | `src/components/profile/courses-journey/regions/WorldwideSection.tsx:6` (unreachable importer); `src/components/profile/courses-journey/regions/USASection.tsx:6` (unreachable importer); `src/components/profile/courses-journey/regions/GreatBritainIrelandSection.tsx:6` (unreachable importer); `src/components/profile/courses-journey/regions/ContinentalEuropeSection.tsx:4` (unreachable importer) | 2026-08-25T14:54:11Z | None found |
| `src/components/profile/CollegeSearchDropdown.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/CollegeSearchDropdown.tsx:1` | 2026-08-24T18:11:04Z | None found |
| `src/components/profile/types/ActivityTypes.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/types/ActivityTypes.ts:1` | 2026-08-08T06:38:56Z | None found |
| `src/components/profile/debug.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/debug.ts:1` | 2026-07-03T21:32:04Z | None found |
| `src/components/profile/actions/useProfileActions.tsx` | `src/components/profile/actions/BusinessProfileActions.tsx:5` (unreachable importer) | 2026-07-13T08:00:06Z | None found |
| `src/components/profile/actions/ProfileSocialButtons.tsx` | `src/components/profile/header/ProfileActionsRow.tsx:2` (unreachable importer) | 2026-07-13T08:00:06Z | None found |
| `src/components/profile/actions/BusinessProfileActions.tsx` | `src/components/profile/header/ProfileActionsRow.tsx:3` (unreachable importer) | 2026-06-29T15:44:39Z | None found |
| `src/components/profile/courses-journey/RegionalProgressRings.tsx` | `src/components/profile/courses-journey/index.ts:2` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/RecentlyPlayedSection.tsx` | `src/components/profile/courses-journey/index.ts:3` (unreachable importer) | 2026-06-17T09:44:09Z | None found |
| `src/components/profile/courses-journey/HighlightReelSection.tsx` | `src/components/profile/courses-journey/index.ts:4` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/utils/courseSorting.ts` | `src/components/profile/courses-journey/RecentlyPlayedSection.tsx:9` (unreachable importer); `src/components/profile/courses-journey/HighlightReelSection.tsx:9` (unreachable importer); `src/components/profile/courses-journey/regions/WorldwideSection.tsx:10` (unreachable importer); `src/components/profile/courses-journey/regions/USASection.tsx:10` (unreachable importer); `src/components/profile/courses-journey/regions/GreatBritainIrelandSection.tsx:10` (unreachable importer); `src/components/profile/courses-journey/index.ts:12` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/types.ts` | `src/components/profile/courses-journey/index.ts:9` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/edit-v2/index.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/edit-v2/index.ts:1` | 2026-06-27T19:43:39Z | None found |
| `src/components/profile/edit-v2/VisibilityDropdown.tsx` | `src/pages/ManageProfile.tsx:51` (unreachable importer); `src/components/profile/edit-v2/index.ts:14` (unreachable importer); `src/components/profile/edit-v2/HomeClubCard.tsx:2` (unreachable importer); `src/components/profile/edit-v2/AdditionalClubsList.tsx:5` (unreachable importer) | 2026-09-07T13:11:02Z | None found |
| `src/components/profile/edit-v2/PrivacySection.tsx` | `src/components/profile/edit-v2/index.ts:12` (unreachable importer) | 2026-08-24T19:46:38Z | None found |
| `src/components/profile/edit-v2/InviteClubModal.tsx` | `src/components/profile/edit-v2/index.ts:16` (unreachable importer) | 2026-07-20T08:22:08Z | None found |
| `src/components/profile/edit-v2/IdentitySection.tsx` | `src/components/profile/edit-v2/index.ts:4` (unreachable importer) | 2026-08-24T18:00:39Z | None found |
| `src/components/profile/edit-v2/HomeClubCard.tsx` | `src/pages/ManageProfile.tsx:47` (unreachable importer); `src/components/profile/edit-v2/index.ts:5` (unreachable importer) | 2026-09-07T13:01:08Z | None found |
| `src/components/profile/edit-v2/HandicapInput.tsx` | `src/pages/ManageProfile.tsx:53` (unreachable importer); `src/components/profile/edit-v2/index.ts:8` (unreachable importer) | 2026-08-24T18:00:39Z | None found |
| `src/components/profile/edit-v2/BioWebsitesSection.tsx` | `src/pages/ManageProfile.tsx:54` (unreachable importer); `src/components/profile/edit-v2/index.ts:9` (unreachable importer) | 2026-08-24T19:46:38Z | None found |
| `src/components/profile/edit-v2/AdditionalClubsList.tsx` | `src/pages/ManageProfile.tsx:50` (unreachable importer); `src/components/profile/edit-v2/index.ts:6` (unreachable importer) | 2026-08-24T19:46:38Z | None found |
| `src/components/profile/journey/GolfJourneyCard.tsx` | `src/components/profile/index.ts:3` (unreachable importer) | 2026-08-24T14:50:19Z | None found |
| `src/components/profile/index.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/index.ts:1` | 2026-10-15T17:42:58Z | None found |
| `src/components/profile/courses-journey/regions/WorldwideSection.tsx` | `src/components/profile/courses-journey/regions/CoursesbyRegionSection.tsx:2` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/regions/USASection.tsx` | `src/components/profile/courses-journey/regions/CoursesbyRegionSection.tsx:3` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/regions/GreatBritainIrelandSection.tsx` | `src/components/profile/courses-journey/regions/CoursesbyRegionSection.tsx:4` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/regions/CoursesbyRegionSection.tsx` | `src/components/profile/courses-journey/index.ts:6` (unreachable importer) | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/regions/ContinentalEuropeSection.tsx` | `src/components/profile/courses-journey/regions/CoursesbyRegionSection.tsx:5` (unreachable importer) | 2026-08-17T15:36:02Z | None found |
| `src/components/profile/courses-journey/index.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/courses-journey/index.ts:1` | 2026-02-02T19:46:24Z | None found |
| `src/components/profile/courses-journey/TopRatedSection.tsx` | `src/components/profile/courses-journey/index.ts:5` (unreachable importer) | 2026-04-22T13:28:33Z | None found |
| `src/components/profile/header/index.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/header/index.ts:1` | 2026-09-27T20:42:46Z | None found |
| `src/components/profile/header/ProfileTop100Chip.tsx` | `src/components/profile/header/index.ts:5` (unreachable importer) | 2026-09-10T15:47:01Z | None found |
| `src/components/profile/header/ProfileStatsRow.tsx` | `src/components/profile/header/index.ts:3` (unreachable importer) | 2026-03-10T15:11:54Z | None found |
| `src/components/profile/header/ProfileHeaderCard.tsx` | `src/components/profile/header/index.ts:2` (unreachable importer) | 2026-10-05T11:21:24Z | None found |
| `src/components/profile/header/ProfileCompletionStamps.tsx` | `src/components/profile/header/index.ts:7` (unreachable importer); `src/components/profile/header/ProfileTop100Chip.tsx:8` (unreachable importer) | 2025-12-04T06:10:17Z | None found |
| `src/components/profile/header/ProfileAvatarRing.tsx` | `src/components/profile/header/index.ts:6` (unreachable importer) | 2026-09-02T16:37:34Z | None found |
| `src/components/profile/header/ProfileActionsRow.tsx` | `src/components/profile/header/index.ts:4` (unreachable importer) | 2025-12-09T06:42:55Z | None found |
| `src/components/profile/components/BioWebsitesSection.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/components/BioWebsitesSection.tsx:1` | 2025-09-25T07:54:06Z | None found |
| `src/components/profile/handicap/gam/launch/LaunchSheet.tsx` | `src/components/profile/handicap/gam/launch/LaunchSheetMount.tsx:2` (unreachable importer) | 2026-08-12T08:56:50Z | None found |
| `src/components/profile/handicap/gam/launch/LaunchSheetMount.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/gam/launch/LaunchSheetMount.tsx:1` | 2026-09-10T11:41:39Z | None found |
| `src/components/profile/handicap/gam/launch/_internal/useLaunchSheetState.ts` | `src/components/profile/handicap/gam/launch/LaunchSheetMount.tsx:3` (unreachable importer) | 2026-05-18T16:28:27Z | None found |
| `src/components/profile/handicap/gam/launch/_internal/PersonalizationSection.tsx` | `src/components/profile/handicap/gam/launch/LaunchSheet.tsx:5` (unreachable importer) | 2026-08-12T13:40:22Z | None found |
| `src/components/profile/handicap/gam/launch/_internal/FeatureCard.tsx` | `src/components/profile/handicap/gam/launch/LaunchSheet.tsx:4` (unreachable importer) | 2026-09-23T06:15:51Z | None found |
| `src/components/profile/handicap/whs/sections/trends/predictHandicap.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/trends/predictHandicap.ts:1` | 2026-10-16T08:18:46Z | None found |
| `src/components/profile/handicap/whs/sections/trends/computeRoundDeltas.ts` | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:8` (unreachable importer) | 2026-09-27T15:57:25Z | None found |
| `src/components/profile/handicap/whs/sections/trends/RoundsArchiveSheet.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/trends/RoundsArchiveSheet.tsx:1` | 2026-09-23T17:58:34Z | None found |
| `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx` | `src/components/profile/handicap/whs/sections/trends/RoundsArchiveSheet.tsx:20` (unreachable importer) | 2026-10-14T09:13:14Z | None found |
| `src/components/profile/handicap/whs/sections/SeeAllRow.tsx` | `src/components/profile/handicap/whs/sections/recently-played/RecentlyPlayedFeed.tsx:10` (unreachable importer) | 2026-09-10T11:43:02Z | None found |
| `src/components/profile/handicap/whs/sections/last-round-card/CinemaCardShapeStrip.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/last-round-card/CinemaCardShapeStrip.tsx:1` | 2026-08-25T12:02:42Z | None found |
| `src/components/profile/handicap/whs/sections/course-legends/types.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/course-legends/types.ts:1` | 2026-09-10T11:55:44Z | None found |
| `src/components/profile/handicap/whs/sections/round-card/index.ts` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/round-card/index.ts:1` | 2026-05-13T13:46:28Z | None found |
| `src/components/profile/handicap/whs/sections/round-card/RoundCardShell.tsx` | `src/components/profile/handicap/whs/sections/round-card/index.ts:1` (unreachable importer) | 2026-10-23T11:33:46Z | None found |
| `src/components/profile/handicap/whs/sections/round-card/RoundCardHoleStrip.tsx` | `src/components/profile/handicap/whs/sections/round-card/index.ts:3` (unreachable importer); `src/components/profile/handicap/whs/sections/round-card/RoundCardShell.tsx:13` (unreachable importer) | 2026-09-22T09:16:33Z | `src/test/scorecardHeadPar.test.tsx:22` |
| `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/useCircleClubs.ts` | `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx:29` (unreachable importer) | 2026-09-10T13:40:59Z | None found |
| `src/components/profile/handicap/whs/sections/invite-to-clbhouz/inviteTiers.ts` | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteProgressPanel.tsx:15` (unreachable importer) | 2026-08-03T09:46:35Z | None found |
| `src/components/profile/handicap/whs/sections/invite-to-clbhouz/invitePresentation.tsx` | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx:19` (unreachable importer) | 2026-10-16T09:47:57Z | None found |
| `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx` | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx:10` (unreachable importer) | 2026-10-16T09:45:32Z | None found |
| `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx:1` | 2026-08-17T15:36:02Z | None found |
| `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteProgressPanel.tsx` | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx:9` (unreachable importer) | 2026-08-12T13:40:00Z | None found |
| `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteCard.tsx` | `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx:8` (unreachable importer) | 2026-09-23T06:18:05Z | None found |
| `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx:1` | 2026-10-23T11:33:46Z | None found |
| `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx:1` | 2026-09-10T15:43:56Z | None found |
| `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/CircleRow.tsx` | `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx:28` (unreachable importer) | 2026-09-27T20:36:27Z | None found |
| `src/components/profile/handicap/whs/connect/HandicapCard.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/connect/HandicapCard.tsx:1` | 2026-08-24T20:13:12Z | None found |
| `src/components/profile/handicap/whs/connect/DrawSparkline.tsx` | `src/components/profile/handicap/whs/connect/HandicapCard.tsx:3` (unreachable importer) | 2026-08-08T12:06:05Z | None found |
| `src/components/profile/handicap/whs/sections/recently-played/RecentlyPlayedFeed.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/recently-played/RecentlyPlayedFeed.tsx:1` | 2026-09-10T09:49:21Z | None found |
| `src/components/profile/handicap/whs/sections/recently-played/FriendsRoundsSheet.tsx` | `src/components/profile/handicap/whs/sections/recently-played/RecentlyPlayedFeed.tsx:14` (unreachable importer) | 2026-09-10T15:43:56Z | None found |
| `src/components/profile/handicap/whs/sections/recently-played/FriendRoundRow.tsx` | `src/components/profile/handicap/whs/sections/recently-played/RecentlyPlayedFeed.tsx:13` (unreachable importer); `src/components/profile/handicap/whs/sections/recently-played/FriendsRoundsSheet.tsx:7` (unreachable importer) | 2026-09-10T08:48:03Z | None found |
| `src/components/profile/handicap/whs/sections/header/CompareOwnerCTA.tsx` | `src/pages/HandicapPage.tsx:39` (unreachable importer) | 2026-08-12T13:33:50Z | None found |
| `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx` | `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:11` (unreachable importer); `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx:7` (unreachable importer); `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx:19` (unreachable importer) | 2026-10-23T11:33:46Z | None found |
| `src/components/profile/handicap/whs/sections/_shared/atoms.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/_shared/atoms.tsx:1` | 2026-08-12T08:56:50Z | None found |
| `src/components/profile/handicap/whs/sections/_shared/Pager.tsx` | No incoming runtime import in parsed source; declaration/file anchor `src/components/profile/handicap/whs/sections/_shared/Pager.tsx:1` | 2026-09-23T07:01:49Z | None found |

### 2.2 Disconnected dependency closure and impossible renders

The 15 additional disconnected dependencies have only dead importers: `src/hooks/useModalDetector.ts` ← `EnhancedRegionalCoursesModal.tsx:10`; `src/components/CourseCardDraggable.tsx` ← same `:21`; `src/utils/debugFlags.ts` ← `src/components/profile/debug.ts:14`; `src/hooks/useRelationshipStatus.ts` ← dead `actions/useProfileActions.tsx:9`, social/business actions `:4`; `src/hooks/useCarouselNavigation.tsx` ← dead RecentlyPlayed/HighlightReel/regional/TopRated sections `:6–10`; `src/hooks/useDragScroll.tsx` ← carousel hook `:3`; `src/hooks/useSectionLoader.ts` ← RecentlyPlayed `:7`, TopRated `:9`; `src/components/ui/SkeletonRow.tsx` ← those sections `:8,10`; `src/hooks/usePlayedCoursesWithRatings.ts` ← dead regional sections `:7,9`; `src/lib/top100Helpers.ts` ← dead ProfileTop100Chip `:9`; `src/features/tourhub/hooks/useCollegeMovers.ts` ← ProfileHeaderCard `:6`; `useCollegeStats.ts`/`useCollegeMedia.ts` ← movers `:3,4`; `src/lib/utils/normalizeCollege.ts` ← college media `:3`; `src/lib/whs/utils/buildLeaderboardCohorts.ts` ← dead FullLeaderboardSheet `:30`. No test import found for these dependencies. The old `src/pages/HandicapPage.tsx:39,275,539` is also unrouted and supplies the otherwise misleading CompareOwnerCTA import; current handicap routes mount redirects (`src/App.tsx:630,634`).

**Recently edited dead files (UTC):** `useProfileData.tsx` 2026-10-30T19:45:25Z; `ManageProfile.tsx` 2026-10-28T09:53:36Z; `RoundCardShell.tsx`, `friends-leaderboard-v2/LeaderboardRow.tsx`, `_shared/darkAtoms.tsx` each 2026-10-23T11:33:46Z. Paths and disconnected import evidence are in the preceding table; these dates came from per-file read-only Git history.

| Import-reachable but impossible/dormant behavior | Why |
|---|---|
| BusinessProfileEditor create mode | Mode is solely `id ? 'edit' : 'create'` (`src/pages/BusinessProfileEditor.tsx:107–108`), but its only production mount is `/business/:id/edit` (`src/App.tsx:467,768`); create mounts another page (`:764`). Impossible create branches: prefill `:200–207`; college lookup `:320–336`; duplicate/pending claims `:343–407`; validity/dirty `:417–428`; submit `:554–572`; legacy hero/identity `:649–711`; claim UI `:714–770`; old facilities/contact/action/hours/social/footer `:776–864`; discard `:875–893`; pin drop `:896–906`. Header route claim `:8–9` is stale. |
| Six legacy business sections | `IdentitySection`, `FacilitiesSection`, `LocationContactSection`, `PrimaryActionSection`, `OpeningHoursSection`, `SocialSection` are imported by editor `:55–63`, but only rendered in impossible create blocks `:649–711,776–864`. Tests only mock them: `src/test/be1BusinessEditSettings.test.tsx:29–34`; be2 `:25–29`; be3/be4 `:20–23`. Their canonical selector is not a second live Creator offering. |
| Profile Achievements switch | Parser excludes achievements (`src/pages/ProfilePageV2.tsx:310–314`); tab definitions exclude it (`src/hooks/useProfileType.ts:34–59`); state originates from parser/tab selection (`ProfilePageV2.tsx:315,345,353–355,600`); switch `:862–883` cannot be selected through current inputs. Imported ProfileAchievementsRail `:98` has no JSX use; its own literal link `src/components/profile/ProfileAchievementsRail.tsx:147` is dormant. |
| Legacy Top 100 URL | **Not a permanent empty-content defect:** although no top100 content case exists, effect normalizes it to Courses and replaces URL (`src/pages/ProfilePageV2.tsx:483–490`). An intermediate render can return null before effect, not an unsupported settled destination. |
| FriendSheet | Provider is globally mounted (`src/App.tsx:1175–1204`), state begins null, only `open` sets it, child guarded (`src/components/friend-sheet/FriendSheetProvider.tsx:44–60`). Only production `useOpenFriendSheet` consumer destructures unused `openHybridSheet` (`src/pages/ProfilePageV2.tsx:16,173`); no invocation found. Import-reachable, but no current production opener. |

The old ProfileSheetV2 component was deleted (`ACCOUNT_TILE_STOP_REPORT.md:58`); AccountGlance is the reachable mobile replacement (`src/components/header/PostingAsMenu.tsx:254–280`), hosted by ChromeIsland `src/features/chrome-v2/ChromeIsland.tsx:907`, AppHeader `src/components/chrome/AppHeader.tsx:265`, and NewsChromeBridge `src/features/tourhub/news/NewsChromeBridge.tsx:78`. AccountGlance has profile/Settings/actor switching, not a dedicated Edit action (`src/features/chrome-v2/AccountGlance.tsx:63–72`; PostingAsMenu `:200–220,269–273`); desktop Edit remains `:523`. Stale ProfileSheetV2 comments are not imports (`:199,225`).

No wholly disconnected Settings/onboarding/canonical edit/business-create/profile-sheet-helper/style file was found in the scoped graph. Partial `edit-v2` survival is real: SocialLinksSection → `src/features/edit-profile/EditProfileLinksPrivacy.tsx:9`; LocationSection → EditProfileYou `:13`; SegToggle → GenderPromptSheet `:6`; PhotoActionSheet → ProfilePageV2 `:104`; cropper → WelcomeCropper `:6`; SectionCard → business NotificationsSection `:15`. `src/styles/profile-spacing.css` is globally imported (`src/index.css:5`); Welcome styles (`src/pages/Welcome.tsx:25`); editor/create CSS (`src/pages/EditProfile.tsx:25–26`); business edit/contact styles (`src/components/business/editor/BusinessEditFrame.tsx:9`; BusinessEditWhereContact `:15`; AddressAutocomplete `:7`). File reachability does not establish that every CSS selector matches DOM.

An additional out-of-scope collision exists at `src/hooks/useCloudflareStream.ts:1` and `.tsx:1`; neither has an incoming import in the inspected graph. Same filenames in **different directories** are not same-import-path duplicates.

## 3. The profile page

### 3.1 Tab authority and inputs

`getProfileType(profile.user_type)` and `getProfileTabs(profile.user_type)` determine base tabs (`src/pages/ProfilePageV2.tsx:391–393`). `isSelf` comes from session member vs profile owner; active posting actor separately changes `isSelfView`, not tab ownership (`:253–269`). The viewer-visible count query is enabled only for personal non-self profiles (`:397–400`); query `['profile-rounds', userId]` derives array length (`src/components/profile/rounds/useProfileRounds.ts:67–75`). Actual RLS/privacy/row completeness is **not verifiable from the code**.

| Classification/view | Tabs in order | Evidence |
|---|---|---|
| Personal self, any count | Posts, Courses, Rounds, Handicap | `src/hooks/useProfileType.ts:34–40`; `src/pages/ProfilePageV2.tsx:401–415` |
| Personal other, positive visible count | Posts, Courses, Rounds | Same; self-only Handicap filter |
| Personal other, zero/unresolved count | Posts, Courses | Same count rule |
| Non-personal fallback, any viewer | Posts | `src/hooks/useProfileType.ts:42–50,55–57` |

Own handicap visibility labels privacy rather than hiding own tab (`src/components/profile/rounds/useProfileRounds.ts:87–99`). An owner posting as business still has member-self tabs (`src/pages/ProfilePageV2.tsx:253–269,401–405`).

### 3.2 URL and content behavior

Exact case-sensitive accepted values: `activity`, `courses`, `rounds`, `top100`, `handicap`, `stats`. Missing/unknown (including posts/settings/achievements/different case) → activity; stats → handicap (`src/pages/ProfilePageV2.tsx:310–315`). Initial state captured on mount and later URL changes synchronize (`:315,345–356`). Unknown string is not itself stripped.

- Top100 → Courses, replace query with `{tab:'courses'}` (`:483–490`). Other-member zero rounds → activity, replace query with `{tab:'activity'}` (`:419–425`); both can discard unrelated search parameters.
- Other-member Handicap/Stats → comparison, regardless of personal classification (`:427–432`). Self non-personal handicap yields null; non-personal Courses URL still renders Courses despite hidden tab; non-personal Rounds yields null; unresolved non-self count can temporarily leave null Rounds content (`:397–432,836–859`). Accepted URL is therefore not equivalent to available tab.
- One-shot `course`, `top_ten_comment`, `top_ten_parent` captured/consumed with other parameters retained (`:317–343`); stale subtab removed (`:438–442`). Achievements switch is unreachable (§2).

### 3.3 Every runtime account-type interpretation found

| Field/domain | Interpretation / source |
|---|---|
| `user_type` frontend authority | `src/hooks/useProfileType.ts:20–28`: falsy/null/undefined/empty, individual, personal → personal; **every other nonempty string** → business. Generated enum includes club, pro_shop, academy, tour_event, other, brand, creator (`src/integrations/supabase/types.ts:27289–27298`). All these, plus unknown strings, get Posts-only fallback on personal page (`useProfileType.ts:48–57`). |
| Separate `profile_type` helper | `src/types/profile.ts:45–47`: exact business → business; everything else, including creator/club/null/unknown → personal. Display business_name only for exact business, otherwise display_name (`:53–62`). No production consumer of these helper functions found; live profile imports hook-file helper (`src/pages/ProfilePageV2.tsx:22,391`). |
| Server edge eligibility | Exact `profile_type='personal'` filter (`supabase/functions/compute-golfer-eligibility-signals/index.ts:214`); null/unknown do not equal personal, unlike helper fallback. Affected records/deployment **not verifiable from the code**. |
| Transport, not interpretation | `src/hooks/useUserProfile.tsx:28–29`; `src/lib/supabase/selects.ts:132–133`; `src/features/social-lists-v2/hooks/useSocialListV2.ts:36`; onboarding cache transport `src/pages/Welcome.tsx:98`, dead ManageProfile `:82,289`. |
| Actor type | Current personal/business only (`src/types/actor.ts:6`); stored old creator becomes personal (`src/context/ActiveActorContext.tsx:72–81`); not the profile-field classifier. |
| Analytics profile_type | Separate personal/business polymorphic discriminator/validation/ownership in recorded migration `supabase/migrations/20260116165844_fb97a315-a6e1-4b65-8636-2c2a3b90115c.sql:17–20,33–36,58,73–74,171–173,191–193`. |

Historical migration semantics remain distinct, with deployment **not verifiable from the code**: original individual/default enum (`supabase/migrations/20250622203138-d1526c0a-47d9-40b1-8de1-81a0e90fc6fb.sql:3,10`); brand/creator/personal additions/null backfill (`20251204041043_4be2a007-e437-4621-9606-d4a98094a8ac.sql:6–8,39–42`); historical individual-or-null personal/five-category business grouping (`20250709162527-47d5ab9d-51d1-4730-8a4a-36b46dfd0511.sql:102,118`; `20250724083744-5ac61f5c-281f-41f0-a253-efaf1d102add.sql:204,220`); non-individual location exposure (`20250812144556-.sql:49`; `20250812144621-.sql:51`); taggable mapping recognizes **only individual**, so personal falls through to business (`20260317161822_61deeee9-a46d-4e35-8056-3593be2b5825.sql:15–16,30–35,43–50`); profile_type business/business_name eligibility (`20251211054009_b6c66fd6-f56d-4be0-82b2-5f713dcf4a8a.sql:96`); personal migration assignment (`20251211084340_269efa7d-8b52-4326-beda-211cdb688c86.sql:11`). Filenames here are within `supabase/migrations/`.

## 4. Writes to the member's profile

### 4.1 Checking vocabulary and shared saver

**Checked row** means returned ID/single plus error/missing-data checks; **error-only** does not assert a matched row; **unchecked** means returned error is not inspected. Runtime/deployed policies and row counts are **not verifiable from the code**.

All `useProfileSave` callers are EditProfile, Welcome, and dead ManageProfile (`src/pages/EditProfile.tsx:37`; `Welcome.tsx:43`; `ManageProfile.tsx:101`). Live editor always supplies photo/profileFields (`EditProfile.tsx:89–101`); Welcome supplies welcomeFields (`Welcome.tsx:104,108`). Default/full branch is implemented but only called by dead ManageProfile (`:275`), not a live routed editor save.

| Saver branch | Explicit columns | Row/failure behavior |
|---|---|---|
| Photo profile/header | profile_photo_url OR header_photo_url; updated_at | Checked row; invalidate profile only; thrown errors reach toast/false (`src/hooks/useProfileSave.ts:109–117,269–274`). |
| Name | first_name,last_name,display_name,updated_at | Checked row; shared catch/toast/false (`:137–138,149–156,269–274`). |
| Bio / location / manual handicap | bio OR country,city OR manual_handicap_index; updated_at | Checked row; handicap returns false without writing if WHS-connected (`:136,139–141,149–156`). |
| Home club | home_club,primary_club_id,updated_at | Checked row; broader club invalidation (`:142,149–156`). |
| Websites / socials | websites OR instagram_handle,twitter_handle,tiktok_handle,youtube_handle; updated_at | Checked row (`:143–144,149–156`). |
| Visibility / gender | home_club_visibility OR additional_clubs_visibility OR top_ten_visibility OR gender; updated_at | Checked row; gender percentile invalidation (`:145–156`). |
| Welcome identity | first_name,last_name,derived display_name,lowercase username,username_is_custom,profile_photo_url,updated_at | Checked row; 23505→username_taken, other failures shared catch (`:162–172,269–274`). |
| Welcome course | primary_club_id,home_club,updated_at | Checked row; same failure branch; suggested-golfers invalidation (`:163–172`). |
| Default/full, currently unrouted | display_name,first_name,last_name,bio,is_public,profile_photo_url,header_photo_url,home_club,primary_club_id,manual_handicap_index,home_club_visibility,additional_clubs_visibility,top_ten_visibility,show_additional_home_clubs,websites,four social handles,country,city,gender,has_completed_onboarding=true,updated_at; onboarding username/custom when nonempty | Payload `:57–86,98–105`; remove manual index if connected `:88–91`; blank seeded names removed `:93–96`; checked row `:184–203`; uniqueness mapping; later additional-club failures return false after profile persisted `:205–240,269–274`. |

AdditionalClubs is **not** a user_profiles writer: replaces user_home_clubs and checks returned errors before early return (`src/hooks/useProfileSave.ts:121–135`). Default profile + later clubs are separate requests, not atomic (`:184–240`).

### 4.2 Other frontend paths

| Path | Fields / target | Check and failure |
|---|---|---|
| Generic updater | dynamic field/value; own ID | Error-only, logs/rethrows; patches exact cache on success (`src/hooks/useProfileData.ts:64–83`). Shadowed .tsx updater is local-only (`:53–55`). |
| Privacy handlers | is_public; handicap_visibility; leaderboard_visibility; top100_visibility; auto_post_rounds | Own ID; error-only, optimistic local rollback and toast (`src/hooks/usePrivacySettings.ts:54–152`). |
| Legacy Top100 handler | top100_visible | Owner guard, error-only/rethrow; invalidates userProfile with ID (`src/hooks/useTop100CoursesData.tsx:96–114`). |
| Dead ManageProfile skip | has_completed_onboarding,updated_at | Checked row; error analytics/toast/no navigation (`src/pages/ManageProfile.tsx:144–177`). |
| Welcome finish/Skip | has_completed_onboarding,updated_at | Checked row; failure message/stay, success cache/navigation (`src/pages/Welcome.tsx:91–100`). |
| Profile avatar upload | profile_photo_url | Error-only, upload/DB failures log/toast; both profile caches on success (`src/pages/ProfilePageV2.tsx:618–638`). |
| Profile avatar removal | profile_photo_url=null | **Error-only, not unchecked**: destructures error, toasts/returns; cache/success follows (`:642–649`). |
| Apple/Google names | first_name,last_name conditionally; own ID where first_name null | Error-only; logs and continues auth (`src/pages/auth/AuthForm.tsx:397–418,513–524`). |
| Google photo | profile_photo_url; where photo null | Error-only/best effort; no matched-row assertion (`src/pages/auth/AuthForm.tsx:527–551`). |
| Decline hook / ConnectGlance / Settings | hide_handicap_chip true / true / inverse checked state | Error-only, toast; cache invalidation, busy/close behavior (`src/lib/whs/useDeclineHandicapChip.ts:17–31`; `src/features/chrome-v2/ConnectGlance.tsx:15–29`; `src/components/settings/SettingsTabContent.tsx:118–138`). |
| WHS connect auto-restore | hide_handicap_chip=false | Unchecked returned error; catches exceptions only; caches invalidated (`src/components/profile/handicap/whs/WhsConnectScreen.tsx:281–292`). |
| Set home club | primary_club_id,home_club,pending_name/key=null,updated_at | Error-only, throws→mutation toast (`src/features/home-club/useSetHomeClub.ts:15–41`). |
| Gender prompt | gender | Error-only; toast, sheet stays for retry, busy reset (`src/components/profile/GenderPromptSheet.tsx:107–129`). |
| Activity exit / explicit mark-all | last_notifications_seen_at, own ID, monotonic predicate | Exit unchecked; explicit checks notification/profile errors, toast/return (`src/features/activity-v2/ActivityPageV2.tsx:317–326,350–366`). |
| Dead launch dismissal | gam_launch_seen_at | Error-only, mutation throw; optimistic payload success patch (`src/components/profile/handicap/gam/launch/_internal/useLaunchSheetState.ts:39–58`). |

### 4.3 Edge-source direct writes

Deployment/call frequency is **not verifiable from the code**; listed bodies are repository evidence, not permission to change them.

| Source (`supabase/functions/`) | Columns / result |
|---|---|
| `_shared/eg-api.ts:578–589` | eg_handicap_index,manual_handicap_index=null,updated_at; error-only/log, no throw at write. Shared callers connect-whs/index.ts:623–626; sync-whs-one/index.ts:128; sync-whs-due/index.ts:237–238. |
| bypass-golfer-approval/index.ts:125–145 | is_verified_golfer,golfer_verified_at,golfer_verified_by; error-only/log+throw. |
| verify-bulk/index.ts:230–240 | is_verified_golfer; error-only, failed item recorded, loop continues. |
| delete-account/index.ts:562–581 | deleted_at,anonymized display_name/username,null bio/profile_photo_url/cover_photo_url/phone,is_public=false; error-only, checked before continuing deletion. |
| delete-whs-data/index.ts:87–102; disconnect-whs/index.ts:86–98 | eg_handicap_index=null; unchecked returned error; exceptions nonfatal, success continues. |
| request-course/index.ts:191–199,267 | home_club_pending_name/key,updated_at; error-only/log, request can succeed anyway. |
| secure-admin-operations/index.ts:325–339 | suspend is_suspended,suspended_until,suspension_reason,suspended_by,suspended_at; error-only audit/result+break. |
| same :394–411,457–475 | two unsuspend branches clear is_suspended/until/reason/at, not suspended_by; error-only, success notification only. |
| same :663–678 | username,username_is_custom; error-only audit/result+break. |
| same :758–772,807–818 | is_verified_golfer true/false; error-only audit/result+break; remove sends no success notification. |
| update-media-urls-to-r2/index.ts:77–112 | conditional profile_photo_url,cover_photo_url,logo_url; error-only per-row log/count. |
| update-mobile-crop/index.ts:30–70 | four mobile_crop fields, supplied updated_at; matches **user_id**, not id; error-only log/throw→500, no matched-row proof. |

### 4.4 RPCs, triggers, and historical definitions

`change_username` caller lowercases/trims and invalidates profile families (`src/features/edit-profile/EditProfileYou.tsx:149–156`); no repository migration body found, so fields/authorization/matched-row semantics are **not verifiable from the code**. `sync_user_email` is **not** a member-profile writer: recorded definition updates admin_profiles email/updated_at, with no matched-row check (`supabase/migrations/20260303162712_9e706a76-1746-401e-a1f7-08f04bfd83a2.sql:2–15`); Settings caller warns on error (`src/components/settings/SettingsTabContent.tsx:87–95`).

Latest located repository definitions below may coexist unless explicitly replaced/dropped; installation/grants/triggers and actual data are **not verifiable from the code**. SQL errors without exception handling propagate; that is different from a frontend returned-error result.

| Definition under `supabase/migrations/` | Recorded user_profiles write/check |
|---|---|
| handle_new_user — 20260611211440_e1e421f4-18c8-4dd6-b60b-9d8275843a24.sql:1–76 | Insert id/username/display/first/last,user_type individual,is_public true,onboarding false,username_is_custom (:67–72); generated collision probing :21–37; metadata username skips probing :17–19; conflict ID does nothing, no inserted-row check. |
| update_mobile_crop_data — 20250823064102_7104a8e9-ad79-4c6c-9f5b-0eb8a046d21d.sql:2–21 | Four crop fields+updated_at, user_id predicate, no matched-row check. |
| admin_set_test_user_photo — 20251210153747_c3ce9927-b57c-4afb-8533-5d5b39b291f6.sql:2–13 | profile_photo_url for is_test; no local authorization/matched-row check in body. |
| request_business_verification — 20251211054009_b6c66fd6-f56d-4be0-82b2-5f713dcf4a8a.sql:65–127 | verification_status/requested_at :101–105; auth/existence/ownership/business checks :77–98; no post-write count. |
| update_business_verification_status — same :129–180 | status/review time/by/notes/is_business_verified :156–164; auth/admin/status validation; no matched-row check. |
| submit_golfer_verification_review — 20251213065956_ce57fe4b-16ec-4b10-922e-5e00a41b3b2e.sql:159–249 | golfer flag/time/by at :249; admin/duplicate checks :174–184; no profile matched-row check. |
| decide_golfer_verification — 20260818133810_2cb744b0-36f0-47b6-8006-9d92f824449c.sql:165–228 | flag/time/by :204–209; admin/decision/request checks :178–193; no profile matched-row check. |
| remove_golfer_verification — same :235–265 | clears flag/time/by :250–252; rejects non-admin if auth.uid nonnull :246–248; no matched-row check; replaces older two-arg version. |
| link_pending_home_club_members — 20251218061458_4dc11b29-76aa-4314-b4b1-8a6b3b7d9000.sql:61–80 | home_club_business_id,cleared pending fields :69–76; zero matches allowed. |
| set_home_club / request_club_page — same :129–163,169–207 | business club/pending fields, auth ID; no explicit auth/matched-row assertion; latter coalesces pending only without linked club :199–204. |
| set_home_clubs — 20251218074222_85d7fb55-d131-46d8-9caf-00be9942ef52.sql:42–67 | business club/conditional pending clearing :59–64; explicit auth and NOT FOUND check :54–67; additional relations also written. |
| sync_user_profiles_handicap_from_snapshot — 20260820052136_b85a521c-e650-42c2-adac-c6af71b46980.sql:4–22 | eg index/manual null/updated_at via connection join :11–18; no matched-row check; returns NEW. |
| resolve_home_club_request / reject_home_club_request — 20260831075047_ee09381b-900f-4bab-8921-5789cb7539f0.sql:14–87,94–131 | resolve primary_club_id/home_club/pending cleared/updated_at :56–64; reject pending cleared/time :117–121; admin/request/club validations, no affected-profile assertion; subsequent SELECT is not UPDATE RETURNING. |

### 4.5 Duplicate writers and explicitly unread fields

| Overlapping columns | Explicit paths (with evidence above) |
|---|---|
| Names/display | full/name/Welcome saver `src/hooks/useProfileSave.ts:58–60,138,164`; Apple/Google `AuthForm.tsx:403–409,517–523`; display also deletion `delete-account/index.ts:562–570`; provisioning migration §4.4. |
| Username/custom | onboarding full/Welcome `useProfileSave.ts:102–104,164`; admin `secure-admin-operations/index.ts:665–668`; deletion username; provisioning. change_username body unknown. |
| Avatar/header | avatar full/photo/Welcome `useProfileSave.ts:63–64,110–113,164`; profile upload/removal `ProfilePageV2.tsx:626,645`; Google `AuthForm.tsx:540`; deletion/conversion `delete-account/index.ts:562–570`, `update-media-urls-to-r2/index.ts:84–105`; test-photo function. Header full/photo only. |
| Bio/public | full/sheet/toggle/delete `useProfileSave.ts:61–62,139`; `usePrivacySettings.ts:58–60`; deletion; provisioning public. |
| Home club/primary ID/pending/business club | full/sheet/Welcome/setter `useProfileSave.ts:65–66,142,165`; `useSetHomeClub.ts:22–30`; request-course `:191–199`; multiple home-club functions/triggers §4.4. |
| Index | manual full/sheet `useProfileSave.ts:69,141`; edge sync clears manual/writes EG `_shared/eg-api.ts:580–585`; disconnect/delete clear EG; snapshot trigger §4.4. |
| Gender/location/websites/socials/visibilities | full and partial saver `useProfileSave.ts:71–82,140,143–148`; gender prompt `GenderPromptSheet.tsx:113–115`. |
| Onboarding | default full `useProfileSave.ts:84`; dead skip `ManageProfile.tsx:145–149`; Welcome `:95`; provisioning false. |
| Handicap-chip hiding | decline/glance/Settings/connect restore §4.2. |
| Notification timestamp | two Activity paths `ActivityPageV2.tsx:319–322,355–359`. |
| Golfer verification flag/time/by | bypass/bulk/admin edges §4.3 plus three verification functions §4.4; flag/time/by share the recorded verification columns. |
| Suspension fields | suspend/two unsuspends `secure-admin-operations/index.ts:326–334,395–402,458–465`. |
| Cover photo | deletion/conversion `delete-account/index.ts:562–572`; `update-media-urls-to-r2/index.ts:87–105`; not header_photo_url. |
| Crop fields/updated_at | crop edge/RPC; updated_at also saver, onboarding, home club, WHS sync/provisioning/other recorded functions. |

The generic updater can target additional typed fields, so explicit overlaps do not constrain it (`src/hooks/useProfileData.ts:64–78`). Four written fields have **no explicit named runtime consumer found**, not “never fetched”: show_additional_home_clubs (`useProfileSave.ts:74`, currently unrouted full branch); top100_visible (`useTop100CoursesData.tsx:101`, distinct current top100_visibility); suspended_by (`secure-admin-operations/index.ts:331`); golfer_verified_by (`bypass-golfer-approval/index.ts:131`). Wildcard readers fetch whole rows (`src/hooks/useProfileData.ts:27–29`; `src/hooks/useUserProfile.tsx:90–94`). Mobile crop has real selected/mapped consumers (`src/lib/whs/api.ts:1025,1044–1047`); launch reader consumes RPC launch_seen_at, projection from profile column **not verifiable from caller code** (`useLaunchSheetState.ts:27–36,54–61`).

## 5. Reads and caches

| Surface | Hook/select/key |
|---|---|
| Profile | `src/pages/ProfilePageV2.tsx:237` → `useUserProfile`; base select('*')/maybeSingle; error throws, only no-row falls back public_profiles '*' (`src/hooks/useUserProfile.tsx:90–119`); `['user-profile',userId]`, stale 0, gc 10m (`:81–84,122–125`). |
| Username resolution | id/deleted_at base, id public, previous handle (`ProfilePageV2.tsx:184–218`); `['profile-id-by-username',routeUsername]`, stale 10m. |
| Edit | **Canonical** `src/pages/EditProfile.tsx:34–37` → useProfileData/useProfileForm, '*' base; `['profile',userId,isGuest]`, stale 0 (`src/hooks/useProfileData.ts:9–43`). |
| Welcome/Settings | Same hook (`src/pages/Welcome.tsx:31–43`; `src/components/settings/SettingsTabContent.tsx:80–104`). Guest intersection: hook does not fetch in guest mode (`useProfileData.ts:23–25`). |
| AccountGlance | PostingAsMenu `useUserProfile(user.id)` plus active/available actor identity mapping (`src/components/header/PostingAsMenu.tsx:40–42,178–196,254–270`); glance accepts props, not whole row (`src/features/chrome-v2/AccountGlance.tsx:19–39`). |
| Dormant FriendSheet | Member-tap resolver fetchQuery `get_friend_hybrid_snapshot`, `friendHybridSnapshotKey(viewerId,targetUserId)` (`src/components/friend-sheet/useMemberTapResolver.ts:112–145`); this resolver does **not** open dormant FriendSheet (§2). No live full ProfileSheetV2 loader survives. |
| Business create | Member country `select('country')`, `['bizc-profile-country',userId]` (`src/features/business-create/Step2Other.tsx:49–56`). |
| Business edit | useBusinessProfile/useBusinessMembership (`src/pages/BusinessProfileEditor.tsx:124–125`), business-profile v3_course_fallback key, not member profile (`src/hooks/useBusinessProfile.ts:56–64`). |

`PROFILE_FULL` is imported but not used for actual projections in useUserProfile and shadowed loader; they use literal '*' (`src/hooks/useUserProfile.tsx:3,90–94`; `src/hooks/useProfileData.tsx:4,22–24`). Handwritten UserProfile interface is separate from generated types (`useUserProfile.tsx:7–75`).

### 5.1 Cache writes, readers, persistence, and asymmetry

| Key | Writer/reader and mismatch |
|---|---|
| `['profile',userId,isGuest]` | Query read and setProfile/generic update exact cache patch (`src/hooks/useProfileData.ts:12,21,59–79`). `['profile',userId]` invalidation is a **prefix**, not proof of another exact object (`:48–54`). |
| `['user-profile',userId]` | Query reader useUserProfile `:83`; distinct from camel-case userProfile. |
| `['profile-id-by-username',username]` | Route resolver read `ProfilePageV2.tsx:184–215`; username save invalidates `EditProfileYou.tsx:156`. |
| `['userProfile',username]` | Real course-profile reader `src/components/courses/user/useUserCoursesData.tsx:68–85`; Top100 writer invalidates userProfile with **userId**, not generally matching username (`src/hooks/useTop100CoursesData.tsx:109`). |
| `public-profile` | Invalidations (`src/features/edit-profile/EditProfileYou.tsx:156`; `src/utils/invalidateHandicapPrivacyCaches.ts:14`), no exact query reader found. Public fallback stays inside user-profile key. |
| `['onboarding-status',userId]` | Explicit seeds Welcome `:98`, dead ManageProfile `:287–290`; full saver invalidation `useProfileSave.ts:254`; no production query reader found. AuthWrapper comment is stale evidence, not a reader. |
| `['welcome-username',userId,base,false]` | Seed and query `src/pages/Welcome.tsx:80,83`. |
| `clbhouz.welcome.${userId}` | LocalStorage write/read with completed/course/follows; parse clamp/default (`src/features/onboarding/welcomeRules.ts:9,22–26`; `Welcome.tsx:41–42`). |
| Launch QUERY_KEY(userId) | Dead launch hook query, dismissal success patches launch_seen_at and reads it (`useLaunchSheetState.ts:27–36,50–68`). |
| bizc-profile-country | Read Step2Other `:51–54`; no shared saver invalidation found (`useProfileSave.ts:10–13,153–156,248–254`). |
| welcome-handicap-friends / welcome-catalogue-count | First-look read-populated keys, not profile state (`src/features/onboarding/WelcomeFirstLook.tsx:27,29`). |

Photo-only invalidates **profile only** (`useProfileSave.ts:113–117`); ordinary partial invalidates profile/user-profile plus conditional gender/club caches (`:150–156`); Welcome identity profile only, course adds suggested-golfers (`:166–172`); full branch broader families + onboarding (`:10–13,245–265`). SetHomeClub refreshes user-profile/club/status but not canonical profile (`src/features/home-club/useSetHomeClub.ts:34–38`); GenderPrompt refreshes profile/percentile but not user-profile (`GenderPromptSheet.tsx:121–122`). These are source asymmetries, not verified stale UI incidents.

Query persister allowlist includes profile-sheet-stats, not profile/user-profile/onboarding-status/welcome-username roots; golf exclusions can override (`src/lib/queryPersister.ts:107–155`). Welcome localStorage is independent.

### 5.2 New-column propagation requirements

A new base column is fetched by '*' but not automatically rendered: own profile requires handwritten UserProfile typing and prop/render consumer (`useUserProfile.tsx:7–75,90–102`; ProfilePageV2 `:237`); other-member fallback requires public_profiles exposure, **not verifiable from the base-column code** (`useUserProfile.tsx:104–119`). Canonical edit requires form mapping (`src/hooks/useProfileForm.ts:31–34,84–87`), control, and the **selected partial payload**, not merely default full payload (`EditProfile.tsx:89–101`; useProfileSave `:137–150`). AccountGlance requires actor/prop mapping and rendering (`PostingAsMenu.tsx:181–196,263–270`; AccountGlance `:19–39`); there is no automatically extending live ProfileSheetV2. Dormant FriendSheet needs its snapshot/props contract separately, not invented profile reads (§2). Settings/Welcome have explicit consumers and writers (`SettingsTabContent.tsx:81–138`; useProfileSave `:162–172`). Business country selection is explicit and business edit reads separate business data (`Step2Other.tsx:49–54`; BusinessProfileEditor `:124–125`). Generated type updates alone change none of these render/save/public/cache boundaries (`src/integrations/supabase/types.ts:15760–15872`).

## 6. First sign-in

### 6.1 Entrypoints and completion

Email OTP/native Apple/native Google completion call `resolvePostAuthRoute` (`src/pages/auth/AuthForm.tsx:318–323,421–426,558–563`); Auth page also calls it from session paths (`src/pages/Auth.tsx:35,79,108`). Resolver reads id/onboarding flag; missing/incomplete overrides requested redirect to Welcome; completed honors redirect or home; error/exception honors redirect or home instead of Welcome (`src/lib/auth/postAuthRoute.ts:15–26`). Median callback separately reads flag and ignores returned error; absent/incomplete → Welcome (`src/pages/auth/AuthCallback.tsx:62–72`). Thus failure policies differ; production frequency is **not verifiable from the code**.

Direct Welcome and account-type alias are live (`src/App.tsx:625–626`); old `/edit-profile?onboarding=1`→ManageProfile→Welcome chain is **not** current: dead source has redirect (`src/pages/ManageProfile.tsx:238`), canonical route mounts EditProfile (`src/App.tsx:642`; `EP4_1_EP5_REPORT.md:12`). Welcome credentials push internal welcomeConnect history, success replaces/clears state, Back returns step 4 (`src/pages/Welcome.tsx:49–52,115`).

Welcome waits loading, rejects anonymous sessions, redirects absent auth, and shows retry-only for missing/error profile (`src/pages/Welcome.tsx:31–37`). It does not provision a row; repository provisioning function is §4.4, but whether installed provisioning resolves missing rows is **not verifiable from the code**. Completed members can directly reopen Welcome because guards do not check completion flag (`:31–42`); regular resolver avoids it (`postAuthRoute.ts:22–24`). Guest intersection only: anonymous callback treats browsing separately (`AuthCallback.tsx:49–52`).

| Step/action | Persistent effect / quit-return boundary |
|---|---|
| Identity | Existing photo upload, strict name/username/avatar save, does not finish onboarding (`src/hooks/useProfileSave.ts:26–39,160–172`; `src/pages/Welcome.tsx:102–106`). Unique username error keeps step and rechecks availability. |
| Course selection/Continue | Selection saved locally immediately (`Welcome.tsx:113`; `welcomeRules.ts:22–26`); profile home club written only with club_id (`Welcome.tsx:108`; useProfileSave `:163–171`). Without club_id advances **without** profile write. |
| Golfers | Shared personal follow hooks; success updates local follow counter (`src/features/onboarding/WelcomeGolfers.tsx:12–17`; Welcome `:88`); no suggestions completes step (`:87,114`). |
| Handicap | Canonical embedded WhsConnectScreen receives initialCountryId/completeOnSuccess/hideChrome/setupEmbedded (`src/features/onboarding/WelcomeHandicap.tsx:23`; Welcome `:115`). Existing successful connection read auto-completes (`Welcome.tsx:90`); unsupported authority uses waitlist (`WelcomeHandicap.tsx:27`). |
| Finish or top-level Skip | **Both finish setup**, not merely skip a step: checked-row flag true+updated_at, success cache/navigation; error stays with retry copy (`Welcome.tsx:91–100,110`). Destination home/Courses/Top100 follows chosen finish (`:91–99`). |

Local completed-step advance differs from final server flag (`Welcome.tsx:85–86,95`; useProfileSave `:160–165`). Final analytics course_set is based on local selected course, so it can imply course setup without server home-club persistence (`Welcome.tsx:97,108,113`).

Resume is localStorage per member key, completed+1 capped step 5 (`src/features/onboarding/welcomeRules.ts:9,22–26`; Welcome `:41–42`). Persisted model is completed/course/follows, **not identity draft or credentials** (`welcomeRules.ts:1–2,8–9`). Saved identity survives profile writes; unsaved draft is component state (`Welcome.tsx:43–48,57–58,102–108`). Storage failure falls back step 1; no server step cursor exists in this model, so cross-device progress is not provided by it. During syncing visible Back/Skip hidden, not proof browser closure is impossible (`Welcome.tsx:110–111`).

## 7. Settings

Settings is canonical editor tab (`src/pages/EditProfile.tsx:40,128–133`). All listed destinations have registered routes (`src/App.tsx:304–312,644–652,761`).

| Group | Every row/control | Destination/action and evidence |
|---|---|---|
| Your handicap | Connected authority/Manage; disconnected Connect; Index/Rounds/First round; Index in top bar or Connect prompts | Both actions `/manage/handicap`; figures read-only; inverse hide_handicap_chip toggle (`src/components/settings/SettingsHandicapCard.tsx:35–58`; SettingsTabContent `:120–138,173–185`). |
| Privacy | Stranger-view summary; Profile; Leaderboards; Courses; New rounds/Tell my followers; Blocked | Summary only; inline Public/Friends profile; Public/Friends/Private leaderboards/courses; auto_post_rounds toggle; `/manage/blocked` (`src/components/settings/SettingsPrivacyCard.tsx:14–19,38–49`). |
| Notifications | Push; Types | Existing enable/disable; `/manage/notifications`; disabled unresolved/unavailable, latest-app copy (`src/components/settings/SettingsNotificationsCard.tsx:12–28`). |
| Account | Email; Businesses; Verification/How it works | `/manage/email`; `/businesses/manage`; `/manage/contact?category=account&subject=Verification%20enquiry` (`SettingsTabContent.tsx:187–193`). |
| Your data, conditional | Rounds/Download all N | Inline Your rounds/export-email sheet, conditional connected+successful known positive count (`src/components/settings/SettingsYourData.tsx:53–70`). |
| Friends | Share your link | Existing invite sheet source settings (`SettingsTabContent.tsx:198–201`). |
| Help | Help centre; Contact us; Your requests conditional; Legal/Terms and privacy | `/manage/help`, `/manage/contact`, `/manage/requests`, `/manage/legal` (`SettingsTabContent.tsx:204–210`); requests successful settled nonempty, open/in-progress count (`:161–162,208`). |
| End card/footer | Sign out; Delete account; clbhouz version | Confirmation→logout; ownership-warning or deletion-confirm; noninteractive footer (`SettingsTabContent.tsx:212–216`). |

Intentional duplication: connected Manage/disconnected Connect share destination, which resolves connection state (`src/pages/manage/HandicapManagePage.tsx:42–49`); Verification is prefilled **Contact us**, not dedicated explainer, parameters consumed (`src/pages/manage/ContactPage.tsx:29–37`; SettingsTabContent `:191,207`). Privacy overlap with Edit profile is **different controls**: editor owns handicap/home/additional club/Top10 visibility (`src/features/edit-profile/EditProfileLinksPrivacy.tsx:49–65`; SettingsPrivacyCard `:41–49`).

Footer `APP_VERSION='1.0.0'` is hardcoded (`SettingsTabContent.tsx:45,216`); actual version currency is **not verifiable from the code**. Missing profile leads skeleton without explicit recovery in this component (`:81–83,159`). Handicap-chip update is error-only, not matched-row checked (`:125–133`).

## 8. Business categories

### 8.1 Definitions, offering, and admin

Two lists: canonical fourteen values/options/type/simple dropdown (`src/constants/businessCategories.ts:35–59`), separately maintained guided tiles/aliases (`src/features/business-create/createRules.ts:17–42`). Current creation renders grouped tiles (`src/pages/BusinessCreate.tsx:146–153`). Canonical IdentitySection selector (`src/components/business/editor/IdentitySection.tsx:101–113`) is inside editor's **unreachable create branch**, not a second current offering (§2). Its edit category text is locked (`:76–88`); live BusinessEditPreview says set when created (`BusinessEditPreview.tsx:83`). Directory filters offer canonical list, exact category query (`src/pages/BusinessDirectoryPage.tsx:131–139`; `src/hooks/useBusinessDirectory.ts:45–46`).

Admin business verification reads/displays category, not edits it (`src/features/admin/components/VerificationsReview.tsx:105,340,396`). No other business-category option list/mutation was identified in the source-wide category searches; this is a negative search finding, not proof of hosted administrator capabilities, which are **not verifiable from the code**. Admin Help “Creator” taxonomy/news/support categories are separate (`src/features/admin/components/HelpArticlesTab.tsx:14–21,218–234,257–284`; `amateur/AmateurStoryEditor.tsx:214–218,410–427`; `src/features/admin/hooks/useSupportTickets.ts:46`; `SupportTicketDrawer.tsx:102,129`).

### 8.2 Values and all identified value-driven business behavior

| Stored category | Create branch; facilities; primary/other behavior |
|---|---|
| Golf Club | Club branch; dedicated facilities; selected club name/place, claim work, exact verified+linked club analytics prerequisites. |
| Golf Academy | Other branch; coaching facilities; Academy word, lesson/Soon, coach eligibility. |
| Driving Range | Other; dedicated range facilities; Range word, bay/Soon, nearby-course membership. |
| Coach / Instructor | Other; coaching facilities; Coach word, lesson/Soon, coach eligibility. |
| University / College | College branch, selected college name/duplicate lookup; general facilities; College word. |
| Creator | Other; **no facilities**; Creator word; generic Book/contact rules, no category-specific Insights gate found. |
| Retailer / Pro Shop | Other; retail; Golf shop word; venue membership. |
| Club Fitter | Other; retail; Club fitter word; venue/bookable membership. |
| Resort | Other; resort facilities; Resort word; stay, nearby, venue/bookable. |
| Hotel / Accommodation | Other; hotel facilities; Hotel word; stay, nearby, venue/bookable. |
| Restaurant / Cafe | Other; restaurant facilities; Restaurant word; table, nearby, venue/bookable. |
| Bar / Pub | Other; pub facilities; Bar word; table, nearby, venue **not** bookable doNext membership. |
| Brand / Manufacturer | Other; **no facilities**; Brand word; generic behavior. |
| Other | Other; general facilities; empty hero word/omitted home category; generic behavior. |

Table evidence: options `businessCategories.ts:35–50`; branch `BusinessCreateStep2.tsx:20–22`; name/club claim `createBusiness.ts:18–20,45,132`; preview identity `step4Rules.ts:12–16`; facilities `editorTypes.ts:81–110`; hero/booking/nearby `src/lib/business/businessHero.ts:8–26,49–93`; venue/bookable `src/components/business/home/doNext.ts:69–88`; analytics `useClubCourseLink.ts:37–58`.

Additional exact/category/set consumers:

- URL golf_club/clubId prefill (`createRules.ts:67–71`); changing away clears old club/college draft (`BusinessCreate.tsx:108–119`); college duplicate exact filter (`Step2College.tsx:71`). Editor college/club checks exist but their create lookups are unreachable (`BusinessProfileEditor.tsx:137,310–311,320–407`).
- Academy/Instructor finish note (`BusinessCreateFinish.tsx:36`); coach set/contracts/search/academy wording (`src/features/coach/contracts.ts:2–3`; `CoachSheets.tsx:53,61`); coach card visibility guard (`BusinessCoachCards.tsx:15`); Visiting coaching distinction (`src/components/business/ClubVisiting.tsx:57`).
- Golf Club claim candidate (`src/components/courses/course-detail/ClaimCourseSheet.tsx:165`); missing-link home/command (`src/components/business/home/BusinessHomeHeader.tsx:226`; `BusinessCommandCard.tsx:120`); Club actor course-group source (`src/features/post-v2/hooks/usePostCourseGroups.ts:35`); Golf club label (`src/components/header/PostingAsMenu.tsx:222–223`; `src/features/find-people/railRules.ts:134–136`).
- Hospitality near-business RPC categories Hotel/Restaurant/Bar/Resort (`src/hooks/useNearbyBusinesses.ts:4–9,34–39`); nearby count category+coordinate condition (`src/hooks/useBusinessNearbyCounts.ts:22–23`); Other omitted from home category line (`BusinessHomeHeader.tsx:254–255`).
- Booking URL fallback priority is category-driven above, but explicit primary_action/URL/phone/email/address decide available action (`businessHero.ts:49–76`); category alone does not promise a booking target.

### 8.3 Creator offered, behavior, and consequences of no longer offering it

Creator is selectable in **live guided creation** (`createRules.ts:33`; `BusinessCreate.tsx:153`; `src/App.tsx:764`), retained in canonical directory (`businessCategories.ts:41`; BusinessDirectoryPage `:139`). Current actors are personal/business, not Creator (`src/types/actor.ts:6`); existing category cannot be converted by edit category control (`BusinessEditPreview.tsx:83`). The canonical catalog's comment says Insights/Analytics enabled (`businessCategories.ts:32–33`), but actual inspected access gate is membership.canViewInsights (`src/pages/BusinessInsightsPageV2.tsx:54–65`), not Creator category.

If **only guided Creator tile** stopped being offered (no change performed):

1. Picker loses selection, but canonical value/type, directory, existing Creator word/facilities remain (`createRules.ts:17–38`; businessCategories `:41,53,59`; businessHero `:19`; editorTypes `:95`).
2. categoryDisplayLabel derives from **tile list**, so Creator becomes null; direct consumer draftHeroIdentity blanks category line; Step4/Finish use it (`createRules.ts:38–42`; step4Rules `:12–16`; BusinessCreateStep4 `:12,26`; BusinessCreateFinish `:9,25`).
3. Category-list parity test fails length/sorted values (`src/test/bc1BusinessCreate.test.tsx:78–82`), Creator-selection/back/generic step/facilities/departure test scenarios also depend on offering (`bc1BusinessCreate.test.tsx:106–113`; `bc2BusinessCreate.test.tsx:356–423`; `bc3BusinessCreate.test.tsx:228–235`; `bc5BusinessFlow.test.tsx:45`). These are dependencies, not authorization to modify tests.
4. Shared create accepts string category and inserts it; hiding tile is not server prohibition (`createBusiness.ts:15–27,72–76`). Canonical deletion also changes Record type facilities contract (`businessCategories.ts:52–53`; editorTypes `:81–95`). Existing/deployed backend constraints and actual impact on saved rows are **not verifiable from the code**.

## 9. Creator remnants

### 9.1 Identity, routes, data, migration history

| Remnant | Live/dead/status evidence |
|---|---|
| Old creator namespaces | Live redirects only `/creator/*`,`/creators/*`→home (`src/App.tsx:733–735`), not Creator pages. |
| Stored creator actor | Compatibility conversion creator→personal (`src/context/ActiveActorContext.tsx:72–81`); current business actors carry category metadata (`:50–62`). Old user_type creator separately classifies business (§3). |
| Creator-only routing/video permissions | creator_only retained but ignored (`src/lib/profileRoutes.ts:5–11,30–39`); getCreatorDestination always profile, features universal, comment Creator Mode removed (`src/constants/videoRules.ts:29–50`). |
| Presence channel | App invokes presence hook; legacy channel name presence:creators_online retained (`src/App.tsx:61,1083`; `src/hooks/usePresenceTracker.ts:36,80`). |
| Verification creator_business | Proof-method identity, phone-shaped proof selection, not category gate (`src/components/business/verification/signals.ts:123–135`; steps/verificationTypes `:8,17`; admin VerificationsReview `:37`). |
| Historical identity columns | is_creator partial index (`supabase/migrations/20251215085640_d5a008aa-485d-4860-a6e2-aba8743a118e.sql:1–11`); creator_only (`20251224065526_4d9664d4-8d52-4daa-9a3d-bf8cc2c0ec37.sql:8–20`); creator_enabled_at backfill (`20260128144133_e55ba7bb-d2cc-4ab8-9baa-6239c0816d92.sql:3–13`). |
| Historical creator pages/actors | Backfill from is_creator to pages/members (`20260110182511_d334f114-92a3-4df4-9b79-caf0187bfeeb.sql:529–559`); old creator actor policies `:323–358`. |
| Recorded retirement | Drops creator_members/follows/pages, renames analytics to polymorphic, drops old functions, casts retained creator_event_type (`20260116165844_fb97a315-a6e1-4b65-8636-2c2a3b90115c.sql:5–53,77–90`); posts creator→**personal**, not business (`:200–203`). No proved creator-page→business migration in that body. |
| Generated schema | creator_profile_events/creator_page_id (`src/integrations/supabase/types.ts:4660–4679`); featured_creators (`:5725`); creator_enabled_at (`:15784,15914,16044`); creator_event_type (`:9903,9916,9929,27255,27465`); featured/suggested RPC declarations (`:22216,23921`). These declarations are not evidence of live table reads/deployed contents. |
| Retired cache/event vocabulary | creator-features invalidations `src/hooks/usePostDeletion.tsx:162`, `useShareReview.ts:91`, `src/utils/invalidateCourseRatingCaches.ts:89`; retired discover_creator_card_tapped registry `src/features/admin/lib/retiredEvents.ts:65`. |

Historical rows above are migration **source facts only**; current installed schema/functions/grants, data remnants and usage are **not verifiable from the code**. Generic variables/fields named creator often mean author, not account type.

### 9.2 Creator-named modules and conditional reachability

Only six production JS/TS source filenames contain Creator/creator in src/functions inventory: useSuggestedCreators, useCommunityCreators, CreatorCard, CreatorSpotlight, CreatorsRow, useFeaturedCreators; all are included below. The broader reference inventory follows in §9.3.

- **Suggested creators live chain:** Clubhouse → ClubhouseEmptyState → FriendsEmptyState (`src/pages/Clubhouse.tsx:98,552,624`; `src/components/clubhouse/ClubhouseEmptyState.tsx:3,68`). Hook get_suggested_creators with user ID/limit12; error→[]; maps personal fields (`src/components/watch/hooks/useSuggestedCreators.ts:17–46`; FriendsEmptyState `:20,61`). This does not establish business Creator eligibility.
- **Watch live chain:** `/amateur`→AmateurPage→ExploreMagazine→WatchFeed (`src/App.tsx:384,681`; AmateurPage `:10,117`; ExploreMagazine `:57,1366`). CreatorsRow/CreatorSpotlight render (`WatchFeed.tsx:508,609`). Featured hook calls get_featured_creators, personal/business actors, signed-in gating/error/minimum count (`useFeaturedCreators.ts:18–41`; CreatorsRow `:113–160`); personal path standard, business path separate (`:46–49`). Spotlight get_watch_spotlight/get_creator_videos are actor-based reads (`CreatorSpotlight.tsx:22,39–47`; useWatchBottom `:11–36`). Server eligibility/deployment **not verifiable from the code**.
- **Courseled dormant creator-card branch:** MomentsGrid is live through GalleryTab and AmateurMediaBlock (`src/components/explore-tab-new/GalleryTab.tsx:11,117`; `src/features/amateur/AmateurMediaBlock.tsx:4`). It imports CreatorCard but without onCreatorPress builds no creator cards (`MomentsGrid.tsx:3,76–89,137–141`). MomentsOfTheWeek wrapper forwards creator props but is not connected to SPA import root; hook builds personal authors, excludes business/viewer/unresolved handles, minimum media (`MomentsOfTheWeek.tsx:33–38,85–86`; hooks/useCommunityCreators.ts:26,58–86`). Import-reachable CreatorCard is not proof of rendered UI. GalleryTab gives no creator props (`:117`).
- **Authorship/provider terms, not identity:** toFeedPost creator username/name/avatar/verification fields (`src/features/watch-v2/utils/toFeedPost.ts:117–120,139`); videoUnit author naming (`watch/videoUnit.tsx:43–44`); MiniPlayer metadata (`src/components/videos/MiniPlayer.tsx:88–89,223`); HubVideoRow/HubClipsRow attribution (`src/features/watch-v2/components/HubVideoRow.tsx:132–134,191–193`; HubClipsRow `:125–137`); Cloudflare Direct Creator Upload is provider upload terminology (`src/utils/cloudflareStreamUpload.ts:2,20,36`). These are not category === Creator tests.

### 9.3 Source-wide Creator reference inventory

This table enumerates production `.ts/.tsx/.js/.css` files containing Creator/creator across src, functions, and supabase/functions, excluding generated types (summarized above), test files, and translations. Match lines and excerpts distinguish generic authorship from historical identity; import reachability is not a guarantee of guarded rendering. Unconnected hooks/modules may still have test-only uses, and server deployment is **not verifiable from the code**. Translation strings are copy, not additional routes/actors; creator-related tests are recorded through the relevant caller/dependency evidence in §§2,8.

| File and match lines | Reachability | Evidence of naming/use |
|---|---|---|
| `src/App.tsx:513, 733, 734, 735` | Import-reachable; individual render/call gates apply | // Creator routes removed - now handled via Business Creator profiles or Personal Creator Mode; {/* Legacy creator routes - redirect to home (creators now handled via Business profiles or Personal Creator Mode) */} |
| `src/index.css:3524` | Import-reachable; individual render/call gates apply | .z-creator-overlay { z-index: 30; } |
| `src/constants/businessCategories.ts:32, 41` | Import-reachable; individual render/call gates apply | * NOTE: 'Creator' category enables creator features (Insights, Analytics); { value: 'Creator', label: 'Creator', icon: Sparkles, subtitle: 'Content creator, influencer, or media brand' }, |
| `src/constants/videoRules.ts:34, 35, 39, 45, 48` | Not reachable from SPA import root | * Watch tab (shorts)         \| Creator                   \| Profile Page; * Videos tab (long-form)     \| Creator                   \| Profile Page |
| `src/context/ActiveActorContext.tsx:36, 50, 72, 78, 79, 81` | Import-reachable; individual render/call gates apply | // Build available actors list (personal + business only, no standalone creators); // Add business profiles (including Business Creator category) |
| `src/context/VideoPlaybackContext.tsx:11` | Import-reachable; individual render/call gates apply | creatorName: string; |
| `src/hooks/usePostDeletion.tsx:162` | Import-reachable; individual render/call gates apply | queryClient.invalidateQueries({ queryKey: ['creator-features'] }); |
| `src/hooks/usePresenceTracker.ts:6, 36, 80` | Import-reachable; individual render/call gates apply | * Tracks the current user's presence on the presence:creators_online channel.; const channelName = 'presence:creators_online'; |
| `src/hooks/useProfileType.ts:3, 18` | Import-reachable; individual render/call gates apply | * Returns whether a profile is personal (individual golfer) or business (club/brand/creator); * Business: 'club', 'brand', 'creator', or any other type |
| `src/hooks/useRelatedLongFormVideos.ts:10, 11, 25, 26, 83, 84` | Not reachable from SPA import root | creatorName: string;; creatorAvatarUrl: string; |
| `src/hooks/useShareReview.ts:91` | Not reachable from SPA import root | queryClient.invalidateQueries({ queryKey: ['creator-features'] }); |
| `src/lib/activityPostMapper.ts:111` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', |
| `src/lib/feedQueryKeys.ts:122` | Import-reachable; individual render/call gates apply | ['suggested-creators'], |
| `src/lib/profileRoutes.ts:5, 11, 30, 36` | Import-reachable; individual render/call gates apply | * Note: creator_only flag is deprecated - all users now use standard profile routes.; creator_only?: boolean \| null; // Deprecated - kept for backwards compatibility |
| `src/lib/queryPersister.ts:129` | Import-reachable; individual render/call gates apply | 'suggested-creators', |
| `src/styles/liquid-glass.css:52` | Import-reachable; individual render/call gates apply | duration badge and the CREATOR badge all render this one class. |
| `src/styles/shorts-meta.css:1` | Not reachable from SPA import root | /* Creator-First Shorts Card Meta Styles - Centered Stack */ |
| `src/styles/style-tokens.css:23` | Import-reachable; individual render/call gates apply | /* Glass surfaces — Canonical spec (Creator Capsule / Panel A) |
| `src/utils/analyticsEvents.ts:98, 100, 114, 116, 166, 174, 181, 196` | Import-reachable; individual render/call gates apply | avatarClick: (creatorId: string, positionIndex: number) => {; creator_id: creatorId, |
| `src/utils/cloudflareStreamUpload.ts:2` | Not reachable from SPA import root | // Uses Pattern A: Direct Creator Upload |
| `src/utils/invalidateCourseRatingCaches.ts:89` | Import-reachable; individual render/call gates apply | queryClient.invalidateQueries({ queryKey: ['creator-features'], exact: false }); |
| `src/lib/business/businessHero.ts:19` | Import-reachable; individual render/call gates apply | Creator: ['business.hero.word.creator', 'Creator'], |
| `src/lib/courseMedia/memberShotPosts.ts:48, 72` | Import-reachable; individual render/call gates apply | avatarUrl: avatarUrl ?? '', isVerified: false, creatorRelation: 'none', caption: '',; width: row.width ?? null, height: row.height ?? null, creator_display_name: row.member_name ?? null, |
| `src/features/amateur/AmateurMediaBlock.tsx:42, 43, 70` | Not reachable from SPA import root | * behind a see-all because long-form is the only format the creator accounts; * publish in; burying it would be a decision about those creators rather than |
| `src/features/business-create/createRules.ts:33` | Import-reachable; individual render/call gates apply | { label: 'Creator', value: 'Creator', icon: Sparkles }, |
| `src/features/media-library/LibraryVideoCard.tsx:11, 30, 38, 39, 40` | Import-reachable; individual render/call gates apply | const creator = item.displayName?.trim() ?? '';; alt={creator} |
| `src/features/watch-v2/components/HubClipsRow.tsx:125, 137` | Import-reachable; individual render/call gates apply | {(row.creator_display_name \|\| row.creator_username) ? (; {row.creator_display_name \|\| row.creator_username} |
| `src/features/watch-v2/components/HubVideoRow.tsx:46, 132, 134, 178, 191, 193` | Import-reachable; individual render/call gates apply | (row.creator_display_name \|\| row.creator_username \|\| '?'); {row.creator_avatar_url ? ( |
| `src/features/watch-v2/hooks/useHubMixedGrid.ts:12, 13` | Import-reachable; individual render/call gates apply | creator_username: string \| null;; creator_display_name?: string \| null; |
| `src/features/watch-v2/utils/toFeedPost.ts:44, 45, 46, 47, 79, 117, 118, 119` (additional matches in same file) | Import-reachable; individual render/call gates apply | creator_username?: string \| null;; creator_display_name?: string \| null; |
| `src/features/post-v2/components/golf/PostPreview.tsx:24` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', caption: d.caption, |
| `src/features/media-library/hooks/useReviewMediaLibrary.ts:113` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', |
| `src/features/explore-magazine/watch/watchFilters.ts:56` | Import-reachable; individual render/call gates apply | /** Continue watching, the Creators row, the lead, the rounds shelf and the |
| `src/features/explore-magazine/watch/watchRules.ts:87, 88, 91, 97, 98, 99` | Import-reachable; individual render/call gates apply | * K.5 — never two consecutive cards from the same creator WHERE AN ALTERNATIVE; * EXISTS. Greedy and stable; nothing is dropped, so a dominant creator clumps |
| `src/features/explore-magazine/watch/watchTopRules.ts:3, 6, 7, 13, 14, 16, 17, 18` (additional matches in same file) | Import-reachable; individual render/call gates apply | * the Creators row and the lead video. No DOM, no locale, no dates here — the; * THE CREATORS ROW hides itself under CREATORS_MIN and shows See all only |
| `src/features/explore-magazine/watch/useFeaturedCreators.ts:2, 3, 5, 6, 12, 18, 33, 35` (additional matches in same file) | Import-reachable; individual render/call gates apply | * WS1 — THE FEATURED CREATORS READ. get_featured_creators(p_limit) returns; * Ben's curated list already ordered (creators with a video in the last 7 |
| `src/features/explore-magazine/watch/useWatchLead.ts:3, 17` | Import-reachable; individual render/call gates apply | * newest creator video from the last 7 days (reason 'creator_new'), otherwise; reason: 'creator_new' \| 'most_liked'; |
| `src/features/explore-magazine/watch/CreatorsRow.tsx:2, 5, 8, 9, 28, 30, 31, 32` (additional matches in same file) | Import-reachable; individual render/call gates apply | * WS1 §2 — THE CREATORS ROW (watch-s1.html, signed off — the mock is the spec).; * video first, from get_featured_creators. A creator with a video in the last |
| `src/features/explore-magazine/watch/WatchLead.tsx:4, 5, 72, 73, 74, 75, 193, 405` (additional matches in same file) | Import-reachable; individual render/call gates apply | * For you only, after the Creators row. One video, picked by get_watch_lead:; * the newest creator video from the last 7 days, otherwise the most-liked of |
| `src/features/explore-magazine/watch/WatchFeed.tsx:33, 40, 52, 64, 185, 268, 270, 462` (additional matches in same file) | Import-reachable; individual render/call gates apply | import { CreatorsRow } from './CreatorsRow';; creatorName, |
| `src/features/explore-magazine/watch/watchMiddle.ts:83, 84, 85, 86` | Import-reachable; individual render/call gates apply | creator_username: personal ? row.handle : null,; creator_display_name: row.display_name, |
| `src/features/explore-magazine/watch/watchBottom.ts:2, 4` | Import-reachable; individual render/call gates apply | * WS3 — the bottom of the Watch page: pure rules for Creator to follow and; * get_creator_videos, get_watch_top100_videos); all return nothing signed out. |
| `src/features/explore-magazine/watch/useWatchBottom.ts:28, 30, 34` | Import-reachable; individual render/call gates apply | export function useCreatorVideos(actorType: string \| null, actorId: string \| null) {; queryKey: ['watch-s3', 'creator-videos', actorType, actorId], |
| `src/features/explore-magazine/watch/CreatorSpotlight.tsx:2, 22, 39, 47, 103, 182` | Import-reachable; individual render/call gates apply | * WS3 §2 — CREATOR TO FOLLOW (signed-off watch-s3 mocks A/B). One creator from; import { useCreatorVideos, useWatchSpotlight } from './useWatchBottom'; |
| `src/features/explore-magazine/watch/videoUnit.tsx:43, 44, 65, 185, 222, 224, 303, 323` (additional matches in same file) | Import-reachable; individual render/call gates apply | export function creatorName(row: HubRpcRow): string {; return (row.creator_display_name \|\| row.creator_username \|\| '').toString(); |
| `src/features/admin/components/HelpArticlesTab.tsx:17` | Import-reachable; individual render/call gates apply | 'Creator', |
| `src/features/admin/components/VerificationSignals.tsx:148` | Import-reachable; individual render/call gates apply | (legacy && (row.proofMethod === 'official_website' \|\| row.proofMethod === 'golf_course' \|\| row.proofMethod === 'creator_business') |
| `src/features/admin/components/VerificationsReview.tsx:37` | Import-reachable; individual render/call gates apply | creator_business: 'contact', |
| `src/features/admin/lib/retiredEvents.ts:65` | Import-reachable; individual render/call gates apply | discover_creator_card_tapped: 'Discover rails rebuilt; no emitter remains in src/ (Sep 2026)', |
| `src/components/business/BusinessEmptyState.tsx:56` | Import-reachable; individual render/call gates apply | ['Brands and creators', 'Post to golfers and see who engages, band by band.'], |
| `src/components/clubhouse/ClubhouseSkeletonShimmer.tsx:6, 66` | Import-reachable; individual render/call gates apply | *   • Right vertical action rail: creator avatar + like/comment/share/more; {/* Creator avatar 48px squircle (matches SquircleAvatar) + follow plus circle */} |
| `src/components/clubhouse/FriendsEmptyState.tsx:8, 20, 61, 114, 117, 118, 119, 126` (additional matches in same file) | Import-reachable; individual render/call gates apply | *   - Suggestions come from useSuggestedCreators (watch/hooks) — this is now its; import { useSuggestedCreators, type SuggestedCreator } from '@/components/watch/hooks/useSuggestedCreators'; |
| `src/components/course-media-tab/CourseMediaCanonGrid.tsx:81, 82` | Import-reachable; individual render/call gates apply | creator_username: post.username ?? null,; creator_display_name: post.displayName ?? null, |
| `src/components/course-media-tab/CourseMediaTabNew.tsx:131` | Import-reachable; individual render/call gates apply | return { id: url, userId: user?.id ?? '', actorType: 'personal', actorId: user?.id ?? '', username: '', displayName: '', avatarUrl: '', isVerified: fa |
| `src/components/feed-cards/FeedCard.tsx:13, 46, 47, 381, 390` | Import-reachable; individual render/call gates apply | *                         course_name, creator_username, like_count).; creator_username: string \| null; |
| `src/components/feed/FeedActionRail.tsx:5, 34, 41, 61, 152, 155, 175, 178` (additional matches in same file) | Not reachable from SPA import root | *   • Creator avatar (48px, white border) with a small amber "+" follow badge; creator: { |
| `src/components/feed/FeedCard.tsx:418, 438` | Import-reachable; individual render/call gates apply | post.creatorRelation !== 'system' &&; if (post.creatorRelation === 'system') parts.push('clbhouz'); |
| `src/components/feed/FeedOverlayLayer.tsx:47, 50, 120, 121, 295, 298` | Not reachable from SPA import root | /** Read-only mode: hides interactive controls on the action rail (only creator avatar shown). */; *  move the creator avatar/follow into the bottom-left chip, lift content above a safe area, |
| `src/components/feed/FeedTopActionBar.tsx:6` | Not reachable from SPA import root | * FeedActionRail. The creator avatar + follow badge are NOT rendered here; |
| `src/components/learn/LearnRecommendedFeed.tsx:15, 16, 17, 18, 21, 22, 23, 24` (additional matches in same file) | Not reachable from SPA import root | { id: 'b1', title: 'Golf Grip Fundamentals – The Foundation of Every Swing', creatorName: 'Rick Shiels', thumbnailUrl: 'https://images.unsplash.com/ph; { id: 'b2', title: 'Your First Time at a Golf Course – What to Expect', creatorName: 'Golf Sidekick', thumbnailUrl: 'https://images.unsplash.com/photo |
| `src/components/learn/LearnVideoCard.tsx:8, 9, 86` | Not reachable from SPA import root | creatorName: string;; creatorAvatarUrl?: string; |
| `src/components/learn/LongFormLearning.tsx:15, 16, 19, 20, 21, 24, 25, 28` (additional matches in same file) | Not reachable from SPA import root | { id: 'lf-b1', title: 'Complete Golf Fundamentals Course – From Grip to Full Swing', creatorName: 'Meandmygolf', thumbnailUrl: 'https://images.unsplas; { id: 'lf-b2', title: 'Understanding Your First Set of Clubs', creatorName: 'TXG', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e |
| `src/components/loop-tab/LoopCard.tsx:327` | Not reachable from SPA import root | {/* 2. CREATOR ROW — compact, sits directly below media */} |
| `src/components/videos/MiniPlayer.tsx:19, 20, 54, 88, 89, 217, 223` | Import-reachable; individual render/call gates apply | creatorName: string;; creatorAvatarUrl?: string; |
| `src/components/watch/hooks/useSuggestedCreators.ts:4, 17, 19, 23, 29, 33` | Import-reachable; individual render/call gates apply | export interface SuggestedCreator {; export function useSuggestedCreators(userId: string \| undefined) { |
| `src/components/shared/overlay/OverlayCorners.tsx:50, 51, 53, 55, 58, 74, 75, 95` (additional matches in same file) | Not reachable from SPA import root | // Bottom-left: Creator + Likes (stacked); creatorName?: string; |
| `src/components/shared/overlay/constants.ts:39` | Not reachable from SPA import root | // Creator name max widths |
| `src/components/settings/ui/SettingsSkeleton.tsx:17` | Import-reachable; individual render/call gates apply | { title: 'Identity & Creator', rows: 2 }, |
| `src/components/profile/actions/BusinessProfileActions.tsx:34` | Not reachable from SPA import root | * Action buttons for business profiles (Club, Brand, Creator) |
| `src/components/media-system/types/media.ts:59, 60, 81, 471, 472, 473, 474, 491` (additional matches in same file) | Not reachable from SPA import root | /** Creator relationship to current user */; export type CreatorRelation = 'friend' \| 'following' \| 'none' \| 'system'; |
| `src/components/media-system/utils/feedAlgorithm.ts:17, 18, 26, 128, 129, 137, 141, 175` (additional matches in same file) | Import-reachable; individual render/call gates apply | const MAX_POSTS_PER_CREATOR = 4;; const MAX_REVIEWS_PER_CREATOR = 4; |
| `src/components/media-system/utils/feedMapper.ts:2, 138, 139, 141, 142, 145, 148, 149` (additional matches in same file) | Import-reachable; individual render/call gates apply | import type { FeedPost, FeedRpcRow, MediaItem, ReviewData, CreatorRelation, FeedPostTag } from '../types/media';; ? (row.business_name \|\| row.creator_username \|\| '') |
| `src/components/explore-tab-new/courseled/CreatorCard.tsx:4, 8, 10, 30, 33, 37, 42, 43` (additional matches in same file) | Import-reachable; individual render/call gates apply | import type { CommunityCreator } from './hooks/useCommunityCreators';; * CREATOR CARD — "B, frame overlay" (BRIEF_COMMUNITY_CREATOR_CARDS). |
| `src/components/explore-tab-new/courseled/MediaRailTile.tsx:47` | Import-reachable; individual render/call gates apply | /** ADDITIVE. Rails keep creator captions; image walls may suppress them. */ |
| `src/components/explore-tab-new/courseled/MomentsGrid.tsx:3, 5, 28, 34, 50, 53, 54, 69` (additional matches in same file) | Import-reachable; individual render/call gates apply | import { CreatorCard } from './CreatorCard';; import type { CommunityCreator } from './hooks/useCommunityCreators'; |
| `src/components/explore-tab-new/courseled/MomentsOfTheWeek.tsx:4, 33, 37, 38, 48, 49, 85, 86` | Not reachable from SPA import root | import { CREATOR_CARD_COUNT, type CommunityCreator } from './hooks/useCommunityCreators';; * Creator cards in relevance order (BRIEF_COMMUNITY_CREATOR_CARDS). Derived |
| `src/components/explore-tab-new/courseled/hooks/useCommunityCreators.ts:6, 10, 22, 26, 29, 31, 58, 63` (additional matches in same file) | Not reachable from SPA import root | * COMMUNITY CREATORS (BRIEF_COMMUNITY_CREATOR_CARDS §5) — NO NEW QUERY.; * derived CLIENT-SIDE from the candidate pool already in hand. A creator's card |
| `src/components/explore-tab-new/courseled/hooks/useCommunityLibrary.ts:202` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', |
| `src/components/explore-tab-new/courseled/hooks/useDiscoverMediaPreview.ts:94` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', |
| `src/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek.ts:302` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', |
| `src/components/courses/course-detail/AboutMediaStrip.tsx:219` | Import-reachable; individual render/call gates apply | creatorRelation: 'none' as const, |
| `src/components/courses/course-detail/CourseReviewsTab.tsx:370` | Import-reachable; individual render/call gates apply | creatorRelation: 'none' as const, |
| `src/components/courses/phase5/CourseMoments.tsx:47` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', |
| `src/components/courses/course-detail/you/YourMomentsSection.tsx:44` | Import-reachable; individual render/call gates apply | creatorRelation: 'none', |
| `src/components/course-media-tab/hooks/useCourseGallery.ts:84` | Import-reachable; individual render/call gates apply | return [{ id: row.id, userId: row.user_id, actorId: row.user_id, actorType: 'personal', displayName: '', avatarUrl: '', username: '', isVerified: fals |
| `src/components/business/editor/editorTypes.ts:78, 95` | Import-reachable; individual render/call gates apply | * category must appear and a renamed category fails to compile. Creator and; 'Creator': [], |
| `src/components/business/verification/VerificationFlowSheet.tsx:117` | Import-reachable; individual render/call gates apply | creator_business: 'That phone number is already linked to another verified business on clbhouz. One number can only vouch for one business.', |
| `src/components/business/verification/signals.ts:123, 124, 127, 135` | Import-reachable; individual render/call gates apply | * CORRECTED from the brief's mapping: 'creator_business' and 'golf_course' are; * not distinct signals, they are PRESENCE with a different shape — a creator's |
| `src/components/business/verification/steps/verificationTypes.ts:8, 17` | Import-reachable; individual render/call gates apply | \| 'creator_business'; { id: 'creator_business', label: 'Creator / brand / influencer business', subtitle: 'For creator-led or personal brands.', icon: Sparkles }, |
| `supabase/functions/_shared/reviewMediaOwnership.ts:2, 3, 22, 36` | Function source; deployed use not verifiable from the code | export function creatorMetadata(metadata: Record<string, string>): Record<string, string> {; return Object.fromEntries(Object.entries(metadata).filter(([key]) => !/creator\|owner/i.test(key))); |
| `supabase/functions/cleanup-review-media/index.ts:1` | Function source; deployed use not verifiable from the code | /** Caller ownership is checked before ANY delete. Stream creator is server-stamped; legacy proof is an owned review row. */ |
| `supabase/functions/cloudflare-stream-tus-endpoint/index.ts:6, 67, 76` | Function source; deployed use not verifiable from the code | import { creatorMetadata } from '../_shared/reviewMediaOwnership.ts';; ...creatorMetadata(metadata), |
| `supabase/functions/delete-account/index.ts:451` | Function source; deployed use not verifiable from the code | ['creator_profile_events','creator_profile_events','user_id'], |
| `supabase/functions/generate-course-mood-blurb/index.ts:117, 119, 124, 125, 133` | Function source; deployed use not verifiable from the code | let creatorHandle = "a Clbhouz creator";; const { data: creator } = await supabase |

## 10. UI currency against latest retained shipped reports

| Surface | Current rendered evidence vs report |
|---|---|
| Edit profile EP | Current canonical head/tabs/status/card/completion/You/Golf/Links/privacy (`src/pages/EditProfile.tsx:122–161`) matches EP2/3/4 groups and **later EP5 switch** (`EP2_REPORT.md:4–9`; `EP3_REPORT.md:9–13`; `EP4_REPORT.md:4–6`; `EP4_1_EP5_REPORT.md:9–14`). Earlier hidden-v2/live-old wording (`EP3_REPORT.md:5`; EP4 `:4`) is superseded by EP5, not evidence old UI renders. ManageProfile is unrouted (§2). EP5.2 report disclaims device/mock verification (`EP52_SHEET_STYLES_REPORT.md:12–15`); actual visual match **not verifiable from the code**. |
| Settings ST | Latest retained ST5/ST5.1 says earlier ST2/3/4 reports removed, correction test/report only (`ST5_REPORT.md:9,102–110`). Your data Account→Friends (`SettingsTabContent.tsx:187–200`), positive connected successful count gate (`SettingsYourData.tsx:53`), open-only summary (`:24–28`), header action absent (`:66`), sending/sent/recent/failed/empty/duplicate suppression (`:14,36–70`) match report `ST5_REPORT.md:4–7`. No done-but-absent ST5 item found; delivery/real export readback **not verifiable from the code**, report itself disclaims (`:95–98`). |
| Welcome OB | Latest OB1.5 embedded canonical syncing present (`WelcomeHandicap.tsx:23`; Welcome `:51–56,110–115`) matches `OB1_5_REPORT.md:26–34`. Original OB1 avoid-syncing wording (`OB1_STOP_REPORT.md:48–49`) superseded by OB1.5 `:14–25`. Old edit-profile onboarding redirect promise (`OB1_STOP_REPORT.md:37`) no longer follows live route after EP5 (`EP4_1_EP5_REPORT.md:12`; App `:642`); compatibility claim is superseded, not live protection. |
| Profile hero | AGENTS says personal keeps HeroShell (`AGENTS.md:80`), but implementation explicitly no longer uses shell, mounts ProfileCoverBand (`src/components/profile/hero/ProfileHero.tsx:4–6,367–372`); HeroPill import remains and is not HeroShell rendering (`:33`). Header's 176px prose differs from aspect/no-floor cover (`ProfileCoverBand.tsx:118–120`). Coach-line ownership matches shipped `CB116_1_REPORT.md:5–6`: page supplies line (`ProfilePageV2.tsx:906`), hero optional prop forwards afterSubline (`ProfileHero.tsx:74,161,372`). These are stale prose vs current ownership, not proof old hero rendered. Full phone visual comparison **not verifiable from the code**. |
| Profile preview/account | Removed ProfileSheetV2 per `ACCOUNT_TILE_STOP_REPORT.md:58`; current mobile AccountGlance `PostingAsMenu.tsx:254–280`, desktop dropdown preserved `:288,523`. Retained helper directory/old comments do not resurrect removed UI (§2). FriendSheet provider is mounted but opener unused, not a second current preview (§2). |
| Business edit BE | BE4 removes legacy edit/deferred full-save/guard, retains create-only equivalents (`BE4_REPORT.md:6–7`). Current edit preview/Where/Links/status (`BusinessProfileEditor.tsx:649–651,772–774,865`); old facilities/contact/action/hours/social/discard only create (`:776–827,875–889`), dirty create-only `:428`. **No BE4 removed section shown still rendering in edit.** However those retained create branches are now unreachable because actual create mounts BusinessCreate (§2). |
| BE report chronology | **No unexplained missing-report defect:** BE4 early line says BE1/2/3 retained pending prerequisite (`BE4_REPORT.md:9`), but later completed-verification paragraph explicitly records their deletion after pass (`:37`), explaining current absence. Reading only early report paragraph would create a false risk. |

Static rendered composition was compared, not screenshot equivalence or live saves. No UI item is labelled done-and-absent solely from a stale earlier report when later report/source supersedes it. Hosted signup/provisioning, RLS/RPC installations, privacy outcomes, device geometry and data-readback are **not verifiable from the code**.

## Top risks

1. **Next edit lands in dead/shadowed code:** recently edited ManageProfile/useProfileData.tsx and source-only tests can mislead; live canonical import selects EditProfile/.ts (`src/App.tsx:301,642`; `src/pages/EditProfile.tsx:11`; `src/test/ob1Welcome.test.tsx:55,82`).
2. **Business creation targets impossible editor branches:** retained mode=create logic is not mounted by actual create route (`BusinessProfileEditor.tsx:107–108,554–572`; `src/App.tsx:764,768`).
3. **Different identity domains are conflated:** user_type/profile_type/actor/analytics rules disagree, notably personal and creator legacy values (`useProfileType.ts:20–28`; `src/types/profile.ts:45–47`; `ActiveActorContext.tsx:72–81`; recorded taggable migration §3).
4. **“Hidden tab” assumed unreachable:** accepted URLs can render content not offered in tab bar or null; Top100 does normalize, while Achievements does not become supported (`ProfilePageV2.tsx:310–315,397–432,483–490,836–883`).
5. **Save/cache authority assumed uniform:** photo/Welcome/ordinary partial/default and home-club invalidations differ; error-only and unchecked writes do not verify matched rows; full branch can partially persist then fail (`useProfileSave.ts:113–117,150–172,184–240`; `useSetHomeClub.ts:34–38`; WhsConnectScreen `:281–292`).
6. **Wrong preview boundary changed:** removed ProfileSheetV2, prop-driven AccountGlance, and dormant FriendSheet are different surfaces (`ACCOUNT_TILE_STOP_REPORT.md:58`; PostingAsMenu `:263–280`; FriendSheetProvider `:44–60`; ProfilePageV2 `:173`).
7. **Creator business offering confused with author/discovery retirement:** two lists, shared draft-label lookup and parity tests; live creator RPC discovery survives independent category tile (`createRules.ts:33,38–42`; bc1BusinessCreate.test `:78–82`; useWatchBottom `:11–36`; useFeaturedCreators `:18–41`).
8. **Local Welcome progress taken as server completion/home club:** step 2 can advance without club write; completion flag and resume store differ; auth errors differ by entry (`Welcome.tsx:41–42,95–108`; postAuthRoute `:20–26`; AuthCallback `:62–69`).
9. **Stale documentation treated as live UI:** HeroShell/176px prose and early BE retention claim contradict current implementation/later report (`AGENTS.md:80`; ProfileHero `:4–6`; ProfileCoverBand `:118–120`; BE4_REPORT.md `:9,37`).
10. **Base column assumed automatically public/editable/visible:** wildcard fetch, handwritten type/form, strict partial payloads, public projection and preview props are separate (`useUserProfile.tsx:7–75,90–119`; useProfileForm `:84–87`; useProfileSave `:137–150`; PostingAsMenu `:181–196`).

**Audit limitation:** no authenticated runtime flow, device visual check, database query, or hosted-service setting read was performed. Repository absence/search findings are bounded to this checkout; external/deployed behavior is **not verifiable from the code**. No fixes or recommendations are included.
