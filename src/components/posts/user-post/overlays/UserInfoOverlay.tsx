import React from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import CoursePostBadge from '../../CoursePostBadge';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface UserInfoOverlayProps {
  user: {
    id: string;
    profile_photo_url: string | null;
  };
  displayName: string;
  onProfileClick: () => void;
  golfCourse?: GolfCourse | null;
  source?: 'profile' | 'index';
}

export const UserInfoOverlay: React.FC<UserInfoOverlayProps> = ({
  user,
  displayName,
  onProfileClick,
  golfCourse,
  source
}) => {
  const isClubhouse = source === 'index';
  
  return (
    <div className="absolute top-3 left-3 z-20">
      <div 
        className="flex flex-col cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onProfileClick();
        }}
      >
        <div className="flex items-center">
          <OptimizedImage
            src={getOptimizedImageUrl(
              user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
              64,
              64
            )}
            alt={displayName}
            className="w-16 h-16 rounded-full mr-2 object-cover"
            width={64}
            height={64}
            priority={true}
          />
          <span 
            className="text-white text-base font-bold"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            {displayName}
          </span>
        </div>
        
        {/* Golf Course Badge - Only show on clubhouse page */}
        {isClubhouse && golfCourse && (
          <div className="mt-2 ml-18">
            <CoursePostBadge 
              course={{
                id: golfCourse.id,
                name: golfCourse.name,
                country: golfCourse.country,
                region: golfCourse.region
              }}
              isClubhouse={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};