# Brief 43 — Coaching: every verified coach, no PRO on coach cards

## Files changed
- `src/features/explore-magazine/watch/forYouRules.ts` — `orderCoaches` keeps every coach: with videos by latest video (newest first), then no videos by `pro_verified_at` (newest first, missing last).
- `src/features/explore-magazine/watch/WatchFeed.tsx` — section/chip show whenever `get_watch_pros` returns ≥1 coach; video rail already conditional; chip grid (and its 16px spacer) now only when videos exist. Error/empty still absent.
- `src/features/explore-magazine/watch/forYouParts.tsx` — coach card name renders plain text (no `InlineProMemberName`); 15/700/-0.02em one-line ellipsis CSS unchanged. Tiles keep PRO/AM/tick.

## Tests
- Rewritten (authorised by brief): `brief42WatchForYou.test.tsx` "is absent when no coach has videos" → "Brief 43: with no coach videos the section shows the heading and coach cards, and no video rail". Old: `expect(q('[data-fy-section="coaching"]')).toBeNull()`. New: section present, 2 coach cards, `[data-watch-rail="coaching"]` null.
- Added `brief43CoachingEveryCoach.test.tsx` (7): zero-video card 0/Videos/Follow after video coaches; no-video section; no-video chip without grid; empty pros → no section; error → no section; no PRO on cards, PRO on tiles; ordering.
- Four sequential shards: 2,575 + 2,550 + 2,707 + 2,894 = **10,726 tests / 944 files**, zero failures. Brief 42A baseline 10,719/943: +7/+1 = the new file. The rewrite is count-neutral.

## Screenshot
`390_coach_cards.png` — temporary harness with test data (no sign-in available), real `CoachCards`. Thomas Muchmore's name shows in full (151px, no truncation); second card shows 0 / VIDEOS. Follow pills are absent in the capture because the harness is signed out (the pill renders only for a signed-in viewer); Follow is covered by the jsdom test. Harness deleted.

No SQL, migrations, `feed_config` or cap changes; no security "Fix all".
