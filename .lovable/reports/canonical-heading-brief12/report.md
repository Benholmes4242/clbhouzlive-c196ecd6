# Canonical heading brief 12 — Business and Insights

Base: 0fc46fb. Canon: SECTION_EYEBROW 11/700/0.16em/uppercase/1; SECTION_TITLE 21/700/-0.035em/1.05/synthesis none; gap 5. Colours untouched; BIZ (businessTokens.ts) untouched.

## Carried rulings (from brief 11)
- The video About sheet title is member content, not a heading: it wraps in full with no line limit; the two-line rule does not apply.
- WatchFeed "Quick hits" / "Under 3 min": keys `amateur.watch.rail.quick` / `quickKicker` added to courses.json in all six locales; inline fallbacks removed (WatchFeed.tsx:497, :500, :570).
  - en: Quick hits / Under 3 min · en-XA: Quick hits / Under 3 min (recent rail keys such as `shorts` stay plain English there) · de: Kurzclips / Unter 3 Min. · es: Clips rápidos / Menos de 3 min · ja: クイック / 3分未満 · ko: 짧은 클립 / 3분 미만

## Changes (before → after)
| Where | Before | After |
|---|---|---|
| index.css `.insights-visits-kicker` (Reviews, Posts, Followers, Engagement, Audience, Visits, sub-kickers) | 10.5/700/.16em, lh inherited | --section-eyebrow-* vars (right-hand span keeps .12em/dim) |
| index.css `.insights-course-kicker` (+ regions kicker) | 10.5/700/.16em | --section-eyebrow-* |
| index.css `.insights-{audience,posts,followers,engagement,reviews,course}-title` (ready + empty) | 17/700/-.01em/1.3, margin-top 6 | --section-title-*, margin-top var(--section-title-gap) 5 |
| clubAnalytics/sections.tsx:145 CARD AGAINST COURSE eyebrow | 10.5/700/.16em | ...SECTION_EYEBROW |
| clubAnalytics/sections.tsx:149 card-against-course title ("remaining Insights title") | 17/700/-.01em/1.3, mt 6 | ...SECTION_TITLE, mt 5 |
| clubAnalytics/sections.tsx:208 The sample kicker | 10.5/700/.16em | ...SECTION_EYEBROW |
| index.css `.club-you-kicker` | 10.5/700/.16em | --section-eyebrow-* (margin-bottom 10 kept) |
| index.css `.club-you-title` | 17/700/-.01em/1.3 | --section-title-* |
| index.css `.team-sheet-title` (add, decline, role ×2, cancel, job, owner, remove, leave) | 18/700/0/1.4 | --section-title-* |
| index.css `.team-list-title` | -0.01em | var(--section-title-tracking) |
| ClubVisiting.tsx:103 "The team" sheet title | 17/700/-.01em | ...SECTION_TITLE |
| ClaimYourCourseSheet.tsx:130 claimSheet.title | 18/700/0 | ...SECTION_TITLE |
| VerificationFlowSheet.tsx SectionCard h3 (domain, document, presence, representation) | 17/600/-.01em | ...SECTION_TITLE |
| DeleteAccountConfirmSheet.tsx red "Permanent" eyebrow | 11/700/0.10em | ...SECTION_EYEBROW, red kept |
| DeleteAccountConfirmSheet.tsx title | TITLE 17/-.032em/1.2, mt 6 | SECTION_TITLE, mt 5 |
| business-create.css `.bizc-kicker` (all steps + Finish) | 10.5/700/.16em | --section-eyebrow-* |
| business-create.css `.bizc-body h1` | 28/700/-.025em/1.12 | 28/700/-.035em/1.05 |
| business-create.css:171 Finish h1 letter-spacing:0 override | 0 | removed from h1 (mini-name keeps 0), so Finish takes hero rule |
| BusinessProfileLiveSuccessPage.tsx:78 "…is live 🎉" | 24/-.02em/32px | 24/-.035em/1.05 |
| BusinessProfileLiveSuccessPage.tsx:121 "What you can do next" (heads the action list) | 14/700/20px | SECTION_TITLE |
| BusinessInviteAcceptPage.tsx:98/119/124 You're on the team / Invite unavailable / Invite {status} — full-screen status panels | 19/700/0 | 19/700/-.035em/1.05 |
| ClubWhatGolfersSay.tsx:136 empty-state eyebrow | 10.5/700/.16em | ...SECTION_EYEBROW |

