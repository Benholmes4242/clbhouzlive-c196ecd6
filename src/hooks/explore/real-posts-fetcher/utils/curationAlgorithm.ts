import type { RawPostData, CurationBuckets } from '../types';

/**
 * Categorize posts into curation buckets based on user relationships
 */
export function categorizePosts(
  posts: RawPostData[],
  friendIds: Set<string>,
  followedIds: Set<string>
): CurationBuckets {
  const buckets: CurationBuckets = {
    friendPosts: [],
    friendReviews: [],
    followedPosts: [],
    followedReviews: [],
    globalPosts: [],
    globalReviews: [],
  };

  for (const post of posts) {
    const userId = post.user_id;
    const isReview = !!post.source_review_id;
    const isFriend = friendIds.has(userId);
    const isFollowed = followedIds.has(userId);

    if (isFriend) {
      if (isReview) {
        buckets.friendReviews.push(post);
      } else {
        buckets.friendPosts.push(post);
      }
    } else if (isFollowed) {
      if (isReview) {
        buckets.followedReviews.push(post);
      } else {
        buckets.followedPosts.push(post);
      }
    } else {
      if (isReview) {
        buckets.globalReviews.push(post);
      } else {
        buckets.globalPosts.push(post);
      }
    }
  }

  return buckets;
}

/**
 * Apply feed curation algorithm
 * Rule 1: Every 3rd post should be from friends/followed users (social slot)
 * Rule 2: Every 6th post is a dedicated review slot
 */
export function curateFeed(
  buckets: CurationBuckets,
  targetCount: number
): RawPostData[] {
  const result: RawPostData[] = [];

  // Helper to get next non-review post with priority
  const getNextNonReviewPost = (): RawPostData | null => {
    if (buckets.friendPosts.length > 0) return buckets.friendPosts.shift()!;
    if (buckets.followedPosts.length > 0) return buckets.followedPosts.shift()!;
    if (buckets.globalPosts.length > 0) return buckets.globalPosts.shift()!;
    return null;
  };

  // Helper to get next friend/followed post (Rule 1)
  const getNextSocialPost = (): RawPostData | null => {
    if (buckets.friendPosts.length > 0) return buckets.friendPosts.shift()!;
    if (buckets.followedPosts.length > 0) return buckets.followedPosts.shift()!;
    // Fallback to friend/followed reviews if no regular posts
    if (buckets.friendReviews.length > 0) return buckets.friendReviews.shift()!;
    if (buckets.followedReviews.length > 0) return buckets.followedReviews.shift()!;
    return null;
  };

  // Helper to get next review post with priority (Rule 2)
  const getNextReviewPost = (): RawPostData | null => {
    if (buckets.friendReviews.length > 0) return buckets.friendReviews.shift()!;
    if (buckets.followedReviews.length > 0) return buckets.followedReviews.shift()!;
    if (buckets.globalReviews.length > 0) return buckets.globalReviews.shift()!;
    return null;
  };

  // Helper to get any available post (fallback)
  const getAnyPost = (): RawPostData | null => {
    const nonReview = getNextNonReviewPost();
    if (nonReview) return nonReview;
    return getNextReviewPost();
  };

  // Build the curated feed
  for (let position = 1; position <= targetCount; position++) {
    let post: RawPostData | null = null;

    const isReviewSlot = position % 6 === 0;
    const isSocialSlot = position % 3 === 0;

    if (isReviewSlot) {
      // REVIEW SLOT (positions 6, 12, 18, 24...)
      post = getNextReviewPost();
      if (!post) {
        post = getNextNonReviewPost() || getAnyPost();
      }
    } else if (isSocialSlot) {
      // SOCIAL SLOT (positions 3, 9, 15, 21...)
      post = getNextSocialPost();
      if (!post) {
        post = getAnyPost();
      }
    } else {
      // REGULAR SLOT
      post = getNextNonReviewPost();
      if (!post) {
        post = getAnyPost();
      }
    }

    if (post) {
      result.push(post);
    } else {
      break;
    }
  }

  return result;
}

/**
 * Fetch user relationships for curation
 */
export async function fetchUserRelationships(
  supabase: any,
  currentUserId: string
): Promise<{ friendIds: Set<string>; followedIds: Set<string> }> {
  const friendIds = new Set<string>();
  const followedIds = new Set<string>();

  // Fetch friends (bidirectional - status = 'accepted')
  const { data: friendships } = await supabase
    .from('user_friends')
    .select('friend_id, user_id')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
    .eq('status', 'accepted');

  if (friendships) {
    for (const f of friendships) {
      if (f.user_id === currentUserId) {
        friendIds.add(f.friend_id);
      } else {
        friendIds.add(f.user_id);
      }
    }
  }

  // Fetch followed users
  const { data: following } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  if (following) {
    for (const f of following) {
      // Don't double-count friends as followed
      if (!friendIds.has(f.following_id)) {
        followedIds.add(f.following_id);
      }
    }
  }

  return { friendIds, followedIds };
}
