import React, { useMemo } from 'react';
import { Squircle } from '@/components/ui/squircle';
import { cn } from '@/lib/utils';
import { getTop100Club, type Top100TierId } from '@/lib/top100Club';
import { getRingGradientStyle } from '@/lib/top100Helpers';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProfileAvatarRingProps {
  photoUrl: string | null | undefined;
  displayName: string;
  totalTop100Played: number;
  isPersonal: boolean;
  isOwnProfile: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const SIZES = {
  sm: { avatar: 64, ring: 72, strokeWidth: 3 },
  md: { avatar: 88, ring: 100, strokeWidth: 4 },
  lg: { avatar: 120, ring: 136, strokeWidth: 5 },
};

/**
 * ProfileAvatarRing - Avatar with Top 100 exploration ring
 * Personal profiles show colored ring based on tier (5-400 courses)
 * Business profiles show avatar without ring
 */
const ProfileAvatarRing: React.FC<ProfileAvatarRingProps> = ({
  photoUrl,
  displayName,
  totalTop100Played,
  isPersonal,
  isOwnProfile,
  size = 'lg',
  onClick,
}) => {
  const dimensions = SIZES[size];
  
  // Get tier info from total played
  const tierInfo = useMemo(() => {
    return getTop100Club(totalTop100Played);
  }, [totalTop100Played]);
  
  const ringStyle = useMemo(() => {
    if (!isPersonal) return {};
    return getRingGradientStyle(tierInfo.tierId, totalTop100Played);
  }, [isPersonal, tierInfo.tierId, totalTop100Played]);
  
  const showRing = isPersonal && totalTop100Played >= 5;
  
  // Tooltip content for personal profiles
  const tooltipContent = useMemo(() => {
    if (!isPersonal) return null;
    if (totalTop100Played === 0) {
      return 'Start your Top 100 journey';
    }
    if (totalTop100Played < 5) {
      return `${totalTop100Played} Top 100 course${totalTop100Played === 1 ? '' : 's'} played`;
    }
    return `${tierInfo.tierName} · ${totalTop100Played} courses`;
  }, [isPersonal, totalTop100Played, tierInfo.tierName]);

  const avatarElement = (
    <div
      className={cn(
        'relative flex items-center justify-center transition-transform duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={onClick}
      style={{
        width: showRing ? dimensions.ring : dimensions.avatar,
        height: showRing ? dimensions.ring : dimensions.avatar,
      }}
    >
      {/* Ring layer - only for personal profiles with milestone */}
      {showRing && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-slow"
          style={{
            ...ringStyle,
            padding: dimensions.strokeWidth,
          }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </div>
      )}
      
      {/* Ring gradient overlay for premium effect */}
      {showRing && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            ...ringStyle,
            mask: `radial-gradient(circle at center, transparent ${dimensions.avatar / 2}px, black ${dimensions.avatar / 2}px)`,
            WebkitMask: `radial-gradient(circle at center, transparent ${dimensions.avatar / 2}px, black ${dimensions.avatar / 2}px)`,
          }}
        />
      )}
      
      {/* Avatar container */}
      <div
        className="relative z-10 overflow-hidden"
        style={{
          width: dimensions.avatar,
          height: dimensions.avatar,
        }}
      >
        <Squircle width={dimensions.avatar} height={dimensions.avatar}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
              decoding="async"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"
              style={{ fontSize: dimensions.avatar * 0.4 }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Squircle>
      </div>
    </div>
  );

  // Wrap with tooltip for personal profiles
  if (isPersonal && tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatarElement}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-sm">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatarElement;
};

export default ProfileAvatarRing;
