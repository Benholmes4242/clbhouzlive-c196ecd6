import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

type RawMedia = {
  id: string;
  media_type: 'image' | 'video';
  media_url: string | null;
  poster_url: string | null;
  post_id: string;
};

type NormalizedMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;          // image url for images, hls/mp4 url for videos
  posterUrl?: string;   // ALWAYS present for videos after normalization
  postId: string;
};

interface UserPost {
  id: string;
  content: string | null;
  created_at: string;
  badges?: string[];
  post_media: NormalizedMedia[];
}

/** Ensure videos always get a posterUrl (1s frame) */
function ensurePosterForVideo(m: RawMedia): string | undefined {
  if (m.media_type !== 'video') return undefined;
  // try DB poster first
  if (m.poster_url) return m.poster_url;

  // derive from stream url/id using existing utils
  const id = getStreamIdFromUrl(m.media_url ?? '');
  if (!id) return undefined;

  // 1s is what's used elsewhere in the app
  return getStreamPoster(id, '1s'); // returns stable jpeg thumbnail url
}

export const useUserProfilePosts = (userId: string | null) => {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        setLoading(true);

        // Get current user for visibility filtering
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const visibilityFilter = buildVisibilityFilter(currentUser?.id ?? null);
        
        // For profile owner viewing their own profile, show all their posts
        // For others, apply visibility filter
        const isOwnProfile = currentUser?.id === userId;

        // Fetch personal posts for this profile (actor-scoped, not user_id)
        let query = supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            badges
          `)
          .eq('actor_type', 'personal')
          .eq('actor_id', userId)
          .eq('status', 'published') // Only show published posts
          .order('created_at', { ascending: false })
          .limit(9); // Show latest 9 posts
        
        // Apply visibility filter only when viewing someone else's profile
        if (!isOwnProfile) {
          query = query.or(visibilityFilter);
        }
        
        const { data: postsData, error: postsError } = await query;

        if (postsError) {
          console.error('Error fetching user posts:', postsError);
          setError('Failed to load posts');
          return;
        }

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          return;
        }

        // Fetch media for these posts
        const postIds = postsData.map(p => p.id);
        const { data: mediaData, error: mediaError } = await supabase
          .from('post_media')
          .select('id, media_type, media_url, poster_url, post_id')
          .in('post_id', postIds);

        if (mediaError) {
          console.error('Error fetching post media:', mediaError);
          // Still show posts even if media fails
        }

        // Combine posts with their media using normalization
        const formattedPosts = postsData.map(post => {
          const medias: NormalizedMedia[] = (mediaData?.filter(m => m.post_id === post.id) || []).map((m: any) => {
            const rawMedia: RawMedia = {
              id: m.id,
              media_type: m.media_type as 'image' | 'video',
              media_url: m.media_url,
              poster_url: m.poster_url,
              post_id: m.post_id
            };

            const posterUrl = rawMedia.media_type === 'video'
              ? ensurePosterForVideo(rawMedia)
              : undefined;

            return {
              id: rawMedia.id,
              type: rawMedia.media_type,
              url: rawMedia.media_url ?? '',       // image src for images, hls/mp4 url for videos (not used by <img>)
              posterUrl,                           // populated for videos
              postId: rawMedia.post_id,
            };
          });

          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            badges: post.badges || [],
            post_media: medias
          };
        });

        // Only include posts that have media
        const postsWithMedia = formattedPosts.filter(post => post.post_media.length > 0);
        setPosts(postsWithMedia);

      } catch (error) {
        console.error('Error in fetchUserPosts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId]);

  return {
    posts,
    loading,
    error,
    isEmpty: !loading && posts.length === 0
  };
};