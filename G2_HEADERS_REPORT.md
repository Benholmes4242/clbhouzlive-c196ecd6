# G2_LOOK — page-owned headers inventory

**Report only · 3 November 2026.** No implementation or header-B migration. Source findings below describe the currently mounted code, not proposed layouts. Route parameters are called `:tournamentId`, `:playerId`, and `:courseId` in App.tsx.

## Evidence and limits

- Read the route table, chrome registry, page/header owners and relevant controls. References below are project-relative source paths.
- Captures: Chromium, **390 × 844**, signed out, no session restoration or sign-in. Set `--sat:47px` in the temporary browser document only. Requested 500px scroll on the actual overflow node; short pages clamp earlier. Most protected routes redirect to `/` and show the existing join dialog: their scrolled captures show the **destination feed**, not the requested page's header.
- No new fixture was added. Live course and Tour record IDs could not be discovered from the available signed-out Courses/Tour views. The explicit `g2-audit-example` parameter is an **invented route-shape placeholder, not a real record or populated fixture**. Tour captures show the existing unavailable-data branch; course captures show loading/unavailable-data and the existing gate. They cannot prove populated header/hero appearance or scroll behavior. Source-derived findings are marked as such throughout.
- All 40 saved screenshots were visually inspected. No Playwright page errors occurred. A course-holes top capture was still a skeleton; this is disclosed rather than represented as a settled populated course.
- No tests, typecheck, build, authentication, SQL, migration, RPC deployment, edge-function edit, restart or app change was performed. No guest browsing, review wizard, news or round-plot code was changed. `feed_config`, `round_pool_cap` (30), native and Median configuration remain untouched.

## 1. Tour tournament — `/tourhub/tournament/:id`

**(a) Owner:** `src/features/tourhub/tournament-v2/TournamentPage.tsx` → `TourHubShell` → `src/features/tourhub/components/TourPageShell.tsx` → `src/components/chrome/AppHeader.tsx`.

**(b) Header inventory:**
- 32px circular Back chevron. `safeGoBack` uses browser back, with `/tourhub?tab=schedule` fallback.
- **No visible title/subtitle in the header control row.** `title={meta.name}` (fallback Tournament) and venue subtitle are accepted by TourPageShell but intentionally ignored for display.
- Search icon opens `SearchOverlayV2`.
- Handicap control uses shared `HcpCell`: disconnected Connect opens `ConnectGlance`; live-linked/no-index branch opens `/manage/handicap`; connected index opens `IndexGlance`. Hidden for guests, business actors, unsettled/hidden-chip states.
- Avatar opens the shared `PostingAsMenu` account/actor glance, not a tournament overflow menu. Loading/no-actor renders a placeholder avatar.
- No header Share, tournament overflow, search input, tournament tabs or filters supplied by this page. Deprecated `right` prop is ignored.

**(c) Position:** `AppHeader` uses **sticky**, top `var(--sat, env(...))` on pushed Tour routes, 42px control row; measured height publishes `--tour-header-h`. Global islands are suppressed while TourPageShell is mounted. No condensing/scrolled title state on this header. Registry comments say “fixed”; executable AppHeader style is sticky, so the implementation wins. Error branches occur before this shell and therefore lack the populated header.

**(d) Hero/name:** photo background when `useBatchCourseImages` supplies a venue image; otherwise fallback wash. Tournament HeroSection draws `<h1>{meta.name}</h1>` (two-line clamp), tour label, venue/location, noninteractive status and conditional field/purse/par figures. It has **no clickable hero action**. This h1 is the actual event-name candidate; do not substitute the ignored shell title. Hero scrolls with content.

**(e) Dock candidates:** no permanent tournament tab/filter row passed to AppHeader or `belowTitle`. Full-board and all-tee-times actions open sheets from content; they are not header tabs. No new docking row should be assumed.

**(f) Screenshots:** [Top](G2_HEADERS_SCREENSHOTS/tour-tournament-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/tour-tournament-scrolled.png). Signed-out placeholder-ID unavailable-data view, not a fixture/populated event. Observed existing “Couldn't load this tournament” branch with Retry and Back, not a new failure in product code.

