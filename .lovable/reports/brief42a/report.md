# Brief 42A — clean up after Brief 42

## Removed (source)
- src/features/explore-magazine/watch/WatchFeaturedDeck.tsx (deleted)
- src/features/explore-magazine/watch/featured.css (deleted, deck-only)
- featuredRules.ts: featuredSwipe, FEATURED_EXIT_MS/ADVANCE_MS/CROSSFADE_MS/TAP_MS removed; FEATURED_MIN kept (used by WatchFeaturedRail)
- src/index.css: --featured-shadow, --featured-shade (deck-only)
- WatchGridPage: WatchTop100Page export, 'top100' kind, Top 100 title, rank chip
- useWatchMiddle: GridSource 'top100' + get_watch_top100_videos read
- watch-grid.css: --watch-grid-rank-ink/prefix
- Kept: useWatchFeatured / get_watch_featured, WatchFeaturedRail, posterPreview (shared), chrome registry entry for /watch/top100 (route still exists as redirect; multi-route chrome tests list it), locale keys.

## Added
- src/pages/WatchTop100Redirect.tsx: /watch/top100 → <Navigate replace> /amateur?view=watch&watch=all
- src/test/brief42aTop100Redirect.test.tsx (1 test): REPLACE navigation lands on that URL.

## Tests deleted (53)
- fw1FeaturedDeck.test.tsx — whole file, 37 tests (deck only)
- brief20FeaturedTarget.test.tsx — whole file, 5 tests (deck engagement target)
- fw1FeaturedRead.test.tsx — 2: "keeps the signed-off deck geometry and material source values", "gives both rear cards their exact centred tilted-pile paint" (read featured.css / deck source)
- ws3WatchBottom.test.tsx — 2: "/watch/top100: title, no sub, no chips, Top 100 source", "/watch/top100 pages 30 at a time on the last created_at"
- headerB1.test.tsx — 2 (it.each history/fallback): "FIX_GRID_1 top100 back uses %s navigation…"
- g2dVideoGrids.test.tsx — 5: "a positive Top 100 rank renders #4…", "Top 100 rank undefined/0/-1 renders no rank chip" (3), "top100 uses its existing translated title…" (case removed from it.each)

## Tests edited without deletion (flagged — consequence of removal, not named in brief)
- fourFixes.test.tsx static amber scan: removed the deleted file path from its file list.
- g2dVideoGrids.test.tsx: removed `expect(source).toContain("color: 'var(--watch-grid-rank-ink)'")`; "uses two columns…" and "the entire second tile opens…" now mount 'courses' instead of 'top100' (track kind 'courses'); mount type narrowed. Assertions otherwise unchanged.

## Grep
`rg "WatchFeaturedDeck|WatchFeaturedSlot|featured\.css|featuredSwipe|FEATURED_(EXIT|ADVANCE|CROSSFADE|TAP)|WatchTop100Page|kind: 'top100'|get_watch_top100|watch-grid-rank" src` (excluding generated types) → no matches.

## Totals
Clean tsgo + vite build OK. Shards: 2,575 + 2,550 + 2,707 + 2,887 = 10,719 tests / 943 files, zero failures.
Baseline Brief 42: 10,771 / 944. Delta −52 tests (−53 deleted, +1 new), −1 file (−2, +1).
No SQL, no migrations, feed_config untouched, round_pool_cap 30, no security "Fix all".
