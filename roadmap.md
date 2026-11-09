# Roadmap

## Open: Tour hero blocks (PAUSED — awaiting ruling)
Brief: BUILD_Tour_hero_blocks + hero-blocks-signed-off.html. Not started.
Blocker: baseline shard 2 fails — src/test/tourOverviewNotStarted.test.tsx:41 expects "1:00 pm", gets "13:00" (24h tee-time change from the Tour sheets brief). Need authorisation to update that assertion before building.

## Open: Tour sheets, island and Schedule across seasons (shards 2–4 after-runs pending)
Completed items 1–5; after-shard 1 passed 2,052. Remaining: after-run shards 2–4, reconcile counts. Note: shard 2 now carries the tourOverviewNotStarted failure above (same ruling needed).

## Open: BUILD Round scores (verification pending)
Items 1–3 built; focused 136/136, typecheck clean, shard 1 after = 2,068/2,068.
- [ ] Update 3 exploreNetChips assertions (old GROSS/NET/VS HCP row → FN1.5 row; brief-authorized).
- [ ] Shards 2–4 after-runs; report counts. Shard 2 also carries known tourOverviewNotStarted 12h/24h failure (ruling pending).
- [ ] Ruling needed: brief item 3a says ExploreCard photo path draws a "big to-par figure" — no such figure exists there; that anatomy is FeaturedRoundCard (no course handicap in useFeaturedRound). Await ruling on converting FeaturedRoundCard + handicap source.
- [ ] Write report file.

## Active: FIX Course photos viewer fit + review confirmation notch
- [ ] 1. AboutMediaStrip ('about-strip', readOnly) open path: portrait media must be cover edge-to-edge, landscape letterboxed contain — match course gallery decision (resolveRestingRect / targetRect.fit / VideoEngine.setObjectFit / readOnly branch). Report cause first; STOP if fix would change Clubhouse feed fullscreen fit. Keep review details panel, progress bars, read-only behaviour.
- [ ] 2. ReviewReceipt hero must equal step one (ReviewComposerHeader → ReviewCourseHero): same height, HERO_CONTENT_TOP/BOTTOM padding, photo behind notch, same scrim; remove rv2-receipt-hero override; close button stays. Compare 390/320 photo top/bottom.
- [ ] Tests: about-strip portrait→cover / landscape→contain; receipt vs step-one hero geometry parity (source/props level). Four shards before+after, one at a time; report counts.

## Paused: BUILD Round scores (round-tiles-signed-off.html)
- [ ] 1. Round tiles: replace dot strip with HoleMarks (tourhub/leaderboard/BoardRound.tsx, as roundTilePlot.tsx uses) in RoundsThisWeekShelf RoundCard (~228, also CourseLatelySection) and StandoutRoundsShelf (~34–39). Two rows of nine, 6px gap, full content width, --hm-surface = SHELF_CARD.background; 9-hole = one row; unplayed = empty dot; keep data-raised standout highlight; tile size unchanged; delete stripColor/STRIP_COLORS once unused.
- [ ] 2. Comments sheet NET: useCommentsContext.ts + header render net score with to-par ("71 E") from FN1 sources (facts.net, course_handicap/feedStrokesReceived); no gross fallback; applies wherever the sheet opens for a round.
- [ ] 3. Round of the week on net (ExploreCard.tsx photo path ~1861): big figure = NET to par; photo line = net line or none (never gross); stat row FN1.5 via feedNet like line ~1785; figure/line/NET cell agree; test danny.akers1 gross 67 net 68.
- [ ] 4. Tests: 18 marks in two rows of nine / 9 in one row; no stripColor; comments net/to-par + nothing when unconvertible; ROTW figure/line/NET agree. Shards before/after, one at a time; report counts.

Standing rules: no SQL/migrations, no RPC/edge changes, feed_config untouched, round_pool_cap 30, no native/Median changes, no guest browsing/review wizard/news/round-plot changes.
