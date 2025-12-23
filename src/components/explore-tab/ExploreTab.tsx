import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ExploreHero from './ExploreHero';
import Top100JourneySummary from './Top100JourneySummary';
import RegionExploreRail from './RegionExploreRail';
import ThemeExploreRail from './ThemeExploreRail';
import CourseDiscoveryFeed from './CourseDiscoveryFeed';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';

interface ExploreTabProps {
  onMediaClick?: (item: any) => void;
  className?: string;
}

// Local storage key
const EXPLORE_SORT_KEY = 'explore-sort-option';

const EXPLORE_PILLS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'courses', label: 'Courses' },
  { id: 'regions', label: 'Regions' },
  { id: 'bucket-list', label: 'Bucket List' },
];

/**
 * ExploreTab - The aspirational discovery surface for golf places, courses, and journeys
 */
export const ExploreTab: React.FC<ExploreTabProps> = ({
  onMediaClick,
  className,
}) => {
  const navigate = useNavigate();
  
  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem(EXPLORE_SORT_KEY);
    return (saved as SortOption) || 'newest';
  });

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
    localStorage.setItem(EXPLORE_SORT_KEY, sort);
  }, []);

  const handleFilterChange = useCallback((key: string) => {
    setActiveFilter(key);
  }, []);

  // Build pills for command center
  const pills: Pill[] = EXPLORE_PILLS.map(p => ({
    key: p.id,
    label: p.label,
    selected: activeFilter === p.id,
  }));

  const handleExploreClick = () => {
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleStartJourney = () => {
    navigate('/top100');
  };

  const handleContinueJourney = () => {
    navigate('/top100');
  };

  const handleRegionClick = (regionId: string) => {
    console.log('Region clicked:', regionId);
  };

  const handleThemeClick = (themeId: string) => {
    console.log('Theme clicked:', themeId);
  };

  const handleItemClick = (item: any) => {
    console.log('Course content clicked:', item);
    onMediaClick?.(item);
  };

  return (
    <div className={cn("min-h-screen", className)}>
      {/* Command Center: Search + Sort + Pills */}
      <DiscoverCommandCenter
        searchPlaceholder="Search courses, regions..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sortValue={sortOption}
        onSortChange={handleSortChange}
        pills={pills}
        onPillSelect={handleFilterChange}
      />

      {/* Hero Section - Sets aspirational tone */}
      <ExploreHero onExploreClick={handleExploreClick} />
      
      {/* Top 100 Journey Summary - Anchor to long-term goal */}
      <Top100JourneySummary
        onStartJourney={handleStartJourney}
        onContinueJourney={handleContinueJourney}
      />
      
      {/* Divider */}
      <div className="h-px bg-border/40 mx-5" />
      
      {/* Explore by Region */}
      <RegionExploreRail onRegionClick={handleRegionClick} />
      
      {/* Explore by Theme */}
      <ThemeExploreRail onThemeClick={handleThemeClick} />
      
      {/* Divider */}
      <div className="h-px bg-border/40 mx-5" />
      
      {/* Course-Led Discovery Feed */}
      <CourseDiscoveryFeed onItemClick={handleItemClick} />
      
      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
};

export default ExploreTab;
