import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ITEMS_PER_PAGE = 20;

export interface ChannelVideo {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profiles: {
    id: string;
    display_name: string;
    username: string;
    profile_photo_url: string | null;
    is_verified?: boolean;
  };
  post_media: Array<{
    id: string;
    media_type: string;
    media_url: string;
    duration_seconds: number | null;
    poster_url: string | null;
    stream_id: string | null;
    width: number | null;
    height: number | null;
  }>;
  post_tags?: Array<{
    id: string;
    tagged_entity_id: string;
    taggable_entities: {
      id: string;
      entity_type: string;
      name: string;
    };
  }>;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
}

interface UseChannelsFeedProps {
  subFilter?: string;
}

export const useChannelsFeed = ({ subFilter = 'all' }: UseChannelsFeedProps = {}) => {
  return useInfiniteQuery({
    queryKey: ['channels-feed', subFilter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user_profiles!inner (
            id,
            display_name,
            username,
            profile_photo_url
          ),
          post_media!inner (
            id,
            media_type,
            media_url,
            duration_seconds,
            poster_url,
            stream_id,
            width,
            height
          ),
          post_tags (
            id,
            tagged_entity_id,
            taggable_entities (
              id,
              entity_type,
              name
            )
          )
        `)
        .eq('post_media.media_type', 'video')
        .gt('post_media.duration_seconds', 180);

      // Apply subfilter ordering and filtering
      if (subFilter === 'new') {
        query = query.order('created_at', { ascending: false });
      } else if (subFilter === 'popular') {
        // For now, order by created_at desc (will wire metrics later)
        query = query.order('created_at', { ascending: false });
      } else if (subFilter !== 'all') {
        // Category-based filters (golf-tips, equipment, on-course, interviews)
        // Filter client-side based on tags or content
        query = query.order('created_at', { ascending: false });
      } else {
        // Default: all
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query
        .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Apply client-side category filtering if needed
      let filteredData = data || [];
      if (subFilter && subFilter !== 'all' && subFilter !== 'new' && subFilter !== 'popular') {
        filteredData = filteredData.filter(post => {
          const categoryKeywords: Record<string, string[]> = {
            'golf-tips': ['tip', 'lesson', 'instruction', 'drill', 'technique'],
            'equipment': ['club', 'equipment', 'gear', 'review', 'putter', 'driver', 'iron'],
            'on-course': ['course', 'vlog', 'playing', 'round', 'hole'],
            'interviews': ['interview', 'talk', 'conversation', 'chat', 'q&a']
          };

          const keywords = categoryKeywords[subFilter] || [];
          const contentLower = (post.content || '').toLowerCase();
          
          // Check tags
          const hasTag = post.post_tags?.some(tag => 
            keywords.some(kw => tag.taggable_entities.name.toLowerCase().includes(kw))
          );
          
          // Check content
          const hasKeyword = keywords.some(kw => contentLower.includes(kw));
          
          return hasTag || hasKeyword;
        });
      }

      return {
        items: filteredData as any[],
        nextPage: (data?.length || 0) === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};
