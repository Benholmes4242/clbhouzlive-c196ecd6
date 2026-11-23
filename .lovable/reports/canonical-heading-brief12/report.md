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
