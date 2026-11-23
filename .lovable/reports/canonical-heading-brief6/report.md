# Canonical heading series — Brief 6

## Result

Completed: **10,111/10,111 tests across 879 files**, four sequential commands. No failures or retries. Production changes: **95 declarations 800→700 and 12 declarations 650→600 across 32 files** (107 declarations on 106 lines). All non-weight sizes, tracking, leading, colours, case, layout, states, and handlers remain unchanged. No SQL, migrations, edge functions, feed_config or pool-cap changes. No captures: explicitly dropped for weight-only work; physical iPhone weight fidelity remains Ben’s check.

Brand/font hygiene remains a separate queued brief; existing font declarations and copy were not changed here.

## Initial census

Ran the exported `scan` from `src/test/weightCanonSweep.test.ts` over all 2,857 non-test .ts/.tsx/.css source files. It reported 107 unsanctioned declarations: 95 above 700 and 12 off-step (all 650). Adding the unchanged `.auth-hero-brand h1` gives **96 above 700 including 1 sanctioned**, exactly the brief. No extra hits. The initial scanner excluded __tests__ directories; independently enumerating them after the change found the same 2,857 files, so none were omitted.

## Every production change

Line numbers are unchanged production lines. CSS selectors are exact. Inline entries quote the actual weight property before/after.

