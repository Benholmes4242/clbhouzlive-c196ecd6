import React, { useMemo } from 'react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import CoursePostBadge from '../CoursePostBadge';
import { PostMedia, GolfCourse } from './types';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';
import SoundtrackStrip from '@/components/studio/SoundtrackStrip';
import { useToast } from '@/hooks/use-toast';

interface UserPostMediaProps {
  media: PostMedia[];
  golfCourse: GolfCourse | null;
  shouldAutoplay: boolean;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  isClubhouse?: boolean;
}

export const UserPostMedia: React.FC<UserPostMediaProps> = ({
  media,
  golfCourse,
  shouldAutoplay,
  onMediaClick,
  isClubhouse = false
}) => {
  const { toast } = useToast();

  // Check if any media in this post has music attached
  // When music exists, all videos in the post should be muted
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
    toast({
      description: "Original audio is muted because a track is applied.",
      duration: 2000,
    });
  };

  if (!media || media.length === 0) return null;

  const carouselItems = media.map((mediaItem, index) => {
    // Use filter_id first (new column), fallback to studio_edits.filter (old data)
    const filterId = mediaItem.filter_id || (mediaItem.studio_edits as any)?.filter;
    const filterClass = getFilterClass(filterId);
    
    console.log('[Feed] slide filter', {
      postMediaId: mediaItem.id,
      filterId,
      filterClass,
      postHasMusic,
    });
    
    return (
      <div key={mediaItem.id} className="w-full aspect-square relative">
        {/* Golf Course Badge overlay on each media item */}
        {golfCourse && (
          <div className="absolute top-2 right-2 z-10">
            <CoursePostBadge 
              course={{
                id: golfCourse.id,
                name: golfCourse.name,
                country: golfCourse.country,
                region: golfCourse.region
              }}
              className={isClubhouse ? "m-0" : "m-0"}
              isClubhouse={isClubhouse}
            />
          </div>
        )}
        
        {mediaItem.media_type === 'image' ? (
          <img
            src={mediaItem.media_url}
            alt="Post content"
            className={cn("w-full h-full object-cover object-center cursor-pointer", filterClass)}
            loading="lazy"
            onClick={() => onMediaClick(mediaItem.media_url, 'image')}
          />
        ) : (
          <EnhancedVideoPlayer
            src={mediaItem.media_url}
            autoplay={shouldAutoplay}
            muted={true}  // Always muted in feed - music handled separately
            loop={true}
            className={cn("w-full h-full", filterClass)}
            enableHLS={true}
            onClick={() => onMediaClick(mediaItem.media_url, 'video')}
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