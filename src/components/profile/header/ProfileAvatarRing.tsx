import React, { useMemo, useRef, useEffect, useState } from 'react';
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
  animateOnFirstView?: boolean;
}

// Size configurations - outer size, then 1.5px ring, 1px white gap, then avatar (reduced 10%)
const SIZES = {
  sm: { outer: 88, white: 86, avatar: 84 },
  md: { outer: 119, white: 116, avatar: 114 },
  lg: { outer: 161, white: 158, avatar: 157 },
};

const RING_ANIMATED_KEY = 'clbhouz:ringAnimated:v1';

/**
 * ProfileAvatarRing - Avatar with Top 100 exploration ring using global squircle shape
 * Personal profiles show colored ring based on tier (5-400 courses)
 * Business profiles show avatar without ring
 * Includes optional one-time animation on first view
 */
const ProfileAvatarRing: React.FC<ProfileAvatarRingProps> = ({
  photoUrl,
  displayName,
  totalTop100Played,
  isPersonal,
  isOwnProfile,
  size = 'lg',
  onClick,
  animateOnFirstView = true,
}) => {
  const dimensions = SIZES[size];
  const ref = useRef<HTMLDivElement>(null);
  
  // Session-based animation flag
  const [hasAnimated, setHasAnimated] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(RING_ANIMATED_KEY) === '1';
  });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Get tier info from total played
  const tierInfo = useMemo(() => {
    return getTop100Club(totalTop100Played);
  }, [totalTop100Played]);
  
  const tierColor = useMemo(() => {
    if (!isPersonal || totalTop100Played < 5) return null;
    return getRingColorForTier(tierInfo.tierId);
  }, [isPersonal, tierInfo.tierId, totalTop100Played]);
  
  const showRing = isPersonal && totalTop100Played >= 5 && tierColor;
  
  // Trigger animation when first visible
  useEffect(() => {
    if (!animateOnFirstView || hasAnimated || !showRing) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldAnimate(true);
        setHasAnimated(true);
        sessionStorage.setItem(RING_ANIMATED_KEY, '1');
        observer.disconnect();
      }
    }, { threshold: 0.6 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animateOnFirstView, hasAnimated, showRing]);
  
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
      ref={ref}
      className={cn(
        'relative flex items-center justify-center transition-transform duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        shouldAnimate && 'animate-ring-pulse'
      )}
      onClick={onClick}
      style={{
        // Premium shadow for depth
        filter: showRing ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))' : undefined,
      }}
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