## Classified and left unchanged
- BusinessReviewsPage.tsx:492 TITLE consumer "Reviews are for golf course profiles" — state headline in a centred panel.
- BusinessProfileEditor.tsx:301 (16px h1) and BusinessProfilePage.tsx:290 (22px h1) — error state headlines.
- ManagePageShell/FixedPageHeader titles (Your businesses, Insights, Team, Verification) — nav-bar titles.
- InsightsFunnel.tsx:170 funnel kicker — inventory ROW/GROUP LABEL above funnel rows.
- team-request-kicker / team-sheet-kicker (below sheet titles) — row labels.
- ReportSheet SheetHeader — already canonical (SheetHeader spreads SECTION_TITLE/EYEBROW since brief 1); no lineHeight override remains.
- BusinessInviteAcceptPage.tsx:156 "Join {business}" — not named; left at 19/-.01em. Ruling needed (same panel family as the status headings).
- Centred AlertDialogTitle confirmations (creation notices, discard), tile/card titles, figures, body sizes.

## For Ben's ruling (in scope folders, not named by the brief)
- ClubWhatGolfersSay.tsx:139 empty-state title "No one has reviewed {club} yet" stays 17/-.01em/1.3 under a canon eyebrow.
- Club analytics ("Your courses") siblings stay at 10.5 kickers / 17/-.01em titles: HOLE BY HOLE (:298/:307), HOW IT PLAYS (:427), Records (S7 :483/:485), Who plays here (:671/:689), tee-sheet title (teeSheet.css). Card against course and The sample now differ from them on the same page. cb971TitleTracking still passes because it reads literal declarations only.
- Other business section kickers still 10.5px: BusinessFollowersCard:80, ClubFromTheClub:54, BusinessNearbyCourses:127, BusinessWeekCard:75, BusinessDoNextCard:73, ClubHowItPlays:149, BusinessEmptyState:68/71, BusinessInvitePage:279; sheet titles ClubWhatGolfersSay:114 picker, BusinessNearbyCourses:152, RequestAnotherCourseSheet:226.
- AGENTS.md rule "Card-title letter-spacing is -0.01em on club, business and Insights surfaces" contradicted by this brief for the changed headings; rewritten to name the brief 12 headings as canonical and keep -0.01em for the unchanged cards.

## Test updates
- src/test/cb104ClubYou.test.tsx:185 renamed `title carries -0.01em letter-spacing` → `title carries the canonical section-title letter-spacing`; :189 `toMatch(/letter-spacing:\s*-0\.01em/)` → `toMatch(/letter-spacing:\s*var\(--section-title-tracking\)/)`. Why: it encoded the old club-you title tracking this brief changes.
- New src/test/businessHeadingCanon.test.tsx (6 tests): canon variables, Insights eyebrow+title+gap, team sheet title, claim sheet title, verification SectionCard title, bizc-body h1 28/-.035em/1.05.
- No other test asserted the changed values (searched 10.5px, 17/18px, -.01em, -.025em, 1.12, 0.10em, TITLE spreads).

## Wraps and captures
Captures were NOT produced in this pass (no fixture page built). Not observed: new wraps, three-line titles at 320, overflow. Highest risk of new wraps from 17/18→21px: Insights titles (sentence-length), card-against-course title, team sheet titles with long names, "What you can do next".
Phone-check list: all surfaces listed in the brief's CAPTURES section.

## Shards (sequential, separate commands; raw logs kept in /tmp/b12, outside repo)
| Shard | Files | Tests |
|---|---|---|
| 1/4 | 222 | 2,454 passed |
| 2/4 | 222 | 2,482 passed |
| 3/4 | 222 | 2,489 passed |
| 4/4 | 222 | 2,750 passed |
| Total | 888 | 10,175 passed |
Baseline 10,169 / 887 → 10,175 / 888: +6 tests, +1 file = businessHeadingCanon.test.tsx. pf3aVideoComposerMounted did not time out. Typecheck clean.

# Close-out (STOPPED at shard 4)