## 2. Tour player — `/tourhub/player/:id`

**(a) Owner:** `src/features/tourhub/player-v2/PlayerPage.tsx` → same TourPageShell/AppHeader as §1.

**(b) Header inventory:** same Back/Search/conditional handicap/avatar cluster as §1; Back fallback `/tourhub?tab=players`. `title={player.full_name}` is not displayed by TourPageShell. **No season/tour dropdowns:** the word “header” in player data comments refers to the server-returned PlayerHeader payload, not interactive selectors. Year comes from `header.season_year`, tour from `tourFor(header, player.tour_codes)`. No header share, overflow, tabs or filters.

Hero controls, separate from the header: Follow/Following invokes canonical toggle and disables while busy; next-event Pick opens `YourPickSheet` without submitting on mount. Optional CollegeStamp uses its shared activation behavior and records activation; it is not a Tour selector. Our record action is in the later PlayerPicks section, not the header.

**(c) Position:** shared **sticky** 42px header, no condensation/scrolled-name state; identity/hero scroll away. Changing player id scrolls page to top and closes pick/record sheets. Error branch lacks populated shell.

**(d) Hero/name:** **no full-bleed hero photograph**. Neutral identity section with shared 118px `PlayerAvatar` headshot (`photo_url`, `headshot_override`, shared fallback). `<h1 className="pv-name">{player.full_name}</h1>` is the candidate back name; tour/country/college kicker and conditional figures follow shared player rules.

**(e) Dock candidates:** none at the page top. Later analytics/section controls are section-owned, not a global header tab row.

**(f) Screenshots:** [Top](G2_HEADERS_SCREENSHOTS/tour-player-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/tour-player-scrolled.png). Signed-out placeholder-ID view says “Couldn't load player data” / Retry, not a populated fixture.

## 3. Every mounted `/courses/:id/*` sub-page

The complete explicit route list in `src/App.tsx:695–703` is **holes, rounds, rate, reviews**. There is no courses catch-all, nested hole-id page, independent media page or course-share-review page mounted here. `/courses/:courseId` is the detail destination, not an additional sub-page.

|Route|Mounted element / destination|Own header, heading and controls|Position / docking / photo|
|---|---|---|---|
|`/courses/:id/holes`|`src/pages/CourseHolesPage.tsx` redirects with replacement to `/courses/:id?sheet=holes`; `scope=you` → `?sheet=your-holes&tab=you`|**None on the shim.** Do not invent a separate holes-page header. Missing id fallback `/courses`.|No shim photo, heading or row to dock. Destination is course detail; sheet state belongs there.|
|`/courses/:id/rounds`|`src/pages/CourseRoundsPage.tsx` redirects with replacement to `/courses/:id?tab=you&sheet=rounds`|**None on the shim.** Missing id fallback `/courses`.|No shim photo/heading/dock. YourRoundsSheet is a destination overlay, not a new page header.|
|`/courses/:id/reviews`|`src/pages/CourseReviewsRedirect.tsx` preserves existing query, sets `tab=reviews&at=reviews`, replacement navigation to detail|**None on the shim.** Existing review targeting/search intent remains in destination query. Missing id fallback `/courses`.|No separate reviews-page hero/header/dock. Detail tabs own Reviews.|
|`/courses/:id/rate`|`ReviewComposerRoute`|**Review wizard explicitly excluded from this audit.** Route listed for completeness only; its internals/controls not audited.|No capture or review-wizard interaction, per exclusion.|

### Destination header and heading (not new sub-page chrome)

`CourseDetailPage` → `src/components/golf-club/GolfClubView.tsx` / `StandaloneCourseDetail`. The shared global `ChromeIsland` supplies the HB4 Back/Search/handicap/avatar or guest controls; the page does not draw an independent sub-page header. Detail Back is history with Courses fallback. Main photo uses `course.thumbnail_image` and canonical wash; the hero's `CourseMasthead as="h1"` contains **`course.name`**, with `nameRef` as actual observed element. The existing back-name source is `shortCourseName(course.name, Number.POSITIVE_INFINITY)` (suffix/parenthetical handling retained, no early clipping), not an invented “Holes” or “Rounds” title.

