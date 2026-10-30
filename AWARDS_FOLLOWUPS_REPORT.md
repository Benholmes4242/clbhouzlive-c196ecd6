# Awards — two follow-ups

## Diff / changed project files
- `src/features/explore-magazine/ExploreCard.tsx`: import FEED_CARD_SURFACE and change only the scoreLed AwardCluster ring from A.CANVAS to FEED_CARD_SURFACE (`#16161A`). Standard AWARDS FigureCell and all other callers unchanged. No new negative letter-spacing or sizing changes.
- `src/test/cb111RoundScoreLed.test.tsx`: add **“uses FEED_CARD_SURFACE for every score-led medal ring”**, asserting all three separator shadows are `0 0 0 1.5px #16161A` and the score-led caller uses the token. Existing assertions/cases unchanged; none deleted or renamed.
- `roadmap.md`: follow-up completion and verification.
- `AWARDS_FOLLOWUPS_REPORT.md`: this report.

The existing temporary Chromium fixture was updated under `/tmp/browser/round-awards/check_awards.py`; it is not app source or a shipped route.

## Widest realistic case at 375px
Real ExploreCard rendered with real providers/app styles and sample data:
- Gross **102**, to-par **+30**, course par **72**.
- Handicap **28**; net **74**, to-par **+2**.
- Gold **4**, silver **5**, bronze **3**: total **12**.
- Score row **scrollWidth 375px / clientWidth 375px**.
- Right-hand group starts **61.796875px** after the big net figure’s right edge: **does not touch or overlap**.
- Total remains **17px**, right-group gap remains **18px**; no shrinking or negative letter-spacing added.
- No page errors; card tap succeeded. Screenshot inspected: `/tmp/browser/round-awards/widest-awards-375.png`.

This is the requested sample-data Chromium fixture, not authenticated live-feed verification.

## Tests / build
- Targeted `bunx vitest run src/test/cb111RoundScoreLed.test.tsx --maxWorkers=2`: **20/20**, one file (previously19).
- Full `bunx vitest run --maxWorkers=2`: **4,528 passed / 4,528 total across 463 files**, exit0, 738.26 seconds.
- Last green baseline **4,527/4,527 across463 files**. Delta **+1**, entirely the new named ring test. No failures, pre-existing or new.
- Automatic preview build **build OK**, observed `2026-10-30T08:57:13Z`.

No SQL/migrations, deployed RPC/edge edits, feed_config, round_pool_cap or native/Median changes.