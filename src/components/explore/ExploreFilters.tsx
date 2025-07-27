
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, TvMinimalPlay, Zap, Brain, Users, TrendingUp } from 'lucide-react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { PiGolf } from 'react-icons/pi';
import { filterOptions, FILTER_TYPES } from './types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';

interface ExploreFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  excludeFilters?: string[];
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ activeFilter, onFilterChange, excludeFilters = [] }) => {
  const isMobile = useIsMobile();

  // Filter out excluded filters
  const availableFilters = filterOptions.filter(filter => !excludeFilters.includes(filter));

  // Split filters into two rows as evenly as possible
  const midpoint = Math.ceil(availableFilters.length / 2);
  const topRowFilters = availableFilters.slice(0, midpoint);
  const bottomRowFilters = availableFilters.slice(midpoint);

  // Carousel navigation hooks for each row
  const topRowCarousel = useCarouselNavigation(topRowFilters.length);
  const bottomRowCarousel = useCarouselNavigation(bottomRowFilters.length);

  const getFilterIcon = (filter: string) => {
    switch (filter) {
      case FILTER_TYPES.FRIENDS:
        return <Users className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.VIDEOS:
        return <MdOutlinePlayCircle className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.PHOTOS:
        return <Camera className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.TRENDING:
        return <TrendingUp className="w-4 h-4 mr-2" />;
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

  const renderFilterButton = (filter: string) => (
    <button
      key={filter}
      onClick={() => onFilterChange(filter)}
      className={`
        px-2 py-0.5 text-lg font-medium whitespace-nowrap flex-shrink-0 
        flex items-center transition-colors duration-100 ease-in-out
        focus:outline-none border border-black/25 outline-0
        text-black bg-transparent hover:bg-black/5
        ${activeFilter === filter ? 'bg-orange-50 border-orange-200 shadow-sm shadow-orange-200/50' : ''}
      `}
      style={{ outline: 'none', borderRadius: '8px' }}
    >
      {getFilterIcon(filter)}
      {filter}
    </button>
  );

  const renderCarouselRow = (filters: string[], carouselRef: (node: HTMLDivElement | null) => void) => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
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
      <div 
        ref={carouselRef}
        className="flex space-x-2 overflow-x-auto scrollbar-hide transition-transform duration-150 ease-out"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {filters.map(renderFilterButton)}
      </div>
    );
  };

  return (
    <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-2 mb-3">
      <div className="space-y-2">
        {/* Top Row */}
        {renderCarouselRow(topRowFilters, topRowCarousel.carouselRef)}
        
        {/* Bottom Row */}
        {renderCarouselRow(bottomRowFilters, bottomRowCarousel.carouselRef)}
      </div>
    </div>
  );
};

export default ExploreFilters;