Hero reference line opens CourseStatsSheet; course record row remains hero content. No page-owned share/overflow is supplied in this header. Standalone course row uses `CourseDetailShellTabs`/RailChips with **course, you, legends, reviews, media** keys and translated labels. It is **sticky at `var(--sat,0px)`**, with `data-stuck`/StickySafeAreaScrim; modal mode uses its own sticky row. This existing row is the destination-level docking consideration, not four new sub-page rows. URL tabs update page state and analytics. `sheet=rounds`/`sheet=your-holes` are consumed by existing sheets; closing removes only `sheet`. The `sheet=holes` redirect string alone is not proof of a separate rendered holes screen.

### Course captures

All use the openly-labelled placeholder ID, signed out; no real course header/photo verified:
- Holes: [Top](G2_HEADERS_SCREENSHOTS/course-holes-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/course-holes-scrolled.png). Top still shows destination skeleton; scrolled existing course gate.
- Holes, `scope=you`: [Top](G2_HEADERS_SCREENSHOTS/course-your-holes-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/course-your-holes-scrolled.png). Destination unavailable course / existing gate.
- Rounds: [Top](G2_HEADERS_SCREENSHOTS/course-rounds-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/course-rounds-scrolled.png). Destination unavailable course / existing gate.
- Reviews: [Top](G2_HEADERS_SCREENSHOTS/course-reviews-redirect-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/course-reviews-redirect-scrolled.png). Destination unavailable course / existing gate.

## 4. `/rounds`

**(a) Owner:** `src/pages/RoundsPage.tsx` draws its own `<header>`; `ScoresLeaderboardsPage` draws board controls beneath. Chrome registry is none.

**(b) Contents:** 36px round Back chevron: history if `window.history.length > 1`, otherwise `/amateur`. Centered title **Rounds**, translation `courses:amateur.roundsPage.title` with English fallback; a plain div, not h1. No header search, Share, overflow, secondary action or tabs.

**(c) Position:** normal-flow safe-area-aware header (top inset +14px, minimum inset +50px); **scrolls away**, no fixed/sticky/scrolled variant. ScrollToTopGlass is separate page affordance.

**(d) Hero/name:** no hero photo or separate page main heading. Candidate name is existing header div “Rounds”. Section headings are not replacements for that page title.

**(e) Dock row:** `ScopeSegments` below header: **Everyone / Your circle / Your club** (club conditional). Governs the scoped boards; omitted in gated/unready states. In-flow, not already docked. Former Filters pill is explicitly unmounted; do not count it. Later feat-window/climb controls remain section-local.

**(f) Captures:** [Top](G2_HEADERS_SCREENSHOTS/rounds-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/rounds-scrolled.png). Signed-out join gate at `/`, not the rounds header.

## 5. Watch grid pages

**(a) Shared owner:** `src/pages/WatchGridPage.tsx`, exported as WatchTop100Page / WatchCoursesPage / WatchRegionPage. Chrome none.

**(b) Common contents:** 36px Back → history if available, else `/amateur`. Centered `<b data-grid-title>`, optional regional subtitle. No header Search, Share, overflow, avatar or second action.

