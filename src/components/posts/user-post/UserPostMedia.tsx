import React, { useMemo } from 'react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import CoursePostBadge from '../CoursePostBadge';
import { PostMedia, GolfCourse, PostMusicData } from './types';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';
import SoundtrackStrip from '@/components/studio/SoundtrackStrip';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { useToast } from '@/hooks/use-toast';

interface UserPostMediaProps {
  media: PostMedia[];
  golfCourse: GolfCourse | null;
  /** Raw course ID for safety net - show badge even if full course lookup failed */
  rawCourseId?: string | null;
  shouldAutoplay: boolean;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  isClubhouse?: boolean;
  /** Post-level music (new - takes priority over legacy per-media music) */
  postMusic?: PostMusicData | null;
  /** Post-level audio mode */
  audioMode?: 'original' | 'music_only' | null;
}

export const UserPostMedia: React.FC<UserPostMediaProps> = ({
  media,
  golfCourse,
  rawCourseId,
  shouldAutoplay,
  onMediaClick,
  isClubhouse = false,
  postMusic,
  audioMode
}) => {
  const { toast } = useToast();

  // Resolve music: post-level takes priority, fallback to legacy per-media
  const { postHasMusic, activeMusic } = useMemo(() => {
    // Check post-level music first (new)
    if (postMusic?.url || postMusic?.r2Key) {
      return { postHasMusic: true, activeMusic: postMusic };
    }
    
    // Fallback to legacy per-media music
    for (const m of media) {
      const legacyMusic = (m.studio_edits as any)?.music;
      if (legacyMusic?.url || legacyMusic?.r2Key) {
        return { postHasMusic: true, activeMusic: legacyMusic as PostMusicData };
      }
    }
    
    return { postHasMusic: false, activeMusic: null };
  }, [postMusic, media]);

  const handleMuteBlocked = () => {
    toast({
      description: "Original audio is muted because a track is applied.",
      duration: 2000,
    });
  };

  if (!media || media.length === 0) return null;

  const carouselItems = media.map((mediaItem, index) => {
    // Use filter_id first (new column), fallback to studio_edits.filter (old data)
    const studioEdits = mediaItem.studio_edits as any;
    const filterId = mediaItem.filter_id || studioEdits?.filter;
    const filterClass = getFilterClass(filterId);
    const cropClass = getCropWrapperClass(studioEdits?.crop);
    const pixelStyle = getPixelLayerStyle(studioEdits);
    
    // Extract text overlays from studio_edits
    const textOverlays = studioEdits?.textOverlays || [];
    
    console.log('[Feed] slide filter', {
      postMediaId: mediaItem.id,
      filterId,
      filterClass,
      postHasMusic,
    });
    
    // Safety net: show badge if we have course data OR if we have a raw course ID
    const courseToShow = golfCourse || (rawCourseId ? {
      id: rawCourseId,
      name: 'Golf Course', // Fallback name
      country: '',
      region: ''
    } : null);
    
    return (
      <div key={mediaItem.id} className="w-full aspect-square relative">
        {/* Golf Course Badge overlay on each media item */}
        {courseToShow && (
          <div className="absolute top-2 right-2 z-10">
            <CoursePostBadge 
              course={{
                id: courseToShow.id,
                name: courseToShow.name,
                country: courseToShow.country,
                region: courseToShow.region
              }}
              className={isClubhouse ? "m-0" : "m-0"}
              isClubhouse={isClubhouse}
            />
          </div>
        )}
        
        <div className={cn("w-full h-full", cropClass)}>
          {mediaItem.media_type === 'image' ? (
            <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
              <img
                src={mediaItem.media_url}
                alt="Post content"
                className="w-full h-full object-cover object-center cursor-pointer"
                loading="lazy"
                onClick={() => onMediaClick(mediaItem.media_url, 'image')}
              />
            </div>
          ) : (
            <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
              <EnhancedVideoPlayer
                src={mediaItem.media_url}
                autoplay={shouldAutoplay}
                muted={true}  // Always muted in feed - music handled separately
                loop={true}
                className="w-full h-full"
                enableHLS={true}
                onClick={() => onMediaClick(mediaItem.media_url, 'video')}
              />
            </div>
          )}
        </div>

        {/* Text overlays from studio_edits */}
        {textOverlays.length > 0 && (
          <TextOverlayRenderer
            textOverlays={textOverlays}
            isEditable={false}
          />
        )}

        {/* Soundtrack strip - show on every slide when post has music */}
        {activeMusic && (
          <div className="absolute bottom-2 left-2 z-10 max-w-[180px]">
            <SoundtrackStrip 
              music={{
                trackId: activeMusic.trackId,
                title: activeMusic.title,
                artist: activeMusic.artist,
                url: activeMusic.url,
                r2Key: activeMusic.r2Key,
                startAt: activeMusic.startAt,
                volume: activeMusic.volume,
              }}
              variant="published"
            />
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="mb-3">
      <div className="rounded-lg overflow-hidden">
        <SwipeCarousel
          items={carouselItems}
          showDots={carouselItems.length > 1}
          showArrows={false}
        />
      </div>
    </div>
  );
};