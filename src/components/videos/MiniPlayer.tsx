import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideoPlaybackSafe } from '@/context/VideoPlaybackContext';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { usePostData } from '@/hooks/usePostData';
import { uidFromNode, generateHlsUrl, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import Hls from 'hls.js';

/**
 * MiniPlayer - YouTube-style mini video player
 * 
 * - Persists at bottom-right when user closes full player
 * - Shows thumbnail, title, play/pause, close
 * - Tap to reopen full player
 * - Auto-resumes from progress
 */
export const MiniPlayer: React.FC = () => {
  const context = useVideoPlaybackSafe();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{
    title: string;
    creatorName: string;
    thumbnailUrl: string;
    hlsUrl: string;
  } | null>(null);
  
  const { fetchPostWithDetails } = usePostData();
  
  // Only render if context exists and mini player is open
  if (!context || !context.isMiniOpen || !context.activeVideoId) {
    return null;
  }

  const { activeVideoId, isMiniOpen, miniMeta, closeMini, openFull } = context;
  
  // Use progress hook for resume
  const { shouldResume, resumePosition, updateProgress } = useVideoProgress(activeVideoId);

  // Fetch video data if not provided via meta
  useEffect(() => {
    if (!activeVideoId) return;
    
    // If we have meta from context, use it
    if (miniMeta) {
      setVideoMeta({
        title: miniMeta.title,
        creatorName: miniMeta.creatorName,
        thumbnailUrl: miniMeta.thumbnailUrl,
        hlsUrl: miniMeta.hlsUrl,
      });
      return;
    }

    // Otherwise fetch
    const loadVideo = async () => {
      try {
        const post = await fetchPostWithDetails(activeVideoId);
        if (!post) return;
        
        const media = post.post_media?.[0];
        if (!media) return;
        
        const uid = uidFromNode(media) || uidFromNode({ media_url: media.media_url });
        const hlsUrl = uid ? generateHlsUrl(uid) : media.media_url;
        const thumbnailUrl = media.poster_url || (uid ? generateThumbnailUrl(uid) : '');
        
        const user = Array.isArray(post.user) ? post.user[0] : post.user;
        
        setVideoMeta({
          title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
          creatorName: user?.display_name || user?.username || 'Unknown',
          thumbnailUrl,
          hlsUrl,
        });
      } catch (err) {
        console.error('MiniPlayer: Failed to load video', err);
      }
    };
    
    loadVideo();
  }, [activeVideoId, miniMeta, fetchPostWithDetails]);

  // Setup HLS when we have the URL
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoMeta?.hlsUrl) return;

    const setupHls = () => {
      // Cleanup previous
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,
        });
        hls.loadSource(videoMeta.hlsUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Apply pending seek if we have resume position
          if (shouldResume && resumePosition > 0) {
            pendingSeekRef.current = resumePosition;
          }
          video.play().catch(() => {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoMeta.hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          if (shouldResume && resumePosition > 0) {
            video.currentTime = resumePosition;
          }
          video.play().catch(() => {});
        }, { once: true });
      }
    };

    setupHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoMeta?.hlsUrl, shouldResume, resumePosition]);

  // Apply pending seek on canplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      if (pendingSeekRef.current !== null) {
        video.currentTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    return () => video.removeEventListener('canplay', handleCanPlay);
  }, []);

  // Track play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Progress tracking (throttled)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastUpdate = 0;
    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate >= 5000 && video.duration > 0) {
        updateProgress(video.currentTime, video.duration);
        lastUpdate = now;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [updateProgress]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Flush progress before closing
    const video = videoRef.current;
    if (video && video.duration > 0) {
      updateProgress(video.currentTime, video.duration);
    }
    closeMini();
  };

  const handleOpenFull = () => {
    // Flush progress
    const video = videoRef.current;
    if (video && video.duration > 0) {
      updateProgress(video.currentTime, video.duration);
    }
    openFull(activeVideoId);
  };

  if (!videoMeta) {
    // Loading state
    return (
      <div className="fixed bottom-20 right-4 z-[90] w-80 bg-zinc-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-right-5 fade-in duration-300">
        <div className="flex items-center gap-3 p-3">
          <div className="w-24 aspect-video bg-white/10 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-20 right-4 z-[90] w-80 bg-zinc-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-white/20 transition-colors animate-in slide-in-from-right-5 fade-in duration-300"
      onClick={handleOpenFull}
    >
      <div className="flex items-center gap-3 p-2">
        {/* Video thumbnail / actual video */}
        <div className="relative w-28 aspect-video rounded overflow-hidden bg-black shrink-0">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted={false}
            poster={videoMeta.thumbnailUrl}
          />
          
          {/* Play/Pause overlay */}
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-white/90" fill="currentColor" />
            ) : (
              <Play className="h-6 w-6 text-white/90 ml-0.5" fill="currentColor" />
            )}
          </button>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0 py-1">
          <h4 className="text-white text-sm font-medium line-clamp-2 leading-tight">
            {videoMeta.title}
          </h4>
          <p className="text-white/50 text-xs mt-1 truncate">
            {videoMeta.creatorName}
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <X className="h-5 w-5 text-white/70 hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;
