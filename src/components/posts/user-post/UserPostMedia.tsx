import React from 'react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import CoursePostBadge from '../CoursePostBadge';
import { PostMedia, GolfCourse } from './types';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';

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
  if (!media || media.length === 0) return null;

  const carouselItems = media.map((mediaItem) => {
    // Use filter_id first (new column), fallback to studio_edits.filter (old data)
    const filterId = mediaItem.filter_id || (mediaItem.studio_edits as any)?.filter;
    const filterClass = getFilterClass(filterId);
    
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
            muted={true}
            loop={true}
            className={cn("w-full h-full", filterClass)}
            enableHLS={true}
            onClick={() => onMediaClick(mediaItem.media_url, 'video')}
          />
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