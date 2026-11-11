/** Published-post loading and fullscreen mapping shared by deep links and Explore's day row.
 * Keep the singular published read, blocked-user behaviour, media identity and actor likes
 * together so an Explore open cannot diverge from the existing deep-link viewer.
 */
import { supabase } from '@/integrations/supabase/client';
import { mapActivityPostToFeedPost } from '@/lib/activityPostMapper';
import type { ActivityPost } from '@/components/profile/types/ActivityTypes';

export interface PostViewerIdentity { userId: string | undefined; actorId: string | null; actorType: 'personal' | 'business' }
export async function loadPublishedPost(postId: string, viewerId?: string) {
  const { data, error } = await supabase.from('posts')
        .select(`
          id,
          content,
          post_type,
          created_at,
          user_id,
          actor_type,
          actor_id,
          status,
          course_id,
          source_review_id,
          whs_score_id,
          like_count,
          comment_count,

          user_profiles!posts_user_profile_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url,
            is_verified
          ),
          golf_courses (
            id,
            name,
            country,
            sub_country,
            region
          ),
          course_ratings:source_review_id (
            id,
            rating,
            review
          ),
          post_media (
            id,
            media_type,
            media_url,
            aspect_ratio,
            width,
            height,
            poster_url,
            stream_id,
            duration_seconds,
            display_order
          )
        `)
    .eq('id', postId).eq('status', 'published').maybeSingle();
  if (error || !data) return { data, error };
  if (viewerId && data.user_id && data.user_id !== viewerId) {
    const { data: blocked, error: blockError } = await supabase.rpc('are_users_blocked', { user_a: viewerId, user_b: data.user_id });
    if (blockError) console.error('[PostDeepLink] are_users_blocked failed, failing open', blockError);
    else if (blocked === true) return { data: null, error: null };
  }
  return { data, error: null };
}

export async function mapPublishedPost(row: any, viewer: PostViewerIdentity) {
  const profileRow = row.user_profiles ?? {};
  const courseRow = row.golf_courses ?? null;
  const ratingRow = row.course_ratings ?? null;
      const activityPost: ActivityPost = {
        id: row.id,
        type: 'post',
        content: row.content ?? '',
        likes: row.like_count ?? 0,
        comments: row.comment_count ?? 0,
        shares: 0, // posts has no share_count column; shares are not surfaced here
        timeAgo: '',
        created_at: row.created_at,
        course_id: row.course_id ?? null,
        source_review_id: row.source_review_id ?? null,

        isReview: !!row.source_review_id || row.post_type === 'review',
        rating: ratingRow?.rating ?? undefined,
        course: courseRow ? {
          id: courseRow.id,
          name: courseRow.name,
          country: courseRow.country ?? undefined,
          sub_country: courseRow.sub_country ?? undefined,
          region: courseRow.region ?? undefined,
        } : undefined,
        post_media: (row.post_media ?? []).map((m: any) => ({
          id: m.id,
          media_type: m.media_type,
          media_url: m.media_url,
          aspect_ratio: m.aspect_ratio,
          width: m.width,
          height: m.height,
          poster_url: m.poster_url,
          // Stream-backed videos have a NULL media_url; the playable manifest is
          // built from stream_id downstream (see activityPostMapper).
          stream_id: m.stream_id ?? null,
          duration_seconds: m.duration_seconds,
          display_order: m.display_order,
        })),
        user: {
          id: profileRow.id,
          display_name: profileRow.display_name,
          username: profileRow.username,
          profile_photo_url: profileRow.profile_photo_url,
        },
      };

      // THE LIKED FLAG (§3.1). Resolved through viewer_liked_post, which is the
      // only correct route: round-backed posts store the viewer's like in
      // content_reactions against whs_score_id, not in post_likes, so reading
      // post_likes directly here would report false for every round post.
      let likedByMe = false;
      if (viewer.userId) {
        const { data: liked } = await supabase.rpc('viewer_liked_post', {
          p_post_id: row.id,
          // p_viewer is the ACTOR id (post_likes.actor_id = p_viewer).
          p_viewer: viewer.actorId ?? viewer.userId,
          // The ACTIVE actor's flag, never assumed personal.
          p_actor_type: viewer.actorType,
        });
        likedByMe = liked === true;
      }

      const feedPost = mapActivityPostToFeedPost(activityPost, { isLikedByMe: likedByMe });

      // BUSINESS AUTHORSHIP: mapActivityPostToFeedPost hard-codes the uploader's
      // personal profile, so a shared link to a business post would open as the
      // uploader. Resolve the business once and override the mapped identity.
      // userId stays the uploader — the block check and ownership need it.
      if (row.actor_type === 'business' && row.actor_id) {
        const { data: business } = await supabase
          .from('business_accounts')
          .select('id, name, logo_url, is_verified, slug')
          .eq('id', row.actor_id)
          .maybeSingle();
        // A failed or empty fetch keeps actorType 'business' with an empty
        // name/avatar — NEVER the uploader's profile.
        return {
          ...feedPost,
          actorType: 'business' as const,
          actorId: row.actor_id,
          displayName: business?.name ?? '',
          username: '',
          avatarUrl: business?.logo_url ?? '',
          isVerified: !!business?.is_verified,
        };
      }

      return feedPost;
}

export async function loadPublishedViewerPosts(ids: string[], viewer: PostViewerIdentity) {
  const posts = await Promise.all(ids.map(async (id) => {
    const { data, error } = await loadPublishedPost(id, viewer.userId);
    if (error) throw error;
    return data ? mapPublishedPost(data, viewer) : null;
  }));
  return posts.filter((post): post is NonNullable<typeof post> => post !== null);
}
