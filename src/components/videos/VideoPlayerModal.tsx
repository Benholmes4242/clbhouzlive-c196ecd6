// [VIDEOSTUB] Poster-only: video engine severed (Stage E).
// The /video/:videoId route renders a poster + basic metadata card until the
// new engine lands. All queue/progress/autoplay flows removed.
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Play } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostData } from '@/hooks/usePostData';
import {
  uidFromNode,
  generateThumbnailUrl,
} from '@/utils/cloudflareStreamTransform';

interface VideoData {
  id: string;
  title: string;
  description: string;
  creatorUserId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  posterUrl: string;
}

export const VideoPlayerModal: React.FC = () => {
  const navigate = useNavigate();
  const { videoId } = useParams<{ videoId: string }>();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchPostWithDetails } = usePostData();

  const handleClose = useCallback(() => {
    if (window.history.length > 2) navigate(-1);
    else navigate('/watch');
  }, [navigate]);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const post = await fetchPostWithDetails(videoId);
        if (!post || cancelled) {
          if (!cancelled) handleClose();
          return;
        }
        const media = post.post_media?.[0];
        const uid = media ? uidFromNode(media) : '';
        const posterUrl =
          media?.poster_url || (uid ? generateThumbnailUrl(uid) : '');
        const user = Array.isArray(post.user) ? post.user[0] : post.user;
        if (cancelled) return;
        setVideoData({
          id: post.id,
          title:
            post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
          description: post.content || '',
          creatorUserId: post.user_id,
          creatorName: user?.display_name || 'Golfer',
          creatorAvatarUrl: user?.profile_photo_url,
          posterUrl,
        });
      } catch (err) {
        console.error('Error loading video:', err);
        if (!cancelled) handleClose();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoId, fetchPostWithDetails, handleClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
        <span className="text-xs uppercase tracking-wider text-white/60">
          Video
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative aspect-video w-full bg-black">
          {isLoading ? (
            <Skeleton className="absolute inset-0" />
          ) : videoData?.posterUrl ? (
            <img
              src={videoData.posterUrl}
              alt={videoData.title}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-900" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        </div>

        {videoData && (
          <div className="px-4 py-5 text-white">
            <h1 className="text-lg font-semibold mb-3">{videoData.title}</h1>
            <button
              onClick={() =>
                navigate(`/profile/${videoData.creatorUserId}`)
              }
              className="flex items-center gap-3"
            >
              <SquircleAvatar
                src={videoData.creatorAvatarUrl}
                alt={videoData.creatorName}
                size={40}
              />
              <span className="text-sm font-medium">
                {videoData.creatorName}
              </span>
            </button>
            {videoData.description && (
              <p className="mt-4 text-sm text-white/80 whitespace-pre-wrap">
                {videoData.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;
