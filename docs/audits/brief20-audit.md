# Brief 20 audit — Parts A, B, D

Written before any Brief 20 code change. Sources: `rg -n "targetType=" src`, callers of
useCommentsV2 / useFeedCommentPreview / usePostLikes / useContentReactions, and every
`openWithOrigin(` opener whose posts can be review-sourced. "Today" is read from the
code at this commit; "After" is the Brief 20 target from `engagementTargetFor`.

## A — engagement target per surface

Columns: like · like count · liked-by · comment open · comment count · comment preview · share.
`R` = review target, `P` = post, `Rd` = round, `E` = editorial / own target (out of scope).

| Surface (file:line) | Today | After | Notes | Status |
|---|---|---|---|---|
| FullscreenFeedOverlay comments `FullscreenFeedOverlay.tsx:1333` | Rd › R › P computed from **activePost** (display post); member shots of a review post resolve to the source post with `review:null` → P | Rd › R › P from `engagementTargetFor(activeActionPost)` | A0.3 cause | Done a5f98916c8 |
| viewer like / like state / comment count / share `useViewerEngagement.ts:44-86` | R only when the **display** post carries `engagementTarget`; otherwise P via `actionPostFor` | target of resolved action post | A0.2 cause | Done a5f98916c8 |
| viewerActionPost `viewerContent.ts:23` | strips `review`, `engagementTarget` from every fetched source post | keeps review target when `source_review_id` set and no `whs_score_id` | A0.2 cause | Done a5f98916c8 |
| readViewerPosts `viewerContent.ts:30` | selects no `source_review_id` / `whs_score_id` | selects both, same single read | | Done a5f98916c8 |
| CourseGalleryChrome engagement `FullscreenFeedOverlay.tsx:1125` | via useViewerEngagement(activePost) | via resolved action post | | Done a5f98916c8 |
| ProfileVideosTab `ProfileVideosTab.tsx:25` → viewer | P (rows carry no review id; `get_profile_videos` returns none) | R via viewer's posts read (`source_review_id`) | No RPC change (A7) | Done a5f98916c8; same-key test 1eb045e3d5 |
| ProfileRoundVideos `ProfileRoundVideos.tsx:25` → viewer | P | Rd/R/P via viewer resolution | round posts unchanged | Done a5f98916c8 (viewer resolution) |
| Clubhouse comment sheet `Clubhouse.tsx:776-782` | E › Rd › R › P (own inline rule) | resolver (E kept) | count/preview see CardFeed | Done a5f98916c8 |
| Clubhouse CardFeed preview `CardFeed.tsx:342` | `useFeedCommentPreview(ids)` default 'post' for every card | review-targeted ids previewed with 'review' | A3 | Done a5f98916c8 |
| ExploreMagazine comments `ExploreMagazine.tsx:877,1202,1234,1588` | own P/Rd/R state | resolver | reactions 625/670/760 already per target | Done 1eb045e3d5 (Watch rows pass source_review_id; WatchFeaturedDeck Done 1a3a94a8b1 (Part G), tests completed ab870a501d + Continuation 4 commit) |
| ExploreTabContent | opens viewer only | viewer rule | | Done a5f98916c8 (viewer rule) |
| PostsTabContent `PostsTabContent.tsx:438` | P always | resolver | | Done a5f98916c8 comments; 1eb045e3d5 like/count/share |
| LightCardFeed preview `LightCardFeed.tsx:163` | P default | resolver | | Done 1eb045e3d5 |
| LoopCard `LoopCard.tsx:627` | P always | resolver | | Done a5f98916c8 |
| ReviewBottomSheet `ReviewBottomSheet.tsx:813` / Portal `:42,:59` | R | R (unchanged) | already correct | Unchanged (already correct) |
| CourseReviewsTab reactions `:297` | R | R | already correct | Unchanged |
| LatestReviews / LatestReviewsSheet / FriendsPlayedRail | R / R / Rd | unchanged | already correct | Unchanged |
| HomeRail `HomeRail.tsx:124`, RoundDetailSheet `:566` | Rd | Rd | unchanged | Unchanged |
| CardScorecardSheet | Rd | Rd | unchanged | Unchanged |
| NewsTabPage, StoryEngagementBlock, WireFeedSlide, StoryPage, AmateurStoryPage | story targets | unchanged | out of scope (own target) | Out of scope |
| ProfileTopTenRail `:420` | top_ten | unchanged | own target | Own target |
| Editorial cards (`usePostLikes(...,'editorial')`) | E | unchanged | out of scope per A1 | Out of scope |
| FeedCard counts `post.commentCount / post.likeCount` | P counts for all cards | review counts from `get_story_engagement('review')` for review-targeted cards | A3 | Done: Clubhouse a5f98916c8, profile posts 1eb045e3d5. Left: watch-v2 HubMixedGrid uses a different tile FeedCard and WatchHubV2 is not routed |

## B — rail tile openers

| Opener (file:line) | Today | After | Status |
|---|---|---|---|
| tilePhotoViewer `tilePhotoViewer.ts:41` (What's been played) | one synthetic page of the row (V4 §3 amendment) | one page per source review/post, full set; sourceless photos keep a synthetic page in row order | Done 7ab0319c7c |
| ReviewRailSlot `ReviewRailSlot.tsx:324` | each review as a full `reviewFeedPost`, landing on tapped media | already full set — left alone | Left alone — already full set |
| CourseReviewsTab `CourseReviewsTab.tsx:400` | each review's full `buildReviewFeedPost` | already full set — left alone | Left alone — already full set |
| AboutMediaStrip `AboutMediaStrip.tsx:452` | `feedPosts` grouped by parent post, landing on media | already full set — left alone | Left alone — already full set |
| ExploreTabContent openMedia `:123` / openReviewMedia `:152` | pool entry posts / course media posts | full posts from pool — left alone pending fixture proof | Left alone — pool posts, no fixture proof yet |
| ExploreMagazine clips `:261`, moments `:401` (deduped by post) | pool posts, mediaIndex/mediaId | full posts — left alone | Left alone — full posts |
| ExploreMagazine videos `:340` | video posts | single-video posts by nature — left alone | Left alone — single-video posts |
| ExploreMagazine `posts: [post]` `:1160` | one post (media/moment payload post), no vertical neighbours | listed for B1; whether payload post carries full media is unconfirmed (?) | Done 1eb045e3d5 (review-targeted payload opens the review's full set; others unchanged). Landed in the A commit |

## D — overlays opened from the viewer, review sheet and scorecard

| Overlay | Floor before | Before when opener is lifted viewer (12200) | After | Status |
|---|---|---|---|---|
| FullscreenFeedOverlay | 200 / 12200 | — | claimLayer(floor) | Done 809b9b5679 |
| ReviewBottomSheet | 240/241 | **behind** viewer | claimLayer(240) → above | Done 809b9b5679; rendered test 4327c3d70a |
| MoreOptions | 230/231 | **behind** | claimLayer(230) | Done 809b9b5679 |
| CommentsSheetV2 | 12100/12101 | **behind** | claimLayer(12100) | Done 809b9b5679; rendered test 4327c3d70a |
| LikesSheet | 12110/12111 | **behind** | claimLayer(12110) | Done 809b9b5679 |
| Scorecard card (Z.sheet) | 12003 | **behind** | claimLayer(12003) | Done 809b9b5679 |
| MediaPreviewViewer | 9999 | behind | claimLayer(9999) | Done 809b9b5679 |

No audit row contradicts the brief.
