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
    <div className={`relative w-full max-w-sm mx-auto ${isMobile ? 'px-4' : ''}`}>
      
      {isDesktop && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 z-20 w-8 h-8 p-1 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <ChevronRight className="w-5 h-5 text-white drop-shadow-lg" />
        </button>
      )}
      
      
      {/* Stats container with peek effect */}
      <div className="relative overflow-hidden rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4"
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
              <div className="text-lg font-semibold text-white drop-shadow-lg">
                {stat.value}
              </div>
              <div className="text-xs text-white/80 font-medium drop-shadow-md">
                {stat.label}
              </div>
            </button>
          ))}
        </div>
        
        {/* Right fade gradient to create peek effect */}
        {stats.length > 4 && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white/8 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default ProfileStatsBar;