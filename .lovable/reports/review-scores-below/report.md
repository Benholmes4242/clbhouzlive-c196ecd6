# Every media-first feed review — scores below media

## Delivered
All media-first review cards with media and course/score contents now use the existing `[data-review-grid-scores]` block directly after `[data-review-media]`. The existing 16px nowrap/ellipsis course name, first-region selection, card-variant ReviewScoreRow, block padding and responsive CSS remain unchanged. Removed feed-only glass strip/fade, FS_GLASS import, grid predicate/import, refs and measurement effect. Media-first Played with offsets now use media/media-video based on the active item; image-only grids continue using media. Standard layout keeps its previous review/review-video offsets.

No SQL, migrations, feed_config or round_pool_cap changes. No-media/standard subject and scores, header/pills, body clamp, Read the full review, footer composition and canonical course links unchanged. InlineVideo.tsx, MediaCarousel.tsx, played-with.css and ImmersiveFullscreenChrome.tsx are byte-unchanged.

## Files changed
- `src/components/feed/ReviewPostCard.tsx`: shared block condition, feed glass removal, Played with offset and ownership header.
- `src/components/feed/feedReviewGlass.css`: delete fade rule; block rules unchanged.
- `src/test/reviewGridScores.test.tsx`: only the three authorized (c) cases.
- `src/test/reviewPlayedWith.test.tsx`: only the two authorized (e) cases' expectations.
- `src/test/feedReviewGlass.test.tsx`: authorized (a), (d), (f) changes and narrowly authorized (e) empty property expectation.
- `roadmap.md`: progress and deferred combined suite.
- Supporting report, focused.log, browser-results.log and screenshots in this directory; original blocked.md retained as history, now superseded by the explicit line-111 ruling.

Module-local ownership recorded in ReviewPostCard's header; protected root architecture rules not rewritten.

## Every test changed — old → new, and why
No tests deleted or new tests added. Six case names renamed as explicitly permitted by the original brief; two Played with names and case (e)'s name retained.

### reviewGridScores.test.tsx (7 → 7)
Each of these three cases is renamed:
- `(c) single photo retains the glass score strip` → `(c) single photo places scores below the media without glass`.
- `(c) video retains the glass score strip` → `(c) video places scores below the media without glass`.
- `(c) three-photo carousel retains the glass score strip` → `(c) three-photo carousel places scores below the media without glass`.

For **each** case, assertions:
- `expect(container.querySelector('[data-review-score-strip]')).not.toBeNull()` → `expect(container.querySelector('[data-review-score-strip]')).toBeNull()`.
- `expect(container.querySelector('[data-review-glass-fade]')).not.toBeNull()` → `expect(container.querySelector('[data-review-glass-fade]')).toBeNull()`.
- `expect(container.querySelector('[data-review-grid-scores]')).toBeNull()` → `const block = container.querySelector('[data-review-grid-scores]'); expect(block).not.toBeNull()`.
- Added `expect(container.querySelector('[data-review-media]')?.nextElementSibling).toBe(block)`.
Why for all three: signed-off brief moves these existing media shapes to the grid's block directly below media. All other grid cases/fixtures/assertions unchanged.

### reviewPlayedWith.test.tsx (23 → 23)
`(e) review photo chip and upward panel clear the measured glass strip` (name retained):
- `expect(chip).toHaveAttribute('data-pw-offset', 'review')` → `expect(chip).toHaveAttribute('data-pw-offset', 'media')`.
- `expect(panel).toHaveAttribute('data-pw-offset', 'review')` → `expect(panel).toHaveAttribute('data-pw-offset', 'media')`.
- `expect(view.container.querySelector('[data-review-score-strip]')).not.toBeNull()` → `expect(view.container.querySelector('[data-review-grid-scores]')).not.toBeNull()`.
Why: photo review chip/panel now use the normal media position and scores leave the photograph.

`(e) review video chip clears the mute tap area by eight pixels`:
- `expect(required(view.container, '[data-testid="played-with-chip"]')).toHaveAttribute('data-pw-offset', 'review-video')` → same assertion with `'media-video'`.
Why: video review chip now uses the normal media-video position.

Both `pwCss.toContain` assertions remain exactly as written, as do all other assertions and fixtures.

### feedReviewGlass.test.tsx (10 → 10)
Case `(a) media review keeps course, first region and shared scores on media only; caption retains body and CTA` → `(a) media review keeps course, first region and shared scores below media; caption retains body and CTA`:
- Assertion source `const strip = container.querySelector('[data-review-score-strip]')` → `const strip = container.querySelector('[data-review-grid-scores]')`.
- The three assertions on canonical link, Catalonia and card score row remain verbatim but now inspect the below-media block; body/caption/CTA assertions unchanged.
Why: authorized location change only.

Case `(d) strip passes pointer events through except canonical course door` → `(d) below-media block retains the canonical course door`:
- `expect(container.querySelector<HTMLElement>('[data-review-score-strip]')?.style.pointerEvents).toBe('none')` → `expect(container.querySelector('[data-review-grid-scores]')).not.toBeNull()`.
- Assertion source `const link = container.querySelector<HTMLElement>('[data-review-score-strip] [data-course-name-link]')` → same source rooted in `[data-review-grid-scores]`.
- `expect(link?.style.pointerEvents).toBe('auto')` and click/call-count assertions unchanged.
Why: no over-media glass pointer-through layer remains; the canonical course door must still work in the block.

Case `(e)` (name retained):
- `expect(containerHeight()).toBe('0px')` → `expect(containerHeight()).toBe('')`.
Why: Ben explicitly authorized only this assertion at original line 111; removing the measurement effect leaves the property unset. **Both InlineVideo/MediaCarousel source assertions remain exactly as written.**

Case `(f) no name and no scores omit both glass and fade` → `(f) no name and no scores omit the below-media block, glass and fade`:
- Added `expect(container.querySelector('[data-review-grid-scores]')).toBeNull()`.
- Existing `expect(container.querySelector('[data-review-score-strip]')).toBeNull()` and `expect(container.querySelector('[data-review-glass-fade]')).toBeNull()` unchanged.
Why: absent contents must not create an empty block.

All other tests, mocks and assertions unchanged. `canonicalFullscreenViewer.test.tsx` and `fullscreenViewerRedesign.test.tsx` untouched.

## Focused test command and totals
Executed once, exactly the five files requested by the follow-up ruling:
```text
bunx vitest run src/test/reviewGridScores.test.tsx src/test/reviewPlayedWith.test.tsx src/test/feedReviewGlass.test.tsx src/test/canonicalFullscreenViewer.test.tsx src/test/fullscreenViewerRedesign.test.tsx
```

| File | Passed | Failed |
|---|---:|---:|
| reviewGridScores | 7 | 0 |
| reviewPlayedWith | 23 | 0 |
| feedReviewGlass | 10 | 0 |
| canonicalFullscreenViewer (unchanged) | 13 | 0 |
| fullscreenViewerRedesign (unchanged) | 10 | 0 |
| **Total** | **63** | **0** |

Full stdout/stderr retained in focused.log. Non-failing jsdom container-CSS parsing and act warnings retained, not suppressed or used to change app/tests.

**All four shards deliberately not run**, per Ben's 22:21 ruling: they run once after the queued poster ruling, covering both builds.

## Inventory reconciliation
- Last full passing baseline in the original brief: **9,383 / 837 files**.
- Prior poster build 19ecc4a23c added exactly six cases in reviewVideoPoster.test.ts: (a) HTTPS kept, (b) blob+Stream fallback, (c) data+Stream fallback, (d) blob without Stream null, (e) publish sanitization, (f) holeMediaPoster sanitization. That build stopped with seven existing poster failures, awaiting the queued ruling.
- Current expected before: **9,389 / 838 files**.
- After this layout change: **9,389 / 838 files**, **zero count delta**; six authorized case renames listed above, no deletions or additions.
- Full-suite passing total remains **unverified** until the combined four-shard run. Prior poster failures were not rerun/repaired in this request.

## 320/390 visual checks and screenshots
Chromium, isolated actual ReviewPostCard with real MemoryRouter/QueryClient providers, actual InlineVideo/MediaCarousel/FeedPhotoGrid controls and unchanged shared CSS. Six states checked at each width: single-photo, single-video, video-carousel, video-played-with, long-course and grid. Each is captured individually in `screenshots/{320,390}-{state}.png`; contact sheets and opened Played with panels also saved.

Checked all twelve cards: score block is directly after media, no feed strip/fade, --review-glass-h unset, 16px course text, and card scrollWidth equals clientWidth (320 or 390). At 320 with **North Scotland**, Cabot Highlands Castle Stuart has 202px text width vs 221px content width and visibly ellipsizes. At 390 it fits; grid remains the same existing block.

Video mute computed bottom is **6px**, Played with chip **58px** using media-video; the existing carousel dots stay at their own bottom position. Opened the Played with panel at both widths and clicked the canonical course door successfully. Final browser run had **zero page errors**. Results in browser-results.log; images visually inspected via both contact sheets and the opened 320 panel.

Mock-authority/frozen differences: header spacing/typography, actual shared score labels/geometry and existing photo/grid sizing were retained rather than adopting different frozen illustration details. Fixture footer glyphs/follow label/avatar stand-ins are not live-feed verification. The embedded mock photos include baked-in video UI near their edges; a small remaining baked-in mute mark in photo screenshots is part of the supplied bitmap, not an added application control. Temporary imagery stayed under /tmp/browser, not added to served app assets.

The initial isolated harness needed matching Vite provider module versions and the mock's precise North Scotland label; corrected only the disposable harness, not app code or test assertions. Screenshot cards use video posters without live playback sources: this verifies control placement, not video playback. Authenticated live feed checks unavailable on external_unmanaged; no hosted save/readback or physical iPhone check is claimed.

## Preview
Harness log: **2026-11-20T22:22:19Z — build OK**. git diff --check clean. No manual build/typecheck run.