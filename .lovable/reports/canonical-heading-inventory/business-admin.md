# Business, Insights and Admin — read-only heading inventory

## Method and resolution notes

- Source audit only; no files under `/dev-server` changed, no tests/builds/SQL run. Tables record distinct source heading/style families; dynamic repeated rows and identical ready/error branches are consolidated. A table per named page/sheet follows. Line references identify JSX or the defining style when shared.
- Comparison uses the task’s Courses canon (11/700/.16em/1 eyebrows and 21/700/−.035em/1.05 titles), **not comments claiming canon**. `lib/tokens/type.TITLE` actually resolves to 17/700/−.032em/1.2. Analytical KICKER actually resolves to 11/700/.16em, without explicit line-height. BIZ_KICKER is 11/700/.19em; BIZ_TITLE 17/700/−.032em/1.2.
- `inherited` means no explicit line-height at the element/style family; it is not assumed to equal 1 or 1.05. Tracking 0 means normal/no local letter spacing. Tailwind uses default px equivalents (text-sm 14/20, text-lg 18/28, text-xl 20/28, text-2xl 24/32).
- Colours: A.INK/BIZ.ink = #F8FAFC; A.MUTE/BIZ.inkFaint = rgba(248,250,252,.62); A.DIM = .42; BIZ.inkMute = .72. Admin dark ink = #E9EDF3 (classified white/ink), muted = #B3BCC9 / faint #7B8697; admin brand #FFA83A / brandText #FFB758 are amber variants, not white.
- Standalone uppercase panel captions above figures, charts, lists or inputs are ROW/GROUP LABEL, **not** section eyebrows. Figure labels remain FIGURE LABEL even when visually above a number. Page-level titles are SECTION TITLE because the supplied role taxonomy has no PAGE TITLE. Header-only navigation controls are CHIP/BADGE rather than headings.
- Coverage prioritizes every routed business/admin page plus Health/Analytics lenses, Content segments, Verified, Team, shared drawers and sheets. Redirects, data hooks and form field labels have no independent heading entry. Some shared source-family rows intentionally consolidate several labels; counts are inventory records, not DOM totals.

## Business — Your businesses

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Your businesses | src/pages/MyBusinessesPage.tsx:120 | ManagePageShell → FixedPageHeader | 16 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Insights

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Insights | src/pages/BusinessInsightsPageV2.tsx:118 | ManagePageShell → FixedPageHeader | 16 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Team

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Team | src/pages/BusinessTeamPage.tsx:41 | ManagePageShell → FixedPageHeader | 16 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Verification

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Verification | src/pages/BusinessVerificationPage.tsx:138 | ManagePageShell → FixedPageHeader | 16 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 16 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Activity

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Activity | src/pages/BusinessActivityPage.tsx:76 | date group h2 | 14 | 500 | 0 | 20px | muted | ROW/GROUP LABEL | — |

## Business — Directory

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Directory | src/pages/BusinessDirectoryPage.tsx:82 | Golf Businesses & Clubs | 20 | 600 | 0 | 28px | white/ink | SECTION TITLE | title 20 vs 21; weight 600 vs 700; tracking 0 vs -0.035em; line-height 28px vs 1.05 |
| Business | Directory | src/pages/BusinessDirectoryPage.tsx:95 | Manage/list business callout | 16 | 500 | 0 | 24px | white/ink | SECTION TITLE | title 16 vs 21; weight 500 vs 700; tracking 0 vs -0.035em; line-height 24px vs 1.05 |
| Business | Directory | src/pages/BusinessDirectoryPage.tsx:175 | No businesses found | 18 | 500 | 0 | 28px | white/ink | SECTION TITLE | title 18 vs 21; weight 500 vs 700; tracking 0 vs -0.035em; line-height 28px vs 1.05 |

## Business — Profile error

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Profile error | src/pages/BusinessProfilePage.tsx:290 | h1 text-[22px] font-semibold tracking-tight | 22 | 600 | -0.025em | inherited | white/ink | SECTION TITLE | title 22 vs 21; weight 600 vs 700; tracking -0.025em vs -0.035em; line-height inherited vs 1.05 |

## Business — Editor error

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Editor error | src/pages/BusinessProfileEditor.tsx:301 | h1 text-[16px] | 16 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 16 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |

## Business — Reviews non-course state

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Reviews non-course state | src/pages/BusinessReviewsPage.tsx:492 | TITLE from lib/tokens/type | 17 | 700 | -0.032em | 1.2 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |

## Business — Invite acceptance

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Invite acceptance | src/pages/BusinessInviteAcceptPage.tsx:98 | You’re on the team / unavailable / status | 19 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 19 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Business | Invite acceptance | src/pages/BusinessInviteAcceptPage.tsx:156 | Join {business_name} | 19 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Invite members

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Invite members | src/pages/BusinessInvitePage.tsx:327 | headingStyle: home club / followers / Role | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Business — Profile live success

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Profile live success | src/pages/BusinessProfileLiveSuccessPage.tsx:78 | Your business profile is live 🎉 | 24 | 700 | -0.02em | 32px | white/ink | SECTION TITLE | title 24 vs 21; tracking -0.02em vs -0.035em; line-height 32px vs 1.05 |
| Business | Profile live success | src/pages/BusinessProfileLiveSuccessPage.tsx:121 | What you can do next | 14 | 700 | 0 | 20px | white/ink | SECTION TITLE | title 14 vs 21; tracking 0 vs -0.035em; line-height 20px vs 1.05 |

