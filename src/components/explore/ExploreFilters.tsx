
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Camera, TvMinimalPlay, Zap, Brain, Users } from 'lucide-react';
import { PiGolf } from 'react-icons/pi';
import { filterOptions, FILTER_TYPES } from './types';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExploreFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  excludeFilters?: string[];
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ activeFilter, onFilterChange, excludeFilters = [] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Filter out excluded filters
  const availableFilters = filterOptions.filter(filter => !excludeFilters.includes(filter));

  const getFilterIcon = (filter: string) => {
    switch (filter) {
      case FILTER_TYPES.FRIENDS:
        return <Users className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.VIDEOS:
        return <Video className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.PHOTOS:
        return <Camera className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.VERIFIED_PROS:
        return <PiGolf className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.CHANNELS:
        return <TvMinimalPlay className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.HACK_SHACK:
        return <Zap className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.BRAIN_GAME:
        return <Brain className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  };

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setIsAtStart(scrollLeft <= 0);
      setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    checkScrollPosition();
    
    // Add bounce effect when reaching ends on mobile
    if (isMobile) {
      const container = e.currentTarget;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      if (scrollLeft <= 0 || scrollLeft >= scrollWidth - clientWidth) {
        container.style.transform = scrollLeft <= 0 ? 'translateX(8px)' : 'translateX(-8px)';
        setTimeout(() => {
          container.style.transform = 'translateX(0)';
        }, 150);
      }
    }
  };

  return (
    <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm pb-4 mb-6">
      <div 
        ref={scrollContainerRef}
        className="flex space-x-2 overflow-x-auto scrollbar-hide transition-transform duration-150 ease-out"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {availableFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 
              flex items-center transition-colors duration-100 ease-in-out
              focus:outline-none border-0 outline-0
              ${activeFilter === filter 
                ? "bg-foreground text-background" 
                : "bg-secondary/80 text-foreground hover:bg-secondary"
              }
            `}
            style={{ border: 'none', outline: 'none' }}
          >
            {getFilterIcon(filter)}
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExploreFilters;