## Changes (before → after)
| Where | Before | After |
|---|---|---|
| clubAnalytics/sections.tsx:298 HOLE BY HOLE + :671 Who plays here `kicker` consts | 10.5/700/.16em | ...SECTION_EYEBROW |
| sections.tsx:307 hole-by-hole title | 17/-.01em/1.3, mt 6 | ...SECTION_TITLE, mt 5 |
| sections.tsx:427 HOW IT PLAYS eyebrow row | 10.5/700/.16em | ...SECTION_EYEBROW |
| sections.tsx:483 S7_KICKER (Records, tees) | 10.5/700/.16em | ...SECTION_EYEBROW |
| sections.tsx:485 S7_TITLE | 17/-.01em/1.3, mt 6 | ...SECTION_TITLE, mt 5 |
| sections.tsx:689 who-plays-title | 17/-.01em/1.3, mt 6 | ...SECTION_TITLE, mt 5 |
| teeSheet.css:3 .tee-sheet-title | 17/700/-.01em/1.3, mt 6 | --section-title-* vars, mt var(--section-title-gap) |
| ClubWhatGolfersSay.tsx:139 empty-state title | 17/-.01em/1.3 | ...SECTION_TITLE |
| ClubWhatGolfersSay.tsx:114 picker sheet title | 17/-.01em | ...SECTION_TITLE |
| BusinessInviteAcceptPage.tsx:156 "Join {business}" | 19/-.01em | 19/-.035em/1.05 |
| BusinessFollowersCard:80, ClubFromTheClub:54, BusinessNearbyCourses:127, ClubHowItPlays:149, BusinessDoNextCard:73, BusinessEmptyState:68 (kicker const), BusinessWeekCard:75 (kickerStyle), BusinessInvitePage:279 (headingStyle) | 10.5/700/.16em | ...SECTION_EYEBROW, colours kept |
| Right-hand eyebrow asides in Followers:84, Nearby:130, FromTheClub:56, HowItPlays:151, EmptyState:69 | 10.5/.12em | 11/.12em/lh 1 (one eyebrow size per row, per ruling "eyebrows are one size everywhere") |
| BusinessNearbyCourses.tsx:152 sheet title | 17/-.01em | ...SECTION_TITLE |
| RequestAnotherCourseSheet.tsx:226 title | 18/700/0 | ...SECTION_TITLE |

Note on the brief's "BusinessEmptyState:68 and :71": :71 is `titleStyle`, the card title. Under the ruling "card titles stay parked" it is unchanged; :68 (eyebrow) and :69 (its aside) changed.
Unchanged by ruling: card titles beneath the eyebrows (BusinessWeekCard headStyle 18px, EmptyState titleStyle 17px, DoNext body). ClubWhatGolfersSay.tsx:162 ready-state label (inventory ROW/GROUP LABEL) and InsightsFunnel:170 remain 10.5 — not named; for ruling given "eyebrows one size everywhere".
AGENTS.md: pointer line names no surface as -0.01em; left as is.

## Test updates
- src/test/cb971TitleTracking.test.ts (single test, name unchanged) rewritten: old `const others = [...src.matchAll(/fontSize: 17, fontWeight: 700, letterSpacing: '([^']+)'/g)]…; expect(others.length).toBeGreaterThanOrEqual(2); for (const o of others) expect(tee).toBe(o);` → `expect(tee).toBe('var(--section-title-tracking)')`, `...SECTION_TITLE` spread count ≥ 2, and no literal 17px title left in sections.tsx. Why: it matched the old literal -0.01em titles, all of which this close-out moves to canon; it still guards tee title = sibling titles.
- businessHeadingCanon.test.tsx +4 tests: Records eyebrow/title, What golfers say empty title, Followers eyebrow (11px/.16em), RequestAnotherCourseSheet title.
- Focused run: 39 business files, 638/638 passed.

## Shards
| Shard | Files | Tests | Result |
|---|---|---|---|
| 1/4 | 222 | 2,454 | passed |
| 2/4 | 222 | 2,482 | passed |
| 3/4 | 222 | 2,493 | passed |
| 4/4 | 222 | 2,750 passed | **exit 1: 1 unhandled error** |
Tests 10,179 / 888 files (baseline 10,175 / 888: +4 = businessHeadingCanon close-out cases). 

