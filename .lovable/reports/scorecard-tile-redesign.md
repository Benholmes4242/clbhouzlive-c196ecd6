# SCORECARD_TILE_REDESIGN — STOPPED (focused run)

Built: new fixed header (kicker + TOP 100 stamp, 22px two-line course name tap, player row tap with chevron, GROSS/TO PAR/POINTS/DIFF/PLAYED OFF row via shared ScoreFigureRow, neutral comparison line), two glass nines + key (TileNine/TileKey), titled sections, awards 32px squircle tier marks, efforts table with no green (first bold ink), one-row footer (like, comment, share, likers stack), 28px scroll fade. Swipe preview shares the head and nines. DIFF comes from whs_scores.handicap_differential already on the round-detail read (no new read). Typecheck clean.

Focused run (47 scorecard files): 570 passed / 21 failed. No tests edited yet; shards not run.

Unauthorised failures (brief does not list them) — need a ruling:
- scorecardHeadPar.test.tsx (3) and roundShapeCarriesPar.test.tsx (2): encode the head's par suffix ("par 72"/"thru 10"). The signed-off mock's header prints no par; the brief's score-row spec lists none.
- scorecardSheetBasis.test.tsx "awards render inside the own-rounds section, after its heading": brief §2c puts AWARDS as its own section before AGAINST {OWN} ROUNDS.

Authorised categories (pills / header rule / boxed pair / stacked footer), pending update after ruling:
- cb61SheetDoors.test.tsx (5), tourScorecardCourseDoor.test.tsx (2), tourScorecardProfileDoor.test.tsx (6): Course/Profile pills and foot.
- likedByCollapse.test.tsx "CardScorecardSheet still passes reserve to LikedByRow": stacked footer.
- scorecardSheetBasis.test.tsx "the strip carries no tone and no handicap item": boxed stat pair.

Material mismatch: mock card is 28px radius / .78 glass; canonical GLASS_CARD is 22px / .92 — left canonical, needs ruling.
New tests (a)–(g) not yet written.

## Rulings applied (19 Nov)
1. Head par now labels the gross figure: "PAR n" (complete, same rule) / "THRU n" / else GROSS. scorecardHeadPar (3) and roundShapeCarriesPar (2): `expect(container.textContent).toContain(PAR_SUFFIX|THRU_SUFFIX)` -> `expect(grossLabel(container))...` (same expected values, negatives too).
2. scorecardSheetBasis: "awards render inside the own-rounds section, after its heading" (`heading.compareDocumentPosition(awards) & FOLLOWING`) replaced by "AWARDS is its own section before the own-rounds section, whose scope note renders under its heading". Strip case: slice end marker `'const rail = useMemo'` -> `'const headCells = useMemo'`; assertions unchanged.
3. GLASS_CARD kept.
4. Authorised rewrites: cb61SheetDoors 5 (pill selectors `[data-sheet-door]` -> course-name / player-row buttons; footer `[data-scorecard-exit-links]` -> `[data-scorecard-footer]`; preview asserts inert header); tourScorecardCourseDoor 2 (renamed, same selector swap, navigate assertions kept); tourScorecardProfileDoor: 4 door/foot cases rewritten, the three "doors at the right edge" cases (head-flex gap 14, `[data-sheet-doors]` last child, marginLeft 10px) replaced by two player-row cases (chevron last, ellipsis) — net -1; likedByCollapse: CardScorecardSheet removed from "still passes reserve" each (`/<LikedByRow[\s\S]{0,900}?\breserve\b/`), replaced by one-row footer/stack case (net 0).
New: scorecardTileRedesign.test.tsx (a)-(g), 7 tests. Typecheck clean.

## Shards (STOPPED)
- Shard 1: 2,246 passed. Shard 2: 2,269 passed.
- Shard 3: 1 failed / 2,296 passed — untouched `src/test/ob1Welcome.test.tsx` "OB1.2 first sign-in fixes > cropper has no slider, grid or reset and Use photo hands the file to the existing upload". Error text was not captured (output filtered). Isolated file rerun 81/81; full shard-3 rerun 2,297/2,297 passed.
- Shard 4 not run.

## Full rerun (19 Nov 14:11, unfiltered logs /tmp/scorecard-shard-1..4.log)
Expected 9,158 (9,152 + 7 new tile tests − 1 tourScorecardProfileDoor). Sequential: 2,246 / 2,269 / 2,297 / 2,346 = 9,158/9,158 across 822 files. No failures; ob1Welcome passed. No source or test changes.