|Route|Exact title/source|Subtitle / filters|Photo and main-heading candidate|Captures (signed-out gate at `/`)|
|---|---|---|---|---|
|`/watch/top100`|**Top 100 on film**, `amateur.watch.top100.title` fallback|No subtitle/chips|No hero photo; title `<b data-grid-title>` is the only page heading. Grid posters are content, not hero.|[Top](G2_HEADERS_SCREENSHOTS/watch-top100-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/watch-top100-scrolled.png)|
|`/watch/courses`|**Your courses**, `amateur.watch.grid.yourCourses` fallback|No subtitle/chips|No hero; same title element.|[Top](G2_HEADERS_SCREENSHOTS/watch-courses-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/watch-courses-scrolled.png)|
|`/watch/region/:region`|Raw `params.region` (capture example **scotland**; do not infer title-casing)|Subtitle `${videosLabel(meta.videos)} · ${coursesLabel(meta.courses)}` when matching region metadata exists. Horizontal **All + each course** chips below header; labels `shortCourseName(course_name)`, selection filters grid and tracks `watch_grid_chip`.|No hero; same title element.|[Top](G2_HEADERS_SCREENSHOTS/watch-region-scotland-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/watch-region-scotland-scrolled.png)|

**(c) Position:** all headers are normal-flow and scroll away; no scrolled state. **(e)** only region course-chip row is a docking candidate; currently in-flow horizontal overflow, not sticky. Tile tap opens canonical viewer; it is not a header action.

## 6. `/achievements` and `/achievements/*`

**(a)** `/achievements` and **only** `/achievements/:userId` mount Navigate to `/profile` with replacement. `/achievementshub` also redirects there. No independent achievement page/header remains. Deeper arbitrary `/achievements/a/b` has no mounted route; registry prefix is not a route declaration.

**(b–e)** Redirects have no Back/title/buttons/search/share/overflow/tabs, fixed state, hero or heading of their own. Profile destination retains existing profile header/hero (already HB5), not a new achievement header. The `:userId` redirect does not target that user's profile: source literally redirects to `/profile`.

**(f)** [Achievements top](G2_HEADERS_SCREENSHOTS/achievements-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/achievements-scrolled.png); [one-segment top](G2_HEADERS_SCREENSHOTS/achievements-prefix-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/achievements-prefix-scrolled.png). Signed-out profile destination gate, “Build your profile…” copy. [Unmatched deeper top](G2_HEADERS_SCREENSHOTS/achievements-unmatched-deeper-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/achievements-unmatched-deeper-scrolled.png): gate at `/`, not evidence of an achievements page.

## 7. `/find-people` and `/golferstofollow`

**(a)** `src/pages/FindPeoplePage.tsx` owns header; GolfersToFollowRedirect → `/find-people${search}` with replacement. No separate golferstofollow header.

**(b)** 36px round Back → history or `/clubhouse`. Centered title div **Explore the community**, `common:findPeople.title` defaultValue. No title-row second button, Share, overflow or avatar. Below: 44px input **Search golfers and businesses** (matching translated aria-label), Search icon; typing replaces suggestion groups with existing people/clubs search results. **Suggested / Golfers / Businesses** tab chips follow; changes preserve other search params, set/remove `?tab=`, replace history. Group See all/Follow all and fixed invite footer are content controls, not header buttons.

**(c)** header, input and tabs all normal-flow, **scroll away**. Bottom nav hidden; no scrolled header state.

**(d)** no hero photo; candidate page name is title div “Explore the community”, not one suggestion-group heading.

**(e)** search + three-choice tab row are the top-level rows that a later header-B proposal must account for; neither currently docks.

**(f)** [Find people top](G2_HEADERS_SCREENSHOTS/find-people-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/find-people-scrolled.png); [Golferstofollow top](G2_HEADERS_SCREENSHOTS/golferstofollow-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/golferstofollow-scrolled.png). Signed-out gate at `/`; no populated suggestions fixture.

## 8. `/followers` and `/following`

**(a)** `src/components/profile/OwnProfileSocialRedirect.tsx`. Session/profile loading spinner; without user/username source fallback says “Please sign in to view this page.” With username:
- `/followers` → `/profile/${username}/followers`.
- `/following` → **`/profile/${username}/followers?tab=following`**, not `/following` URL. Replacement navigation.

Destination `ProfileSocialListRoute` resolves profile → `src/features/social-lists-v2/SocialListPage.tsx`. Actual `/profile/:username/followers` and `/profile/:username/following` are both mounted. Registry destination is **island**, not none (already group 1).

