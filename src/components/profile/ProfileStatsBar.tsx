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
        container.scrollLeft < container.scrollWidth - container.clientWidth - 2
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollDistance = direction === 'left' ? -200 : 200;
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
    <div className={`relative w-full max-w-md mx-auto ${isMobile ? 'px-4' : ''}`}>
      {/* Desktop scroll buttons */}
      {isDesktop && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 z-20 w-7 h-7 p-1 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
        </button>
      )}
      
      {isDesktop && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 z-20 w-7 h-7 p-1 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </button>
      )}
      
      {/* Left fade gradient */}
      {canScrollLeft && (
        <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none ${isMobile ? 'ml-4' : ''}`} />
      )}
      
      {/* Right fade gradient for peek effect - stronger on mobile */}
      {canScrollRight && (
        <div className={`absolute right-0 top-0 bottom-0 ${isMobile ? 'w-12 mr-4 bg-gradient-to-l from-background/95 via-background/60 to-transparent' : 'w-8 bg-gradient-to-l from-background/80 to-transparent'} z-10 pointer-events-none`} />
      )}
      
      {/* Stats container */}
      <div 
        ref={containerRef}
        className={`flex gap-2 overflow-x-auto scrollbar-hide py-0.5 bg-background/70 backdrop-blur-sm rounded-2xl border border-border/20 shadow-sm ${isMobile ? 'px-4 pr-8' : 'px-2'}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={stat.onClick}
            className="flex-shrink-0 w-24 flex flex-col items-center justify-center py-0.5 px-2 rounded-xl bg-background/50 hover:bg-background/80 transition-all duration-200 hover:shadow-sm"
          >
            <div className="text-lg font-semibold text-foreground">
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {stat.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileStatsBar;