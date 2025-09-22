import React, { useRef, useEffect, useState } from 'react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { ChevronLeft, ChevronRight, Camera, Star, Users, UserPlus } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatItem {
  value: string | number;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface ProfileStatsBarProps {
  stats: StatItem[];
}

const ProfileStatsBar: React.FC<ProfileStatsBarProps> = ({ stats }) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  const updateScrollState = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 2);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      // Desktop: scroll by exactly one stat (5rem + 1rem gap = 6rem = 96px)
      // Mobile: use original scroll distance
      const scrollDistance = isDesktop 
        ? (direction === 'left' ? -96 : 96)
        : (direction === 'left' ? -200 : 200);
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  }, [stats]);

  // Icon mapping for stats
  const getIconForStat = (label: string) => {
    switch (label.toLowerCase()) {
      case 'posts': return '📸';
      case 'total xp': return '⭐';
      case 'following': return '👥';
      case 'followers': return '👤';
      default: return null;
    }
  };

  return (
    <div id="profile-stats" className="mx-4 mt-3 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-3 py-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((stat, index) => {
          const iconEmoji = getIconForStat(stat.label);
          return (
            <button
              key={index}
              onClick={stat.onClick}
              className="flex flex-col items-center justify-center text-slate-900/90 hover:opacity-80 transition-opacity duration-200 py-2"
            >
              {iconEmoji && (
                <span className="text-[16px] leading-none mb-1">
                  {iconEmoji}
                </span>
              )}
              <span className="text-xl font-extrabold leading-tight">
                {stat.value}
              </span>
              <span className="text-xs opacity-80 leading-tight">
                {stat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileStatsBar;