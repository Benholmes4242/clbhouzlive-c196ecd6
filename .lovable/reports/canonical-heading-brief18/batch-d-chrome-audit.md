--- message 1 of 2 ---

## Batch D supplement — completed source-traced closure

Read-only audit complete for the requested **global chrome, account/profile glance, search and nested results, share/report/block confirmations, and global compose entry**. Navigation to a separate, unnamed route is a scope exit.

Baseline: `.lovable/reports/canonical-heading-brief18/report.md`, accepted A–C classifications. **No files changed; no SQL, migrations, tests or browser captures run.**

### Corrections to the earlier supplement

- `/round/:whsScoreId` has island chrome **but `hideHcp: true`**. Its account/search controls are reachable; `IndexGlance` and `ConnectGlance` are not reachable through that route’s header.
- Registry `tone: 'light'` literals do **not** establish a live light branch. `withResolvedTone()` coerces every island to dark (`registry.ts:410–416`).
- `AppHeader` contains shared-component calls, but **has no currently reachable rendering consumer**; details below.
- The compose separator resolves to literal **OR**. It is selected, **K3**, and unchanged.
- There is no production `ProfileDrawer` owner. The actual account owner is `PostingAsMenu`, with mobile `AccountGlance` and desktop portal branches.

## Complete new selected-label table

Paths are relative to `src/`. Prior A–C rows are excluded from this table and referenced separately.

**Parent chains**

- **H** — named route → `GlobalHeader` → `ChromeIsland` → `HcpCell`.
- **I** — H → index button → `IndexGlance` → `GlanceShell`.
- **N** — H → Connect button → `ConnectGlance` → `GlanceShell`.
- **P** — named route → `GlobalHeader` → `ChromeIsland` → avatar → `PostingAsMenu` → **desktop portal** → scroll area.
- **F** — named route → global compose entry → `ComposerFlowSheet` → `.post-or-review`.

**Route sets**

- **H/I/N:** `/`, `/profile`, `/profile/:username`, `/notificationmessages`, subject to the explicit session/actor/handicap visibility conditions.
- **P:** those four routes **plus `/round/:whsScoreId`**.
- `/messages` and `/messages/:conversationId` resolve to `chrome: 'none'`; they do not acquire H/I/N/P merely because the global header remains mounted.
- F is the global compose entry, not navigation into the post studio or course-review route.

| # | File:line | Exact text/key | Route / parent chain | Role | Old → planned ink |
|---:|---|---|---|---|---|
| 1 | `features/chrome-v2/ChromeIsland.tsx:405` | HANDICAP | H → disconnected Connect control → caption | K4 | **keep** `rgba(248,250,252,0.42)`; `.12em` |
| 2 | `features/chrome-v2/ChromeIsland.tsx:415` | INDEX | H → linked, not connected → Manage control → caption | K2 | **keep** resolved-dark `rgba(248,250,252,0.42)`; `.12em` |
| 3 | `features/chrome-v2/ChromeIsland.tsx:470–479` | INDEX | H → connected index control → caption | K2 | **keep** resolved-dark `rgba(248,250,252,0.42)`; `.12em` |
| 4 | `features/chrome-v2/IndexGlance.tsx:125–136` | Your handicap index | I → top-level kicker above index/chart/stats | **E1** | local `DIM` → existing local `INK` (`#F8FAFC`); `.14em` uppercase unchanged |
| 5 | `features/chrome-v2/IndexGlance.tsx:110–113,167–178` | Low index | I → statistics → caption | K2 | **keep** local `DIM`; `.14em` uppercase |
| 6 | Same declaration | Last round | I → statistics → caption | K2 | **keep** local `DIM` |
| 7 | Same declaration | vs par | I → statistics → caption | K2 | **keep** local `DIM` |
| 8 | `components/handicap/IndexWindowChart.tsx:112–114`; `:54` | `common:handicap.chart.low` — `Low {value}` | I → shared chart → low reference label | K3 | **keep** `rgba(248,250,252,0.42)`; shared `MICRO`, `.16em` uppercase |
| 9 | `components/handicap/IndexWindowChart.tsx:116–117`; `:54` | `common:handicap.chart.ago` — `{window} ago` | I → shared chart → left axis label | K3 | **keep** `rgba(248,250,252,0.30)`; `.16em` uppercase |
| 10 | `components/handicap/IndexWindowChart.tsx:116,118`; `:54` | `common:handicap.chart.today` — Today | I → shared chart → right axis label | K3 | **keep** `rgba(248,250,252,0.30)`; `.16em` uppercase |
| 11 | `features/chrome-v2/ConnectGlance.tsx:40–42`; `index-glance.css:20` | Low index | N → example statistics → first caption | K2 | **keep** `--glance-dim` (`rgba(248,250,252,0.42)`); `.14em` uppercase |
| 12 | Same declaration | Last round | N → example statistics → second caption | K2 | **keep** `--glance-dim` |
| 13 | Same declaration | vs par | N → example statistics → third caption | K2 | **keep** `--glance-dim` |
| 14 | `components/header/PostingAsMenu.tsx:343–349` | `postingAsCopy.dropdown.sectionTitle` — Switch profile | P → switch-profile section → heading | **E2** | live dark `text-white/45` → **`text-foreground`**; retain `.tracking-wider` and uppercase |
| 15 | `components/header/PostingAsMenu.tsx:441–443` | `postingAsCopy.sectionLabels.businesses` — Business Profiles | P → switch-profile section → business-actor group heading | **E2** | inherited live dark `text-white/40` → **`text-foreground`**; retain `.tracking-wider` and uppercase |
| 16 | `features/composer-flow/ComposerFlowSheet.tsx:90`; `post-or-review.css:27` | `composerFlow:or` — **OR** | F → separator between Post and Review choices | K3 | **keep** `--post-review-dim` (`rgba(248,250,252,0.42)`); `.16em` |