| File:line | Selector/context | Before | After |
|---|---|---|---|
| `src/components/feed/PostGolfContext.tsx:186` | `inline style` | `fontWeight: 800` | `fontWeight: 700` |
| `src/components/feed/PostGolfContext.tsx:192` | `inline style` | `fontWeight: 800` | `fontWeight: 700` |
| `src/components/invite/inviteConnected.css:10` | `.if1-stat span` | `font-weight:800` | `font-weight:700` |
| `src/components/invite/inviteConnected.css:19` | `.if1-group-title` | `font-weight:800` | `font-weight:700` |
| `src/components/likes/LikesSheet.tsx:195` | `inline style` | `fontWeight: 800` | `fontWeight: 700` |
| `src/components/shared/ReviewGhostScore.tsx:82` | `inline style` | `fontWeight: 800` | `fontWeight: 700` |
| `src/components/ui/RailChips.tsx:290` | `inline style` | `fontWeight: size === 'tile' ? 800 : RAIL_CHIP_WEIGHT` | `fontWeight: RAIL_CHIP_WEIGHT` |
| `src/features/chrome-v2/ChromeIsland.tsx:578` | `inline style` | `fontWeight: 800` | `fontWeight: 700` |
| `src/features/chrome-v2/IndexGlance.tsx:199` | `inline style` | `fontWeight: 650` | `fontWeight: 600` |
| `src/features/chrome-v2/account-glance.css:24` | `.account-switch-label` | `font-weight: 650` | `font-weight: 600` |
| `src/features/chrome-v2/account-glance.css:28` | `.account-count` | `font-weight: 800` | `font-weight: 700` |
| `src/features/chrome-v2/account-glance.css:32` | `.account-door-label` | `font-weight: 650` | `font-weight: 600` |
| `src/features/chrome-v2/account-glance.css:44` | `.account-admin` | `font-weight: 800` | `font-weight: 700` |
| `src/features/chrome-v2/tour-glance.css:8` | `.tour-menu-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/chrome-v2/tour-glance.css:21` | `.tour-menu-live` | `font-weight:800` | `font-weight:700` |
| `src/features/coach/coach.css:2` | `.coach-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/composer-flow/review-course-search.css:43` | `.rcs-ask` | `font-weight: 650` | `font-weight: 600` |
| `src/features/creator/profile-creator.css:7` | `.profile-round-video` | `font-weight:800` | `font-weight:700` |
| `src/features/find-people/follow-tiles.css:17` | `.follow-tile .follow-tile-follow` | `font-weight:800` | `font-weight:700` |
| `src/features/guest/guestGate.css:78` | `.guest-gate-head` | `font-weight: 800` | `font-weight: 700` |
| `src/features/member-badge/member-badge.css:8` | `.mbc-title` | `font-weight:800` | `font-weight:700` |
| `src/features/post-v2/StageComposer.tsx:1055` | `inline style` | `fontWeight:800` | `fontWeight:700` |
| `src/features/post-v2/StageComposer.tsx:1057` | `inline style` | `fontWeight:800` | `fontWeight:700` |
| `src/features/post-v2/components/golf/ShareFooter.tsx:27` | `inline style` | `fontWeight: 800` | `fontWeight: 700` |
| `src/features/post-v2/components/golf/composerGolf.css:3` | `.composer-golf-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/post-v2/components/golf/composerGolf.css:20` | `.composer-golf .composer-golf-chip` | `font-weight:650` | `font-weight:600` |
| `src/features/post-v2/components/golf/composerGolf.css:81` | `.pf4-filmstrip .pf4-filmstrip-remove,.pf4-filmstrip-number` | `font-weight:800` | `font-weight:700` |
| `src/features/post-v2/components/video/roundVideoCreator.css:3` | `.vc-round-score` | `font-weight:800` | `font-weight:700` |
| `src/features/post-v2/components/video/roundVideoCreator.css:8` | `.video-creator .vc-mark-primary` | `font-weight:800` | `font-weight:700` |
| `src/features/post-v2/components/video/videoCreator.css:3` | `.video-creator .vc-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/post-v2/components/video/videoCreator.css:51` | `.video-creator .vc-chip` | `font-weight:650` | `font-weight:600` |
| `src/features/post-v2/components/video/videoCreator.css:60` | `.video-creator .vc-glyph` | `font-weight:800` | `font-weight:700` |
| `src/features/post-v2/components/video/videoCreator.css:73` | `.video-creator .vc-sheet-action` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-label.css:2` | `.pro-label-text` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-label.css:20` | `.pro-hero-descriptor b` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-label.css:21` | `.pro-hero-descriptor span` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-label.css:23` | `.profile-pro-tour-heading` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-status-controls.css:6` | `.pro-being-checked` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-status-controls.css:14` | `.pro-status-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-status-controls.css:15` | `.pro-status-heading` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-status-controls.css:23` | `.pro-status-confirm h2` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-verification.css:10` | `.pds-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-verification.css:11` | `.pds-head h2` | `font-weight:800` | `font-weight:700` |
| `src/features/pro-verification/pro-verification.css:19` | `.pds-label` | `font-weight:800` | `font-weight:700` |
| `src/features/review-v2/components/SubmitBar.tsx:89` | `inline style` | `fontWeight: 650` | `fontWeight: 600` |
| `src/features/review-v2/components/reviewReceipt.css:13` | `.receipt-pending-head` | `font-weight:650` | `font-weight:600` |
| `src/features/review-v2/components/reviewReceipt.css:25` | `.receipt-overall>span` | `font-weight:650` | `font-weight:600` |
| `src/features/review-v2/components/reviewReceipt.css:30` | `.receipt-category>span` | `font-weight:650` | `font-weight:600` |
| `src/features/review-v2/components/reviewReceipt.css:43` | `.review-receipt .receipt-find` | `font-weight:650` | `font-weight:600` |
| `src/features/review-v2/components/reviewReceipt.css:46` | `.review-receipt .receipt-clubhouse` | `font-weight:650` | `font-weight:600` |
| `src/features/video-details/round-video.css:2` | `.round-video-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/video-details/round-video.css:2` | `.round-video-value` | `font-weight:800` | `font-weight:700` |
| `src/features/video-details/round-video.css:5` | `.round-video-chapter-score` | `font-weight:800` | `font-weight:700` |
| `src/features/video-details/video-viewer.css:2` | `.video-teaser .video-title` | `font-weight:800` | `font-weight:700` |
| `src/features/video-details/video-viewer.css:11` | `.video-about h2` | `font-weight:800` | `font-weight:700` |
| `src/features/video-details/video-viewer.css:15` | `.video-about-kicker` | `font-weight:800` | `font-weight:700` |
| `src/features/video-details/video-viewer.css:20` | `.video-about-glyph` | `font-weight:800` | `font-weight:700` |
| `src/index.css:534` | `.club-you-kicker` | `font-weight:800` | `font-weight:700` |
| `src/index.css:556` | `.club-visiting-kicker` | `font-weight:800` | `font-weight:700` |
| `src/index.css:565` | `.club-visiting-tag` | `font-weight:800` | `font-weight:700` |
| `src/index.css:601` | `.review-upload-failed` | `font-weight:800` | `font-weight:700` |
| `src/index.css:644` | `.team-summary-avatar` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:653` | `.team-request-kicker` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:657` | `.team-request-avatar` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:686` | `.team-s4-table th` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:695` | `.team-s4-tile` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:707` | `.team-list-avatar` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:5510` | `.insights-visits-kicker` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:5519` | `.insights-visits-marker > span` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:5564` | `.insights-posts-rank` | `font-weight: 800` | `font-weight: 700` |
| `src/index.css:5631` | `.insights-course-kicker` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5700` | `.review-score-kicker` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5768` | `.overview-news-kicker` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5779` | `.overview-news-hero h3` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5797` | `.overview-news-player em` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5803` | `.tour-news-head h1` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5818` | `.tour-news-lead-copy h2` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5830` | `.tour-news-event-row .score` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5832` | `.tour-news-sec` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5845` | `.tour-news-grp` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5848` | `.tour-news-ar-date b` | `font-weight:800` | `font-weight:700` |
| `src/index.css:5849` | `.tour-news-ar-date small` | `font-weight:800` | `font-weight:700` |
| `src/pages/auth/components/auth-hero.css:40` | `.auth-hero-panel h2` | `font-weight: 800` | `font-weight: 700` |
| `src/styles/hybrid-hero.css:70` | `.upcoming-facts b` | `font-weight:800` | `font-weight:700` |
| `src/styles/hybrid-hero.css:71` | `.upcoming-facts span` | `font-weight:800` | `font-weight:700` |
| `src/styles/hybrid-hero.css:72` | `.upcoming-kicker` | `font-weight:800` | `font-weight:700` |
| `src/styles/hybrid-hero.css:88` | `.recap-block .upcoming-kicker` | `font-weight:800` | `font-weight:700` |
| `src/styles/hybrid-hero.css:120` | `.upcoming-event-facts span` | `font-weight:800` | `font-weight:700` |
| `src/styles/hybrid-hero.css:124` | `.upcoming-sec-kick` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:4` | `.pf-header h3` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:12` | `.pf-group` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:30` | `.pf .pf-pill` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:34` | `.pf-best-head` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:46` | `.pf-label` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:48` | `.pf-day-week` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:49` | `.pf-day-num` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:53` | `.pf-time-value` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:61` | `.pf-kicker` | `font-weight:800` | `font-weight:700` |
| `src/styles/post-flow.css:64` | `.pf-headline` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:6` | `.welcome-kicker` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:10` | `.welcome-field label` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:12` | `.welcome-stats span` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:13` | `.welcome-section-heading` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:15` | `.welcome-group-label` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:16` | `.welcome-tiles span` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:38` | `.welcome-final-facts i` | `font-weight:800` | `font-weight:700` |
| `src/styles/welcome.css:41` | `.welcome-final-sec` | `font-weight:800` | `font-weight:700` |

## Global index.css selector reach

All 25 changed selectors below. Literal class-name searches cover all non-test TypeScript source, with compound selectors restricted to their distinctive ancestor. Dynamic overview-news-${shape}/${kind} builders are included explicitly. Entries identify every matching component/module, not every transitive caller of those shared components.

| index.css line | Selector | Class-name consumers (file:line) |
|---|---|---|
| 534 | `.club-you-kicker` | `src/components/business/YouCardShell.tsx:20` |
| 556 | `.club-visiting-kicker` | `src/components/business/ClubVisiting.tsx:77` |
| 565 | `.club-visiting-tag` | `src/components/business/ClubVisiting.tsx:78,79` |
| 601 | `.review-upload-failed` | `src/features/review-v2/components/MediaTray.tsx:185` |
| 644 | `.team-summary-avatar` | `src/components/business/TeamSummary.tsx:46,50,51` |
| 653 | `.team-request-kicker` | `src/components/business/AccessRequestsSection.tsx:92,119`<br>`src/components/business/TeamInvitesSection.tsx:154,173`<br>`src/components/business/TeamListSection.tsx:191,253`<br>`src/components/business/TeamRolesActivity.tsx:20,54` |
| 657 | `.team-request-avatar` | `src/components/business/AccessRequestsSection.tsx:101` |
| 686 | `.team-s4-table th` | `src/components/business/TeamRolesActivity.tsx:21` |
| 695 | `.team-s4-tile` | `src/components/business/TeamRolesActivity.tsx:58` |
| 707 | `.team-list-avatar` | `src/components/business/TeamInvitesSection.tsx:30`<br>`src/components/business/TeamListSection.tsx:34,254` |
| 5510 | `.insights-visits-kicker` | `src/components/business/insights/InsightsAudienceSection.tsx:29,57,66`<br>`src/components/business/insights/InsightsEngagementSection.tsx:40`<br>`src/components/business/insights/InsightsFollowersSection.tsx:33`<br>`src/components/business/insights/InsightsPostsSection.tsx:103`<br>`src/components/business/insights/InsightsReviewsSection.tsx:50,70,95`<br>`src/components/business/insights/InsightsVisitsSection.tsx:33,41` |
| 5519 | `.insights-visits-marker > span` | `src/components/business/insights/InsightsVisitsSection.tsx:17` |
| 5564 | `.insights-posts-rank` | `src/components/business/insights/InsightsPostsSection.tsx:66` |
| 5631 | `.insights-course-kicker` | `src/components/business/insights/InsightsCourseSection.tsx:39,53` |
| 5700 | `.review-score-kicker` | `src/features/review-v2/components/OverallScrubber.tsx:23`<br>`src/features/review-v2/components/ReviewScoreHeadings.tsx:23` |
| 5768 | `.overview-news-kicker` | `src/features/tourhub/news/NewsTab.tsx:405`<br>`src/features/tourhub/overview/sections/OverviewNewsStory.tsx:31`<br>`src/features/tourhub/components/overview-v3/overviewShells.tsx:208` |
| 5779 | `.overview-news-hero h3` | `src/features/tourhub/overview/sections/OverviewNewsStory.tsx:34,36`<br>`src/features/tourhub/components/overview-v3/overviewShells.tsx:208,222` |
| 5797 | `.overview-news-player em` | `src/features/tourhub/overview/sections/OverviewNewsStory.tsx:11` |
| 5803 | `.tour-news-head h1` | `src/features/tourhub/news/NewsTab.tsx:521,543` |
| 5818 | `.tour-news-lead-copy h2` | `src/features/tourhub/news/NewsTab.tsx:404` |
| 5830 | `.tour-news-event-row .score` | `src/features/tourhub/news/NewsEventCard.tsx:23,27,82` |
| 5832 | `.tour-news-sec` | `src/features/tourhub/news/NewsTab.tsx:421,435,455` |
| 5845 | `.tour-news-grp` | `src/features/tourhub/news/NewsTab.tsx:384,480` |
| 5848 | `.tour-news-ar-date b` | `src/features/tourhub/news/NewsTab.tsx:252` |
| 5849 | `.tour-news-ar-date small` | `src/features/tourhub/news/NewsTab.tsx:252` |