## Business — Empty businesses

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Empty businesses | src/components/business/AddBusinessCard.tsx:36 | No business profiles yet | 17 | 600 | 0 | inherited | white/ink | SECTION TITLE | title 17 vs 21; weight 600 vs 700; tracking 0 vs -0.035em; line-height inherited vs 1.05 |
| Business | Empty businesses | src/components/business/BusinessEmptyState.tsx:151 | Golf businesses on clbhouz / kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Empty businesses | src/components/business/BusinessEmptyState.tsx:152 | Reach golfers who track every round… | 27 | 700 | -0.02em | 1.16 | white/ink | SECTION TITLE | title 27 vs 21; tracking -0.02em vs -0.035em; line-height 1.16 vs 1.05 |
| Business | Empty businesses | src/components/business/BusinessEmptyState.tsx:71 | Card titleStyle | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Business — Business home

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Business home | src/components/business/home/BusinessDoNextCard.tsx:73 | business.doNext.kicker | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Business — Business week

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Business week | src/components/business/home/BusinessWeekCard.tsx:74 | Kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Business week | src/components/business/home/BusinessWeekCard.tsx:78 | Headline / error headline | 18 | 700 | -0.015em | 1.28 | white/ink | SECTION TITLE | title 18 vs 21; tracking -0.015em vs -0.035em; line-height 1.28 vs 1.05 |
| Business | Business week | src/components/business/home/BusinessWeekCard.tsx:81 | labelStyle | 9.5 | 700 | 0.12em | inherited | muted | FIGURE LABEL | — |

## Business — Followers card

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Followers card | src/components/business/BusinessFollowersCard.tsx:80 | Their followers (no following prose title) | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |
| Business | Followers card | src/components/business/BusinessFollowersCard.tsx:119 | Where they play most | 10 | 700 | 0.12em | inherited | muted | ROW/GROUP LABEL | — |

## Business — Nearby courses

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Nearby courses | src/components/business/BusinessNearbyCourses.tsx:127 | Courses nearby (no following title) | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |
| Business | Nearby courses | src/components/business/BusinessNearbyCourses.tsx:82 | Top 100 | 9.5 | 800 | 0.1em | inherited | white/ink | CHIP/BADGE | — |
| Business | Nearby courses | src/components/business/BusinessNearbyCourses.tsx:94 | Rating | 9.5 | 700 | 0.1em | inherited | muted | FIGURE LABEL | — |

## Business — From the club

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | From the club | src/components/business/ClubFromTheClub.tsx:54 | heading (posts immediately below) | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Business — How it plays

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | How it plays | src/components/business/ClubHowItPlays.tsx:149 | How it plays (stat content below) | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |
| Business | How it plays | src/components/business/ClubHowItPlays.tsx:99 | Early data | 9.5 | 800 | 0.1em | inherited | muted | CHIP/BADGE | — |

## Business — What golfers say

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | What golfers say | src/components/business/ClubWhatGolfersSay.tsx:136 | What golfers say, empty state | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | What golfers say | src/components/business/ClubWhatGolfersSay.tsx:139 | No one has reviewed {club} yet | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |
| Business | What golfers say | src/components/business/ClubWhatGolfersSay.tsx:161 | What golfers say, ready (rating content) | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Business — You cards

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | You cards | src/components/business/YouCardShell.tsx:20 | club-you-kicker; index.css:526 | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | You cards | src/components/business/YouCardShell.tsx:21 | club-you-title; index.css:527 | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Business — Golf club load error

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Golf club load error | src/components/golf-club/GolfClubView.tsx:221 | Couldn’t load this course | 17 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 17 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |

## Business — Claim course

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Claim course | src/components/business/ClaimYourCourseSheet.tsx:130 | business.card.claimSheet.title | 18 | 700 | 0 | inherited | white/ink | SHEET TITLE | title 18 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |

## Business — Request another course

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Request another course | src/components/business/RequestAnotherCourseSheet.tsx:226 | Request another course | 18 | 700 | 0 | inherited | white/ink | SHEET TITLE | title 18 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |

## Business — Delete business

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Delete business | src/components/business/DeleteBusinessDialog.tsx:52 | Delete business profile? / TITLE | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |

## Business — Pin drop

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Pin drop | src/components/business/PinDropModal.tsx:198 | Drop a pin on the map / TITLE | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |

## Business — Request access

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Request access | src/components/business/RequestAccessModal.tsx:152 | Request access / TITLE | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |

## Business — Request club

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Request club | src/components/business/RequestClubModal.tsx:72 | Request a course / TITLE | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |

## Business — Public team

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Public team | src/components/business/ClubVisiting.tsx:103 | The team / sheetTitle | 17 | 700 | -0.01em | inherited | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Access decision

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Access decision | src/components/business/AccessRequestsSection.tsx:116 | team-sheet-title: addTitle / declineTitle | 18 | 700 | 0 | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking 0 vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Invite role

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Invite role | src/components/business/TeamInvitesSection.tsx:152 | roleSheet.title / team-list-title | 18 | 700 | -0.01em | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking -0.01em vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Cancel invite

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Cancel invite | src/components/business/TeamInvitesSection.tsx:166 | cancelSheet.title / team-list-title | 18 | 700 | -0.01em | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking -0.01em vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Change team role

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Change team role | src/components/business/TeamListSection.tsx:189 | business.team.sectionTwo.roleSheet.title / team-list-title | 18 | 700 | -0.01em | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking -0.01em vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Edit job title

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Edit job title | src/components/business/TeamListSection.tsx:214 | business.team.sectionTwo.jobSheet.title / team-list-title | 18 | 700 | -0.01em | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking -0.01em vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Make owner

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Make owner | src/components/business/TeamListSection.tsx:223 | business.team.sectionTwo.ownerSheet.title / team-list-title | 18 | 700 | -0.01em | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking -0.01em vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Remove team member

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Remove team member | src/components/business/TeamListSection.tsx:231 | business.team.sectionTwo.removeSheet.title / team-list-title | 18 | 700 | -0.01em | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking -0.01em vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Leave business

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Leave business | src/components/business/TeamListSection.tsx:239 | business.team.sectionTwo.leaveSheet.title / team-list-title | 18 | 700 | -0.01em | 1.4 | white/ink | SHEET TITLE | title 18 vs 21; tracking -0.01em vs -0.035em; line-height 1.4 vs 1.05 |

