# Round scores + Course photos viewer fit + review confirmation notch — report

## Final shard counts (after all work, one command per shard, --maxWorkers=2)
- Shard 1: 2,071/2,071 ✓
- Shard 2: 1,902/1,902 ✓
- Shard 3: 2,051/2,051 ✓
- Shard 4: 1,935/1,935 ✓
- **Total: 7,959, zero failures.** Baseline before this stream: 7,898. Delta +61: Round scores (+15), viewer-fit/notch (+7), featured-round net (+3), harness-only QueryClient wraps (+0 assertions), plus the Tour sheets/island/Schedule suite additions already in the tree.

## FIX: Course photos viewer fit (about-strip)
- **Cause:** `resolveViewerRect` (src/components/feed/FeedSlide.tsx) applied the gallery rule (full-viewport rect + `galleryFit`: aspect < 0.75 → cover, else contain) only when the store's `courseGallery` was set. The about-strip open (`openedFrom: 'about-strip'`, readOnly) never sets it, so it fell through to `resolveRestingRect`, which is always safe-area contain — portrait media shrunk into a centred box.
- **Fix:** the gallery decision now also applies when `openedFrom === 'about-strip'`; FullscreenFeedOverlay's two clone-rect call sites route through the same exported `resolveViewerRect`. Clubhouse feed opens (`openedFrom: 'clubhouse'`) still take `resolveRestingRect` — **no Clubhouse fit change** (covered by test). Review details panel, progress bars and read-only behaviour untouched.
- Test: `src/test/aboutStripViewerFit.test.tsx` (4) — portrait→cover full-bleed, landscape→contain, strip≡gallery rects identical, clubhouse unchanged.

## FIX: Review confirmation notch
- Removed `className="rv2-receipt-hero"` from the receipt's `ReviewCourseHero` and deleted both CSS overrides (`height: calc(env(safe-area-inset-top) + 196px)` ×2). The confirmation hero is now Step 1's exactly: HERO_CONTENT_TOP / HERO_CONTENT_BOTTOM padding, content-derived height, same scrim, photo to the container top.
- ReviewComposerV2's notch claim now treats the receipt as immersive (`photoHeader || receiptShowing`) — previously the transparent shield depended on stale composer state, which is why the notch area was dark. Close button unchanged.
- Tests: `src/test/reviewReceiptHero.test.tsx` (3) — receipt hero padding/height/class, receipt≡step-one geometry, CSS free of the override.
- **390/320 photo top/bottom measurements: NOT TAKEN — this sandbox's auth is `external_unmanaged`, so the auth-gated wizard (/courses/:id/rate) can't be reached in the browser here.** Parity is guaranteed at source/props level (both pages render the identical ReviewCourseHero default branch; test asserts identical paddingTop/paddingBottom/height). Device check left for Ben: step one vs confirmation photo top/bottom at 390 and 320 must match.

## RULINGS applied
1. `tourOverviewNotStarted.test.tsx:41` — assertion now uses `formatTimeHm24` ("13:00"); code not revisited. ✓
2. `likesSheetTiers` — diagnosis confirmed exactly as ruled (shared subject line shows NET; fixture had no net fields). Fixture gained `net: 70, netToPar: -1`; the "−1" assertion now proves the net to-par. No other assertion touched. The likes sheet shows the net score, matching the comments sheet. ✓
3. **FeaturedRoundCard on FN1 net rules** (renders in three places: Home round of the week via FeedCard.tsx:852 and HomeRail.tsx:99, and the Explore featured round via ExploreMagazine.tsx:1383 — the hook lives inside the card, so all three converted at once):
   - (a) Big photo figure is NET to par (net_score − course_par), existing under-par red; tier-2 red suffix and tier-3 default big figure both converted; no net row → no figure.
   - (b) Photo line is the net line via `feedStrokesReceived` → `feedNetSeries` (the FN1 helpers roundTilePlot uses), passed as RoundShape `seriesOverride`; no net row/unnetted → not drawn, never gross.
   - (c) Stat row is FN1.5: NET (to-par suffix), GROSS (to-par), HANDICAP (`formatDisplayedHcp`), AWARDS; VS HCP cell removed.
   - Handicap source: new `useFeaturedRoundNet` — one single-row `gam_round_net` read (`net_score, course_handicap`) keyed on `whs_score_id`, mirroring useCommentsContext. No RPC/migration change.
   - Tests: `src/test/featuredRoundNet.test.tsx` (3) — danny.akers1 (gross 67, net 68, par 70 → figure −2, NET 68 −2, GROSS 67 −3, HANDICAP +1); no-net-row case (no figure/line/NET cell, GROSS 67 −3 still shows); figure/line-end/NET-cell agreement (line end = −2).
4. exploreNetChips updates were already in (3 assertions → FN1.5 row; one test renamed "renders NET and VS HCP…" → "renders NET, GROSS and HANDICAP…"). ✓

## Test changes ledger (all brief/ruling-authorized)
- `exploreNetChips.test.tsx` — 3 assertions updated to the FN1.5 row (NET '67−4'/'76+5', GROSS plain when no to_par fact, HANDICAP, vs-hcp null); one test renamed as above.
- `exploreRoundCardEngagement.test.tsx` — `'NET76VS HCP+4'` → `'NET76+4GROSS80+8HANDICAP4'`.
- `reviewConfirmationRedesign.test.tsx` — old `toHaveClass('rv2-receipt-hero')` + CSS-contains-`196px` → class-free hero with HERO_CONTENT padding, CSS free of the override.
- `tourOverviewNotStarted.test.tsx` — `formatTimeHm` → `formatTimeHm24` (ruling 1).
- `likesSheetTiers.test.tsx` — fixture +`net: 70, netToPar: -1` (ruling 2); assertion unchanged.
- `roundCardFollowCB29.test.tsx`, `holeTilesBoardBuild.test.tsx` — harness-only QueryClientProvider wraps for the new useQuery read; no assertion changes.

## Standing rules kept
No SQL/migrations, no RPC/edge changes, feed_config untouched, round_pool_cap 30, no native/Median changes, no guest browsing/review wizard/news/round-plot changes. Pure-white ratings untouched.

## Open for Ben
- Device check: step one vs confirmation photo top/bottom at 390/320 (auth-gated here).
- Device check: Course tab Photos tap → portrait full bleed, landscape letterboxed.
