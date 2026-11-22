# FEED MEDIA CHROME — build report

## Suite
Command: `./node_modules/.bin/vitest run --shard=N/4`, four sequential commands; full logs shard1–4.log here.
Before: 9,766 tests / 865 files (last report, with the known open overviewRoundParity casing failure).
After: 2,398 / 2,418 / 2,429 / 2,544 = 9,789 tests / 866 files; 9,788 passed, 1 failed.
Delta +23 tests / +1 file = new `src/test/feedMediaChrome.test.tsx` (23 cases). No test deleted.
The one failure is the previously reported, still-open `overviewRoundParity.test.tsx:82` ('ROUND 1 · First tee' vs 'ROUND 1 · FIRST TEE'), unchanged and awaiting its ruling. No new failure.

## Existing tests changed (rules this brief changes)
- feedReviewGlass.test.tsx (a): renamed "…keeps course, first region and shared scores…" → "…full region and shared tile scores…"; `[data-review-glass-region]` toBe('Catalonia') → `[data-review-region-line]` toBe('Catalonia, Spain'); variant "card" → "tile". Why: §7 full region line, §8 tile.
- feedReviewGlass.test.tsx (a2): renamed "…without joining parts" → "…then joins the country, de-duplicated"; expectations `['', 'Girona', 'Girona'], ['', '', 'Spain']` → `'Girona, Spain'`, `'Spain'`, plus `['Spain','', 'Spain']`. Why: §7 formatter.
- feedReviewGlass.test.tsx (e): renamed "video mute and duration use measured strip offset…; dots retain ten" → "video mute sits bottom-right at 12px, duration top-right; dots sit at 58px"; the `--review-glass-h` calc assertions replaced with the new mute/dots positions. Why: §3.
- reviewGridScores.test.tsx (a)/(b): renamed "…course, region and card scores after media without glass" → "…full region and the glass score tile after media"; region 'Catalonia' → 'Catalonia, Spain'; variant card → tile. Why: §7–8.
- reviewPlayedWith.test.tsx (e) ×2: renamed; `[data-pw-offset="review"]{bottom:calc(var(--review-glass-h, -12px) + 18px)}` → `{bottom:12px}`; `review-video … + 44px + 8px` → `{bottom:15px}`. Why: §3 pill/mute row.
- pf1bFeedCard snapshot "renders a post with no context exactly as before": updated; the only difference is the new bottom media scrim (§3).

## Surfaces changed
FeedCard (Clubhouse CardFeed and profile Posts LightCardFeed both render it), ReviewPostCard, MediaCarousel (dots), InlineVideo (mute/duration), MuteButton ('chip' size), PostGolfContext (HoleChip, HoleCard, FeedHoleChip; fullscreen chip inherits the glass), PostGolfTags (pill, faces, panel, sheet, place chip), PostCourseBand (opt-in feedLine), ReviewScoreRow ('tile'), CourseGalleryChrome (shared hole facts), usePostGolfTags (batched mention read).
Audit: no Explore or other profile card draws a pill, hole chip, carousel dots or this mute.

## Shared modules
CHIP_GLASS (lib/tokens/glass.ts); holeFacts (lib/courseMedia/holeFacts.ts) + useCourseHoleFacts; formatRegionLine (lib/courses/regionLine.ts); mergeTagged (lib/mentions/taggedEntities.ts); fetchMentionEntities (hooks/feed/mentionEntities.ts).

## MentionText audit
Feed caption (FeedCard CaptionBlock), review body (ReviewPostCard) and the review sheet (ReviewBottomSheet) already used MentionText. Not converted, reported:
- VideoTeaser (detailed-video feed teaser) strips markup and measures a one-line cut; converting it changes the frozen PF3B teaser. Needs a ruling.
- BreathingRoomBottomBar renders plain captions but is unmounted (FeedOverlayLayer is imported nowhere).

## Differences from the mock / brief, not resolved
1. Duration label: the mock has none; mute now owns bottom-right, so the existing duration badge moved to top-right. It shows faintly through the open hole card's glass.
2. "18TH" bluer chip: no second hole-chip renderer existed in code; the only other chip material was SlideTagChip (place/hole tags). It now uses CHIP_GLASS and never renders a hole tag.
3. Mention read uses readMemberFaces (canonical public faces) and business_accounts (id, name, logo_url), not the selects.ts helpers, which no code uses and which name other tables. It runs inside the existing per-page golf-tags batch, cached per page rather than per id.
4. Business actors: their posts show mention tags but no played-with rows (existing exclusion kept).
5. Place chip on a multi-photo post still lifts to bottom 50, overlapping the 58px dots row; not in the mock.
6. Initials faces (no photo) draw letters top-aligned at 22px — existing SquircleAvatar fallback.
7. Hole chips on photo-grid tiles stay static (no expand) — the tiles are too small for the card.
8. Fullscreen viewer pieces (pill merge, REVIEW chip) left for brief 2.

## Verification
Disposable page (deleted) rendering the real FeedCard with cache-seeded placeholders: captures/*_390.png and *_320.png for review with video, review with chip open, @mention-only post (one person, one business), untagged post, single photo. metrics.json: page scrollWidth equals viewport at both widths, no element outside the screen beyond off-screen carousel slides. At 320: pill bottom 15 / mute bottom 12 / right 12, dots bottom 58, card 12/12/12; a second tap collapsed the card and opened no viewer. Fixture checks only — not live data or a real phone.