### Selected counts

| E1 | E2 | K1 | K2 | K3 | K4 | K5 | K6 | D | ? | Total |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 2 | 0 | 8 | 4 | 1 | 0 | 0 | 0 | 0 | **16** |

These counts cover **new selected labels in this supplement**, not earlier A–C rows or unrelated Batch D page/tab work.

**Unresolved-role list: none.** No “?” crop is required: the consumers establish the roles.

## Exact proposed replacements — not applied

Only three declaration sites qualify for an ink change.

| Site | Exact replacement |
|---|---|
| `IndexGlance.tsx:132`, within the **Your handicap index** kicker only | `color: DIM,` → `color: INK,` |
| `PostingAsMenu.tsx:346`, within the **Switch profile** heading’s `cn()` | `useLightTheme ? "text-muted-foreground/60" : "text-white/45"` → `"text-foreground"` |
| `PostingAsMenu.tsx:441`, business-group heading wrapper’s `cn()` | `useLightTheme ? "text-muted-foreground" : "text-white/40"` → `"text-foreground"` |

**Why `text-foreground`, not hardcoded white:** this portal already uses the semantic foreground class for its primary identity text. The global dark palette owns `--foreground` (`index.css:3283`); the legacy `.light` scope also resolves foreground to the dark-app ink (`:3438–3450`). Removing only the two heading-color conditionals makes both source branches use their actual theme foreground without introducing another palette.

Do **not** repoint `DIM`, `--glance-dim`, analytical `KICKER`, or shared label metrics.

## Completed sheet and nested-result closure

