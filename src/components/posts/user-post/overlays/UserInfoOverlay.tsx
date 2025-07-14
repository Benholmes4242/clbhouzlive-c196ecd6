import React from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

interface UserInfoOverlayProps {
  user: {
    id: string;
    profile_photo_url: string | null;
  };
  displayName: string;
  onProfileClick: () => void;
}

export const UserInfoOverlay: React.FC<UserInfoOverlayProps> = ({
  user,
  displayName,
  onProfileClick
}) => {
  return (
    <div className="absolute top-3 left-3 z-20">
      <div 
        className="flex items-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onProfileClick();
        }}
      >
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
    </div>
  );
};