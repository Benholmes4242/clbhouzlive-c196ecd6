# Brief 36 — one Latest reviews rail

Files: src/components/courses/ReviewRailSlot.tsx (one rail, new written card, media-only viewer index), src/components/courses/browse/sectionShells.tsx (skeleton: second rail label removed, written shell card in the same rail at MEDIA_CARD_W), src/test/brief36OneReviewRail.test.tsx (new, 5 tests), src/test/coursesPageV5Sections.test.tsx (4 tests updated, implicitly authorised by the brief changing the documented rule).

Updated assertions (coursesPageV5Sections.test.tsx):
- "the written card is min(290px...)" -> "...MEDIA_CARD_W wide...": removed `expect(WRITTEN_CARD_W).toBe('min(290px, calc(100vw - 64px))')` and the `'16px'` padding entry — card width/padding changed by the brief.
- "the written card shows the score...": `[data-review-score]` -> `[data-review-disc]` — score now in the ScoreDisc.
- "a review appears once across the two rails, each under its label" -> "...one unlabelled rail": `toEqual(['WRITTEN REVIEWS'])` -> `toEqual([])`.
- "an empty rail hides with its label" -> "a written-only pool renders the one rail with no label": same label change.

Tests: four sequential shards 10,745 tests / 937 files vs Brief 35's 10,740 / 936 (+5/+1 = brief36OneReviewRail.test.tsx). 12 failures, all the same pre-existing Brief 34/35 ones awaiting Ben's ruling (brief31TopTen 1, topTenOwnerLabelRender 6, topTenTileWidth 1, proProfileScale 1, topTenShareCard 3). No new failures.

jsdom note: jsdom drops -webkit-line-clamp and multi-stop gradients, so the quote carries data-review-quote-lines="9" and test 3 asserts the fallback layer marker plus blur, not the gradient string.

Live /courses: 20 cards in one rail, mixed order mwwmwwwmmmmwmmmmmmmm, all 300x492 at 390/375 and 256x492 at 320, no WRITTEN REVIEWS, no horizontal overflow, no page errors. Captures: captures/{390,320,375}-{rest,swiped,written}.png. Security findings: none touched.
No SQL, migrations, feed_config or round_pool_cap changes.