## Business — Team role controls

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Team role controls | src/components/business/TeamListSection.tsx:191 | team-request-kicker (below sheet title) | 10.5 | 800 | 0.16em | 1.4 | muted | ROW/GROUP LABEL | — |

## Business — Verification flow

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Verification flow | src/components/business/verification/VerificationFlowSheet.tsx:726 | Get verified / Verify domain | 18 | 600 | -0.01em | 1 | white/ink | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking -0.01em vs -0.035em; line-height 1 vs 1.05 |
| Business | Verification flow | src/components/business/verification/VerificationFlowSheet.tsx:1475 | SectionCard: domain / document / presence / representation | 17 | 600 | -0.01em | inherited | white/ink | SECTION TITLE | title 17 vs 21; weight 600 vs 700; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Verification submitted

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Verification submitted | src/components/business/verification/VerificationFlowSheet.tsx:1568 | Request submitted (inner confirmation) | 18 | 600 | -0.01em | inherited | white/ink | SECTION TITLE | title 18 vs 21; weight 600 vs 700; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Business — Verification flow

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Verification flow | src/components/business/verification/VerificationFlowSheet.tsx:1202 | Choose one / What the reviewer will get | 11 | 700 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Business — Editor groups

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Editor groups | src/components/business/editor/BusinessEditPreview.tsx:81 | ep-group: Business; edit-profile.css:33 | 10 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Business — Editor contact

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Editor contact | src/components/business/editor/BusinessEditWhereContact.tsx:67 | BizcSheet / bizc-sheet-title (business-create.css:113) | 20 | 700 | -0.02em | inherited | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.02em vs -0.035em; line-height inherited vs 1.05 |

## Business — Editor profile links

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Editor profile links | src/components/business/editor/BusinessEditProfileLinks.tsx:58 | BizcSheet / bizc-sheet-title (business-create.css:113) | 20 | 700 | -0.02em | inherited | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.02em vs -0.035em; line-height inherited vs 1.05 |

## Business — Editor settings

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Editor settings | src/components/business/editor/BusinessEditSettings.tsx:1 | BizcSheet / bizc-sheet-title (business-create.css:113) | 20 | 700 | -0.02em | inherited | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.02em vs -0.035em; line-height inherited vs 1.05 |

## Insights — Insights — Audience

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Insights — Audience | src/components/business/insights/InsightsAudienceSection.tsx:93 | insights-audience-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Insights | Insights — Audience | src/components/business/insights/InsightsAudienceSection.tsx:93 | insights-audience-title (ready / empty) | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Insights — Insights — Course

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Insights — Course | src/components/business/insights/InsightsCourseSection.tsx:39 | insights-course-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Insights | Insights — Course | src/components/business/insights/InsightsCourseSection.tsx:39 | insights-course-title (ready / empty) | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Insights — Insights — Engagement

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Insights — Engagement | src/components/business/insights/InsightsEngagementSection.tsx:45 | insights-engagement-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Insights | Insights — Engagement | src/components/business/insights/InsightsEngagementSection.tsx:45 | insights-engagement-title (ready / empty) | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Insights — Insights — Followers

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Insights — Followers | src/components/business/insights/InsightsFollowersSection.tsx:42 | insights-followers-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Insights | Insights — Followers | src/components/business/insights/InsightsFollowersSection.tsx:42 | insights-followers-title (ready / empty) | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Insights — Insights — Posts

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Insights — Posts | src/components/business/insights/InsightsPostsSection.tsx:107 | insights-posts-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Insights | Insights — Posts | src/components/business/insights/InsightsPostsSection.tsx:107 | insights-posts-title (ready / empty) | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Insights — Insights — Reviews

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Insights — Reviews | src/components/business/insights/InsightsReviewsSection.tsx:51 | insights-reviews-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Insights | Insights — Reviews | src/components/business/insights/InsightsReviewsSection.tsx:51 | insights-reviews-title (ready / empty) | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |

## Insights — Insights funnel

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Insights funnel | src/components/business/insights/InsightsFunnel.tsx:170 | From seen to acted / funnel kicker | 10.5 | 800 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Insights — Club analytics — Card against course

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Club analytics — Card against course | src/features/business/clubAnalytics/sections.tsx:144 | CARD AGAINST COURSE | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Insights | Club analytics — Card against course | src/features/business/clubAnalytics/sections.tsx:148 | title | 17 | 700 | -0.01em | 1.3 | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.3 vs 1.05 |
| Insights | Club analytics — Card against course | src/features/business/clubAnalytics/sections.tsx:154 | Plays harder/easier than its card | 10.5 | 800 | 0.14em | inherited | muted | ROW/GROUP LABEL | — |

## Insights — Club analytics — Sample

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Insights | Club analytics — Sample | src/features/business/clubAnalytics/sections.tsx:207 | sample kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |

## Business — Create — Category

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Create — Category | src/pages/BusinessCreate.tsx:143 | bizc-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Create — Category | src/pages/BusinessCreate.tsx:143 | bizc-body h1 | 28 | 700 | -0.025em | 1.12 | white/ink | SECTION TITLE | title 28 vs 21; tracking -0.025em vs -0.035em; line-height 1.12 vs 1.05 |

## Business — Create — Club

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Create — Club | src/features/business-create/Step2Club.tsx:150 | bizc-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Create — Club | src/features/business-create/Step2Club.tsx:150 | bizc-body h1 | 28 | 700 | -0.025em | 1.12 | white/ink | SECTION TITLE | title 28 vs 21; tracking -0.025em vs -0.035em; line-height 1.12 vs 1.05 |

## Business — Create — College

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Create — College | src/features/business-create/Step2College.tsx:92 | bizc-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Create — College | src/features/business-create/Step2College.tsx:92 | bizc-body h1 | 28 | 700 | -0.025em | 1.12 | white/ink | SECTION TITLE | title 28 vs 21; tracking -0.025em vs -0.035em; line-height 1.12 vs 1.05 |

## Business — Create — Other

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Create — Other | src/features/business-create/Step2Other.tsx:148 | bizc-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Create — Other | src/features/business-create/Step2Other.tsx:148 | bizc-body h1 | 28 | 700 | -0.025em | 1.12 | white/ink | SECTION TITLE | title 28 vs 21; tracking -0.025em vs -0.035em; line-height 1.12 vs 1.05 |

## Business — Create — Contact

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Create — Contact | src/features/business-create/BusinessCreateStep3.tsx:138 | bizc-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Create — Contact | src/features/business-create/BusinessCreateStep3.tsx:138 | bizc-body h1 | 28 | 700 | -0.025em | 1.12 | white/ink | SECTION TITLE | title 28 vs 21; tracking -0.025em vs -0.035em; line-height 1.12 vs 1.05 |

## Business — Create — Profile

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Create — Profile | src/features/business-create/BusinessCreateStep4.tsx:59 | bizc-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Create — Profile | src/features/business-create/BusinessCreateStep4.tsx:59 | bizc-body h1 | 28 | 700 | -0.025em | 1.12 | white/ink | SECTION TITLE | title 28 vs 21; tracking -0.025em vs -0.035em; line-height 1.12 vs 1.05 |

## Business — Create — Finish

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Create — Finish | src/features/business-create/BusinessCreateFinish.tsx:31 | bizc-kicker | 10.5 | 800 | 0.16em | inherited | muted | SECTION EYEBROW | eyebrow 10.5 vs 11; weight 800 vs 700; line-height inherited vs 1; eyebrow muted vs white/ink |
| Business | Create — Finish | src/features/business-create/BusinessCreateFinish.tsx:31 | bizc-body h1 | 28 | 700 | 0 | 1.12 | white/ink | SECTION TITLE | title 28 vs 21; tracking 0 vs -0.035em; line-height 1.12 vs 1.05 |

## Business — Creation sheets

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Creation sheets | src/features/business-create/step2Bits.tsx:1 | BizcSheet / bizc-sheet-title; CSS:113 | 20 | 700 | -0.02em | inherited | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.02em vs -0.035em; line-height inherited vs 1.05 |

## Business — Creation ownership notice

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Creation ownership notice | src/features/business-create/BusinessCreationNotices.tsx:11 | AlertDialogTitle default | 18 | 600 | -0.025em | 28px | white/ink | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking -0.025em vs -0.035em; line-height 28px vs 1.05 |

## Business — Discard creation

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Business | Discard creation | src/features/business-create/BusinessCreationNotices.tsx:27 | AlertDialogTitle default | 18 | 600 | -0.025em | 28px | white/ink | SHEET TITLE | title 18 vs 21; weight 600 vs 700; tracking -0.025em vs -0.035em; line-height 28px vs 1.05 |

## Manage / moderation — Delete account

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Manage / moderation | Delete account | src/components/manage/overlays/DeleteAccountConfirmSheet.tsx:63 | red uppercase context | 11 | 700 | 0.10em | inherited | other: red | SHEET EYEBROW | tracking 0.10em vs 0.16em; line-height inherited vs 1; eyebrow other: red vs white/ink |
| Manage / moderation | Delete account | src/components/manage/overlays/DeleteAccountConfirmSheet.tsx:66 | TITLE spread | 17 | 700 | -0.032em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.2 vs 1.05 |

## Manage / moderation — Manage group primitive

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Manage / moderation | Manage group primitive | src/components/manage/ui.tsx:117 | group label | 11 | 700 | 0.14em | inherited | muted (danger variant red) | ROW/GROUP LABEL | — |

## Manage / moderation — Report business / user / content

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Manage / moderation | Report business / user / content | src/components/moderation/ReportSheet.tsx:101 | SheetHeader → TITLE + lineHeight override | 17 | 700 | -0.032em | 1.15 | muted: rgba(255,255,255,.96) | SHEET TITLE | title 17 vs 21; tracking -0.032em vs -0.035em; line-height 1.15 vs 1.05; title muted: rgba(255,255,255,.96) vs ink |

## Admin — Admin chrome

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Admin chrome | src/features/admin/AdminShell.tsx:132 | Admin / Analytics prefix above current title | 11 | 600 | 0 | 1.1 | muted | SECTION EYEBROW | weight 600 vs 700; tracking 0 vs 0.16em; line-height 1.1 vs 1; eyebrow muted vs white/ink |

## Admin — Dashboard

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Dashboard | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Health

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Health | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Analytics

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Members (Users)

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Members (Users) | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Content

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Content | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Inbox

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Inbox | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Settings

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Settings | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Video performance

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Video performance | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Analytics diagnostics

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics diagnostics | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Course matching

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Course matching | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Venue mapping

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Venue mapping | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Ranking event courses

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Ranking event courses | src/features/admin/AdminShell.tsx:135 | current routed title | 15 | 700 | 0 | 1.1 | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height 1.1 vs 1.05 |

## Admin — Navigation drawer

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Navigation drawer | src/features/admin/AdminDrawer.tsx:75 | navigation group.label | 10 | 700 | 0.08em | inherited | muted | ROW/GROUP LABEL | — |
| Admin | Navigation drawer | src/features/admin/AdminDrawer.tsx:152 | panel role badge | 10 | 700 | 0.06em | inherited | muted | CHIP/BADGE | — |

## Admin — Drawer status

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Drawer status | src/features/admin/AdminDrawerStatus.tsx:37 | In the app now (green dot only) | 10 | 700 | 0.08em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Dashboard

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Dashboard | src/features/admin/pages/DashboardPage.tsx:47 | Panel .ti: section captions (CSS line 2) | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |
| Admin | Dashboard | src/features/admin/pages/DashboardPage.tsx:40 | Label .ml: Members / Golfers / Clubs etc. | 10 | 700 | 0.07em | inherited | muted | FIGURE LABEL | — |

## Admin — Members last seen

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Members last seen | src/features/admin/components/MembersList.tsx:107 | Last seen / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Members lifecycle

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Members lifecycle | src/features/admin/components/MembersList.tsx:131 | Lifecycle / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Members cohorts

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Members cohorts | src/features/admin/components/MembersList.tsx:225 | dynamic header / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Verified

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Verified | src/features/admin/components/AdminVerifiedCard.tsx:47 | Verified / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Inbox flow

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Inbox flow | src/features/admin/components/InboxPanels.tsx:221 | Flow / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Help overview

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Help overview | src/features/admin/components/HelpArticlesTab.tsx:99 | Help / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Help articles

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Help articles | src/features/admin/components/HelpArticlesTab.tsx:136 | Articles / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Legal

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Legal | src/features/admin/components/LegalDocumentsTab.tsx:72 | Legal / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Tour data

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Tour data | src/features/admin/components/content/TourDataSection.tsx:317 | Player directory / PANEL_TITLE | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Verified

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Verified | src/features/admin/components/AdminVerifiedCard.tsx:46 | PROS / businesses / other account groups | 10 | 700 | 0.07em | inherited | muted | ROW/GROUP LABEL | — |

## Admin — Health — Status

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Health — Status | src/features/admin/components/health/StatusLens.tsx:85 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Health — GolfData

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Health — GolfData | src/features/admin/components/health/GolfDataLens.tsx:43 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Health — App

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Health — App | src/features/admin/components/health/AppLens.tsx:26 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Health — Jobs

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Health — Jobs | src/features/admin/components/health/JobsLens.tsx:143 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Analytics — Live

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics — Live | src/features/admin/components/analytics/LiveLens.tsx:62 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Analytics — Behaviour

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics — Behaviour | src/features/admin/components/analytics/BehaviourLens.tsx:33 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Analytics — Screens

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics — Screens | src/features/admin/components/analytics/ScreensLens.tsx:60 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Analytics — Journeys

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics — Journeys | src/features/admin/components/analytics/JourneysLens.tsx:49 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Analytics — Health

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics — Health | src/features/admin/components/analytics/HealthLens.tsx:57 | Head → analyticsUi.KICKER; panel labels above data | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Analytics figures

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Analytics figures | src/features/admin/components/analytics/analyticsUi.tsx:22 | FIG_LABEL | 9 | 700 | 0.08em | inherited | muted | FIGURE LABEL | — |

## Admin — Health sublabels

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Health sublabels | src/features/admin/components/health/healthUi.tsx:25 | SUB_LABEL | 9 | 700 | 0.08em | inherited | muted | ROW/GROUP LABEL | — |

## Admin — Member radar

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Member radar | src/features/admin/components/MemberRadar.tsx:82 | mr-title: Member / The loop / Golf / In app / Time / Sessions | 11 | 700 | 0.1em | inherited | white/ink | ROW/GROUP LABEL | — |

## Admin — Chart cards

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Chart cards | src/features/admin/components/ChartCard.tsx:59 | ChartCard title | 15 | 700 | 0 | inherited | white/ink | SECTION TITLE | title 15 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |

## Admin — Course matching

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Course matching | src/features/admin/pages/CourseMatchingPage.tsx:289 | AI matching queue (description, not title, below) | 11 | 700 | 0.12em | inherited | muted | ROW/GROUP LABEL | — |
| Admin | Course matching | src/features/admin/pages/CourseMatchingPage.tsx:684 | Prediction engine suggestion badge | 10 | 700 | 0.08em | inherited | amber: #FFB758 | CHIP/BADGE | — |

## Admin — Ranking event courses

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Ranking event courses | src/features/admin/pages/RankingEventCoursesPage.tsx:270 | Different place group | 11 | 700 | 0.06em | inherited | muted | ROW/GROUP LABEL | — |

## Admin — Venue mapping

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Venue mapping | src/features/admin/pages/VenueMappingPage.tsx:292 | Different place group | 11 | 700 | 0.06em | inherited | muted | ROW/GROUP LABEL | — |

## Admin — Diagnostics

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Diagnostics | src/features/admin/pages/AnalyticsDiagnostics.tsx:101 | metric eyebrow above number (not section title) | 11.5 | 700 | 0.5px | inherited | muted | FIGURE LABEL | — |

## Admin — Video performance

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Video performance | src/features/admin/pages/VideoPerfPage.tsx:541 | HeadlineCard metric label | 11 | 600 | 0.3px | inherited | muted | FIGURE LABEL | — |

## Admin — Settings

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Settings | src/features/admin/pages/SettingsPage.tsx:73 | Platform / Get app / Staff / Admin access / This device | 11 | 700 | 0.16em | inherited | muted | ROW/GROUP LABEL | — |

## Admin — Maintenance confirmation

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Maintenance confirmation | src/features/admin/pages/SettingsPage.tsx:337 | Lock members out? | 24 | 700 | -0.03em | inherited | white/ink | SHEET TITLE | title 24 vs 21; tracking -0.03em vs -0.035em; line-height inherited vs 1.05 |

## Admin — Store link

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Store link | src/features/admin/pages/SettingsPage.tsx:435 | App Store / Google Play | 20 | 700 | -0.02em | inherited | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.02em vs -0.035em; line-height inherited vs 1.05 |

## Admin — Flag staff account

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Flag staff account | src/features/admin/pages/SettingsPage.tsx:539 | Flag another account | 20 | 700 | -0.02em | inherited | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.02em vs -0.035em; line-height inherited vs 1.05 |

## Admin — Device diagnostics

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Device diagnostics | src/features/admin/pages/SettingsPage.tsx:719 | Diagnostics | 20 | 700 | -0.02em | inherited | white/ink | SHEET TITLE | title 20 vs 21; tracking -0.02em vs -0.035em; line-height inherited vs 1.05 |

## Admin — Maintenance confirmation

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Maintenance confirmation | src/features/admin/pages/SettingsPage.tsx:336 | Maintenance mode | 11 | 700 | 0.16em | inherited | other: red #FF9B93 | SHEET EYEBROW | line-height inherited vs 1; eyebrow other: red #FF9B93 vs white/ink |

## Admin — Team tab

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Team tab | src/features/admin/pages/UsersPage.tsx:800 | Invite action (button, not heading) | 11 | 700 | 0.06em | inherited | white/ink | CHIP/BADGE | — |

## Admin — Member sections

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Member sections | src/features/admin/pages/UsersPage.tsx:648 | Section {title} above controls, not another title | 11 | 700 | 0.6px | inherited | muted | ROW/GROUP LABEL | — |

## Admin — Content sections

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Content sections | src/features/admin/components/content/ContentSegments.tsx:15 | Newsroom / Courses / Tour data / Pages navigation | 12 | 700 | 0 | inherited | white/ink (active dark canvas ink) | CHIP/BADGE | — |

## Admin — Content list labels

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Content list labels | src/features/admin/components/content/v3Styles.ts:10 | LABEL10 / RAIL_LABEL | 10 | 700 | 0.07em (rail .06em) | inherited | muted | FIGURE LABEL | — |

## Admin — Story detail

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Story detail | src/features/admin/components/content/StorySection.tsx:75 | Newsroom | 10 | 700 | 0.12em | inherited | muted | SECTION EYEBROW | eyebrow 10 vs 11; tracking 0.12em vs 0.16em; line-height inherited vs 1; eyebrow muted vs white/ink |
| Admin | Story detail | src/features/admin/components/content/StorySection.tsx:76 | Tour / Amateur story | 17 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |
| Admin | Story detail | src/features/admin/components/content/StorySection.tsx:98 | story.kicker | 9.5 | 800 | 0.1em | inherited | muted | SECTION EYEBROW | eyebrow 9.5 vs 11; weight 800 vs 700; tracking 0.1em vs 0.16em; line-height inherited vs 1; eyebrow muted vs white/ink |
| Admin | Story detail | src/features/admin/components/content/StorySection.tsx:99 | story.headline | 20 | 800 | -0.01em | 1.25 | white/ink | SECTION TITLE | title 20 vs 21; weight 800 vs 700; tracking -0.01em vs -0.035em; line-height 1.25 vs 1.05 |
| Admin | Story detail | src/features/admin/components/content/StorySection.tsx:92 | Live / Scheduled / Draft | 9.5 | 800 | 0.08em | inherited | green / amber #FFB758 / muted | CHIP/BADGE | — |

## Admin — AddCourseSheet sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | AddCourseSheet sheet | src/features/admin/components/AddCourseSheet.tsx:156 | AdminSheet "Add course" | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — AppealDetailDrawer sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | AppealDetailDrawer sheet | src/features/admin/components/AppealDetailDrawer.tsx:56 | DetailDrawer "Suspension appeal" | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — ApprovalDetailDrawer sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | ApprovalDetailDrawer sheet | src/features/admin/components/ApprovalDetailDrawer.tsx:58 | DetailDrawer {row ? ACTION_LABEL[row.action_type] ?? row.action_type : 'Request'} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — HelpArticlesTab sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | HelpArticlesTab sheet | src/features/admin/components/HelpArticlesTab.tsx:253 | AdminSheet {initial ? 'Edit article' : 'New article'} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — HolePhotoReviewSheet sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | HolePhotoReviewSheet sheet | src/features/admin/components/HolePhotoReviewSheet.tsx:178 | AdminSheet {`Hole ${row.hole_no} ${row.media_type === 'video' ? 'video' : 'photo'}`} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — LegalDocumentsTab sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | LegalDocumentsTab sheet | src/features/admin/components/LegalDocumentsTab.tsx:188 | AdminSheet {initial ? 'Edit document' : 'New document'} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — ModerationDetailDrawer sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | ModerationDetailDrawer sheet | src/features/admin/components/ModerationDetailDrawer.tsx:159 | DetailDrawer {targetTitle} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — PostInsightSheet sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | PostInsightSheet sheet | src/features/admin/components/PostInsightSheet.tsx:37 | AdminSheet {data?.authorName ?? 'Post insight'} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — SupportTicketDrawer sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | SupportTicketDrawer sheet | src/features/admin/components/SupportTicketDrawer.tsx:196 | DetailDrawer {ticket?.subject} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — VerificationsReview sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | VerificationsReview sheet | src/features/admin/components/VerificationsReview.tsx:299 | DetailDrawer {active ? ( | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — AnalyticsDiagnostics sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | AnalyticsDiagnostics sheet | src/features/admin/pages/AnalyticsDiagnostics.tsx:609 | AdminSheet {aggregate ? labelForEvent(aggregate.name) : ''} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — ContentPage sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | ContentPage sheet | src/features/admin/pages/ContentPage.tsx:479 | DetailDrawer {course?.name ?? 'Course'} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Admin | ContentPage sheet | src/features/admin/pages/ContentPage.tsx:1203 | AdminSheet "Manage headshot" | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — CourseMatchingPage sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | CourseMatchingPage sheet | src/features/admin/pages/CourseMatchingPage.tsx:705 | AdminSheet "Link WHS course" | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — InboxPage sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | InboxPage sheet | src/features/admin/pages/InboxPage.tsx:390 | AdminSheet {title} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Admin | InboxPage sheet | src/features/admin/pages/InboxPage.tsx:487 | AdminSheet "Match WHS course" | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Admin | InboxPage sheet | src/features/admin/pages/InboxPage.tsx:610 | AdminSheet {row.whs_course_name ?? 'Unnamed WHS course'} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Admin | InboxPage sheet | src/features/admin/pages/InboxPage.tsx:727 | AdminSheet {row.courseName} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — RankingEventCoursesPage sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | RankingEventCoursesPage sheet | src/features/admin/pages/RankingEventCoursesPage.tsx:231 | AdminSheet {row.event_name} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — UsersPage sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | UsersPage sheet | src/features/admin/pages/UsersPage.tsx:256 | DetailDrawer {detail?.display_name ?? (loading ? 'Loading...' : 'Member')} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Admin | UsersPage sheet | src/features/admin/pages/UsersPage.tsx:584 | AdminSheet "Change username" | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |
| Admin | UsersPage sheet | src/features/admin/pages/UsersPage.tsx:1083 | DetailDrawer "Invite admin" | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — VenueMappingPage sheet

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | VenueMappingPage sheet | src/features/admin/pages/VenueMappingPage.tsx:258 | AdminSheet {venue.venueName} | 17 | 700 | -0.01em | 1.2 | white/ink | SHEET TITLE | title 17 vs 21; tracking -0.01em vs -0.035em; line-height 1.2 vs 1.05 |

## Admin — Admin confirmation primitive

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Admin confirmation primitive | src/features/admin/components/ConfirmDialog.tsx:73 | ConfirmDialog title (all consumers) | 16 | 700 | 0 | inherited | white/ink | SHEET TITLE | title 16 vs 21; tracking 0 vs -0.035em; line-height inherited vs 1.05 |

## Admin — Admin invite acceptance

| Area | Page/Sheet | file:line | Component/class | Size | Weight | Tracking | Line-height | Colour | Role | Differs from Courses |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin | Admin invite acceptance | src/pages/AdminInviteAcceptPage.tsx:83 | dynamic invitation state title | 19 | 700 | -0.01em | inherited | white/ink | SECTION TITLE | title 19 vs 21; tracking -0.01em vs -0.035em; line-height inherited vs 1.05 |

## Area count summary

“Headings” below counts only the five canon-comparable roles; other labels/chips are included separately.

| Area | All records | Headings recorded | Headings differing |
|---|---:|---:|---:|
| Business | 79 | 63 | 63 |
| Insights | 17 | 15 | 15 |
| Manage / moderation | 4 | 3 | 3 |
| Admin | 87 | 48 | 48 |
| **Total** | **187** | **129** | **129** |

## (i) Tile, subline, metaline and body departures from Courses

Reference: photo tile title 15px/700; subline 11.5px; meta 11.5px; body 13px. These are size comparisons, not a claim that all admin rows are photo tiles.
- Directory: supporting copy is text-sm = 14px (`src/pages/BusinessDirectoryPage.tsx:83,98,176`), versus body 13.
- Business landing: body 14.5px (`src/components/business/BusinessEmptyState.tsx:155`); row titles 15px/600, not 700 (`:72`).
- Club load error body 13.5px (`src/components/golf-club/GolfClubView.tsx:222`). Invite acceptance body 13.5px (`src/pages/BusinessInviteAcceptPage.tsx:99`); Admin invite acceptance 13.5px (`src/pages/AdminInviteAcceptPage.tsx:85`).
- Reviews unavailable body 14px (`src/pages/BusinessReviewsPage.tsx:495`). Request-another-course body 12.5px (`src/components/business/RequestAnotherCourseSheet.tsx:229`).
- Creation: sheet subline 13.5px (`src/features/business-create/business-create.css:115`), not tile sub 11.5/body 13. Main title treatment intentionally 28px, not photo-tile 15.
- Club analytics card explanation 12.5px; flagged-hole row title 13.5px/600 (`src/features/business/clubAnalytics/sections.tsx:149,157`).
- Content list row NAME = 13.5px/700, SUB = 11px, CAPTION = 10.5px (`src/features/admin/components/content/v3Styles.ts:17,22,23`); versus 15 / 11.5 / 11.5 reference.
- Admin chart title 15px/700 matches tile-title size/weight, but chart subtitle 12px (`src/features/admin/components/ChartCard.tsx:59,61`). Shared admin sheet subtitle 12px (`src/features/admin/components/AdminSheet.tsx:75`), drawer subtitle 12px (`DetailDrawer.tsx:81`).
- Dashboard row labels 13px/600, row sublines 11px, metadata 11px; metric support 10.5px (`src/features/admin/pages/commandCentreV3.css:2`, `.row .lb`, `.row .sb`, `.me`, `.fs`). These are analytical rows, not photo tiles.
- Admin analytics Fig sublines 10px, Muted body 12px (`src/features/admin/components/analytics/analyticsUi.tsx:49,68`). Health META 10.5px (`src/features/admin/components/health/healthUi.tsx:26`).
- Delete-account explanation 15px (`src/components/manage/overlays/DeleteAccountConfirmSheet.tsx:85`); maintenance explanation 14px (`src/features/admin/pages/SettingsPage.tsx:338`).

## (ii) Sheet titles at risk of wrapping at 21px / 320px viewport

Estimate only, not a browser measurement. Characters × 10.5px includes spaces; real proportional fonts and translated/dynamic values vary. AdminSheet/DetailDrawer: 320 − 32 padding − 36 close − 8 gap ≈ **244px** (~23 characters). BizcSheet: 320 − 40 padding − roughly 40 Done − 12 gap ≈ **228px** (~21 characters). Plain padded business sheet: about 280px (~26 characters).
- **Delete business profile?** (~252px): risky with a close control; fits only without a meaningful button reservation. `DeleteBusinessDialog.tsx:52`.
- **Drop a pin on the map** (~231px): borderline if header buttons consume more than ~57px total after 32px padding. `PinDropModal.tsx:198`.
- **You are not yet listed as the owner** (~357px): wraps. `BusinessCreationNotices.tsx:11`.
- Team title keys with names/businesses are variable and commonly wrap: `business.team.sectionTwo.roleSheet.title`, `jobSheet.title`, `ownerSheet.title`, `removeSheet.title`, `leaveSheet.title` (`TeamListSection.tsx:189–239`); invite `roleSheet.title` / `cancelSheet.title` (`TeamInvitesSection.tsx:152,166`); access `addTitle` / `declineTitle` (`AccessRequestsSection.tsx:116`). Any resolved title above ~26 characters exceeds a 280px heading area.
- **Confirm you represent this business** (~367px), **Confirm your business domain** (~294px), **Show us your presence** (~221px): inner verification section headings, not sheet header; first two still wrap if promoted to 21px (`VerificationFlowSheet.tsx:900,1195,1246`).
- **Approve duplicate proof?** (~252px), **Revoke verification for {business}?** (usually >300px): admin confirmation sheets (`VerificationsReview.tsx:389,406`).
- Admin author/business/member names used as sheet titles can exceed 23 characters: PostInsightSheet author, verification review display name, MemberRadar identity, approval/moderation/appeal/support drawer titles. Dynamic names require a runtime/locale check; cannot guarantee one line.
- Story editor titles / data-driven story headlines can wrap; long Content/course detail names also exceed AdminSheet’s ~23-character budget. **Add course**, **Edit article**, **New article**, **Edit document**, **New document**, **Hole N photo/video**, **Diagnostics**, **Flag another account** are not predicted to wrap under the stated simple estimate.

## (iii) Celebration surfaces with deliberately larger titles

- `src/features/business-create/BusinessCreateFinish.tsx:31`: “{identity.name} is live.” uses **28px/700**, line-height 1.12, tracking reset to 0 by `.bizc-finish-body h1`. This is a full-page finish, not a sheet.
- `src/pages/BusinessProfileLiveSuccessPage.tsx:78`: “Your business profile is live 🎉” uses **24px/700**, −.02em, 32px line-height. Full-page success, not a sheet.
- No confirmed celebration **sheet** with an oversized title found in this scope. Verification “Request submitted” is 18px/600, and “You’re on the team” is a 19px full-page state; neither is a deliberate >21px sheet title.

## Amber and weight-rule findings

- 800 weights remain in business legacy kickers, empty-state cards, followers/nearby badges, home-week figure, creation kickers and several admin story labels/titles and analytics/health figures. These violate the 400–700 rule even when their role is outside canon-comparable headings.
- Admin CourseMatching prediction badge uses brandText #FFB758 (`CourseMatchingPage.tsx:684`); Scheduled story badge uses brandText (`StorySection.tsx:92–95`). Neither is member-own data/logo/sign-in dot: amber is out of policy.
- Admin health H.brand #FFA83A, H.amber = warnText #F9C874, analytics LIT.amber #FFA83A are amber-like operational emphasis, not a permitted own-member exception. Avoid treating them as neutral ink; chart/operational usages require the same amber restriction.
- Green LIVE and health/live dots are green status semantics, not amber findings; no recommendation to recolour them.

## Shared heading components and import-consumer counts

Counts below are matching **import statements** in production src TS/TSX (tests excluded), not component render counts. Same-file local helpers have zero imports by design. Shared primitives are counted repo-wide, including consumers outside this audit scope.

| Component / module | Import statements | Notes |
|---|---:|---|
| ManagePageShell | 23 | FixedPageHeader actually renders 16/700/−.01em; shell comments still say 18/600. |
| FixedPageHeader | 1 | Shared manage/page chrome. |
| SheetHeader | 8 | TITLE 17/700/−.032em; line-height overridden to 1.15. |
| AdminSheet | 13 | 17/700/−.01em/1.2. |
| DetailDrawer | 10 | 17/700/−.01em/1.2; artboard mode hides this default header. |
| ConfirmDialog | 16 | 16/700, no local tracking/line-height. |
| ChartCard | 1 | 15/700 title, 12px subtitle. |
| BizcSheet | 3 | Shared file import count, not just named BizcSheet imports. |
| YouCardShell | 2 | 10.5/800 muted kicker; 17/700 title. |
| Admin lens Head | 9 | Shared module import count; Head is named among exports. |
| PANEL_TITLE | 15 | Shared module import count; uppercase standalone label, not an eyebrow. |
| Canonical type tokens | 54 | Module import count; actual TITLE 17, not task’s 21. |

Local heading helpers: Dashboard Panel/Label (`DashboardPage.tsx:40,47`), Settings Section (`SettingsPage.tsx:73`), MemberRadar Head (`MemberRadar.tsx:79`), verification SectionCard (`VerificationFlowSheet.tsx:1475`): **0 imports**, same-file consumers.

## Limits / follow-up precision

- Source-family coverage is not an exhaustive DOM-element census. In particular the large hero/name overlays, localized sheet names and legacy content editors contain dynamic and inherited styling; measure them in the rendered app before a migration. No line-fit assertion is a substitute for 320px locale screenshots.
- `BusinessCreateStep2` delegates to Club/College/Other; `BusinessCreateRedirect` is navigation-only. BusinessProfilePage delegates club rendering to GolfClubView and shared hero/cards; these shared surfaces are represented above. Business/admin business pages in src/pages were included; non-business generic pages were not expanded.