**(b)** Redirect has no header. Destination page identity block contains **display name ?? username ?? Profile**, optional username beneath, not “Followers”/“Following” main title. No page-owned Back/Search icon/Share/overflow/second action in this identity block. Shared island provides history Back with `/` fallback and standard right controls. Below: Followers and Following segmented choices with available counts; selecting swaps list direction. Direction-specific search input filters loaded display names/usernames. Own-profile invite card is content, not header. No title link action.

**(c)** identity, tabs and search normal-flow, scroll away; global island is separate HB6 folding chrome. No page-owned sticky/scrolled identity state.

**(d)** no hero photograph; candidate name is a **plain div** containing owner's display name/username/Profile. If group 2 wants a list-type name instead, that would require an explicit title-source ruling, not an assumed existing heading.

**(e)** Followers/Following row and search are potential dock rows at destination; currently in-flow.

**(f)** [Followers top](G2_HEADERS_SCREENSHOTS/followers-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/followers-scrolled.png); [Following top](G2_HEADERS_SCREENSHOTS/following-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/following-scrolled.png). Signed-out app gate intercepts both at `/`; no real identity/list header verified.

## 9. `/notificationmessages`

**(a)** `src/features/activity-v2/ActivityPageV2.tsx` → `src/components/manage/ManagePageShell.tsx` → `src/components/chrome/FixedPageHeader.tsx`. Global header and bottom nav suppressed.

**(b)** 32px Back; Activity goBack uses `/` with replacement for synthesized push-round exit or `location.key === 'default'`, otherwise history. Centered **Activity**, literal page prop rendered as `<h1>` by FixedPageHeader. Conditional CheckCheck + **Mark all read** when unreadCount >0 invokes existing actor-scoped mark-all-read handling, invalidation/read state and success toast. No search/share/overflow. Below-title horizontal chips **All / New / Mentions / Friends / Records**, selecting feed lens; New/Records show their existing unread counters. Records display label uses `crowns` internal key.

**(c)** **fixed at top:0**, pays env safe-area, 42px control row + border + below chips. Measured spacer reserves the whole header. No folding/scrolled variant. ManagePageShell's old “sticky” comment is stale; FixedPageHeader's executable fixed style is authoritative.

**(d)** no page hero photo; main name is fixed header `<h1>Activity</h1>`. FeaturedMomentCard can have media below, not a page identity hero.

**(e)** five-chip row is **already inside the fixed header**, not a loose body row. A future islands treatment must preserve this existing mounted row/reservation and mark-all-read action.

**(f)** [Top](G2_HEADERS_SCREENSHOTS/activity-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/activity-scrolled.png). Signed-out gate at `/`, not Activity fixed-header proof.

## 10. `/discover/explore/region/*`

**(a)** **No matching mounted route in App.tsx.** Chrome registry/globalHeaderRules retain this prefix, but configuration is not a page. Unknown routes have the App catch-all NotFound; signed-out gate intercepted the tested example first.

**(b–e)** no mounted region header owner, Back target, title source, buttons, filters, hero, heading, docking row or scrolled state to inventory. Do not substitute `/watch/region/:region` (separate mounted feature) or resurrect legacy region components.

**(f)** `/discover/explore/region/scotland`: [Top](G2_HEADERS_SCREENSHOTS/discover-region-scotland-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/discover-region-scotland-scrolled.png). Signed-out gate at `/`; does not prove a mounted Discover-region page.

## 11. Other chrome:none pages with their own header

Compared explicit `chrome:none` registry entries/prefixes with mounted App routes, excluding requested auth/sign-in/onboarding/messages/edit/business setup/manage/admin/legal/create-moment/review-wizard families and leaving news untouched.

### Additional eligible page

