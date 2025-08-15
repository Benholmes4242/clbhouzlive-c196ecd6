import React, { useRef, useEffect, useState } from 'react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatItem {
  value: string | number;
  label: string;
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

  return (
    <div className={`relative w-full max-w-lg mx-auto ${isMobile ? 'px-4' : ''}`}>
      {/* Desktop scroll buttons */}
      {isDesktop && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 transform -translate-y-1/2 z-20 w-8 h-8 p-1 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
      )}
      
      {isDesktop && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 z-20 w-8 h-8 p-1 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <ChevronRight className="w-5 h-5 text-black" />
        </button>
      )}
      
      
      {/* Stats container - clean design without liquid glass */}
      <div className="relative overflow-hidden rounded-full bg-muted border shadow-sm">
        <div 
          ref={containerRef}
          className="flex gap-8 overflow-x-auto scrollbar-hide px-4 pr-20"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            width: 'calc(4 * 5rem + 3 * 1rem + 2rem + 0.5 * 5rem)', // 4 full stats + 3 gaps + padding + half of 5th stat
          }}
        >
          {stats.map((stat, index) => (
            <button
              key={index}
              onClick={stat.onClick}
              className="flex-shrink-0 w-20 flex flex-col items-center justify-center hover:opacity-80 transition-opacity duration-200"
            >
              <div className="text-lg font-semibold text-black">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {stat.label}
              </div>
            </button>
          ))}
        </div>
        
        {/* Right fade gradient to create peek effect */}
        {stats.length > 4 && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-muted via-muted/50 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default ProfileStatsBar;