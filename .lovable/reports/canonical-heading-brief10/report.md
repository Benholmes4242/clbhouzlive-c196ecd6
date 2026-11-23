# Canonical heading series — Brief 10: Profile, Settings, social and messaging

Baseline entering: `fae03a5ba3`, 10,159 tests / 885 files.
Canon: SECTION_TITLE 21/700/−0.035em/1.05/synthesis none; SECTION_EYEBROW 11/700/0.16em/uppercase/1; gap 5. Colours unchanged throughout (brief 7 ownership rules stand).

## Confirmed already canonical (unchanged)
- `ui/SheetHeader` — every messaging-v2 sheet (ConversationRow:407, ConversationSettingsSheet:426/1023, NewConversationSheet:410) and FullLeaderboardSheet:85 render through it; the inventory's 17/1.15 rows predate Brief 1. Verified by the new test (21/700/−0.035em/1.05).
- `ui/SectionHeader` — Profile Courses rows (AllCoursesList, BreakdownsPrompt, CourseLegacyCard, CoursesMapSection, TheChaseSection, YourSignatureSection); inventory 20/0.14em rows predate Brief 1.
- friend-sheet `SheetHeader`/Eyebrow.
- Champions `TAB_TITLE` consumers (course-legends, brief 8 — excluded).
- `BreakdownsPickerSheet:140` ("SheetTitle uppercase" row): already on `.canon-sheet-title` with sentence-case titles ("Courses to review" / "Add breakdowns") since the Brief 1 follow-ups. **No sentence-title proposal is needed**; the row is stale.

## Classification and changes

| Row | Class | Before | After |
|---|---|---|---|
| roundsTokens.ts `TITLE` (ProfileRoundsTab:164, CoursesPlayed:63, Season:43, Year:60) | section title | 19/700/−0.02em, inherited lh, mt 5 | `...SECTION_TITLE`, mt `SECTION_TITLE_GAP`, colour RT.INK |
| roundsTokens.ts `KICKER` (same four) | section eyebrow | 11/700/.16em/upper, inherited lh | `...SECTION_EYEBROW`, colour RT.AMBER (call-site ownership conditionals untouched) |
| business-create.css:113 `.bizc-sheet-title` (EditProfileGolf/LinksPrivacy/You, SettingsPrivacyCard, business-create sheets) | sheet title | 20/700/−0.02em | `--section-title-*` vars (size, weight, tracking, leading, synthesis) |
| settingsYourData.css:3 Your data override | sheet title | 20/700/0 | `--section-title-*` size/weight/tracking/leading |
| pro-profile.css:60 `.pro-profile-sheet h2` (ProCollectionSheets ×4, ProSeasonSection:26) | sheet title | 19/700/lh1.25, margin 6 0 14 | section-title vars, margin 5 0 14 |
| pro-profile.css (new) `.pro-profile-sheet .pro-collection-kicker` | sheet eyebrow | 10/700/.14em | section-eyebrow vars (colour unchanged). The amateur-ranking `.amr-sheet` override in ranking-tab.css is out of scope and still wins there (10/.14em) — reported, not changed |
| pro-profile.css:180 `.pro-ask-sheet h2` (ProAskSheets ×5) | sheet title | 19/700 | section-title vars |
| pro-profile.css:181 ask-sheet kicker gap | gap | 6 | 5 |
| coach.css:12 `.coach-sheet h2` (CoachSheets ×4) | sheet title | 19/700/lh1.3 | section-title vars |
| inviteConnected.css:3 `.if1-title` | sheet title | 22/700/−.02em/1.2 | section-title vars |
| pro-verification.css:10 `.pds-kicker` | sheet eyebrow | 10/700/.16em | section-eyebrow vars |
| pro-verification.css:11 `.pds-head h2` | sheet title | 22/700/1.2, mt 4 | section-title vars, mt 5 |
| pro-status-controls.css:14 `.pro-status-kicker` | sheet eyebrow | 10/700/.16em | section-eyebrow vars |
| pro-status-controls.css:15 `.pro-status-heading` | sheet title | 22/700, mt 4 | section-title vars, mt 5 |
| CoursePickerModal.tsx:167 | sheet title | TITLE 17/−.032/1.2 | SECTION_TITLE |
| SortViewModal.tsx:61 | sheet title | TITLE | SECTION_TITLE |
| ImageCropperModal.tsx:186 | sheet title | TITLE | SECTION_TITLE |
| GenderPromptSheet.tsx kicker / h2 | sheet eyebrow / title | 13/700/.14em amber; TITLE, mt 8 | SECTION_EYEBROW amber; SECTION_TITLE, mt 5 |
| TopTenShareSheet.tsx:167 | sheet title | 22/700/−.03em | SECTION_TITLE |
| YourCourseAnalyticsSheet.tsx:643 | sheet title | 22/700/−.02em | SECTION_TITLE |
| DeleteAllDataConfirmSheet.tsx:47/48 | sheet eyebrow / title | KICKER 9/.19em, mb 8; TITLE lh1.14 | SECTION_EYEBROW (BAD red kept), mb 5; SECTION_TITLE |
| DisconnectConfirmSheet.tsx:46/48 | sheet eyebrow gap / title | mb 6; TITLE lh1.2 | mb 5; SECTION_TITLE (eyebrow already SectionHeader) |
| StreaksSheet.tsx:375/377 | sheet eyebrow / title | 11/.16em no lh; TITLE, mt 6 | SECTION_EYEBROW (amber kept); SECTION_TITLE, mt 5 |
| SentInvitesSheet.tsx:193/194 | sheet eyebrow / title | 9/.19em; 17/−.02em, mt 6 | SECTION_EYEBROW (REC.DIM kept); SECTION_TITLE, mt 5 |
| InviteFriendsSheet.tsx:120/121 | sheet eyebrow / title | KICKER 9→local; TITLE, mt 4 | SECTION_EYEBROW / SECTION_TITLE (A.INK kept), mt 5. Local LABEL/KICKER/TITLE constants untouched for other uses |
| HomeClubPickerSheet.tsx:69, :106 | sheet title | TITLE | SECTION_TITLE |
| LikesSheet.tsx:208 | sheet title | 19/700/−0.4px | SECTION_TITLE |
| ProfileAchievementsRail.tsx:161 | section title | 17/700 | SECTION_TITLE |
| AgeingOutSection.tsx:59 eyebrow/title | section eyebrow / title | 11/.16em; 19/−.02em, mt 6 | SECTION_EYEBROW (own amber kept); SECTION_TITLE, mt 5 |
| NotConnectedSection.tsx:31 | section title | 16/700 | SECTION_TITLE |
| welcome.css:7 `.welcome-body h1` | celebration | 28/−.025em/1.12 | 28/−.035em/1.05 |
| auth-hero.css:40 `.auth-hero-panel h2` | celebration/hero | 24/−.025em/normal | 24/−.035em/1.05 (short-viewport 21px rule unchanged); `.auth-hero-brand` untouched |
| LevelUpSheet.tsx:78 eyebrow / :90 label | celebration | 12/.16em; 26/−.01em/1.1 gold | SECTION_EYEBROW (colour kept); 26/−.035em/1.05, gold kept |
| LaunchSheet.tsx:61 | celebration | 28/−.01em/1.15 | 28/−.035em/1.05 |
| SeasonWrapModal.tsx:56 (30) / :72 (24) | celebration | Tailwind default tracking/leading | −0.035em / 1.05 inline, sizes kept |
| SeasonRecapModal.tsx:75 (24) | celebration | default | −0.035em / 1.05 |
| post-flow.css:61 `.pf-kicker` / :64 `.pf-headline` (PostSuccessV2) | celebration | 11/.16em no lh; 30/1.1 | section-eyebrow vars; 30/−0.035em/1.05 |

Carry-over: `tournament.fieldSheetTitle` added to de/es (`_one`/`_other`) and ja/ko (`_other`, their existing practice).

## Left unchanged (listed)
- **Nav-bar:** `.ep-title` (EditProfile:135); ManagePageShell → FixedPageHeader on Blocked, Contact, Email, HandicapManage, Help, Legal, MyRequests, Notifications, SupportThread, DeleteAccount, LegalDocument; messaging thread identity bar (ThreadV2Page:429).
- **Page identity titles (>20px, not section headings):** InboxV2Page:187 MT.TITLE 22; FindPeoplePage:172 PageTitle 30; SocialListPage:157 identity 21/1.15; AuthCallback:144 status 28.
- **Tile/card:** LearningCollectionCard:43; CuratedInsightCard:87; BusinessCoachCards:18 (card title + 10.5 kicker); SettingsHandicapCard `.st2-name`; phase6 GolfJourneyProgress:104 and MilestoneBadges:155 (white legacy cards); PostSuccessV2 `Label` (21px card label).
- **State headlines (do not head a section):** PrivateProfileGate:29; InboxEmptyState:153.
- **Legal:** LegalBodyRenderer:80/86; DeleteAccountPage:24.
- **Outside the listed scope paths:** src/pages/manage body titles ContactPage:98, MyRequestsPage:102, SupportThreadPage:79 — reported, not changed.

## New wraps and three-line cases (fixture text)
- Rounds section title, long fixture "Your rounds at Royal Lytham & St Annes Golf Club this season": 2 lines → **3 lines at 320** (2 at 390). Fixture string invented to stress the title; real Rounds titles ("12 rounds so far" style) stay on one line. Flagged for ruling.
- Welcome h1 fixture (long sentence) is 3 lines at both widths before and after (28px is retained by ruling).
- No other new wraps; no element or page overflow in any capture.

## Test updates
- Existing tests: **none changed.** `vitest related` across all changed files: 244 files / 3,335 tests passed with no edits. No existing expectation encoded the old values.
- Added `src/test/profileHeadingCanon.test.tsx` (5 cases): Rounds title, BizcSheet title, pro profile sheet title, messaging SheetHeader title (21/700/−.035em/1.05), welcome h1 (28/−.035em/1.05).

## Captures
`captures/{state}_{390|320}_{before|after}.png` — Chromium, a disposable page (removed) rendering the real `BizcSheet`, `DeleteAllDataConfirmSheet`, `DisconnectConfirmSheet`, `NotConnectedSection`, `roundsTokens` and the real stylesheets for pro profile / Ask a pro / coach / invite connected / pro details / pro status / welcome / post success; plus the live `/auth` route. Backend requests were blocked.
Not captured: authenticated Profile Rounds (own/visitor), profile sheet, Edit profile / Settings pages, social lists, find people, messaging inbox (need a signed-in session; the browser rules forbid minting one); the auth panel h2 (only the brand step renders without input); LevelUp (heading is a div; capture selector timed out); LaunchSheet / SeasonWrap / SeasonRecap. Their changes are covered by source review and tests only.

| State | 390 before → after | 320 before → after |
|---|---|---|
| rounds | 19/−0.38px/28.5 → 21/−0.735px/22.05 | long 2 → 3 lines |
| bizc / yourdata | 20/30 → 21/22.05 | same lines |
| delete / disconnect | 17 → 21 | 1 line |
| pro / ask / coach | 19 → 21 | ask, coach 2 lines both |
| invite | 22 → 21 | 2 lines both |
| pds / prostatus | 22 → 21 | prostatus 2 → 1 line |
| welcome | 28/−0.7px/31.36 → 28/−0.98px/29.4 | 3 lines both |
| postsuccess | 30/normal → 30/−1.05px/31.5 | 1 line |
| notconnected | 16 → 21 | 1 line |

## Shards
Each shard ran as its own `./node_modules/.bin/vitest run --shard=N/4` invocation, one after another; raw logs kept locally only.

| Shard | Files | Tests | Result |
|---|---|---|---|
| 1/4 | 222 | 2,454 | pass |
| 2/4 | 222 | 2,482 | pass |
| 3/4 | 222 | 2,493 | pass |
| 4/4 | 220 | 2,735 | pass |
| **Total** | **886** | **10,164** | **10,164/10,164** |

Before 10,159 / 885 → after 10,164 / 886. Delta +5 tests / +1 file = the five cases in `src/test/profileHeadingCanon.test.tsx`. pf3aVideoComposerMounted did not time out; no reruns.
