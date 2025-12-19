import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HeroItem } from '@/components/discover/DiscoverHero';
import { getStreamPoster } from '@/utils/stream';

/**
 * Fetches a single hero item for the Watch tab.
 * Currently selects a trending/featured video from recent posts.
 * In future, this could be editorially curated.
 */
export function useDiscoverHero() {
  return useQuery({
    queryKey: ['discover-hero'],
    queryFn: async (): Promise<HeroItem | null> => {
      // Fetch recent video posts with their media
      const { data, error } = await supabase
        .from('post_media')
        .select(`
          id,
          media_url,
          media_type,
          poster_url,
          post_id,
          posts!inner (
            id,
            content,
            created_at,
            course_id,
            user_id,
            user_profiles!posts_user_id_fkey (
              id,
              display_name,
              username
            ),
            golf_courses!posts_course_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        console.error('Failed to fetch hero item:', error);
        return null;
      }

      // Pick one with good content (has caption, has course or creator info)
      const candidates = data.filter(media => {
        const post = media.posts as any;
        return post?.content && 
          post.content.length > 10 && 
          (post.user_profiles || post.golf_courses);
      });

      const selected = candidates[0] || data[0];
      if (!selected) return null;

      const post = selected.posts as any;
      const userProfile = post?.user_profiles;
      const course = post?.golf_courses;

      // Determine sub-context (prefer course for golf context)
      const hasCourseName = course?.name;
      const hasCreatorName = userProfile?.display_name;

      return {
        id: post?.id || selected.post_id,
        contextLabel: 'Trending in golf',
        title: post?.content?.slice(0, 100) || 'Watch now',
        subContext: hasCourseName ? course.name : (hasCreatorName || 'Unknown'),
        subContextType: hasCourseName ? 'course' : 'creator',
        mediaUrl: selected.media_url || '',
        mediaType: 'video',
        posterUrl: selected.poster_url || getStreamPoster(selected.media_url, '2s') || undefined,
        ctaLabel: 'Watch',
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}
