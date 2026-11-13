# Member-shot gallery layout

Baseline: 8,573 → 8,582 (+9). All four independent shards passed, zero failures.

## New file and changed lines
- `src/lib/media/galleryLayout.ts:1–7`: documented shared predicate, `!!s.courseGallery || !!s.syntheticPosts`; ownership is local to this module per AGENTS.md's module-header rule.
- `src/components/feed/FeedSlide.tsx:28`: import predicate.
- `src/components/feed/FeedSlide.tsx:36`: rect ownership comment now includes every member-shot open.
- `src/components/feed/FeedSlide.tsx:44`: gallery viewport decision uses predicate; the `s.openedFrom !== 'about-strip'` exception is unchanged.
- `src/components/feed/FeedSlide.tsx:105`: derive layout from existing reactive courseGallery/syntheticPosts selectors.
- `src/components/feed/FeedSlide.tsx:355`: fullscreen gallery slide class uses shared layout.
- `src/components/feed/FeedSlide.tsx:376`: fullscreen gallery gradient uses shared layout.
- `src/components/feed/FeedSlide.tsx:1955`: backdrop reads shared predicate from current store.
- `src/components/feed/FeedSlide.tsx:1989`: gallery inset -40 and width/height calc(100% + 80px) use shared predicate.
- `src/components/feed/FeedSlide.tsx:1991`: gallery filter blur(36px) brightness(0.45) saturate(1.2) uses shared predicate; ordinary backdrop unchanged.
- `src/components/feed/FullscreenNotchScrim.tsx:3,9–10`: import predicate, reactively select syntheticPosts, suppress notch scrim for shared gallery layout.
- `src/test/memberShotGalleryLayout.test.tsx:1–77`: nine new regression cases.
- `roadmap.md:3–6`: request and verification accounting.

## CSS loading (step 7)
No additional import needed. `FullscreenFeedOverlay.tsx:56` statically imports CourseGalleryChrome, which imports `./course-gallery.css` at `CourseGalleryChrome.tsx:24`. This guarantees stylesheet loading for the canonical fullscreen overlay, including synthetic opens without courseGallery. Chrome, rails/open calls, resolveRestingRect, getCurrentViewport and CSS are untouched.

## Tests
No existing tests deleted, renamed, rewritten or assertions updated; therefore no before/after assertion replacements. New cases in `memberShotGalleryLayout.test.tsx`:
1. uses gallery layout for synthetic shots without courseGallery
2. uses gallery layout for the course media gallery
3. does not use gallery layout for ordinary feed posts
4. fills the full 390x844 viewport with portrait cover, ignoring safeTop 59
5. centres landscape video in the full viewport with contain
6. preserves ordinary feed resting geometry for 1080x1920 image
7. preserves ordinary feed resting geometry for 1920x1080 video
8. preserves the about-strip full-viewport exception without synthetic posts
9. renders synthetic fullscreen gallery media without the notch scrim and reacts to store changes

Focused command: `bunx vitest run src/test/memberShotGalleryLayout.test.tsx src/test/fsNotch1.test.tsx --maxWorkers=2` — 15 passed (9 new + 6 unchanged).

Each shard ran in its own command:
- `bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/member-shot-shard-1.json` — 2,170 passed.
- `bunx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/member-shot-shard-2.json` — 2,036 passed.
- `bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/member-shot-shard-3.json` — 2,179 passed.
- `bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/member-shot-shard-4.json` — 2,197 passed.

Total executed = passed = 8,582; failed/pending = 0. Delta is exclusively nine cases in the new test file. Build diagnostics: `2026-11-13T21:03:44Z — build OK`. Real-member rail/tag-card browser rendering is not verified.

## Saved implementation diff
Platform maintenance saved implementation checkpoint `6dc869913e`; retained unchanged (not reverted or squashed). `git diff adbd60bdb3 6dc869913e --stat`:
```text
 roadmap.md                                   |  5 ++
 src/components/feed/FeedSlide.tsx            | 15 +++---
 src/components/feed/FullscreenNotchScrim.tsx |  4 +-
 src/lib/media/galleryLayout.ts               |  7 +++
 src/test/memberShotGalleryLayout.test.tsx    | 77 ++++++++++++++++++++++++++++
 5 files changed, 101 insertions(+), 7 deletions(-)
```
This report and final roadmap completion are additional documentation-only changes. No SQL, migrations, feed_config or cap changes.