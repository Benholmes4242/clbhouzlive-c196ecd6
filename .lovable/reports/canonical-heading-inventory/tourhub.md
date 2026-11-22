# Tour hub typography inventory

Read-only source audit. Canon is the task’s Courses reference, not the conflicting comments in the token files. Rows record distinct rendered treatments (a mapped list is one row); retained/legacy components are identified separately. Section names in caps with no title beneath are ROW/GROUP LABEL even when the component is called SectionEyebrow or the tag is h2. Page/hero headlines use SECTION TITLE because the supplied role vocabulary has no page-title role.

**Inheritance notation:** “1.5 inherited” means no component-local line-height; Tailwind preflight/base supplies the usual 1.5. Unstyled h2 inherits base size/weight (normally 16px/400), not browser bold heading defaults. Those inherited values are not a match to explicit canon. Locale-specific CJK overrides can remove tracking/casing in SectionEyebrow.

**Resolved tokens:** analytical KICKER = 11px/700/0.16em/uppercase/A.INK (#F8FAFC), without line-height; analytical LABEL = 11px/700/0.13em/muted; analytical TITLE = 13px/700/ink without tracking or line-height. lib/tokens/type TITLE = 17px/700/−0.032em/1.2; its KICKER = 9px/700/0.19em with no line-height. INK = #F8FAFC; INK_MUTE = rgba(248,250,252,.62); INK_FAINT = .42; AMBER = #F7931E. MASTHEAD_KICKER = 11/700/.15em/1.2/amber.

## Overview

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Overview | Hero / PhotoBand | src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:197 | MASTHEAD_KICKER | 11 | 700 | 0.15em | 1.2 | amber (#F7931E) | PHOTO KICKER | tracking 0.15em vs 0.16em; line-height 1.2 vs 1; eyebrow amber (#F7931E) vs white/ink |
| Overview | Hero / PhotoBand | src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:199 | MASTHEAD_NAME + photoBandGeometry | 26 | 800 | 0 | 0.99 | white/ink | SECTION TITLE | title 26 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 0.99 vs 1.05 |
| Overview | Hero / PhotoBand | src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:230 | leader surname | 10 | 700 | 0.13em | 1.2 | muted (white 72%) | FIGURE LABEL | — |
| Overview | Hero / PhotoBand | src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:237 | FIRST TEE | 10 | 700 | 0.13em | 1.2 | muted (white 72%) | FIGURE LABEL | — |
| Overview | Hero / PhotoBand | src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:244 | recap figure caption | 10 | 700 | 0.13em | 1.2 | muted (white 72%) | FIGURE LABEL | — |
| Overview | News | src/features/tourhub/overview/sections/OverviewNews.tsx:37 | OverviewSectionHead → OverviewSectionHead.tsx:14 | 20 | 800 | 0 | 1.2 | white/ink | SECTION TITLE | title 20 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.2 vs 1.05 |
| Overview | Also this week | src/features/tourhub/overview/sections/AlsoThisWeek.tsx:39 | OverviewSectionHead → OverviewSectionHead.tsx:14 | 20 | 800 | 0 | 1.2 | white/ink | SECTION TITLE | title 20 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.2 vs 1.05 |
| Overview | Coming up | src/features/tourhub/overview/sections/ComingUp.tsx:31 | OverviewSectionHead → OverviewSectionHead.tsx:14 | 20 | 800 | 0 | 1.2 | white/ink | SECTION TITLE | title 20 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.2 vs 1.05 |
| Overview | Rankings | src/features/tourhub/overview/sections/WorldRankings.tsx:216 | OverviewSectionHead → OverviewSectionHead.tsx:14 | 20 | 800 | 0 | 1.2 | white/ink | SECTION TITLE | title 20 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.2 vs 1.05 |
| Overview | Rankings | src/features/tourhub/overview/sections/WorldRankings.tsx:117 | column headings | 9 | 700 | 0.08em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Overview | Rankings | src/features/tourhub/overview/sections/WorldRankings.tsx:141 | climber label | 9 | 800 | 0.14em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Overview | Rankings | src/features/tourhub/overview/sections/WorldRankings.tsx:236 | your players | 10.5 | 800 | 0.16em | 1.5 inherited | amber (#F7931E) | ROW/GROUP LABEL | — |
| Overview | Your players | src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx:63 | upcoming-kicker / upcoming-sec-kick / cw-kick | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Overview | Last year · was won | src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx:74 | upcoming-kicker / upcoming-sec-kick / cw-kick | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Overview | Last year board | src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx:80 | upcoming-kicker / upcoming-sec-kick / cw-kick | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Overview | The course | src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx:104 | upcoming-kicker / upcoming-sec-kick / cw-kick | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Overview | Tee times | src/features/tourhub/components/overview-v3/LiveOverviewSections.tsx:77 | upcoming-kicker / upcoming-sec-kick / cw-kick | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |

## Season recap

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Season recap | The season | src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:126 | cw-kick / upcoming-kicker | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Season recap | The points list | src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:140 | cw-kick / upcoming-kicker | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Season recap | Cards / see all, empty state | src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:161 | cw-kick / upcoming-kicker | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Season recap | Cards list | src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:168 | cw-kick / upcoming-kicker | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Season recap | Our picks · year | src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:191 | cw-kick / upcoming-kicker | 10 | 800 | 0.16em | 1.4 | muted (62% ink) | ROW/GROUP LABEL | — |
| Season recap | Season figures | src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:126 | cw-cell > span / recap-figs | 9.5 | 800 | 0.12em | 13px | muted (42% ink) | FIGURE LABEL | — |

## Picks / record

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Picks / record | Why these picks | src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx:66 | pick-panel-kicker; pickPanels.css:2 | 10 | 800 | 0.16em | 1.5 inherited | amber (#F7931E) | SHEET EYEBROW | eyebrow 10 vs 11; weight 800 vs 700; line-height 1.5 inherited vs 1; eyebrow amber (#F7931E) vs white/ink |
| Picks / record | Why these picks | src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx:66 | pick-panel-header h2; pickPanels.css:3 | 21 | 800 | 0 | 1.5 inherited | white/ink | SHEET TITLE | weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.5 inherited vs 1.05 |
| Picks / record | Why these picks | src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx:66 | pick-panel-label (models / fit / case / catch / what wins / methodology) | 9.5 | 800 | 0.13em | 1.5 inherited | muted (62% ink) | ROW/GROUP LABEL | — |
| Picks / record | Our record | src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:28 | pick-panel-kicker; pickPanels.css:2 | 10 | 800 | 0.16em | 1.5 inherited | amber (#F7931E) | SHEET EYEBROW | eyebrow 10 vs 11; weight 800 vs 700; line-height 1.5 inherited vs 1; eyebrow amber (#F7931E) vs white/ink |
| Picks / record | Our record | src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:28 | pick-panel-header h2; pickPanels.css:3 | 21 | 800 | 0 | 1.5 inherited | white/ink | SHEET TITLE | weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.5 inherited vs 1.05 |
| Picks / record | Our record | src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:28 | pick-panel-label (models / fit / case / catch / what wins / methodology) | 9.5 | 800 | 0.13em | 1.5 inherited | muted (62% ink) | ROW/GROUP LABEL | — |
| Picks / record | Why these picks | src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx:77 | pick-panel-figures small | 9.5 | 700 | 0.13em | 1.5 inherited | muted (62% ink) | FIGURE LABEL | — |
| Picks / record | Why these picks | src/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet.tsx:77 | pick-panel-chip | 12 | 600 | 0 | 1.5 inherited | muted (soft ink) | CHIP/BADGE | — |
| Picks / record | Our record | src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx:28 | pick-record-three span; pickPanels.css:59 | 9.5 | 800 | 0.13em | 1.5 inherited | muted (62% ink) | FIGURE LABEL | — |

## Leaderboards

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Leaderboards | Page hero | src/features/tourhub/leaderboard/LeaderboardTab.tsx:462 | tour-board-title; leaderboard.css | 26 | 800 | 0 | 1.1 | white/ink | SECTION TITLE | title 26 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |
| Leaderboards | Leaderboard | src/features/tourhub/leaderboard/LeaderboardTab.tsx:405 | tour-board-section-title | 10 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Leaderboards | LiveBoard | src/features/tourhub/leaderboard/LiveBoard.tsx:33 | tour-board-kicker: Your players | 10.5 | 800 | 0.16em | 1.5 inherited | amber (#F7931E); full-board-sheet override white/ink | ROW/GROUP LABEL | — |
| Leaderboards | LiveBoard | src/features/tourhub/leaderboard/LiveBoard.tsx:34 | tour-board-kicker: Leaderboard fallback | 10.5 | 800 | 0.16em | 1.5 inherited | amber (#F7931E); full-board-sheet override white/ink | ROW/GROUP LABEL | — |

## Tournament

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Tournament | V3 hero | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:34 | tv-tour; tournamentPage.css:3 | 11 | 800 | 0.14em | 1.5 inherited | amber (#F7931E) | PHOTO KICKER | weight 800 vs 700; tracking 0.14em vs 0.16em; line-height 1.5 inherited vs 1; eyebrow amber (#F7931E) vs white/ink |
| Tournament | V3 hero | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:34 | tv-title | 26 | 800 | 0 | 1.1 | white/ink | SECTION TITLE | title 26 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |
| Tournament | V3 hero | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:34 | tv-figures span: FIELD / PURSE / PAR / YARDS | 9.5 | 800 | 0.12em | 1.5 inherited | muted (42% ink) | FIGURE LABEL | — |
| Tournament | Field | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:36 | SectionHead / tv-head h2 (uppercase standalone section name) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament | Course | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:39 | SectionHead / tv-head h2 (uppercase standalone section name) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament | Tee times | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:41 | SectionHead / tv-head h2 (uppercase standalone section name) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament | Hardest / easiest | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:39 | tv-subtitle | 9.5 | 800 | 0.13em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Tournament | Your groups / marquee / last three | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:41 | tv-subtitle | 9.5 | 800 | 0.13em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Tournament | Tee times | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:41 | tv-tag (our pick / following / defending) | 9 | 800 | 0 | 1.5 inherited | muted (soft ink) | CHIP/BADGE | — |
| Tournament | Full field sheet | src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx:36 | tv-field-list h2 (no local typography rule) | 16 inherited | 400 | 0 | 1.5 inherited | white/ink | SHEET TITLE | title 16 inherited vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height 1.5 inherited vs 1.05 |
| Tournament | Completed week | src/features/tourhub/tournament-v2/sections/CompletedWeekBlock.tsx:42 | cw-kick | 10 | 800 | 0.16em | 1.4 | muted (42–62% ink) | ROW/GROUP LABEL | — |
| Tournament | Completed week | src/features/tourhub/tournament-v2/sections/CompletedWeekBlock.tsx:46 | cw-sub | 9.5 | 800 | 0.14em | 1.4 | muted (42–62% ink) | ROW/GROUP LABEL | — |
| Tournament | Completed week | src/features/tourhub/tournament-v2/sections/CompletedWeekBlock.tsx:51 | cw-kick | 10 | 800 | 0.16em | 1.4 | muted (42–62% ink) | ROW/GROUP LABEL | — |
| Tournament | Completed week | src/features/tourhub/tournament-v2/sections/CompletedWeekBlock.tsx:69 | cw-kick | 10 | 800 | 0.16em | 1.4 | muted (42–62% ink) | ROW/GROUP LABEL | — |

## Tournament — retained components

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Tournament — retained components | Contest | src/features/tourhub/tournament-v2/sections/ContestSection.tsx:76 | SectionEyebrow: standalone kicker, no following title | 11 | 700 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament — retained components | Event information | src/features/tourhub/tournament-v2/sections/EventInfoSection.tsx:46 | SectionEyebrow: standalone kicker, no following title | 11 | 700 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament — retained components | Movement | src/features/tourhub/tournament-v2/sections/MoveSection.tsx:40 | SectionEyebrow: standalone kicker, no following title | 11 | 700 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament — retained components | Story | src/features/tourhub/tournament-v2/sections/StorySection.tsx:25 | SectionEyebrow: standalone kicker, no following title | 11 | 700 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament — retained components | Tee times | src/features/tourhub/tournament-v2/sections/TeeTimesRail.tsx:63 | SectionEyebrow: standalone kicker, no following title | 11 | 700 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament — retained components | Moments | src/features/tourhub/tournament-v2/sections/MomentsSection.tsx:36 | SectionEyebrow: standalone kicker, no following title | 11 | 700 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Tournament — retained components | Hero | src/features/tourhub/tournament-v2/sections/HeroSection.tsx:95 | MASTHEAD_KICKER | 11 | 700 | 0.15em | 1.2 | amber (#F7931E) | PHOTO KICKER | tracking 0.15em vs 0.16em; line-height 1.2 vs 1; eyebrow amber (#F7931E) vs white/ink |
| Tournament — retained components | Hero | src/features/tourhub/tournament-v2/sections/HeroSection.tsx:100 | MASTHEAD_NAME | clamp(24px,7.7vw,30px) | 800 | -0.032em | 0.99 | white/ink | SECTION TITLE | title clamp(24px,7.7vw,30px) vs 21; weight 800 vs 700; tracking -0.032em vs -0.035em; line-height 0.99 vs 1.05 |

## Tournament sheets

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Tournament sheets | Full leaderboard | src/features/tourhub/tournament-v2/sections/FullBoardSheet.tsx:153 | KICKER above h2 | 11 | 700 | 0.16em | 1.5 inherited | white/ink | SHEET EYEBROW | line-height 1.5 inherited vs 1 |
| Tournament sheets | Full leaderboard | src/features/tourhub/tournament-v2/sections/FullBoardSheet.tsx:153 | h2 / TITLE (canonical lib token where spread) | 21 | 800 | 0 | 1.5 inherited | white/ink | SHEET TITLE | weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.5 inherited vs 1.05 |
| Tournament sheets | All tee times | src/features/tourhub/tournament-v2/sections/AllTeeTimesSheet.tsx:176 | KICKER above h2 | 11 | 700 | 0.16em | 1.5 inherited | white/ink | SHEET EYEBROW | line-height 1.5 inherited vs 1 |
| Tournament sheets | All tee times | src/features/tourhub/tournament-v2/sections/AllTeeTimesSheet.tsx:176 | h2 / TITLE (canonical lib token where spread) | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Tournament sheets | How the field scores | src/features/tourhub/tournament-v2/sections/CourseSection.tsx:234 | KICKER above h2 | 11 | 700 | 0.16em | 1.5 inherited | white/ink | SHEET EYEBROW | line-height 1.5 inherited vs 1 |
| Tournament sheets | How the field scores | src/features/tourhub/tournament-v2/sections/CourseSection.tsx:234 | h2 / TITLE (canonical lib token where spread) | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |
| Tournament sheets | Moments | src/features/tourhub/tournament-v2/sections/MomentsSection.tsx:61 | KICKER above h2 | 11 | 700 | 0.16em | 1.5 inherited | white/ink | SHEET EYEBROW | line-height 1.5 inherited vs 1 |
| Tournament sheets | Moments | src/features/tourhub/tournament-v2/sections/MomentsSection.tsx:61 | h2 / TITLE (canonical lib token where spread) | 17 | 700 | -0.01em | 1.5 inherited | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.5 inherited vs 1.05 |

## Players / rankings

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Players / rankings | Front page | src/features/tourhub/players-v2/front/FrontPage.tsx:101 | tour title h1 | 22 | 800 | 0 | 1.15 | white/ink | SECTION TITLE | title 22 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.15 vs 1.05 |
| Players / rankings | Season hero | src/features/tourhub/players-v2/front/FrontPage.tsx:105 | THE SEASON | 10 | 800 | 0.16em | 1.5 inherited | muted (72% ink) | PHOTO KICKER | eyebrow 10 vs 11; weight 800 vs 700; line-height 1.5 inherited vs 1; eyebrow muted (72% ink) vs white/ink |
| Players / rankings | Season hero | src/features/tourhub/players-v2/front/FrontPage.tsx:106 | hero headline | 28 | 800 | 0 | 1.08 | white/ink | SECTION TITLE | title 28 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.08 vs 1.05 |
| Players / rankings | Season hero | src/features/tourhub/players-v2/front/FrontPage.tsx:112 | figure captions | 9.5 | 800 | 0.14em | 1.5 inherited | muted (60% ink) | FIGURE LABEL | — |
| Players / rankings | Front page sections | src/features/tourhub/players-v2/front/FrontPage.tsx:36 | kickStyle / section header helper | 10 | 800 | 0.14em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Players / rankings | Race phase | src/features/tourhub/players-v2/front/FrontPage.tsx:142 | phase_label | 10 | 800 | 0.14em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Players / rankings | Stat leaders | src/features/tourhub/players-v2/front/FrontPage.tsx:252 | stat category labels | 9.5 | 800 | 0.12em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Players / rankings | All players / standings / form / stats | src/features/tourhub/players-v2/field/FullField.tsx:202 | All {n} players h2 | 20 | 800 | 0 | 1.5 inherited | white/ink | SECTION TITLE | title 20 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.5 inherited vs 1.05 |
| Players / rankings | Full field | src/features/tourhub/players-v2/field/FullField.tsx:56 | column labels | 9 | 700 | 0.08em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Players / rankings | Full field | src/features/tourhub/players-v2/field/FullField.tsx:100 | stake.line_label | 10 | 800 | 0.14em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Players / rankings | Full field | src/features/tourhub/players-v2/field/FullField.tsx:42 | filter pills | 12.5 | 700 | 0 | 1.5 inherited | white/ink / muted / amber for viewer filter | CHIP/BADGE | — |
| Players / rankings | Line picks | src/features/tourhub/players-v2/picks/LinePicksCard.tsx:26 | Picks card heading | 10 | 800 | 0.14em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Players / rankings | Line picks | src/features/tourhub/players-v2/picks/LinePicksCard.tsx:53 | THE LINE | 10 | 800 | 0.14em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Players / rankings | Line picks | src/features/tourhub/players-v2/picks/LinePicksCard.tsx:109 | WHO CALLED IT | 10 | 800 | 0.14em | 1.5 inherited | muted (42% ink) | ROW/GROUP LABEL | — |
| Players / rankings | Line picks | src/features/tourhub/players-v2/picks/LinePicksCard.tsx:170 | Your pick | 11.5 | 700 | 0 | 1.5 inherited | amber (#F7931E), viewer data allowed | CHIP/BADGE | — |

## Player detail

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Player detail | Identity | src/features/tourhub/player-v2/sections/HeroSection.tsx:25 | pv-kicker (identity above name, not photo) | 10.5 | 800 | 0.14em | 1.5 inherited | muted (62% ink) | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; tracking 0.14em vs 0.16em; line-height 1.5 inherited vs 1; eyebrow muted (62% ink) vs white/ink |
| Player detail | Identity | src/features/tourhub/player-v2/sections/HeroSection.tsx:25 | pv-name | 30 | 800 | 0 | 1.05 | white/ink | SECTION TITLE | title 30 vs 21; weight 800 vs 700; tracking 0 vs -0.035em |
| Player detail | Hero stats | src/features/tourhub/player-v2/sections/HeroSection.tsx:25 | pv-figs span | 9.5 | 800 | 0.12em | 1.5 inherited | muted (42% ink) | FIGURE LABEL | — |
| Player detail | Form | src/features/tourhub/player-v2/sections/PlayerForm.tsx:14 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | His / her season | src/features/tourhub/player-v2/sections/PlayerForm.tsx:15 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | His / her game | src/features/tourhub/player-v2/sections/PlayerGame.tsx:9 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | Round by round | src/features/tourhub/player-v2/sections/PlayerSeasonDetails.tsx:11 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | Majors | src/features/tourhub/player-v2/sections/PlayerSeasonDetails.tsx:15 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | In our picks | src/features/tourhub/player-v2/sections/PlayerSeasonDetails.tsx:20 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | Results | src/features/tourhub/player-v2/sections/TournamentsSection.tsx:24 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | About | src/features/tourhub/player-v2/sections/AboutSection.tsx:11 | PlayerSection → pv-head h2 (uppercase standalone section label) | 11 | 800 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Player detail | Full season sheet | src/features/tourhub/player-v2/sections/TournamentsSection.tsx:25 | #player-season-title (unstyled h2; pv-head rule does not apply) | 16 inherited | 400 | 0 | 1.5 inherited | white/ink | SHEET TITLE | title 16 inherited vs 21; weight 400 vs 700; tracking 0 vs -0.035em; line-height 1.5 inherited vs 1.05 |

## News

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| News | News page | src/features/tourhub/news/NewsTab.tsx:522 | tour-news-head h1; src/index.css | 26 | 800 | 0 | 1.5 inherited | white/ink | SECTION TITLE | title 26 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.5 inherited vs 1.05 |
| News | Lead story | src/features/tourhub/news/NewsTab.tsx:409 | tour-news-lead-copy h2 | 27 | 800 | 0 | 1.12 | white/ink | SECTION TITLE | title 27 vs 21; weight 800 vs 700; tracking 0 vs -0.035em; line-height 1.12 vs 1.05 |
| News | Feed | src/features/tourhub/news/NewsTab.tsx:421 | tour-news-sec / tour-news-grp: YOUR PLAYERS | 10.5 | 800 | 0.16em | 1.5 inherited | amber (#F7931E) | ROW/GROUP LABEL | — |
| News | Feed | src/features/tourhub/news/NewsTab.tsx:435 | tour-news-sec / tour-news-grp: TOP STORIES | 10.5 | 800 | 0.16em | 1.5 inherited | muted (news-dim) | ROW/GROUP LABEL | — |
| News | Feed | src/features/tourhub/news/NewsTab.tsx:455 | tour-news-sec / tour-news-grp: BY EVENT | 10.5 | 800 | 0.16em | 1.5 inherited | muted (news-dim) | ROW/GROUP LABEL | — |
| News | Feed | src/features/tourhub/news/NewsTab.tsx:480 | tour-news-sec / tour-news-grp: Archive group date | 10.5 | 800 | 0.16em | 1.5 inherited | muted (news-dim) | ROW/GROUP LABEL | — |
| News | Event filters | src/features/tourhub/news/NewsTab.tsx:459 | tour-news-chip (CSS-defined filter) | CSS filter size | CSS weight | 0 | 1.5 inherited | white/ink / muted | CHIP/BADGE | — |
| News | Story | src/features/tourhub/news/StoryPage.tsx:145 | story h1 | 24 | 700 | -0.02em | 1.15 | white/ink | SECTION TITLE | title 24 vs 21; tracking -0.02em vs -0.035em; line-height 1.15 vs 1.05 |
| News | Story body blocks | src/features/tourhub/news/StoryBody.tsx:58 | Heading h2 | 16 | 700 | -0.01em | 1.25 | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height 1.25 vs 1.05 |

## News — shared shapes

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| News — shared shapes | LeadStory | src/features/tourhub/news/StoryShapes.tsx:159 | headline h1/h2/h3 | 25 | 800 | -0.01em | 1.13 | white/ink | SECTION TITLE | title 25 vs 21; weight 800 vs 700; tracking -0.01em vs -0.035em; line-height 1.13 vs 1.05 |
| News — shared shapes | Photo story tile | src/features/tourhub/news/StoryShapes.tsx:191 | headline h1/h2/h3 | 14 | 700 | 0 | 1.28 | white/ink | SECTION TITLE | title 14 vs 21; tracking 0 vs -0.035em; line-height 1.28 vs 1.05 |
| News — shared shapes | Story card | src/features/tourhub/news/StoryShapes.tsx:209 | headline h1/h2/h3 | 14.5 | 700 | 0 | 1.3 | white/ink | SECTION TITLE | title 14.5 vs 21; tracking 0 vs -0.035em; line-height 1.3 vs 1.05 |
| News — shared shapes | Story row | src/features/tourhub/news/StoryShapes.tsx:229 | headline h1/h2/h3 | 13.5 | 700 | 0 | 1.3 | white/ink | SECTION TITLE | title 13.5 vs 21; tracking 0 vs -0.035em; line-height 1.3 vs 1.05 |
| News — shared shapes | Story section | src/features/tourhub/news/StoryShapes.tsx:279 | KICKER h2 without following title | 11 | 700 | 0.16em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |

## Schedule

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Schedule | Week groups | src/features/tourhub/schedule-v2/ScheduleTab.tsx:767 | sticky week labels (this / last / next / date) | 11 | 800 | 0.16em | 1.5 inherited | white/ink for current; muted otherwise | ROW/GROUP LABEL | — |
| Schedule | Season close | src/features/tourhub/schedule-v2/ScheduleTab.tsx:89 | SEASON_KICKER | 10.5 | 800 | 0.16em | 1.5 inherited | muted (62% ink) | ROW/GROUP LABEL | — |
| Schedule | Next season opener | src/features/tourhub/schedule-v2/ScheduleTab.tsx:89 | SEASON_KICKER | 10.5 | 800 | 0.16em | 1.5 inherited | amber (#F7931E) | ROW/GROUP LABEL | — |
| Schedule | No events | src/features/tourhub/schedule-v2/ScheduleTab.tsx:686 | text-lg font-semibold | 18 | 600 | 0 | 28px | white/ink | SECTION TITLE | title 18 vs 21; weight 600 vs 700; tracking 0 vs -0.035em; line-height 28px vs 1.05 |
| Schedule | Event rows | src/features/tourhub/schedule-v2/SeasonRow.tsx:144 | month below day | 9 | 700 | 0.13em | 1.5 inherited | muted | FIGURE LABEL | — |
| Schedule | Event rows | src/features/tourhub/schedule-v2/SeasonRow.tsx:179 | status / tour marker | 8.5 | 700 | 0.1em | 1.5 inherited | muted / status-specific | CHIP/BADGE | — |

## Chrome

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Chrome | Tour picker | src/features/tourhub/components/TourPickerSheet.tsx:116 | SheetHeader eyebrow → src/components/ui/SheetHeader.tsx:65 | 9 | 700 | 0.19em | 1.5 inherited | muted (#64748B) | SHEET EYEBROW | eyebrow 9 vs 11; tracking 0.19em vs 0.16em; line-height 1.5 inherited vs 1; eyebrow muted (#64748B) vs white/ink |
| Chrome | Tour picker | src/features/tourhub/components/TourPickerSheet.tsx:116 | SheetHeader title | 17 | 700 | -0.032em | 1.15 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.15 vs 1.05 |
| Chrome | Tour picker | src/features/tourhub/components/TourPickerSheet.tsx:167 | All tours | 13 | 700 | 0.04em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Chrome | Tour picker | src/features/tourhub/components/TourPickerSheet.tsx:226 | Majors | 13 | 700 | 0.06em | 1.5 inherited | other (gold GOLD_DEEP) | ROW/GROUP LABEL | — |
| Chrome | Tour picker | src/features/tourhub/components/TourPickerSheet.tsx:295 | Season / no event tour | 13 | 700 | 0.04em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Chrome | Tour picker | src/features/tourhub/components/TourPickerSheet.tsx:339 | Tour rows | 13 | 700 | 0.04em | 1.5 inherited | white/ink | ROW/GROUP LABEL | — |
| Chrome | Tour picker | src/features/tourhub/components/TourPickerSheet.tsx:256 | LIVE / upcoming / results status | 10 | 700 | 0.16em | 1.5 inherited | other (green LIVE / gold results) or muted | CHIP/BADGE | — |

## Clubhouse Tour

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Clubhouse Tour | TourSlot | src/features/clubhouse-tour/TourSlot.tsx:73 | tour-slot-kicker; tourSlot.css:7 | 11 | 700 | 0.15em | 1.5 inherited | amber (#F7931E) | PHOTO KICKER | tracking 0.15em vs 0.16em; line-height 1.5 inherited vs 1; eyebrow amber (#F7931E) vs white/ink |
| Clubhouse Tour | TourSlot | src/features/clubhouse-tour/TourSlot.tsx:77 | tour-slot-title; tourSlot.css:9,51 | 28 (24 narrow) | 700 | -0.01em | 1.08 | white/ink | SECTION TITLE | title 28 (24 narrow) vs 21; tracking -0.01em vs -0.035em; line-height 1.08 vs 1.05 |
| Clubhouse Tour | Lead player | src/features/clubhouse-tour/TourSlot.tsx:87 | tour-slot-lead-heading | 10 | 700 | 0.14em | 1.5 inherited | muted (feed-tour-mute) | ROW/GROUP LABEL | — |
| Clubhouse Tour | Lead figure | src/features/clubhouse-tour/TourSlot.tsx:87 | tour-slot-figure-label | 10 | 700 | 0.14em | 1.5 inherited | muted | FIGURE LABEL | — |
| Clubhouse Tour | Facts | src/features/clubhouse-tour/TourSlot.tsx:87 | tour-slot-fact-label | 9.5 | 700 | 0.14em | 1.5 inherited | muted | FIGURE LABEL | — |
| Clubhouse Tour | SlotBoard | src/features/clubhouse-tour/SlotBoard.tsx:1 | tour-slot-board-header | 10 | 700 | 0.08em | 1.5 inherited | muted | ROW/GROUP LABEL | — |

## Area count summary

“Headings” below means the five canon-comparable roles; labels/chips/figure captions remain inventoried but are excluded from this denominator.

| Area | All rows | Headings recorded | Headings differing |
|---|---:|---:|---:|
| Overview | 17 | 6 | 6 |
| Season recap | 6 | 0 | 0 |
| Picks / record | 9 | 4 | 4 |
| Leaderboards | 4 | 1 | 1 |
| Tournament | 14 | 3 | 3 |
| Tournament — retained components | 8 | 2 | 2 |
| Tournament sheets | 8 | 8 | 8 |
| Players / rankings | 15 | 4 | 4 |
| Player detail | 12 | 3 | 3 |
| News | 9 | 4 | 4 |
| News — shared shapes | 5 | 4 | 4 |
| Schedule | 6 | 1 | 1 |
| Chrome | 7 | 2 | 2 |
| Clubhouse Tour | 6 | 2 | 2 |
| **Total** | **126** | **44** | **44** |

## (i) Tile, supporting-line and body-size differences from Courses

- Overview PhotoBand: title 26px/800 rather than photo tile 15px/700 (hero rather than small tile); place 12.5px/600, sentence 13.5px vs 11.5px sub/meta and 13px body. `components/overview-v3/HybridHeroBands/PhotoBand.tsx:199–215`; geometry constants `photoBandGeometry.ts:9–24`.
- Overview rankings: names 14.5px/600, lead sentence 13.5px, rank meta 12px (`overview/sections/WorldRankings.tsx:75,95`). Treat as table rather than photo tile.
- Players front page: hero 28px/800; supporting 13px (body matches); situation 13.5px; section supporting line 13px; footers 12px. `players-v2/front/FrontPage.tsx:38,106–107,182,277`. Full-field situation 13.5px (`field/FullField.tsx:207`).
- Individual player: identity 30px/800, intro 13.5px; lead prose 14px; event row meta 11.5px generally matches reference meta. `player-v2/playerPage.css:11,17,39`; JSX `sections/HeroSection.tsx:25`, `sections/TournamentsSection.tsx:16–18`.
- Tournament: title 26px/800, venue 12.5px, hero sentence 13.5px, section lead 14px; field tile names 12.5px and rank 11px. `tournament-v2/tournamentPage.css:3–4`, JSX `sections/TournamentV3Sections.tsx:34–39`.
- Picks / record sheets: header sub 12px; verdict prose 12.5px; agreement/methodology/benchmark prose 13.5px; case and catch 13px match body; dark-horse sub 11.5px matches meta. `components/overview-v3/HybridHeroBands/pickPanels.css:4,23,28,39–48,60`; sheet JSX `PicksSheet.tsx:66–78`, `OurRecordSheet.tsx:28`.
- News: lead title 27px/800, shape headlines 25/800, 14/700, 14.5/700, 13.5/700 rather than 15/700; article body 14.5px rather than 13px. `news/NewsTab.tsx:409`, `news/StoryShapes.tsx:159,191,209,229`, `news/StoryBody.tsx:50`. StoryPage title 24px/700 (`StoryPage.tsx:145`).
- Schedule: row event title 15px/700 matches title size/weight, but venue sub 12px rather than 11.5px; date meta 11.5px matches. Field/follow supporting lines 12px. `schedule-v2/SeasonRow.tsx:197–231`; top featured title 16px/800 and sub 12.5px (`ScheduleTab.tsx:663–666`).
- Season recap: narrative foot 12.5px, row names 13px/600, table score 15px/700, captions 9.5px. `src/styles/hybrid-hero.css:86–101`; `SeasonRecapSections.tsx:126–191`.
- Tour picker row names 13px/700, sub 12px/500; majors sub 11px/600. `components/TourPickerSheet.tsx:167–170,239–243,339–343`. Side-menu nav 16px/600–700, player name 14px/700; these are navigation, not section headings (`TourSideMenu.tsx:246–248,417–419`).
- Clubhouse TourSlot: title 28px (24 narrow)/700, sub 13px, lead name 17px (16 narrow), detail 12.5px. `src/features/clubhouse-tour/tourSlot.css:9–16,51–53`, rendered `TourSlot.tsx:73–87`.

## (ii) Sheet title wrapping at 21px / 320px viewport

Estimate only, not a browser measurement. 10.5px × character count; header padding/buttons deducted. Dynamic/localized strings are conditional.

| Sheet | Title/key | Estimated available width | Risk at 21px |
|---|---|---:|---|
| Picks | dynamic eventName | 284px (18px sides, no header button) | Names ≥28 chars likely wrap; current header permits wrapping. |
| Full leaderboard | dynamic meta.name | 288px (16px sides) | Names ≥28 chars would wrap, but current white-space:nowrap instead ellipsizes. |
| All tee times | dynamic tournamentName | 288px | Names ≥28 chars likely wrap. |
| Full player season | dynamic playerName | 280px (20px sides) | Names ≥27 chars likely wrap. |
| Moments | tournament.moments.sheetTitle | 288px | Locale strings ≥28 chars likely wrap; conditional, not a claim that English necessarily does. |
| Tour picker | picker.title | 246px (32px padding + 12px gap + 30px close) | ≥24 chars likely wrap; localization risk. |
| Holes | How the field scores | 288px | 20 × 10.5 = 210px: not expected to wrap in English. |
| Record | overview.record sheet title via copy(title) | 284px | Short English Our record fits; ≥28-char locales risky. |
| Field | copy(field) | about 280px | Short English Field fits. |

## (iii) Celebration sheets with deliberately larger titles

No dedicated celebration sheet found in this scope. Champion/season recap are page bands, not celebration sheets. Large recap/hero type and the 21px/800 Picks/Our record headers are not evidence of a deliberate celebration-sheet exception. The delegated scorecard has rarity/celebration content, but is shared Courses UI, not a Tour-owned celebration sheet.

## Shared heading components and import-consumer counts

Counts use `rg -l` of import declarations under src (distinct importing files; not JSX instances).

| Component | Source | Importing files | Notes |
|---|---|---:|---|
| OverviewSectionHead | overview/sections/OverviewSectionHead.tsx:11–14 | 4 | News, coming up, also this week, rankings; 20/800/0/1.2. |
| SectionShell | overview/sections/SectionShell.tsx:22–64 | 1 | Shared retained shell; kicker muted; optional subline 13/700/−.005em/1.35. With subline, kicker is SECTION EYEBROW and subline SECTION TITLE; without it, ROW/GROUP LABEL. |
| SectionEyebrow | tournament-v2/sections/SectionEyebrow.tsx:26–38 | 6 | Includes external Search consumer. Name does not determine role. |
| PlayerSection | player-v2/sections/PlayerSection.tsx:2–3 | 7 | Standalone uppercase section labels, not 21px titles. |
| SheetHeader | src/components/ui/SheetHeader.tsx:29–90 | 8 | Tour picker uses it; lib KICKER 9/.19em and TITLE 17/−.032em, overridden title LH 1.15. |
| SectionHead (V3-local) | tournament-v2/sections/TournamentV3Sections.tsx:26 | 0 imports of this definition | Function is used locally. A repository-wide symbol-name rg finds 11 other imports, but those are homonyms, not consumers of this definition. |

## Coverage and caveats

- All Tour feature families were inspected: overview/live/upcoming/recap, hero PhotoBand, LiveBoard and leaderboard page, tournament sections and all Tour-owned BottomSheet implementations, players front/full-field/stat lenses and detail page, news/story shapes/body, schedule, tour picker and side menu, plus clubhouse-tour. Retained/legacy files are kept distinguishable from current V3 styles; no claim that all alternate components mount concurrently.
- `components/TourSideMenu.tsx` has navigation rows, not a sheet-own header title/eyebrow: nav 16px/600–700/−.01em, player row name 14px/700, lower actions 14px/600. Do not misclassify these as SECTION TITLE merely because they are visually prominent.
- `leaderboard/ScorecardSheet.tsx` delegates to `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx`; its shared identity line is 13px/700/1.15 (`CardScorecardSheet.tsx:941`), secondary line 11.5px/600 or rarity 700 (`:954–959`). This is an external Courses-owned detail header, not a Tour-owned sheet title rewrite.
- `news/WireNewsPage.tsx` is a wrapper around the news tab, not another typographic page. Redirect/shell-only components (including SeasonStatsRedirect) add no independent heading treatment.
- `rg -l -i tour src/pages` returned HomeLanding, Clubhouse, EditProfile, EchoV2Page, Welcome, ProfilePageV2, gate/home/HomeSections, gate/gateRoutes, public/InviteLandingPage. HomeLanding mounts TourHubShell + OverviewPageV3; Clubhouse mounts TourSlot. Remaining hits are profile tour-pro logic/tab content, chat source labels, marketing/invite prose or gate-route strings, not additional Tour hub routed pages. Their unrelated page headings are excluded rather than inflating Tour counts.
- Amber violations include PhotoBand masthead kicker, V3 tournament tour kicker, Picks/Our record sheet eyebrows, schedule next-season opener, and clubhouse TourSlot kicker. Amber “your players” tied to followed professionals is not automatically the viewing member’s own data; this is a policy concern even where existing comments explicitly permit it. Viewer’s actual pick labels are allowed. Gold is classified separately, not silently treated as amber. Green LIVE must remain green.
- Many standalone caps labels use 800, as do hero names, titles and figures; this violates the global 400–700 weight constraint even though non-heading rows correctly have an em dash in the Courses-diff column.
- This is static-source estimation, not a rendered visual test. No project files changed, tests/builds run, SQL executed or dependencies installed.
