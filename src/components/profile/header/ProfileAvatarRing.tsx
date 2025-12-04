import React, { useMemo } from 'react';
import { Squircle } from '@/components/ui/squircle';
import { cn } from '@/lib/utils';
import { getTop100Club, getRingColorForTier, type Top100TierId } from '@/lib/top100Club';
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

// Size configurations - outer size, then 2px ring, 1px white gap, then avatar
const SIZES = {
  sm: { outer: 68, white: 64, avatar: 62 },   // 2px ring + 1px white
  md: { outer: 92, white: 88, avatar: 86 },   // 2px ring + 1px white  
  lg: { outer: 124, white: 120, avatar: 118 }, // 2px ring + 1px white
};

/**
 * ProfileAvatarRing - Avatar with Top 100 exploration ring using global squircle shape
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
  
  const tierColor = useMemo(() => {
    if (!isPersonal || totalTop100Played < 5) return null;
    return getRingColorForTier(tierInfo.tierId);
  }, [isPersonal, tierInfo.tierId, totalTop100Played]);
  
  const showRing = isPersonal && totalTop100Played >= 5 && tierColor;
  
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

  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const avatarElement = (
    <div
      className={cn(
        'relative flex items-center justify-center transition-transform duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      {showRing ? (
        // Nested squircles for ring effect - matches My Progress page exactly
        <Squircle width={dimensions.outer} height={dimensions.outer}>
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: tierColor }}
          >
            {/* White ring layer - 1px */}
            <Squircle width={dimensions.white} height={dimensions.white}>
              <div className="w-full h-full bg-background flex items-center justify-center">
                {/* Avatar */}
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
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xl font-semibold">
                      {initials}
                    </div>
                  )}
                </Squircle>
              </div>
            </Squircle>
          </div>
        </Squircle>
      ) : (
        // No ring - just avatar (business profiles or no milestone)
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
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xl font-semibold">
              {initials}
            </div>
          )}
        </Squircle>
      )}
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
