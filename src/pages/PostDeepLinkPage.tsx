/**
 * PostDeepLinkPage - Handles /post/:postId deep links
 * Fetches the post and opens it in the fullscreen viewer
 */

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { FullscreenMediaItem, FullscreenMediaItemMedia } from '@/media/hooks/useFullscreenViewer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

// Lazy load the fullscreen viewer
const FullscreenMediaViewer = lazy(() => 
  import('@/media/fullscreen/FullscreenMediaViewer').then(m => ({ default: m.FullscreenMediaViewer }))
);

// Type for the post query result
interface PostQueryResult {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  course_id: string | null;
  like_count: number;
  comment_count: number;
  post_media: {
    id: string;
    media_url: string | null;
    media_type: string;
    poster_url: string | null;
    aspect_ratio: number | null;
    width: number | null;
    height: number | null;
    display_order: number | null;
  }[];
  user_profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
    home_club: string | null;
    eg_handicap_index: number | null;
  } | null;
  golf_courses: {
    id: string;
    name: string;
    country: string | null;
    region: string | null;
  } | null;
}

const PostDeepLinkPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenItems, setFullscreenItems] = useState<FullscreenMediaItem[]>([]);
  
  const handleClose = () => {
    navigate('/clubhouse');
  };

  useEffect(() => {
    async function loadPost() {
      if (!postId) {
        setError('No post ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the post with all related data
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            course_id,
            like_count,
            comment_count,
            post_media (
              id,
              media_url,
              media_type,
              poster_url,
              aspect_ratio,
              width,
              height,
              display_order
            ),
            user_profiles!posts_user_profile_id_fkey (
              id,
              username,
              display_name,
              profile_photo_url,
              home_club,
              eg_handicap_index
            ),
            golf_courses (
              id,
              name,
              country,
              region
            )
          `)
          .eq('id', postId)
          .maybeSingle();

        if (fetchError) {
          console.error('[PostDeepLinkPage] Fetch error:', fetchError);
          setError('Failed to load post');
          setIsLoading(false);
          return;
        }
        
        if (!data) {
          setError('Post not found');
          setIsLoading(false);
          return;
        }

        // Cast to expected type (Supabase types don't handle FK hints well)
        const post = data as unknown as PostQueryResult;

        // Sort media by display_order
        const sortedMedia = (post.post_media || []).sort((a, b) => 
          (a.display_order || 0) - (b.display_order || 0)
        );

        if (sortedMedia.length === 0) {
          setError('Post has no media');
          setIsLoading(false);
          return;
        }

        const firstMedia = sortedMedia[0];
        
        // Extract stream ID for video posters
        const firstStreamId = firstMedia.media_url 
          ? uidFromNode({ src: firstMedia.media_url }) 
          : undefined;
        
        // Build allMedia array for carousel
        const allMedia: FullscreenMediaItemMedia[] = sortedMedia.map((m) => {
          const streamId = m.media_url ? uidFromNode({ src: m.media_url }) : undefined;
          return {
            id: m.id,
            mediaUrl: m.media_url || '',
            mediaType: (m.media_type || 'image') as 'video' | 'image',
            streamId,
            posterUrl: streamId 
              ? generateStreamThumbnailUrl(streamId, { height: 720 })
              : m.poster_url || undefined,
            aspectRatio: m.aspect_ratio || undefined,
          };
        });

        // Build the fullscreen item directly
        const fullscreenItem: FullscreenMediaItem = {
          id: post.id,
          postId: post.id,
          mediaIndex: 0,
          mediaUrl: firstMedia.media_url || '',
          mediaType: (firstMedia.media_type || 'image') as 'video' | 'image',
          streamId: firstStreamId,
          posterUrl: firstStreamId 
            ? generateStreamThumbnailUrl(firstStreamId, { height: 720 })
            : firstMedia.poster_url || undefined,
          aspectRatio: firstMedia.aspect_ratio || undefined,
          width: firstMedia.width || undefined,
          height: firstMedia.height || undefined,
          creatorId: post.user_profiles?.id || post.user_id,
          creatorName: post.user_profiles?.display_name || 'User',
          creatorAvatar: post.user_profiles?.profile_photo_url || undefined,
          creatorUsername: post.user_profiles?.username || '',
          creatorHomeClub: post.user_profiles?.home_club || undefined,
          creatorHandicap: post.user_profiles?.eg_handicap_index,
          caption: post.content || undefined,
          likeCount: post.like_count || 0,
          commentCount: post.comment_count || 0,
          isLiked: false,
          isBookmarked: false,
          courseId: post.golf_courses?.id || post.course_id || undefined,
          courseName: post.golf_courses?.name || undefined,
          courseCountry: post.golf_courses?.country || undefined,
          courseRegion: post.golf_courses?.region || undefined,
          allMedia,
        };

        setFullscreenItems([fullscreenItem]);
      } catch (err) {
        console.error('[PostDeepLinkPage] Error loading post:', err);
        setError('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 text-white">
        <p className="text-lg mb-4">{error}</p>
        <button 
          onClick={() => navigate('/clubhouse')}
          className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
        >
          Go to Clubhouse
        </button>
      </div>
    );
  }

  if (fullscreenItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 text-white">
        <p className="text-lg mb-4">Unable to display post</p>
        <button 
          onClick={() => navigate('/clubhouse')}
          className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
        >
          Go to Clubhouse
        </button>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    }>
      <FullscreenMediaViewer 
        isOpen={true}
        items={fullscreenItems}
        initialIndex={0}
        context="notification"
        onClose={handleClose}
        showComments={true}
        showShare={true}
        showActionRail={true}
        showCreatorCapsule={true}
      />
    </Suspense>
  );
};

export default PostDeepLinkPage;
