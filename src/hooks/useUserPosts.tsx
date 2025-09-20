import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserPostData {
  id: string;
  type: 'video' | 'image';
  src: string;
  thumbnail?: string;
  title?: string;
  created_at: string;
  media?: Array<{
    id: string;
    media_type: 'video' | 'image';
    media_url: string;
  }>;
}

export function useUserPosts(userId: string, enabled: boolean = true) {
  const query = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async (): Promise<UserPostData[]> => {
      if (!userId) return [];

      // For now, return mock data since the exact database structure is unclear
      // This would be replaced with actual Supabase queries once the schema is confirmed
      return Array.from({ length: 6 }, (_, i) => ({
        id: `post-${userId}-${i}`,
        type: i % 2 === 0 ? 'video' : 'image',
        src: `https://images.unsplash.com/photo-${1500000000 + i}?w=300&h=300&fit=crop`,
        thumbnail: `https://images.unsplash.com/photo-${1500000000 + i}?w=300&h=300&fit=crop`,
        title: `User Post ${i + 1}`,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        media: [{
          id: `media-${i}`,
          media_type: i % 2 === 0 ? 'video' : 'image',
          media_url: `https://images.unsplash.com/photo-${1500000000 + i}?w=300&h=300&fit=crop`
        }]
      }));
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });

  return {
    posts: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    }
  };
}