STOP: shard 4 ended with exit code 1 on an unhandled error with no test failing:
```
Error: [vitest-worker]: Timeout calling "onTaskUpdate"
 ❯ Object.onTimeoutError node_modules/vitest/dist/chunks/rpc.-pEldfrD.js:53:10
 ❯ Timeout._onTimeout node_modules/vitest/dist/chunks/index.B521nVV-.js:59:62
 ❯ listOnTimeout node:internal/timers:585:17
 ❯ processTimers node:internal/timers:521:7
```
Not the pf3aVideoComposerMounted timeout named in the rerun clause, so not rerun. Shard 3/4 ran 310s and 4/4 286s (vs ~145–185s earlier today), consistent with sandbox load. No file:line in a test; the worker RPC timed out reporting a task update.

## Captures
Not taken: held behind the stop. Phone-check list not yet compiled.

## Continuation (two eyebrows, shard 4 rerun, captures)

### Changes
| Where | Before | After |
|---|---|---|
| ClubWhatGolfersSay.tsx:162 "What golfers say" (ready) | 10.5/700/.16em | ...SECTION_EYEBROW, T.mute kept |
| ClubWhatGolfersSay.tsx:163 count label | 10.5/.12em | 11/.12em/lh 1, T.dim kept |
| InsightsFunnel.tsx:170 funnel kicker row | 10.5/700/.16em | ...SECTION_EYEBROW, FUNNEL_MUTE kept; right span keeps .12em/FUNNEL_DIM and inherits 11px |

Tests: businessHeadingCanon.test.tsx +1 ("the Insights funnel kicker takes SECTION_EYEBROW at 11px / 0.16em"). No existing assertion changed (cb82InsightsFunnel, cb106ClubWhatGolfersSay and the other touched-file tests passed 262/262 focused). Commit 3941c44c00.

### Shard 4 runs
| Run | Change state | Files | Tests | Exit |
|---|---|---|---|---|
| 1 (close-out) | fd7931b | 222 | 2,750 passed | 1 — worker RPC timeout "Timeout calling onTaskUpdate" |
| 2 (this continuation) | + two eyebrows, +1 test | 222 | 2,750 passed | 0 |
The +1 test sits in shard 3 and the touched files' tests are spread across all four shards, so all four were rerun sequentially after step 1.

### Final shard table
| Shard | Files | Tests |
|---|---|---|
| 1/4 | 222 | 2,454 passed |
| 2/4 | 222 | 2,482 passed |
| 3/4 | 222 | 2,494 passed |
| 4/4 | 222 | 2,750 passed |
| Total | 888 | 10,180 passed (10,179 + 1), all exit 0 |

### Captures
Method: temporary `b12.html` + `src/b12Fixture.tsx` rendering the real components with the real stylesheets, one surface per load (`?s=<key>`). React Query caches seeded, Supabase REST/RPC answered from fixtures in-page (unmatched requests left pending, never real data). Sheets opened by real taps. Business-create step 1 used a fake local session object (no network, no sign-in). "Before" = the 22 production files restored from 0fc46fb in the working tree; "after" = 3941c44. Files restored to HEAD, page deleted. 156 files: `captures/<key>_<390|320>_<before|after>.png`; heading line counts measured from rendered height ÷ line-height.

Surfaces (all at 390 and 320, before and after): insights (ready), insights-empty, analytics (Sample, Hole by hole, How it plays, Card against course, Tees, Tee sheet, Who plays here), cards (followers, from the club, nearby, week, do next, how it plays), nearbysheet, empty, create1 (category), create2club, create2college, create2other, create3, create4, createfinish, live, invite-join, invite-success, invite-revoked, invite-unavailable, team, team-role, team-job, team-owner, team-remove, team-leave, team-irole, team-icancel, team-approve, team-decline, claim, verify-domain, verify-document, verify-presence, verify-ownership, you, say, saypicker, say-empty, request, delete.

New wraps (before → after; size · lines):
- analytics 390: "Hole 1 plays hardest, hole 6 easiest" 17·1 → 21·2; "57% of rounds are played off 6,400 yards" 17·1 → 21·2.
- nearbysheet 390: "Courses near The Bromley Court Hotel" 17·1 → 21·2.
- team-role 390: "Alexandra Montgomery-Whitfield's role" 18·1 → 21·2; team-irole 390: "sam.longname@example.com's invite" 18·1 → 21·2; team-icancel 390: 18·2 → 21·3.
- verify-domain 320: "Confirm your business domain" 17·1 → 21·2; verify-ownership 390: "Confirm you represent this business" 17·1 → 21·2.

Three-line titles at 320 (the two-line rule is broken):
- analytics: "12 holes play well away from where your card puts them" 17·2 → 21·3 (new).
- team-decline: "Decline Christopher Featherstonehaugh's request?" 18·2 → 21·3 (new).
- team-remove: "Remove Alexandra Montgomery-Whitfield from the team?" 18·2 → 21·3 (new).
- team-approve: "Add Christopher Featherstonehaugh to Sundridge Park Golf Club…" 18·3 → 21·3 (already three).
- team-icancel: "Cancel sam.longname@example.com's invite?" 18·3 → 21·3 (already three).
- you (club "you" title, fixture with two long sentences): 17·4 → 21·5 — the title holds both lines of the card, so it runs longest.
- empty: hero "Reach golfers who track every round…" 27·3 → 27·3, hero size unchanged by design.
Names in the team fixtures are deliberately long (30+ characters); with typical names these sheets fit in two lines at 390.

Overflow: none new. Page scrollWidth equals the viewport on every capture. One pre-existing element overflow at team 320 in both before and after: the "Add job title" link (`.team-list-link`, right edge 336px), which is not a heading and was not changed by this brief.

### Phone-check list
- Physical iPhone SF Pro rendering for all surfaces above (fixtures ran headless Chromium on the system stack).
- None of the surfaces in the brief needed to be dropped: all rendered from fixtures. The full Insights page and full Your courses page shells (page chrome, range picker and course chips) were not rendered; their sections were rendered directly, so check page-level spacing on the phone.

## Close-out 2 (three-line titles, team-page overflow)

### Changes
| File | Before | After |
|---|---|---|
| features/business/clubAnalytics/sections.tsx (IndexDisagreesSection title) | hardcoded `${numberWord(n)} holes play well away from where your card puts them` | `t('business.clubAnalytics.indexDisagrees.title', { count })` — numerals, plural forms. The count-0 title is unchanged. The `numberWord` import was dropped as unused. |
| components/business/teamSummary.ts (end) | — | `teamTitleFirst(displayName)`: the first whitespace token of the display name, or '' if there is none |
| components/business/AccessRequestsSection.tsx:116 add/decline title | `{ name: nameOf(request) }` (full name, falling back to @username) | `{ name: titleFirst }`; the `…NoName` key when the request has no display name |
| components/business/TeamListSection.tsx role/job/owner/remove sheet titles (189, 214, 223, 231) | `{ name: sName }` | `titled(key)`: the first name, or "You" for yourself; the `titleNoName` key when there is no display name. The leave sheet names the business, so it is unchanged. |
| components/business/TeamInvitesSection.tsx:152/166 invite role/cancel titles | `{ name: inviteName(invite) }` (display name, @username or email) | the first name of the invitee's display name; email-only and username-only invites use `titleNoName` |
| components/business/YouCardShell.tsx:21 | `<h2>{first} <span>{second}</span></h2>` | `<h2>{first}</h2>` then `<p class="club-you-body" data-club-you-body>{second}</p>` |
| index.css `.club-you-title span` | muted colour on the in-title span | replaced by `.club-you-body` (margin 4px 0 0; 13px / 1.4 / --club-you-muted). This reuses the panel's existing body values (`.club-you-faces p`), so no new type values. |
| TeamListSection.tsx meta line + index.css | `@handle · Add job title` was one clipped inline run | `team-list-meta--link` (flex, min-width 0); `.team-list-meta-handle` (min-width 0, ellipsis); separator and `.team-list-link` are flex:none and nowrap |
Full names are unchanged in sheet heads, rows, bodies ({{first}} already) and toasts. YouCardShell is shared, so the business "you" card (BusinessYouCard) gets the same split; this is intentional, because the shell exists to prevent drift between the two cards.

### i18n keys (all six locales: en, en-XA, de, es, ja, ko)
New: `business.clubAnalytics.indexDisagrees.title_one` / `title_other` (ja and ko have `title_other` only, following their plural practice); `business.team.sectionOne.addTitleNoName`, `declineTitleNoName`; `sectionThree.roleSheet.titleNoName` ("This invite"), `sectionThree.cancelSheet.titleNoName` ("Cancel this invite?"); `sectionTwo.{roleSheet,jobSheet,ownerSheet,removeSheet}.titleNoName`.
There was no split key: the "you" panel's sentences come from `clubYouTitle()` as two values already (hardcoded English, not i18n), so nothing needed splitting.
Notes: before this, de/es/ja/ko did not carry `business.team.*` or the club analytics strings and fell back to English. Those locales are disabled (English-only cutover), so the new translations only appear if they are enabled again. Switching to `{{count}}` retires the CB94 number words ("Four holes" → "4 holes"), as the brief's example "1 hole" requires.

