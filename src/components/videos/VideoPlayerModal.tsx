import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { X, ArrowLeft, Play, Heart, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FlickerFreeHLSPlayer from '@/components/ui/FlickerFreeHLSPlayer';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { usePostData } from '@/hooks/usePostData';
import { uidFromNode, generateHlsUrl, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoData {
  id: string;
  title: string;
  creatorUserId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  hlsUrl: string;
  posterUrl: string;
  views: number;
  golfCourseName?: string;
  golfCourseId?: string;
  durationSeconds?: number;
}

/**
 * VideoPlayerModal - YouTube-style fullscreen modal video player
 * 
 * - Route-backed: /video/:videoId
 * - Fullscreen modal with backdrop blur
 * - Resume playback support
 * - Feed stays mounted underneath
 */
export const VideoPlayerModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { videoId } = useParams<{ videoId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  const { fetchPostWithDetails } = usePostData();
  const { progress, shouldResume, resumePosition, updateProgress, clearProgress, isLoading: progressLoading } = useVideoProgress(videoId || '');
  const { likesCount, hasLiked, toggleLike, isTogglingLike } = usePostEngagement(videoId || null);
  
  // Fetch video data on mount
  useEffect(() => {
    if (!videoId) return;
    
    const loadVideo = async () => {
      setIsLoading(true);
      try {
        const post = await fetchPostWithDetails(videoId);
        if (!post) {
          console.error('Post not found');
          navigate(-1);
          return;
        }
        
        // Extract video from post_media
        const media = post.post_media?.[0];
        if (!media) {
          console.error('No media found for post');
          navigate(-1);
          return;
        }
        
        // Get HLS URL and poster
        const uid = uidFromNode(media) || uidFromNode({ media_url: media.media_url });
        const hlsUrl = uid ? generateHlsUrl(uid) : media.media_url;
        const posterUrl = media.poster_url || (uid ? generateThumbnailUrl(uid) : '');
        
        // Get creator info - user is an array from the join
        const user = Array.isArray(post.user) ? post.user[0] : post.user;
        
        // Get golf course tag if present
        const postTags = post.post_tags as any[] | undefined;
        const golfTag = postTags?.find((tag: any) => 
          tag.tagged_entity?.entity_type === 'golf_club' || 
          tag.tagged_entity?.entity_type === 'golf_course'
        );
        
        setVideoData({
          id: post.id,
          title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
          creatorUserId: post.user_id,
          creatorName: user?.display_name || user?.username || 'Unknown',
          creatorAvatarUrl: user?.profile_photo_url,
          hlsUrl,
          posterUrl,
          views: 0, // We'll add views tracking later
          golfCourseName: golfTag?.tagged_entity?.name,
          golfCourseId: golfTag?.tagged_entity?.entity_id,
          durationSeconds: media.duration_seconds,
        });
      } catch (err) {
        console.error('Error loading video:', err);
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVideo();
  }, [videoId, fetchPostWithDetails, navigate]);
  
  // Handle resume logic once progress is loaded
  useEffect(() => {
    if (progressLoading || !videoData || hasAutoStarted) return;
    
    if (shouldResume && resumePosition > 0) {
      setShowResumeOverlay(true);
    } else {
      setHasAutoStarted(true);
    }
  }, [progressLoading, videoData, shouldResume, resumePosition, hasAutoStarted]);
  
  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  const handleClose = useCallback(() => {
    // Use history.back() if there's history, otherwise navigate to discover
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/discover?main=videos');
    }
  }, [navigate]);
  
  const handleCreatorClick = () => {
    if (videoData?.creatorUserId) {
      navigate(`/creator/${videoData.creatorUserId}`);
    }
  };
  
  const handleResumeClick = () => {
    setShowResumeOverlay(false);
    setHasAutoStarted(true);
    
    // Seek to resume position after video starts
    setTimeout(() => {
      const video = videoRef.current;
      if (video && resumePosition > 0) {
        video.currentTime = resumePosition;
      }
    }, 100);
  };
  
  const handleStartFromBeginning = () => {
    setShowResumeOverlay(false);
    setHasAutoStarted(true);
  };
  
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    updateProgress(video.currentTime, video.duration);
  }, [updateProgress]);
  
  const handleVideoEnded = useCallback(() => {
    clearProgress();
  }, [clearProgress]);
  
  // Swipe down to dismiss (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    
    const deltaY = e.touches[0].clientY - startYRef.current;
    // If swiped down more than 100px, dismiss
    if (deltaY > 100) {
      handleClose();
      startYRef.current = null;
    }
  };
  
  const handleTouchEnd = () => {
    startYRef.current = null;
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          {!isLoading && videoData && (
            <button
              onClick={handleCreatorClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8 border border-white/20">
                <AvatarImage src={videoData.creatorAvatarUrl} alt={videoData.creatorName} />
                <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                  {videoData.creatorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">{videoData.creatorName}</span>
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors md:hidden"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
      
      {/* Video area - centered 16:9 */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        {isLoading ? (
          <div className="w-full max-w-4xl aspect-video bg-muted/20 rounded-xl animate-pulse flex items-center justify-center">
            <Play className="h-12 w-12 text-white/30" />
          </div>
        ) : videoData ? (
          <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black">
            <FlickerFreeHLSPlayer
              ref={videoRef}
              hlsUrl={videoData.hlsUrl}
              poster={videoData.posterUrl}
              autoplay={hasAutoStarted && !showResumeOverlay}
              loop={false}
              muted={false}
              className="w-full h-full"
              objectFit="contain"
              showMuteButton={false}
              onEnded={handleVideoEnded}
            />
            
            {/* Resume overlay */}
            {showResumeOverlay && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-white/70 text-sm">Resume watching?</p>
                  <Button
                    onClick={handleResumeClick}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Play className="h-4 w-4" />
                    Resume at {formatTime(resumePosition)}
                  </Button>
                  <button
                    onClick={handleStartFromBeginning}
                    className="text-white/60 hover:text-white text-sm underline"
                  >
                    Start from beginning
                  </button>
                </div>
              </div>
            )}
            
            {/* Time update listener */}
            {hasAutoStarted && (
              <video
                ref={(el) => {
                  if (el && videoRef.current !== el) {
                    // This is just to add the timeupdate listener to the actual video element
                  }
                }}
                onTimeUpdate={handleTimeUpdate}
                className="hidden"
              />
            )}
          </div>
        ) : null}
      </div>
      
      {/* Bottom info area */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-6 bg-gradient-to-t from-black/80 to-transparent">
        {isLoading ? (
          <div className="max-w-4xl mx-auto space-y-3">
            <Skeleton className="h-6 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-1/4 bg-white/10" />
          </div>
        ) : videoData ? (
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Title */}
            <h1 className="text-white text-lg md:text-xl font-semibold line-clamp-2">
              {videoData.title}
            </h1>
            
            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Views */}
              <span className="text-white/60 text-sm">
                {formatViews(videoData.views)}
              </span>
              
              {/* Like button */}
              <button
                onClick={() => toggleLike()}
                disabled={isTogglingLike}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                  hasLiked 
                    ? "bg-red-500/20 text-red-400" 
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
              >
                <Heart 
                  className={cn("h-4 w-4", hasLiked && "fill-current")} 
                />
                <span className="text-sm font-medium">{likesCount}</span>
              </button>
              
              {/* Course badge */}
              {videoData.golfCourseName && (
                <Badge variant="secondary" className="bg-white/10 text-white/80 hover:bg-white/20 gap-1">
                  <MapPin className="h-3 w-3" />
                  {videoData.golfCourseName}
                </Badge>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VideoPlayerModal;