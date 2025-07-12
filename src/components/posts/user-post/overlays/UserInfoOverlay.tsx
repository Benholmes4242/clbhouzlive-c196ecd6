import React from 'react';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

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
        <OptimizedAvatar
          src={user.profile_photo_url || undefined}
          alt={displayName}
          size={64}
          priority={true}
          className="mr-2"
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