### Line table (same long-name fixtures; title lines)
| Surface | 390 before → after | 320 before → after |
|---|---|---|
| Your courses card-against-course title | 2 → 2 | 3 → 2 |
| Team decline | 2 → 1 | 3 → 2 |
| Team remove | 2 → 1 | 3 → 2 |
| Team add (approve) | 2 → 2 | 3 → 2 |
| Team cancel-invite (email invite → no-name) | 3 → 1 | 3 → 1 |
| Team role | 2 → 1 | 2 → 1 |
| Team invite role (email invite → no-name) | 2 → 1 | 2 → 1 |
| Team job title | 2 → 1 | 2 → 1 |
| Team make owner | 2 → 1 | 2 → 1 |
| Club "you" panel title | 3 → 1 (+ body) | 4 → 2 (+ body) |
At 320 every title is two lines or fewer. Page scrollWidth equals the viewport on every capture, with zero overflowing elements.
The fixture correction: in close-out 1 the "you" panel used invented copy ("…here across both courses."). These captures use the real `clubYouTitle` output ("You've played 12 rounds here." / "Your best is 80, on the East Course."), before and after.
Captures: `closeout2/<key>_<390|320>_<before|after>.png` (44 files). The fixture page was recreated from 3941c44 for the run and deleted afterwards.

### Overflow outcome (team page, 320)
The row fits on one line. `@alexandramontgomery-whitfield` truncates to 110px (about 14 characters, more than the 6-character threshold) and "Add job title" ends inside the meta box at 259px. The link does not need its own line. Elements overflowing: before 1, after 0.

### Test updates
- cb94CardAgainstCourse.test.tsx:24 — `toBe('Four holes play well away from where your card puts them')` → `getByRole('heading', { level: 3 })` present. The canonical i18n mock returns '' for keyed copy; the wording moved to brief12CloseOut2 under a real i18next instance.
- cb94CardAgainstCourse.test.tsx:45 — `toBe('One hole plays well away from where your card puts it')` → same structural assertion, same reason.
- cb94CardAgainstCourse.test.tsx:56–58 — test renamed from "writes count %i as %s" with `[9,'Nine']` to "renders the counted title for %i flagged holes (%s)" with `[9,'9']`; `toBe(\`${label} holes play well away…\`)` → structural assertion. Number words are retired by `{{count}}`.
- cb113BusinessYouCard.test.tsx:122, 132, 145, 153 — `querySelector('.club-you-title span')` → `querySelector('[data-club-you-body]')` (same presence/absence). This encodes the split.
- cb104ClubYou.test.tsx:140–143 — renamed from "…and the title keeps two sentence elements" to "…and the second sentence sits beneath the title as body"; `querySelector('h2 > span')` → `querySelector('h2 + [data-club-you-body]')`. The brief changes this rule.
- New brief12CloseOut2.test.tsx (8 tests): counted title at 1 / 4 / 12 (singular and plural); `teamTitleFirst` tokens and empty input; named titles ("Decline Christopher's request?", "Remove Alexandra from the team?") and no-name fallbacks, plus all eight no-name keys present; the source guard that no named team title takes the full name; the split panel (title text, body <p> directly beneath) and no body without a second sentence.
- No team test asserted the old names in titles (the team tests use the canonical mock).

### Shard table (sequential, separate commands)
| Shard | Files | Tests | Exit |
|---|---|---|---|
| 1/4 | 223 | 2,462 | 0 |
| 2/4 | 223 | 2,493 | 0 |
| 3/4 | 223 | 2,494 | 0 |
| 4/4 | 220 | 2,739 | 0 |
| Total | 889 | 10,188 | |
Reconciliation: 10,180 / 888 + 8 tests in 1 new file (brief12CloseOut2.test.tsx) = 10,188 / 889. Renamed tests keep their counts. No pf3aVideoComposerMounted or worker-timeout recurrence. After the shards, typecheck caught `initImmediate` (not an i18next v24 option) in the new test; it was changed to `initAsync: false`, the file passed 8/8, and shard 1 (which holds it) was rerun: 223 / 2,462, exit 0. Typecheck is clean.
