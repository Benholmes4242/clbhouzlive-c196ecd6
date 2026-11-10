# Roadmap

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