| Surface / source proof | Selection outcome |
|---|---|
| **Mobile account:** `PostingAsMenu.tsx:253–286` → `AccountGlance`; desktop portal renders `menuContent` at `:621` | Mobile and desktop are distinct live viewport branches. The two new E2 rows belong to desktop; they are not dead remnants. Mobile ADMIN/SIGN OUT retain Batch C roles. |
| **Profile actions:** `AccountGlance` navigation callbacks and `PostingAsMenu.tsx:225–245` | View profile/messages/activity remain within named-route scope where applicable. Edit/settings/business-management/admin navigation exits scope. “Your courses” opens the actual analytics sheet; Invite retains A–C ownership. |
| **ProfileSheetV2 / ProfileDrawer** | No live `ProfileDrawer` declaration/caller. `ProfileSheetV2` occurrences are historical comments/state-module documentation, not an additional rendered owner. No invented drawer rows. |
| **Analytics:** `YourCourseAnalyticsSheet.tsx:707–710,728–738` | The two summary-tile captions retain Batch C K2. Local `LABEL` at `:46` retains Batch C D. |
| **Opened analytics course:** `YourCourseOpenContent.tsx:35,42,47`; `index.css:5744–5747` | Average/chart captions and distribution legend do not have qualifying uppercase tracking. `EARLY_TAG` has `.06em` (`YourCourseAnalyticsSheet.tsx:134–139`), below threshold. |
| **Search headings:** `SearchSectionHeader.tsx:14,36`; `SearchEmptyState.tsx:262`; analytical `tokens.tsx:274–280` | Already **INK**. Excluded, not new E rows. Includes dynamic player rail, Your courses, People to follow and Highest rated on clbhouz. |
| **Search actions:** `SearchSectionHeader.tsx:53–54`; `RecentsList` uses `ACTION` | See all/Clear use ink, not selected grey. |
| **Search course marker:** `CourseRow.tsx:46–49` | “Your rounds” and count default to ink; not selected. |
| **Search scopes:** `ScopeChips.tsx` → shared `PillFilterRow` | No qualifying grey uppercase ≥.08em label introduced by the scope consumer. |
| **All search result types:** `SearchOverlayV2.tsx:313–417`; `lib/searchNavigation.ts` | Person → named profile route. Course → `/courses/:id`; club → `/business/:id`; player → `/tourhub/player/:id`; video/post → `/post/:id`: those are navigation exits, not nested previews to traverse. Result-row captions, timestamps, regions, names and duration labels do not add selected grey uppercase tracked labels. |
| **Search “Previews”:** `SearchOverlayV2.tsx:637–645` | Retain Batch C **D**. Only commit mode renders it; production mounts use default mode. No new live E2 row. |
| **Request course:** search CTA → `RequestCourseSheetHost` → `RequestCourseSheet.tsx:109–218` | Form, submitting and success states inspected. Labels use `labelCls` at `:99`, with no uppercase tracking. Nested `DiscardDraftDialog` likewise has no qualifying labels. |
| **Uploads:** desktop menu → `UploadCenterPanel` | Title, jobs, progress, failure/retry and empty states have no qualifying uppercase tracking. |
| **Profile share:** `ProfilePageV2.tsx:1031` | Native `navigator.share`, clipboard fallback/toast; no in-app share sheet to audit. |
| **Feed/profile-post share:** `Clubhouse.tsx:491`, `PostsTabContent.tsx:214` → `useClubhouseShare.ts` | Native share or clipboard/toast. Feed report callback submits and toasts; it does not mount a hidden report-confirmation sheet. |
| **Round share:** `RoundPage.tsx:14–16` and actual host | No separate built share action/sheet. RoundPage hosts canonical RoundDetailSheet; retain A–C scorecard ownership. |
| **Top-ten share:** `ProfileTopTenRail.tsx:388–405` → `TopTenShareSheet` → preview/export `TopTenShareCard` | Owner-only, at least three courses. Done, Story/Post segments, toggles, Save image and Share lack qualifying uppercase tracking. Preview title/No. labels use `ON_PHOTO_KICKER = #F8FAFC`; rating tiers use ink. Grey place lines and footer stat line lack qualifying tracking. **Zero new selected rows**, including panel-photo fallback and both story/post formats. |
| **Messaging share:** `Composer.tsx` → `ShareActionSheet`, `ShareRoundSheet`, `ShareCourseSheet` in `ShareSheets.tsx` | Action rows, round/course pickers, date/to-par metadata, search/loading/empty/load-more inspected. No qualifying grey uppercase tracked label. `BizcSheet` title is canonical sentence-case title styling (`business-create.css:113`); action sheet hides its header. |
| **Canonical reports:** `ReportSheet.tsx:99–145`; `reportSheet.css` | Profile and message report form, selected reasons, details and disabled/submitting send states: no qualifying tracked uppercase label. SheetHeader title is ink and does not add a grey eyebrow. |
| **Comment report:** `ReportCommentSheetV2.tsx:119–133` | Disabled Next retains Batch C K4. REPORT COMMENT is amber; other caps commands are ink/semantic command states, not new grey headings. |
| **Profile block:** `ProfilePageV2.tsx:1522–1547` → shared AlertDialog | Title/body/Cancel/Block do not have qualifying uppercase tracking. No selected row. |
| **Conversation block/leave/delete:** `ThreadV2Page.tsx:643` → `ConversationSettingsSheet.tsx:783–838` | Inline second-tap confirmation, not an extra untraced sheet. “Tap again to confirm” and action rows do not have qualifying uppercase tracking (`:930`). Nested AddPeople and discard guard add no selected labels for these actions. |
| **Global compose:** `ComposerFlowSheet.tsx:35,90` | `useTranslation('composerFlow')`; **OR** is literal uppercase in every present locale: `en`, `en-XA`, `de`, `es`, `ja`, `ko`, each `composerFlow.json:12`. Thus row 16 is selected K3, not uncertain. Review search retains A–C ownership; post/review handoff navigation exits scope. |

Photo/gate/celebration tokens are not converted into ordinary grey-heading candidates. The top-ten preview’s photo-token labels remain excluded even when a photo falls back to its panel.

## Batch D — new shared reach

### Actual production caller graph

| Changed shared candidate | Direct callers and rendering proof |
|---|---|
| `IndexGlance` E1 | `ChromeIsland.tsx:483` inside **HcpCell**. HcpCell hosts: `ChromeIsland.tsx:893`, `NewsChromeBridge.tsx:88`, and syntactically `AppHeader.tsx:220`. |
| `PostingAsMenu` desktop E2 ×2 | `ChromeIsland.tsx:910`; `NewsChromeBridge.tsx:94`; syntactically `AppHeader.tsx:265`. |

**AppHeader has zero current live route consumers:**

- `DiscoverHeader.tsx:20` calls it; `ExploreTabContent.tsx:164` renders DiscoverHeader only when `!embedded`.
- Its production `NewExploreTab` consumer passes **`embedded`**. No reachable nonembedded mount was found.
- `TourPageShell.tsx:130` renders AppHeader only when `!headerB`.
- Both production shell consumers pass **`headerB`**: `TournamentPage.tsx:289–290` and `PlayerPage.tsx:52`.

Therefore AppHeader is recorded as a **dormant caller**, not falsely assigned live outside-D routes.

**NewsChromeBridge is live**, suppressing the global island itself (`NewsChromeBridge.tsx:56–57`). It provides both candidates on these exact outside-D routes:

- `/tour/news` — `WireNewsPage.tsx:13`
- `/tour/news/:slug` — `StoryPage.tsx:221`
- `/discover/news` — `AmateurNewsPage.tsx:26`
- `/discover/news/:slug` — `AmateurStoryPage.tsx:63`

### Exhaustive registry reach map

`registry.ts` is first-match-wins. The following lists its **exact paths and matcher domains**, including non-page backstops; it does not invent mounted pages for wildcard domains.

All resulting islands resolve **dark**, regardless of historical light literals.

| Registry matcher(s) | PostingAsMenu | IndexGlance via HcpCell |
|---|---|---|
| `/`, `/clubhouse` | Yes | Yes |
| `/profile`, `/profile/quest` | Yes | Yes |
| `/find-people`, `/rounds` | Yes | Yes |
| `/watch/courses`, `/watch/top100`, prefix `/watch/region/` | Yes | Yes |
| `/notificationmessages` | Yes | Yes |
| `/profile/:username/followers`, `/profile/:username/following` regex | Yes | Yes |
| `/profile/:username` regex; remaining prefix `/profile/` | Yes | Yes |
| `/business/:idOrSlug`, excluding reserved `create`, `success`, `intro`, `invite`; business followers/following regex | Yes | Yes |
| `/courses/:id` three-segment predicate | Yes | Yes |
| `/tourhub/tournament/:id`, `/tourhub/player/:id` root regexes | Yes | Yes |
| `/tourhub`, `/tour/news`, `/tour/news/:slug…` regex | Yes | Yes; news pages use their bridge instead of the suppressed global instance |
| Remaining prefix `/tourhub/`, remaining prefix `/tour/` | Yes | Yes |
| `/amateur`, `/courses`, `/friends-activity` | Yes | Yes |
| `/discover/news`, `/discover/news/:slug…` regex | Yes | Yes; supplied by bridge on actual news pages |
| Prefix `/discover/explore/theme/` | Yes | Yes |
| `/discover…` with `main=videos` and nonempty `section` | Yes | Yes |
| Remaining prefix `/discover` | Yes | Yes |
| `/handicap`; rivalry regexes `/handicap/rivalry/:id`, `/handicap/:id/rivalry/:id`; remaining prefix `/handicap/` | Yes | **No — hideHcp** |
| Prefix `/round/` | Yes | **No — hideHcp** |
| Unmatched paths — `DEFAULT_SPEC` | Yes | Yes, unless runtime suppression applies |