## State-by-weight cases

- `src/components/ui/RailChips.tsx:290`: `size === 'tile' ? 800 : RAIL_CHIP_WEIGHT` → `RAIL_CHIP_WEIGHT` (700). The former difference distinguished the tile presentation from other chip sizes, not selection. Collapsed the equivalent branches; existing selection fill, edge, colour and handlers remain unchanged.
- `src/index.css:601`, `.review-upload-failed`: failed uploads previously used 800 while waiting labels use 700. Failed now uses 700; existing failure background, retry action and state remain. No replacement invented.
- No other changed declaration conditions its weight on application state. Static heading/label/figure weights and 650 controls are listed individually above. Unchanged canonical state distinctions elsewhere remain.

## Celebration sizes and badge

LevelUp, LaunchSheet, SeasonWrap and SeasonRecap already had canonical weights and are unchanged. PostSuccess inherits the changed `.pf-kicker` (11px) and `.pf-headline` (30px), retaining those sizes. welcome.css is OB1 onboarding rather than a celebration override: its larger 28px heading, 40px index and 24px tiles remain unchanged. `.pro-label-text` changes 800→700 at 7.5px, with the existing small/island size overrides and all badge artwork preserved.

## Test changes and inventory reconciliation

Baseline: Brief 5 `bc71501`, **9,981 tests / 879 files**.

