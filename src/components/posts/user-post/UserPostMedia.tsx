import React from 'react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import CoursePostBadge from '../CoursePostBadge';
import { PostMedia, GolfCourse } from './types';

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

  // For clubhouse, only show the first media item without carousel
  if (isClubhouse) {
    const firstMedia = media[0];
    return (
      <div className="mb-3">
        <div className="rounded-lg overflow-hidden">
          <div className="w-full aspect-square relative">
            {/* Golf Course Badge overlay */}
            {golfCourse && (
              <div className="absolute top-2 right-2 z-10">
                <CoursePostBadge 
                  course={{
                    id: golfCourse.id,
                    name: golfCourse.name,
                    country: golfCourse.country,
                    region: golfCourse.region
                  }}
                  className="m-0"
                  isClubhouse={isClubhouse}
                />
              </div>
            )}
            
            {firstMedia.media_type === 'image' ? (
              <img
                src={firstMedia.media_url}
                alt="Post content"
                className="w-full h-full object-cover object-center cursor-pointer"
                loading="lazy"
                onClick={() => onMediaClick(firstMedia.media_url, 'image')}
              />
            ) : (
              <EnhancedVideoPlayer
                src={firstMedia.media_url}
                autoplay={shouldAutoplay}
                muted={true}
                loop={true}
                className="w-full h-full"
                enableHLS={true}
                onClick={() => onMediaClick(firstMedia.media_url, 'video')}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // For non-clubhouse, use the full carousel
  const carouselItems = media.map((mediaItem) => (
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
            className="m-0"
            isClubhouse={isClubhouse}
          />
        </div>
      )}
      
      {mediaItem.media_type === 'image' ? (
        <img
          src={mediaItem.media_url}
          alt="Post content"
          className="w-full h-full object-cover object-center cursor-pointer"
          loading="lazy"
          onClick={() => onMediaClick(mediaItem.media_url, 'image')}
        />
      ) : (
        <EnhancedVideoPlayer
          src={mediaItem.media_url}
          autoplay={shouldAutoplay}
          muted={true}
          loop={true}
          className="w-full h-full"
          enableHLS={true}
          onClick={() => onMediaClick(mediaItem.media_url, 'video')}
        />
      )}
    </div>
  ));

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