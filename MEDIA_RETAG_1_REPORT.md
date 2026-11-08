# MEDIA_RETAG_1 report

Changed: `src/components/course-media-tab/CourseGalleryTagger.tsx` (one-step retag; no lock, no Remove row, selection-driven primary label via the existing `primaryLabel` prop, so ShotTagCard is unchanged) and `public/locales/en/courses.json` (`media.v3.taggedHole`, `taggedPlace`, `moveHole`, `movePlace` beside `tagHole`/`tagPlace`).
HolePhotoFastPaths and the other adapters are untouched.

New tests: `src/test/mediaRetagOneStep.test.tsx` (+7). No existing test edited.

Shards (`bunx vitest run --maxWorkers=2 --shard=N/4`), logs in `docs/verification/retag/`:
1. 1,995 passed / 12 failed (2,007)
2. 1,847 passed / 8 failed (1,855)
3. 1,990 passed
4. 1,895 passed
Total 7,727 passed, 20 failed, 7,747 executed.

All 20 failures are in hole-tiles board build areas (Also this week, hero board, ties, POS alignment, player rings, round plot gross strip); none touches the gallery tagger.
`tourIsland.test.tsx:235` did not appear.

Unverified: 320px overflow (no browser pass), device checks 1–3.
