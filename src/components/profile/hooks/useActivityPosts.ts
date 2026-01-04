
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityPost } from '../types/ActivityTypes';
import { postKeys } from '@/queryKeys/posts';

/**
 * Fetches activity posts for a personal profile.
 * Cache invalidation is handled globally by PostEventsBridge.
 * Now includes review data (categories, source_review_id, rating) for overlay display.
 */
export const useActivityPosts = (actorId?: string) => {
  const query = useQuery({
    queryKey: postKeys.actorPosts('personal', actorId ?? ''),
    enabled: !!actorId,
    queryFn: async (): Promise<ActivityPost[]> => {
      if (!actorId) return [];

      const [postsRes, profileRes] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            actor_type,
            actor_id,
            course_id,
            badges,
            categories,
            source_review_id,
            post_media (
              id,
              media_type,
              media_url,
              poster_url,
              aspect_ratio,
              duration_seconds,
              filter_id,
              studio_edits
            ),
            post_tags (
              id,
              tagged_entity_id,
              start_index,
              end_index,
              taggable_entities (
                id,
                entity_type,
                entity_id,
                name,
                username
              )
            ),
            course:golf_courses!course_id (
              id,
              name,
              country,
              sub_country,
              region
            )
          `)
          .eq('actor_type', 'personal')
          .eq('actor_id', actorId)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .eq('id', actorId)
          .single(),
      ]);

      if (postsRes.error) {
        console.error('ActivityPosts - Error with posts query:', postsRes.error);
        return [];
      }

      const postsData = postsRes.data ?? [];
      const userProfile = profileRes.data;

      // Batch fetch ratings for posts with source_review_id
      const reviewIds = postsData
        .filter((p: any) => p.source_review_id)
        .map((p: any) => p.source_review_id);
      
      let ratingsMap = new Map<string, number>();
      if (reviewIds.length > 0) {
        const { data: ratings } = await supabase
          .from('course_ratings')
          .select('id, rating')
          .in('id', reviewIds);
        
        if (ratings) {
          ratingsMap = new Map(ratings.map(r => [r.id, r.rating]));
        }
      }

      return postsData
        .filter((post: any) => {
          const hasContent = post.content && post.content.trim().length > 0;
          const hasMedia = post.post_media && post.post_media.length > 0;
          return hasContent || hasMedia;
        })
        .map((post: any) => {
          const tags =
            post.post_tags?.map((tag: any) => ({
              id: tag.id,
              post_id: post.id,
              tagged_entity_id: tag.tagged_entity_id,
              entity_type: tag.taggable_entities?.entity_type,
              entity_id: tag.taggable_entities?.entity_id,
              name: tag.taggable_entities?.name,
              username: tag.taggable_entities?.username,
              tagged_entity: tag.taggable_entities,
            })) || [];

          // Determine if this is a review post
          const isReview = 
            (Array.isArray(post.categories) && post.categories.includes('review')) ||
            !!post.source_review_id;

          // Get rating if available
          const rating = post.source_review_id 
            ? ratingsMap.get(post.source_review_id) 
            : undefined;

          // Get course info
          const course = post.course;

          return {
            id: post.id,
            type: 'post' as const,
            content: post.content || '',
            likes: 0,
            comments: 0,
            shares: 0,
            timeAgo: new Date(post.created_at).toLocaleDateString(),
            created_at: post.created_at,
            course_id: post.course_id || null,
            badges: post.badges || [],
            categories: post.categories || [],
            source_review_id: post.source_review_id || null,
            isReview,
            rating,
            course: course ? {
              id: course.id,
              name: course.name,
              country: course.country,
              sub_country: course.sub_country,
              region: course.region,
            } : undefined,
            post_media: (post.post_media || []).map((media: any) => ({
              id: media.id,
              media_type: media.media_type as 'image' | 'video',
              media_url: media.media_url,
              poster_url: media.poster_url,
              aspect_ratio: media.aspect_ratio,
              duration_seconds: media.duration_seconds,
              filter_id: media.filter_id,
              studio_edits: media.studio_edits,
            })),
            post_tags: tags,
            user: {
              id: actorId,
              display_name: userProfile?.display_name || null,
              username: userProfile?.username || null,
              profile_photo_url: userProfile?.profile_photo_url || null,
            },
            image: post.post_media?.find((m: any) => m.media_type === 'image')?.media_url,
          };
        });
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    posts: query.data ?? [],
    loading: query.isLoading,
    fetchUserPosts: query.refetch,
  };
};

