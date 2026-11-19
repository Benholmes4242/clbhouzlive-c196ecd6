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
