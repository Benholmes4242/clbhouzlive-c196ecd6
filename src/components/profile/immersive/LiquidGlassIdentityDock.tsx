import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface LiquidGlassIdentityDockProps {
  profile: {
    id: string;
    display_name?: string;
    username?: string;
    profile_photo_url?: string;
    home_club?: string;
  };
  isOwnProfile: boolean;
  onFollowClick?: () => void;
  onMessageClick?: () => void;
  onMoreClick?: () => void;
}

const LiquidGlassIdentityDock: React.FC<LiquidGlassIdentityDockProps> = ({
  profile,
  isOwnProfile,
  onFollowClick,
  onMessageClick,
  onMoreClick
}) => {
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  };

  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 rounded-2xl px-6 py-4 animate-[bounce_0.8s_ease-out]"
      style={liquidGlassStyle}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="w-12 h-12 ring-2 ring-white/30">
          <AvatarImage 
            src={profile.profile_photo_url} 
            alt={profile.display_name || profile.username || 'User'} 
          />
          <AvatarFallback className="bg-white/20 text-white font-medium">
            {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Identity Info */}
        <div className="flex flex-col min-w-0">
          <h3 className="text-white font-bold text-lg leading-tight truncate">
            {profile.display_name || profile.username || 'User'}
          </h3>
          <p className="text-white/80 text-sm truncate">
            @{profile.username || 'username'}
          </p>
          {profile.home_club && (
            <p className="text-white/70 text-xs truncate flex items-center gap-1">
              <span>⛳</span>
              {profile.home_club}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              onClick={onFollowClick}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full px-4"
              variant="outline"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Follow
            </Button>
            
            <Button
              size="sm"
              onClick={onMessageClick}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full p-2"
              variant="outline"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={onMoreClick}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full p-2"
              variant="outline"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiquidGlassIdentityDock;