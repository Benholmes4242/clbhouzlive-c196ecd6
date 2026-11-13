# Roadmap

## Stopped: Composer tagging
- Fix Played with pointer/focus and pending/empty results; rank up to twenty search rows into eight.
- Add canonical title mentions with plain eighty-character limit, draft restoration and deduplicated submission.
- Focused run: 43 passed / 5 failed (48). New composerTagging ordering assertion at 86:68 and four missing suggestion options at 98:33, 109:33, 117:34, 133:34 block continuation under the stop rule; tests untouched after failure. Four shards not run; baseline 8,407 plus twelve new cases = expected 8,419, unverified.
- Authenticated 320px checks depend on available sign-in (external_unmanaged).

## Done: Admin Command centre v2C
Five Dashboard-only mock-match fixes complete; focused 25 passed. Four separate sequential shards: 2,142 / 1,998 / 2,133 / 2,110 passed, each zero failures. Total 8,383, up five from 8,378; no known failures appeared and no reruns were needed.
Five added cases in adminCommandCentreV2.test.tsx: plain-post grammar; first four top posts; unknown-body label; zero-peak message; exactly two Connected leak figures. Two authorised assertions updated: third-leak case toContain("3we can't place") becomes not.toContain because the third figure is removed; coverage case 'Not known4' becomes 'No body named4' because only the display label changes. Existing case names retained; no tests deleted or renamed. Live authenticated rendering remains unverified (external_unmanaged).

## Done: Admin Command centre v2B verification
Authorised repair adds explicit single columns to the squircle and cohort grids only; hook and tests unchanged.
Focused checks: 20 passed. Four separate sequential shards: 2,142 / 1,993 / 2,133 / 2,110 passed, each zero failures; total 8,378 across 739 files.
Inventory before/after: 8,378 / 8,378, no test changes. Prior verified 8,373 + eleven v2 cases - six retired loop cases = 8,378. No named intermittent or existing failures appeared; no reruns needed.

## Previous stop: Admin Command centre v2
Dashboard/live v2 hook implemented; mock caption weights and auto-fit creator grid confirmed.
Focused 16 passed; separate shards 1=2,142 passed, 2=1,993 passed, 3=2,132 passed/1 failed. Shard 4 not run.
STOP src/test/fixOverflowSource.test.ts:62:24: `AssertionError: expected [ …(2) ] to deeply equal []`; Dashboard squircle/cohort grids omit explicit columns. Test untouched; no repair after failure.
Baseline 8,373; six retired loop cases replaced by eleven v2 cases => expected 8,378, full-suite unverified.
Authenticated 320/390 screenshots/live flow unavailable (external_unmanaged); exact assertions and diff in delivered ADMIN_COMMAND_CENTRE_V2_REPORT.md.

## Done: PRO member-name coverage suite
Kinds A/B/C/D authorised assertion updates complete; no production components or shared test files changed this turn.
Separate shards: retained 1 = 2,142 passed and 2 = 1,987 passed from the preceding run; fresh 3 = 2,132 passed and 4 = 2,112 passed. Total 8,373 passed, zero failures (+78 named prior PRO tests against 8,295). This turn adds/removes zero tests.
Shard 4 first exposed another kind-D count (competitionBoards); excluding only get_pro_members preserved the expected one call, and its separate full rerun passed.
Root checkpoint report removed; final sweep, every new/updated test and diff delivered in PRO-label-shards-complete-report.md.
Live 320px/authenticated screen checks remain unverified; LearnVideoCard has no member ID and admin post-source actor type is absent, so no identity is guessed.

## Done: Verification messages
Lowercase verification copy, pro-specific push and support sender/reply address; both authorised functions deployed.
Six new pure payload tests; no existing tests changed. Four separate sequential shards:
2,142 / 1,987 / 2,138 / 2,028 = 8,295 passed, zero failures (+6 against 8,289).
Deployed smoke checks returned expected 401/400; no real approval or member delivery was triggered.
Report: /mnt/documents/VERIFICATION_MESSAGES_REPORT.md. No SQL, migrations or database decision changes.

## Done: Top 100 leaderboard finish
Complete panel hook mocks restored; four retired dropdown tests replaced with two.
Numeric sheet positions, ring-free avatars and retained page-card rows verified by focused tests.
Four fresh sequential shards: 2,136 / 1,982 / 2,128 / 2,043 = 8,289 passed, zero failures.
Against 8,265: prior leaderboard build +23, this finish +3 new / -2 replacements = +24 net.
Report: /mnt/documents/TOP100_LEADERBOARD_FINISH_REPORT.md. No new screen verification.
Older roadmap entries are historical and do not authorise unrelated work in this brief.

## Done: Store-link suite rerun
Requested assertions and HTTPS/insecure business-link case already present; no duplicate case or source change.
Sequential shards passed: 2,133 / 1,958 / 2,111 / 2,004 = 8,206, zero failures (730 files). Picker screenshot skipped by request.
No test changes this turn. StoreLinks 6/6 passed; prior guestStage24 and historical tourIsland failures did not recur. Report: STORE_LINKS_SUITE_REPORT.md.

## In progress: WEB_HOMEPAGE_1B completion
Both fixes implemented; focused 30 passed. Sequential shards: 1=2,133 passed; 2=1,958 passed; 3=2,110 passed /1 failed. Shard 4 not run under the stop rule.
STOP: src/test/guestStage24.test.tsx:85:18, `AssertionError: expected [ '/auth' ] to deeply equal [ '/auth', '/' ]`. Guest code/test unchanged; no repair or rerun.
Ben verified production-style none/invite layouts at 1280/390/320; no visual rerun required. Inventory before 8,204; two new cases give expected 8,206, not full-suite verified. Report: WEB_HOMEPAGE_1B_REPORT.md.

## In progress: Golf Travel category
Implemented canonical category, create tile, hero labels, seven facilities and booking membership; venue/hospitality exclusions unchanged.
Focused 57 passed; sequential shard 1: 2,133 passed; shard 2: 1,956 passed / 1 failed. STOP at src/lib/storeLinks.test.ts:45:37: `AssertionError: expected { …(3) } to deeply equal { …(2) }` (existing homepage business:null regression). No repair or test changes.
Shards 3/4 not run under the stop rule. Actual 320px picker check redirected to /auth; external_unmanaged prevents authenticated verification and the requested picker screenshot.
Previous full verified baseline: 8,173; homepage +23 and golfTravelCategory +8 yield expected inventory 8,204, not full-suite verified. Report: GOLF_TRAVEL_CATEGORY_REPORT.md.

## In progress: WEB_HOMEPAGE_1
Homepage implemented; focused 39/39 (23 new guards), shard 1: 2,138 passed; shard 2: 1,950 passed / 1 failed.
STOP: src/lib/storeLinks.test.ts:45:37, `AssertionError: expected { …(3) } to deeply equal { …(2) }`; new business:null field breaks the existing exact-shape assertion. No repair attempted.
Shards 3/4 and visual verification unfinished. Localhost bypasses the public gate; live homepage locator timed out. Production BootHold unverified.
Last verified full-suite baseline: 8,173; new inventory expected 8,196 (+23 webHome1 cases), not verified as a full run. Report: WEB_HOMEPAGE_1_REPORT.md.

## Verified: Explore gallery business identity; two screenshots blocked
Preview identity uses actor_type; missing-business regression passes. No existing tests rewritten.
Separate shards 2,125 / 1,956 / 2,077 / 2,015 = 8,173 passing (+1 from 8,172).
390px MasterGolf header/search captured and visually verified. Machrihanish fullscreen/shared link remain blocked: Long form has no posts in the available external_unmanaged browser, and actual post id is unavailable.
Report: EXPLORE_GALLERY_IDENTITY_REPORT.md.
Older entries below retain their historical status; this brief does not authorise their unrelated work.

## In progress: Replacement voice outcome + course hint brief
Course-name prompt, recording-duration outcomes, session-scoped text-cleared tracking and retry toast implemented; recording format/layout unchanged.
STOP: focused 35 executed, 33 passed / 2 failed. Both voiceReviewFormat recorder tests fail at line 28:8: `Error: createObjectURL does not exist` before assertions.
No authorised repairs, full shards or redeployment. Report: VOICE_REVIEW_OUTCOME_HINT_REPORT.md.
Last verified suite 8,103; prior voice guards +9; this brief voiceReviewHint +5; inferred inventory 8,117, not a verified full-suite result.

## In progress: Four posting/upload corrections
White in-progress indicators; match VIDEO to ON THE COURSE spacing; retain custom cover frame and seek on reopen.
Add guards and run focused tests/fresh shards; baseline 8,097. No unrelated changes or unauthorised test repairs.

## In progress: Feed avatar fallbacks and comment-row account chooser
Use standard dark two-initial fallbacks in Who to follow; preserve business logos.
Move media-first footer chooser into the comment row; standard footers stay per ruling.
Add requested guards, audit white initials tiles, run focused tests and separate shards; baseline 8,091.

## Done: Tour dock blur and Players portrait correction
Page-level frost appears while Schedule/Leaderboards headers dock; other board callers retain default paint.
Players portrait height uses the requested CHROME_CLEARANCE expression. Six new guards; no existing tests changed.
Focused 45/45; separate shards 2,113 / 1,929 / 2,068 / 1,981 = 8,091 passed (+6 from 8,085); build OK.
Live phone checks blocked: all three Tour URLs show “App couldn't start”. Real-page docking/portrait appearance remains unverified.

## Done: Featured round label and date corrections
Inline FeedCard heroes use the courses Featured label; HomeRail keeps Round of the week.
Featured date text uses A.MUTE, with three new guards; no other color: A.SOFT hits found.
Focused 34/34; sequential shards 2,113 / 1,924 / 2,078 / 1,970 = 8,085 passing (+3 against 8,082).
No existing tests changed, deleted, renamed or repaired. Corrected the new harness's i18next option name without changing assertions.

## Done: Menu interpolation + LIV retirement
Original baseline: 8,040. Retirement tests: 8,047; authorised Champions fixture/switch repair plus one LIV-exclusion test: 8,048.
Fresh sequential shards: 2,093 / 1,917 / 2,068 / 1,970 = 8,048 passed, zero failures. Focused pk2WinnerChance: 13/13.
Report: LIV_RETIREMENT_REPORT.md, including every audited reference and exact renamed/assertion changes.
Ben confirmed job 27 sync-player-stats-liv-2026 unscheduled; job 54 tournament-live-sync is unrelated. No agent SQL or production changes in repair.

## Done: Featured round Follow ruling + close-out
Canonical inline Follow restored on date line; own rounds hide it.
Focused 51/51; sequential shards 2,087 / 1,916 / 2,066 / 1,971 = 8,040, zero failures.
320/390/430 real-style fixtures passed 18 collision/ellipsis/date-line checks.
Report: FEATURED_ROUND_REPORT.md. Live-account device checks blocked by external_unmanaged auth; listed in report.

## In progress: Last year lookup + missing-leaderboard sweep
Before-change shards executed separately: 2,087 / 1,908 / 2,049 / 1,968 = 8,012 executed (8,011 passed, 1 failed).
STOP: src/test/heroBlocks.test.tsx:104, “recap board header removal > RecapStandings renders no kicker or Full list link” unexpectedly fails on `recap-head`.
Authorised exact assertion repair applied. Finish board/recap measurements and shard 4, then fix tour-scoped prior-year lookup, add/deploy/invoke the authorised sweep, and run four final shards separately.
Report: LAST_YEAR_BACKFILL_REPORT.md.

## In progress: Board headers without POS / PLAYER
Combine heading/score labels where they fit; otherwise retain a score-only label line.
Preserve row geometry and behaviour; move full-sheet movement legend below board.
Verify all listed/sibling Tour boards and run sequential before/after shards after recap closes.

## In progress: Season in review — completed rhythm (option B)
Restore THE SEASON/THE POINTS LIST headings; shared two-line cells and spacing.
Centre the column-major card list as a block, with narrow-width equal-column fallback.
Run four before/after shards separately and measure real-stylesheet fixtures at 320/390/430.
Prior full-suite baseline: 8,002. Board rows, photo, champion and sentence frozen.
Checkpoint: after 8,005 (+3); last heading alignment rerun shard 1 only (2,087).
Remaining Our record heading-to-content gap is 13px, required 9px; finish then rerun four shards.
Report: SEASON_RECAP_RHYTHM_REPORT.md. Board-header implementation has not started.

## Done: Tour heroes — upcoming rhythm + completed two lines
Approved figure size: 15px / 700 (brief governs the mock's unused 15px class).
Fresh before-change shards: 2,084 / 1,907 / 2,053 / 1,954 = 7,998, all passing.
Replacement brief includes two-line completed figures and both live payload fixtures.
Before fixtures measured facts-label → LAST YEAR 30px and last row → COURSE 18px on both pages.
Focused 32/32; after shards 2,084 / 1,907 / 2,053 / 1,958 = 8,002 (+4).
Both page fixtures checked at 320/390/430, draw/no-draw and WWT/Abu Dhabi.
Only permitted McIlroy label ellipsis at 320. Live authenticated/device checks remain external to these fixtures.
Report: UPCOMING_COMPLETED_RHYTHM_REPORT.md.

## Done: Round scores + Media/notch + rulings (baseline clean)
All four shards green: 2,071 / 1,902 / 2,051 / 1,935 = 7,959, zero failures.
Report: ROUND_SCORES_AND_VIEWER_FIT_REPORT.md. Device checks left for Ben
(auth here is external_unmanaged): receipt-vs-step-one photo top/bottom at
390/320; Course tab Photos tap fit.

## Next: Tour hero blocks (BUILD_Tour_hero_blocks + hero-blocks-signed-off.html)
Starts from this clean baseline. Previous blocker (tourOverviewNotStarted
"1:00 pm" vs "13:00") is resolved — ruling 1 authorized formatTimeHm24.

Standing rules: no SQL/migrations, no RPC/edge changes, feed_config untouched,
round_pool_cap 30, no native/Median changes, no guest browsing/review wizard/
news/round-plot changes.
