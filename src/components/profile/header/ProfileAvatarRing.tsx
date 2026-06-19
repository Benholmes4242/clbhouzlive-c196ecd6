import React, { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getAvatarFallbackColor } from '@/lib/avatarFallback';
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

// Width configurations for each size
const SIZES = {
  sm: 54,
  md: 74,
  lg: 144,
};

const RING_ANIMATED_KEY = 'clbhouz:ringAnimated:v1';

/**
 * ProfileAvatarRing - Part of Global Achievement & Milestone System
 * 
 * Avatar with Top 100 exploration ring using squircle spec (1/1.05 aspect, 34% radius).
 * Ring colors are sourced from globalAchievementMilestoneSystem.ts to match milestone cards.
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
  const width = SIZES[size];
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
  
  // Ring color from Global Achievement & Milestone System (matches milestone cards)
  const tierColor = useMemo(() => {
    if (!isPersonal || totalTop100Played < 5) return null;
    return getRingColorForTotalPlayed(totalTop100Played);
  }, [isPersonal, totalTop100Played]);
  
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

  // Calculate fallback font size
  const fallbackFontSize = Math.round(width * 0.22);

  // Inner avatar content
  const avatarInner = photoUrl ? (
    <img
      src={photoUrl}
      alt={displayName}
      className="w-full h-full object-cover"
      loading="eager"
      decoding="async"
    />
  ) : (
    <div 
      className="w-full h-full flex items-center justify-center font-semibold text-white"
      style={{ fontSize: `${fallbackFontSize}px`, background: getAvatarFallbackColor(displayName) }}
    >
      {initials}
    </div>
  );

  const avatarElement = (
    <div
      ref={ref}
      className={cn(
        'relative flex items-center justify-center transition-transform duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        shouldAnimate && 'animate-ring-pulse'
      )}
      onClick={onClick}
    >
      {showRing ? (
        // Achievement state: colored ring directly on avatar (no grey ring)
        <div
          className="relative overflow-hidden"
          style={{
            width: `${width}px`,
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
            border: `2px solid ${tierColor}`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
          }}
        >
          {avatarInner}
        </div>
      ) : (
        // Normal state: single grey ring around avatar
        <div
          className="relative overflow-hidden"
          style={{
            width: `${width}px`,
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
            border: '2px solid #D1D5DB',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
          }}
        >
          {avatarInner}
        </div>
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
