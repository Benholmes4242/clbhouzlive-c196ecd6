# Roadmap — Tour sheets, island and Schedule across seasons

Brief: BUILD_Tour_sheets_island_and_Schedule_across_pasted-2.md + schedule-across-seasons-signed-off.html.

- [ ] 1. FullBoardSheet: white LEADERBOARD kicker (sheet only), whole sheet SHEET_SURFACE #16161A (rows, sticky head, --hm-surface, masks), row tap = inline expand via HeroRoundPanel (one open, tap closes), Full scorecard still opens ScorecardSheet.
- [ ] 2. 24-hour tee times (formatTimeHm24) at: TeeTimesFirstGroups, TeeTimesRail, OnTheCourse, magazineCopy, useTournamentTeeTimes, LeadersGroup. Drop am/pm .toUpperCase().
- [ ] 3. Island start label: weekday only within next 6 days, else "Starts 17 Jan". Tests at 0/6/7 days. Update stale tourIsland.test.tsx:106 assertion (report old/new).
- [ ] 4. Schedule across seasons: useSeasonTimeline fetches prev/current/next year seasons; season break per mock; counters/anchor/stats stay current-season; merged view untouched; tests (order, one break per boundary, anchor unchanged, Korn Ferry 17 Jan with 2026 above).
- [ ] 5. Empty week: CAUSE = anchor scroll fires before winner/leader enrichment settles; rows above grow, landing falls short, sticky "12–18 OCT" header covers the SAS row's name/date (row renders — measured 108px at top 32 vs header 42–89.5). Fix in schedule-v2: re-scroll on timeline settle, cancel on first user scroll. Add no-empty-week test.
- [ ] 6. Shards before: 1=2052 ✓, 2/3/4 running. After: all four, counts reconciled. Report.

Standing rules: no SQL/migrations, no RPC/edge changes, feed_config untouched, round_pool_cap 30, no native/Median changes, no guest browsing/review wizard/news/round-plot changes.