1. `src/test/proBadgeMembers.test.ts:70`, **“uses clipped amber foil letters with the signed-off normal type”**: the declaration in `for (...) expect(css).toContain(declaration)` changes from `font-weight:800` to `font-weight:700`; every other checked declaration remains identical. Reason: the expressly authorised PRO letter weight ruling.
2. `src/test/overviewTypeScale.test.tsx:37`: `expect(rule).toContain('font-weight:800')` → `expect(rule).toContain('font-weight:700')`. Title at line 32 changes **“(b) live facts use 15px/700 figures and 800 labels”** → **“(b) live facts use 15px/700 figures and 700 labels”**. Reason: expressly authorised live-fact label ruling. File retains six tests.
3. `src/test/weightCanonSweep.test.ts`: retains the unchanged matcher, all 28 matcher fixtures, and the single selector allowlist. Replaces the 18 hand-kept scope cases with 147 discovered scope cases, retaining assertion `expect(walk(scope).flatMap(violations)).toEqual([])` and 60,000ms per-scope timeout. Adds **“the generated scopes cover every non-test TypeScript and CSS file under src exactly once”**, asserting `expect(CLEAN_SCOPES.flatMap(walk).sort()).toEqual(allSourceFiles)` against an independent recursive Dirent enumeration. Directory walking no longer skips __tests__; only *.test.* files are excluded.

**Arithmetic:** 9,981 − 18 + 147 + 1 = **10,111** (+130). Guard file: 46→176 tests. Files: 879→879. No test files deleted, no assertion cases removed except the named old scope instances replaced by generated instances, and no other tests renamed or rewritten. Of the original 18 scopes, 15 remain as direct discovered scopes; pages/messaging-v2, FindPeoplePage.tsx and BusinessInvitePage.tsx are now covered by src/pages. No coverage is lost.

A second search of all src/**/*.test.* for 800/900/750/650 and heavy Tailwind weights found no additional weight expectations whose subjects changed. `authHeroKeyboard.test.tsx` and deliberate weightCanonSweep fixtures are untouched; unrelated dimensions, durations, counts, data and negative heavy-weight assertions are unchanged.

## Generated guard scopes

**147 scopes**: each direct child directory of components/features; their 13 direct source-file children also get independent scopes, to avoid losing root files to directory-only partitioning; then pages/styles/lib/hooks/index.css; then every other source-bearing top-level entry. All 2,857 non-test source files are covered exactly once by the coverage assertion. New dirs/files are discovered on the next run.

The standalone command `./node_modules/.bin/vitest run src/test/weightCanonSweep.test.ts --reporter=verbose` passed **176/176**, 1 file, 11.02s total. Slowest scope: **src/features/tourhub, 835ms**. The 28 matcher fixtures are unchanged.