**Registry “none” domains — neither candidate through ChromeIsland:**

- Exact `/auth`, `/welcome`, `/auth/callback`, `/signup`, `/onboarding`, `/create-moment`, `/business/intro`, `/messages`, `/achievements`, `/golferstofollow`, `/edit-profile`, `/followers`, `/following`, `/join`, `/business/create`, `/explore`.
- Prefix `/messages/`, `/admin`, `/hub`, `/discover/explore/region/`, `/achievements/`, `/manage/`, `/support/`, `/legal`, `/terms`, `/businesses/manage`, `/business/invite/accept`, `/admin-invite/accept`, `/i/`, `/rate-course-v2/`.
- Managed-business regex `/business/:id/(verification|edit|insights|team|activity|course|reviews)(/…)?`.
- Deeper `/courses/…` after the detail predicate.
- Deeper `/tourhub/tournament/…` and `/tourhub/player/…` after their root regexes.

**Outside-D mounted pages affected by the new defaults** therefore include `/find-people`, the three Watch route families, `/amateur`, `/courses`, `/courses/:courseId`, business profiles/social lists, `/tourhub`, tournament/player roots, and the four news routes above. Registry redirect-only entries—such as `/clubhouse`, `/rounds`, `/friends-activity`, profile quest and handicap aliases—are not separate destination screens; their source matcher reach is recorded above.

The default matcher also covers otherwise unmatched routes. This is intentionally an exhaustive **complement rule**, not an incorrect assertion that only the explicitly named island routes can reach the candidates.

## Prior A–C reference list — not duplicated or recounted

Retain the roles already recorded in `report.md`:

- `AccountGlance` ADMIN — **K3**; SIGN OUT — **K4**.
- `YourCourseAnalyticsSheet` Where you score best / Where it bites — **K2**; unused local LABEL — **D**.
- Search commit-mode Previews — **D**.
- Disabled comment-report Next — **K4**.
- Connected Invite statistics, group headings and trailing counts — their distinct accepted roles.
- Scorecard, RoundResults, Likes, video About, Played-with, Invite, shot tagger, review search, Tour and Courses shared pieces — **see batch A/B/C**.

**Final result:** **16 new selected labels; three ink-change sites; zero unresolved roles.** Fonts, copy, size, weight, tracking, spacing, semantic colors and all retained K-label inks remain frozen.

--- message 2 of 2 ---

Confirmed—you’re correct. I incorrectly admitted those two labels without resolving `tracking-wider`.

### Source/config verification

- Installed Tailwind defines **`tracking-wider = 0.05em`**: `node_modules/tailwindcss/stubs/config.full.js:602`.
- `tailwind.config.ts` has **no `letterSpacing` override**.
- No `.tracking-wider` override was found in project CSS.
- Both spans declare the utility directly; inherited letter-spacing does not raise it above `.05em`.

### Corrected exclusions

| Source | Text/key | Actual tracking | Disposition |
|---|---|---:|---|
| `src/components/header/PostingAsMenu.tsx:345–349` | `postingAsCopy.dropdown.sectionTitle` — Switch profile | **.05em** | **Exclude: below .08em** |
| `src/components/header/PostingAsMenu.tsx:441–443` | `postingAsCopy.sectionLabels.businesses` — Business Profiles | **.05em** | **Exclude: below .08em** |

**Withdraw both E2 classifications and both proposed foreground replacements.** They are not selected Batch D candidates. No light/dark default probe or new shared-change reach is required for `PostingAsMenu`.

### Corrected selected counts

Prior A–C references remain excluded from these counts.

| E1 | E2 | K1 | K2 | K3 | K4 | K5 | K6 | D | ? | Total |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **1** | **0** | 0 | 8 | 4 | 1 | 0 | 0 | 0 | 0 | **14** |

### Sole remaining proposed ink-change site

`src/features/chrome-v2/IndexGlance.tsx:125–136` — **Your handicap index**

- Explicit `letterSpacing: '0.14em'`
- Explicit uppercase transform
- Current `color: DIM` at **line 132**
- **E1: `color: DIM` → `color: INK`**, using the existing local surface ink.

All other retained selected rows have explicit `.12em`, `.14em`, or `.16em` declarations—not an inference from uppercase. The compose **OR** remains K3 at `.16em`.

**Corrected outcome: 14 new selected labels, one proposed ink-change site, zero E2 candidates. No changes applied.**

