# Roadmap

## In progress: Tour heroes — upcoming rhythm + completed two lines
Approved figure size: 15px / 700 (brief governs the mock's unused 15px class).
Fresh before-change shards: 2,084 / 1,907 / 2,053 / 1,954 = 7,998, all passing.
Replacement brief includes two-line completed figures and both live payload fixtures.
Before fixtures measured facts-label → LAST YEAR 30px and last row → COURSE 18px on both pages.
Application changes and after-change verification are in progress.
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