```text
src/components/AccessControl.tsx
src/components/AppShell.tsx
src/components/BootHold.tsx
src/components/DeletedAccountGate.tsx
src/components/DeletedAccountScreen.tsx
src/components/ErrorBoundary.tsx
src/components/GlobalBottomNavigation.tsx
src/components/LockAnchorSync.tsx
src/components/ScrollRestoration.tsx
src/components/ScrollToTop.tsx
src/components/SuspendedScreen.tsx
src/components/achievements
src/components/auth
src/components/awards
src/components/bottom-navigation
src/components/business
src/components/chrome
src/components/clubhouse
src/components/common
src/components/course-media-tab
src/components/courses
src/components/debug
src/components/discover
src/components/explore-tab-new
src/components/feed
src/components/feed-cards
src/components/friend-sheet
src/components/fullscreen
src/components/fullscreen-feed
src/components/golf-club
src/components/handicap
src/components/header
src/components/hub-warm
src/components/icons
src/components/index.ts
src/components/invite
src/components/keep-alive
src/components/layout
src/components/leaderboard
src/components/learn
src/components/legal
src/components/likes
src/components/loop-tab
src/components/maintenance
src/components/manage
src/components/map
src/components/media
src/components/media-system
src/components/mentions
src/components/moderation
src/components/notifications
src/components/planning
src/components/post
src/components/post-composer
src/components/posts
src/components/posts-tab
src/components/premium
src/components/profile
src/components/redirects
src/components/season
src/components/security
src/components/settings
src/components/shared
src/components/sheets
src/components/skeletons
src/components/system
src/components/theme-provider.tsx
src/components/toast
src/components/top100
src/components/ui
src/components/upload
src/components/uploads
src/components/videos
src/components/watch
src/components/whs
src/features/_shared
src/features/activity-v2
src/features/admin
src/features/amateur
src/features/amateur-ranking
src/features/business
src/features/business-create
src/features/chrome-v2
src/features/clubhouse-tour
src/features/coach
src/features/comments-v2
src/features/composer-flow
src/features/courses
src/features/creator
src/features/echo-chat
src/features/echo-v2
src/features/edit-profile
src/features/explore-magazine
src/features/find-people
src/features/golfers
src/features/guest
src/features/home-club
src/features/media-library
src/features/member-badge
src/features/messaging-dark
src/features/onboarding
src/features/post-v2
src/features/pro-profile
src/features/pro-verification
src/features/profile-sheet-v2
src/features/review-v2
src/features/search-v2
src/features/social-lists-v2
src/features/social-suggestions
src/features/stories
src/features/tourhub
src/features/video-details
src/features/watch-v2
src/pages
src/styles
src/lib
src/hooks
src/index.css
src/App.css
src/App.tsx
src/ReviewIslandLoader.tsx
src/analytics
src/audio
src/config
src/constants
src/context
src/contexts
src/diag
src/events
src/i18n
src/integrations
src/main.tsx
src/perf
src/providers
src/queryKeys
src/review-island
src/routes
src/services
src/store
src/stores
src/test
src/tokens
src/types
src/uploads
src/utils
src/video
src/vite-env.d.ts
```

## Four sequential shards

| Command | Passed / total tests | Files | Duration |
|---|---:|---:|---:|
| `./node_modules/.bin/vitest run --shard=1/4` | 2447 / 2447 | 220 | 154.08s |
| `./node_modules/.bin/vitest run --shard=2/4` | 2474 / 2474 | 220 | 193.98s |
| `./node_modules/.bin/vitest run --shard=3/4` | 2457 / 2457 | 220 | 171.70s |
| `./node_modules/.bin/vitest run --shard=4/4` | 2733 / 2733 | 219 | 223.49s |
| **Total** | **10,111 / 10,111** | **879** | |

All shards were separate commands, run 1→2→3→4. No PF3A timeout occurred, so the retry/isolated-file exception was unused. Complete stdout/stderr retained locally under `.lovable/reports/canonical-heading-brief6/logs/{guard,shard-1,shard-2,shard-3,shard-4}.log`; raw logs are ignored and not committed.

## Final census and checks

The guard’s unchanged exported scanner over all src yields **0 unsanctioned hits**, **1 above 700 including sanctioned**, **0 off-step**. Only `.auth-hero-brand h1` at `src/pages/auth/components/auth-hero.css:20` remains 800. A separate scan with a non-allowlisted filename confirms exactly that one declaration. The preserved narrow-screen selector changes size only, not weight.

`git diff --check` passed. Preview observability latest entry: `build OK` (2026-11-23T08:36:37Z). No manual build/typecheck command was run. No browser/capture or physical-device weight claims are made.