**`/support/thread/:id`** — mounted `src/pages/manage/SupportThreadPage.tsx`, matched `/support/` none prefix. Although source lives in pages/manage, its URL is `/support/...`, so it is listed explicitly rather than silently excluded as `/manage/*`.
- Header owner ManagePageShell → FixedPageHeader; fixed geometry/reservation as §9.
- Back default `navigate(-1)` (no explicit fallback); title **ticket.subject || Request**, header `<h1>`. Loading/error/no-ticket branches use Request. No right action, below-title tabs, search, Share or overflow passed.
- No hero photo or other main identity heading. Reply Send/composer, status/category and Retry/Requests actions are body content, not header controls. No dock row.
- [Top](G2_HEADERS_SCREENSHOTS/support-thread-top.png) · [Scrolled](G2_HEADERS_SCREENSHOTS/support-thread-scrolled.png): signed-out gate at `/`, placeholder id; no real support request read.
- If “messages” exclusion is intended to include support conversations too, this is an **excluded-family boundary**, not an undiscovered header; listed for clarity only.

### None entries that do not add another qualifying page

- `/explore`: mounted shim → `/amateur`, no independent header.
- `/hub`, `/hub/*`: mounted redirects → `/clubhouse`, no independent header.
- `/achievements`, `/achievements/:userId`, `/golferstofollow`, `/followers`, `/following`, course shims: already covered; no extra standalone header.
- `/join` and `/i/:inviteCode`: mounted public JoinLandingPage/InviteLandingPage → PublicLanding. These are join/invitation acquisition screens, not group-2 browsing pages; **no page-header band/Back or dock row**. Public wordmark and offer `<h1>` (“Every round you play, scored hole by hole.”), GetApp link and invitation line are body content. Even if not treated as sign-in/onboarding, they fail the “draws its own header” criterion.
- `/auth`, `/auth/callback`, `/signup`, `/welcome`, onboarding, create, messages, admin, manage, legal/privacy/terms, business create/invite/manage, rate/review prefixes: excluded by brief; no internals audited for this report.
- `/discover/explore/region/` and arbitrary deeper `/achievements/`: registry-only or beyond explicit mounted shape; no additional live page.
- `/media`, user/business social destinations, profile, business home, Tour backstops: island entries, **not chrome:none**, so not extra qualifying pages.

## 12. Existing failures and audit checks

**Pre-existing confirmed test failure (not rerun):** retained in `HB6_GROUP1_REPORT.md`:

```text
FAIL src/test/headerB1.test.tsx > HEADER_B1 shared state and controls > GI1 non-condense guest capsule remains byte-identical through nav changes
AssertionError: expected '16px' to be '23px' // Object.is equality
Expected: "23px"
Received: "16px"
❯ src/test/headerB1.test.tsx:97:39
```

**Pre-existing suspected stale fixture, not an observed failing run:** `src/test/tourOverviewBand.test.tsx:65–66` uses `/discover` as non-header-B example; HB6 report identifies it as likely stale. Do not label it a confirmed test failure.

HB6 last focused result: **71 passed / 1 failed / 72 executed**, zero unhandled errors. Last full green baseline remains **6,298 tests / 564 files** (NAV_SQ1); HB6 **6,326 / 565** is candidate inventory, not a full passing result. G2 adds/rewrites/deletes **zero tests** and does not change either count. No historical resolved failures are represented as current failures.

Preview diagnostic log files were absent in this sandbox; no fresh build claim is made. HB6 report's saved automatic build record was `build OK` at `2026-11-03T17:46:59Z`, pre-existing evidence only. No new uncaught browser/page failure was observed in G2; placeholder-ID unavailable-data branches and signed-out access restrictions are expected evidence limitations, not test results.

## 13. Files created

- **`G2_HEADERS_REPORT.md`** (this new report).
- **`G2_HEADERS_SCREENSHOTS/`**: 40 PNGs, top/scrolled pair for each capture entry named above. No other project files changed; no roadmap, plan, memory or architecture updates.

**Not verified:** populated authenticated page headers, real Tour/course photos/names, real social-list identities, and real in-page scroll/docking screenshots behind the sign-in gate. Source inventory is complete for mounted requested route shapes; screenshot limitations are explicit rather than claimed as mock parity.
