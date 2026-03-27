import React, { useMemo, useState, useCallback } from 'react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import CoursePostBadge from '../CoursePostBadge';
import { PostMedia, GolfCourse } from './types';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';
import SoundtrackStrip from '@/components/studio/SoundtrackStrip';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { toast } from 'sonner';

import { useClubhouseStore } from '@/store/clubhouseStore';

interface UserPostMediaProps {
  media: PostMedia[];
  /** @deprecated Use courses array instead */
  golfCourse?: GolfCourse | null;
  /** Array of golf courses for multi-course support */
  courses?: GolfCourse[];
  /** Raw course ID for safety net - show badge even if full course lookup failed */
  rawCourseId?: string | null;
  shouldAutoplay: boolean;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  isClubhouse?: boolean;
  /** Achievement badges to display on media */
  badges?: string[];
}

export const UserPostMedia: React.FC<UserPostMediaProps> = ({
  media,
  golfCourse,
  courses: coursesProp,
  rawCourseId,
  shouldAutoplay,
  onMediaClick,
  isClubhouse = false,
  badges
}) => {
  
  const { isGloballyMuted } = useGlobalAudio();
  
  // Track active slide index for per-slide autoplay control
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Handle slide changes - this ensures only the active slide's video plays
  const handleSlideChange = useCallback((index: number) => {
    setActiveSlideIndex(index);
  }, []);

  // Normalize courses: use coursesProp if provided, else wrap golfCourse for backward compat
  const courses = useMemo(() => {
    if (coursesProp && coursesProp.length > 0) return coursesProp;
    if (golfCourse) return [golfCourse];
    if (rawCourseId) {
      return [{
        id: rawCourseId,
        name: 'Golf Course', // Fallback name
        country: '',
        region: ''
      }];
    }
    return [];
  }, [coursesProp, golfCourse, rawCourseId]);

  // Check if any media in this post has music attached
  const postHasMusic = useMemo(() => {
    return media.some(m => {
      const studioEdits = m.studio_edits as any;
      return studioEdits?.music?.url || studioEdits?.music?.r2Key;
    });
  }, [media]);

  // Get the active music track (from any media item) for display
  const activeMusic = useMemo(() => {
    for (const m of media) {
      const music = (m.studio_edits as any)?.music;
      if (music?.url || music?.r2Key) {
        return music;
      }
    }
    return null;
  }, [media]);

  const handleMuteBlocked = () => {
    toast("Original audio is muted because a track is applied.", { duration: 2000 });
  };

  if (!media || media.length === 0) return null;

  // Determine effective mute state: muted if globally muted OR if post has music track
  const effectiveMuted = isGloballyMuted || postHasMusic;

  const carouselItems = media.map((mediaItem, index) => {
    // Use filter_id first (new column), fallback to studio_edits.filter (old data)
    const studioEdits = mediaItem.studio_edits as any;
    const filterId = mediaItem.filter_id || studioEdits?.filter;
    const filterClass = getFilterClass(filterId);
    const cropClass = getCropWrapperClass(studioEdits?.crop);
    const pixelStyle = getPixelLayerStyle(studioEdits);
    
    // Extract text overlays from studio_edits
    const textOverlays = studioEdits?.textOverlays || [];
    
    // Per-slide autoplay: only autoplay if this slide is active AND post is visible
    const isActiveSlide = index === activeSlideIndex;
    const slideAutoplay = shouldAutoplay && isActiveSlide;
    
    console.log('[Feed] slide render', {
      postMediaId: mediaItem.id,
      index,
      isActiveSlide,
      slideAutoplay,
      effectiveMuted,
      isGloballyMuted,
      postHasMusic,
    });
    
    return (
      <div key={mediaItem.id} className="w-full aspect-square relative">
        
        {/* Golf Course Badge overlay on each media item - top right */}
        {courses.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <CoursePostBadge 
              courses={courses}
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
                autoplay={slideAutoplay}
                muted={effectiveMuted}
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
          onSlideChange={handleSlideChange}
        />
      </div>
    </div>
  );
};