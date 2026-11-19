# FOUR FIXES — hairline liker faces, white thumbs, liker taps over the viewer, index chart left edge

## 1. Hairline avatars
- LikedByRow `stack`: `border: 2px solid surfaceColor` removed; face takes `boxShadow: 0 0 0 1.5px surfaceColor` + SquircleAvatar `hairlineRing` (DARK_HAIRLINE overlay). Fallback face adds `inset 0 0 0 1px rgba(255,255,255,0.22)`. Size 22, overlap -7px, order unchanged.
- ReviewBottomSheet author avatar: `ringColor={DARK_HAIRLINE}` dropped; now `hairlineRing` only, as FeedCard.
- Widths (from code, SquircleAvatar hairline path): review author ring = hairline overlay (0.5px ring thickness path, same as FeedCard 34px author); liker faces = 1.5px outer surface separator + same hairline — matching FeedCard's `line` variant faces. Not measured on device.
- No other avatar in ReviewBottomSheet or CardScorecardSheet uses a 1.5px+ solid border (grep found none).

## 2. White reacted state
- `ReactionGlyph` reacted = new `REACTED` (#FFFFFF) for panel/chrome/media; idle unchanged.
- Files changed: reactionKind.ts, FeedPostControls.tsx, HeartBurst.tsx, ReactionAction.tsx (count + footerBox/glass), ReviewBottomSheet.tsx (footerBox reactedColor), StoryRowEngagement.tsx, WireFeedSlide.tsx, WatchFeaturedDeck.tsx, ExploreCard.tsx (likeColour + two spans), CommentCard.tsx, ReplyRow.tsx, ImmersiveFullscreenChrome.tsx (like pill).
- Left amber (identity/status, not reactions): LikesSheet viewer's own name; CommentCard/ReplyRow viewer name and the amber author/"you" chip; ImmersiveFullscreenChrome `want_to_play` status label; ReportCommentSheetV2 selected reason border; TourSwitcherAffordance; streaks chart.
- `AMBER` stays exported (identity consumers remain) with a comment that it is not a reaction colour. FeedCard still imports it (unused there, untouched).

## 3. Liker tap over the viewer
- New `src/lib/fullscreen/navigateOverViewer.ts`: viewer open → `store.close({ reason: 'navigating' })`, navigate next frame; otherwise plain navigate, store untouched.
- Applied: LikesSheet row taps (profile/business); CommentCard author + mention taps; ReplyRow author + mention taps (the comments sheet's rows).

## 4. IndexWindowChart
- svg style adds `clipPath: 'inset(-12px -12px -12px 0)'` beside `overflow: visible`. Label unchanged.

## Tests
- Added `src/test/fourFixes.test.tsx` (9 cases: a ×1, b ×4, c ×3, d ×1).
- Rewritten (encoded amber reacted colour, authorised by §2):
  - reviewCardRedesign.test.tsx: "liked uses the shared amber like token; unliked stays MUTE" → "…white reacted token…"; `toContain('footerBox={{ color: MUTE, reactedColor: A.AMBER }}')` → `REACTED`; liked colour now #FFFFFF.
  - exploreRoundCardEngagement.test.tsx: "uses amber for the celebrated clap…" → "uses white…"; `toBe('rgb(247, 147, 30)')` → `rgb(255, 255, 255)`.
  - fw1FeaturedDeck.test.tsx: "renders the filled amber thumb and amber count when liked" → white; both `rgb(247, 147, 30)` → `rgb(255, 255, 255)`.
  - fullscreenViewerRedesign.test.tsx: "(b) … liked is amber" → "liked is white"; liked `toBe('rgb(247, 147, 30)')` → white; unliked `not.toBe('rgb(247, 147, 30)')` → `not.toBe('rgb(255, 255, 255)')`.
- Note: the three latter failures surfaced during shards 1, 2 and 4; each is an amber-reacted assertion the brief authorised updating, fixed and that shard rerun from its start.
- Shards (sequential): 2,247 / 2,269 / 2,297 / 2,339 = 9,152 (9,143 + 9). Typecheck clean.

## Outstanding
Ben's iPhone checks.
