# Brief 20 audit — Parts A, B, D

Written before any Brief 20 code change. Sources: `rg -n "targetType=" src`, callers of
useCommentsV2 / useFeedCommentPreview / usePostLikes / useContentReactions, and every
`openWithOrigin(` opener whose posts can be review-sourced. "Today" is read from the
code at this commit; "After" is the Brief 20 target from `engagementTargetFor`.

## A — engagement target per surface

Columns: like · like count · liked-by · comment open · comment count · comment preview · share.
`R` = review target, `P` = post, `Rd` = round, `E` = editorial / own target (out of scope).

| Surface (file:line) | Today | After | Notes |
|---|---|---|---|
| FullscreenFeedOverlay comments `FullscreenFeedOverlay.tsx:1333` | Rd › R › P computed from **activePost** (display post); member shots of a review post resolve to the source post with `review:null` → P | Rd › R › P from `engagementTargetFor(activeActionPost)` | A0.3 cause |
| viewer like / like state / comment count / share `useViewerEngagement.ts:44-86` | R only when the **display** post carries `engagementTarget`; otherwise P via `actionPostFor` | target of resolved action post | A0.2 cause |
| viewerActionPost `viewerContent.ts:23` | strips `review`, `engagementTarget` from every fetched source post | keeps review target when `source_review_id` set and no `whs_score_id` | A0.2 cause |
| readViewerPosts `viewerContent.ts:30` | selects no `source_review_id` / `whs_score_id` | selects both, same single read | |
| CourseGalleryChrome engagement `FullscreenFeedOverlay.tsx:1125` | via useViewerEngagement(activePost) | via resolved action post | |
| ProfileVideosTab `ProfileVideosTab.tsx:25` → viewer | P (rows carry no review id; `get_profile_videos` returns none) | R via viewer's posts read (`source_review_id`) | No RPC change (A7) |
| ProfileRoundVideos `ProfileRoundVideos.tsx:25` → viewer | P | Rd/R/P via viewer resolution | round posts unchanged |
| Clubhouse comment sheet `Clubhouse.tsx:776-782` | E › Rd › R › P (own inline rule) | resolver (E kept) | count/preview see CardFeed |
| Clubhouse CardFeed preview `CardFeed.tsx:342` | `useFeedCommentPreview(ids)` default 'post' for every card | review-targeted ids previewed with 'review' | A3 |
| ExploreMagazine comments `ExploreMagazine.tsx:877,1202,1234,1588` | own P/Rd/R state | resolver | reactions 625/670/760 already per target |
| ExploreTabContent | opens viewer only | viewer rule | |
| PostsTabContent `PostsTabContent.tsx:438` | P always | resolver | |
| LightCardFeed preview `LightCardFeed.tsx:163` | P default | resolver | |
| LoopCard `LoopCard.tsx:627` | P always | resolver | |
| ReviewBottomSheet `ReviewBottomSheet.tsx:813` / Portal `:42,:59` | R | R (unchanged) | already correct |
| CourseReviewsTab reactions `:297` | R | R | already correct |
| LatestReviews / LatestReviewsSheet / FriendsPlayedRail | R / R / Rd | unchanged | already correct |
| HomeRail `HomeRail.tsx:124`, RoundDetailSheet `:566` | Rd | Rd | unchanged |
| CardScorecardSheet | Rd | Rd | unchanged |
| NewsTabPage, StoryEngagementBlock, WireFeedSlide, StoryPage, AmateurStoryPage | story targets | unchanged | out of scope (own target) |
| ProfileTopTenRail `:420` | top_ten | unchanged | own target |
| Editorial cards (`usePostLikes(...,'editorial')`) | E | unchanged | out of scope per A1 |
| FeedCard counts `post.commentCount / post.likeCount` | P counts for all cards | review counts from `get_story_engagement('review')` for review-targeted cards | A3 |

## B — rail tile openers

| Opener (file:line) | Today | After |
|---|---|---|
| tilePhotoViewer `tilePhotoViewer.ts:41` (What's been played) | one synthetic page of the row (V4 §3 amendment) | one page per source review/post, full set; sourceless photos keep a synthetic page in row order |
| ReviewRailSlot `ReviewRailSlot.tsx:324` | each review as a full `reviewFeedPost`, landing on tapped media | already full set — left alone |
| CourseReviewsTab `CourseReviewsTab.tsx:400` | each review's full `buildReviewFeedPost` | already full set — left alone |
| AboutMediaStrip `AboutMediaStrip.tsx:452` | `feedPosts` grouped by parent post, landing on media | already full set — left alone |
| ExploreTabContent openMedia `:123` / openReviewMedia `:152` | pool entry posts / course media posts | full posts from pool — left alone pending fixture proof |
| ExploreMagazine clips `:261`, moments `:401` (deduped by post) | pool posts, mediaIndex/mediaId | full posts — left alone |
| ExploreMagazine videos `:340` | video posts | single-video posts by nature — left alone |
| ExploreMagazine `posts: [post]` `:1160` | one post (media/moment payload post), no vertical neighbours | listed for B1; whether payload post carries full media is unconfirmed (?) |

## D — overlays opened from the viewer, review sheet and scorecard

| Overlay | Floor before | Before when opener is lifted viewer (12200) | After |
|---|---|---|---|
| FullscreenFeedOverlay | 200 / 12200 | — | claimLayer(floor) |
| ReviewBottomSheet | 240/241 | **behind** viewer | claimLayer(240) → above |
| MoreOptions | 230/231 | **behind** | claimLayer(230) |
| CommentsSheetV2 | 12100/12101 | **behind** | claimLayer(12100) |
| LikesSheet | 12110/12111 | **behind** | claimLayer(12110) |
| Scorecard card (Z.sheet) | 12003 | **behind** | claimLayer(12003) |
| MediaPreviewViewer | 9999 | behind | claimLayer(9999) |

No audit row contradicts the brief.
