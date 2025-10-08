
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, TvMinimalPlay, Zap, Brain, Users } from 'lucide-react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { PiGolf } from 'react-icons/pi';
import { IoFlameOutline } from 'react-icons/io5';
import { filterOptions, FILTER_TYPES } from './types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { FILTER_TO_MAIN_PILL } from '@/constants/discoverPills';

interface ExploreFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  excludeFilters?: string[];
  main?: string;
  sub?: string;
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ 
  activeFilter, 
  onFilterChange, 
  excludeFilters = [],
  main = 'shorts',
  sub = ''
}) => {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const { setSub } = useDiscoverQuery();

  // Define subfilters for Shorts
  const shortsSubfilters = [
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'new', label: 'New', icon: '✨' },
    { id: 'golf-swing', label: 'Golf Swing', icon: '⛳' },
    { id: 'hole-in-one', label: 'Hole in One', icon: '🎯' },
    { id: 'long-drive', label: 'Long Drive', icon: '🚀' },
    { id: 'fail', label: 'Fail', icon: '😅' },
  ];

  // Define subfilters for Channels
  const channelsSubfilters = [
    { id: 'all', label: 'All', icon: '📺' },
    { id: 'new', label: 'New', icon: '✨' },
    { id: 'popular', label: 'Popular', icon: '🔥' },
    { id: 'golf-tips', label: 'Golf Tips', icon: '💡' },
    { id: 'equipment', label: 'Equipment', icon: '⛳' },
    { id: 'on-course', label: 'On-Course', icon: '🏌️' },
    { id: 'interviews', label: 'Interviews', icon: '🎤' },
  ];

  // Determine which filters to show based on main tab
  const availableFilters = main === 'shorts' 
    ? shortsSubfilters.map(f => f.id)
    : main === 'channels'
    ? channelsSubfilters.map(f => f.id)
    : filterOptions.filter(filter => !excludeFilters.includes(filter));

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setIsAtStart(scrollLeft <= 10);
    setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
  }, []);

  const getFilterIcon = (filter: string) => {
    const iconProps = { className: "w-5 h-5", strokeWidth: 2 };
    
    switch (filter) {
      case FILTER_TYPES.SHORTS:
        return <MdOutlinePlayCircle className="w-5 h-5" />;
      case FILTER_TYPES.CHANNELS:
        return <TvMinimalPlay {...iconProps} />;
      case FILTER_TYPES.VIDEOS:
        return <MdOutlinePlayCircle className="w-5 h-5" />;
      case FILTER_TYPES.PHOTOS:
        return <Camera {...iconProps} />;
      case FILTER_TYPES.FRIENDS:
        return <Users {...iconProps} />;
      case FILTER_TYPES.VERIFIED_PROS:
        return <PiGolf className="w-5 h-5" />;
      case FILTER_TYPES.HACK_SHACK:
        return <Zap {...iconProps} />;
      case FILTER_TYPES.BRAIN_GAME:
        return <Brain {...iconProps} />;
      default:
        return null;
    }
  };

  const renderFilterButton = (filterId: string) => {
    // For Shorts, use subfilter logic
    if (main === 'shorts') {
      const subfilter = shortsSubfilters.find(f => f.id === filterId);
      if (!subfilter) return null;
      
      const isActive = sub === filterId;
      
      return (
        <button
          key={filterId}
          onClick={() => setSub(filterId)}
          className={`pill ${isActive ? 'pill--active' : ''}`}
        >
          <span className="mr-1">{subfilter.icon}</span>
          <span>{subfilter.label}</span>
        </button>
      );
    }

    // For Channels, use subfilter logic
    if (main === 'channels') {
      const subfilter = channelsSubfilters.find(f => f.id === filterId);
      if (!subfilter) return null;
      
      const isActive = (sub || 'all') === filterId;
      
      return (
        <button
          key={filterId}
          onClick={() => setSub(filterId)}
          className={`pill ${isActive ? 'pill--active' : ''}`}
        >
          <span className="mr-1">{subfilter.icon}</span>
          <span>{subfilter.label}</span>
        </button>
      );
    }
    
    // For other tabs, use old filter logic (to be refactored later)
    const isActive = activeFilter === filterId;
    
    return (
      <button
        key={filterId}
        onClick={() => onFilterChange(filterId)}
        className={`pill ${isActive ? 'pill--active' : ''}`}
      >
        <div className="pill__icon">
          {getFilterIcon(filterId)}
        </div>
        <span>{filterId}</span>
      </button>
    );
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    checkScrollPosition();
    
    // Add bounce effect when reaching ends
    const container = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    if (scrollLeft <= 0 && isAtStart) {
      container.style.transform = 'translateX(8px)';
      container.style.transition = 'transform 150ms ease-out';
      setTimeout(() => {
        container.style.transform = 'translateX(0)';
      }, 150);
    } else if (scrollLeft >= scrollWidth - clientWidth && isAtEnd) {
      container.style.transform = 'translateX(-8px)';
      container.style.transition = 'transform 150ms ease-out';
      setTimeout(() => {
        container.style.transform = 'translateX(0)';
      }, 150);
    }
  };

  return (
    <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-0 mb-0">
      <div className="pl-1 md:container md:mx-auto md:px-0">
        {/* Single Row Horizontal Scroll */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex space-x-3 overflow-x-auto scrollbar-hide"
            onScroll={handleScroll}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
          >
            {availableFilters.map(renderFilterButton)}
          </div>
          
          {/* Gradient overlays for visual scroll indication */}
          {!isAtStart && (
            <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          )}
          {!isAtEnd && (
            <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreFilters;
