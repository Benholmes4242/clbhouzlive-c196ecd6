import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

export function useFollowingFeed(pageSize = 12) {
  const [videos, setVideos] = useState<ExploreContentItem[]>([]);
  const [photos, setPhotos] = useState<ExploreContentItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const nextOffset = reset ? 0 : offset;

      // Get followed user ids
      const { data: following, error: fErr } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (fErr) throw fErr;
      const followedIds = (following ?? []).map(f => f.following_id);
      
      if (followedIds.length === 0) {
        setVideos([]);
        setPhotos([]);
        setHasMoreVideos(false);
        setHasMorePhotos(false);
        setLoading(false);
        return;
      }

      // Build visibility filter
      const visibilityFilter = buildVisibilityFilter(user.id);
      
      // Fetch videos from followed users
      const { data: videoPosts, error: vErr } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, badges,
          post_media!inner (id, media_type, media_url, duration_seconds, width, height, filter_id, studio_edits)
        `)
        .in('user_id', followedIds)
        .eq('post_media.media_type', 'video')
        .or(visibilityFilter)
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .range(nextOffset, nextOffset + pageSize - 1);

      if (vErr) throw vErr;

      // Fetch photos from followed users
      const { data: photoPosts, error: pErr } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, badges,
          post_media!inner (id, media_type, media_url, width, height, filter_id, studio_edits)
        `)
        .in('user_id', followedIds)
        .eq('post_media.media_type', 'image')
        .or(visibilityFilter)
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .range(nextOffset, nextOffset + pageSize - 1);

      if (pErr) throw pErr;

      // Get unique user IDs
      const allPosts = [...(videoPosts ?? []), ...(photoPosts ?? [])];
      const userIds = [...new Set(allPosts.map(post => post.user_id))];
      
      // Get user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      const mapPost = (post: any, kind: 'video' | 'image'): ExploreContentItem | null => {
        const m = post.post_media?.[0];
        if (!m) return null;
        
        const isValid =
          (kind === 'image' && isValidImageUrl(m.media_url)) ||
          (kind === 'video' && !!m.media_url);
          
        if (!isValid) return null;

        const userProfile = profiles?.find(p => p.id === post.user_id);
        
        return {
          id: post.id,
          type: kind,
          src: m.media_url,
          duration: m.duration_seconds ? `${m.duration_seconds}s` : undefined,
          durationSeconds: m.duration_seconds ?? undefined,
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username || undefined,
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          },
          title: post.content || '',
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          isFollowing: true,
          badges: post.badges || [],
        };
      };

      const newVideos = (videoPosts ?? []).map((p: any) => mapPost(p, 'video')).filter(Boolean) as ExploreContentItem[];
      const newPhotos = (photoPosts ?? []).map((p: any) => mapPost(p, 'image')).filter(Boolean) as ExploreContentItem[];

      setVideos(prev => reset ? newVideos : [...prev, ...newVideos]);
      setPhotos(prev => reset ? newPhotos : [...prev, ...newPhotos]);
      setHasMoreVideos((videoPosts ?? []).length === pageSize);
      setHasMorePhotos((photoPosts ?? []).length === pageSize);
      setOffset(nextOffset + pageSize);
      setLoading(false);
    } catch (error) {
      console.error('Error loading following feed:', error);
      setLoading(false);
    }
  }, [offset, pageSize]);

  useEffect(() => {
    load(true);
  }, []); // Initial load

  return {
    videos,
    photos,
    loading,
    hasMoreVideos,
    hasMorePhotos,
    loadMore: () => load(false),
    reset: () => load(true),
  };
}
