
import React, { useState } from 'react';
import ExplorerFilters from './ExplorerFilters';
import CoursesFeed from './CoursesFeed';
import FriendsPlayedScroll from './FriendsPlayedScroll';
import MapView from './MapView';
import FeaturedMoment from './FeaturedMoment';
import CommunityLeaderboards from './CommunityLeaderboards';
import RandomExplorerGrid from './RandomExplorerGrid';
import VideoHighlights from './VideoHighlights';

interface FilterState {
  audience: 'friends' | 'all';
  region: 'global' | 'britain-ireland' | 'usa' | 'europe';
  search: string;
  viewMode: 'media' | 'course';
  showMap: boolean;
  sortBy: 'recent' | 'rating' | 'engagement';
}

const Top100ExplorerContent = () => {
  const [filters, setFilters] = useState<FilterState>({
    audience: 'all',
    region: 'global',
    search: '',
    viewMode: 'media',
    showMap: false,
    sortBy: 'recent'
  });

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div 
      className="space-y-0"
      onMouseEnter={() => console.log('🖱️ Mouse ENTERED Top100ExplorerContent')}
      onMouseLeave={() => console.log('🖱️ Mouse LEFT Top100ExplorerContent')}
    >
      {/* Sticky Filters */}
      <div 
        className="sticky top-0 z-10 bg-background border-b pb-4 px-4 sm:px-6 lg:px-8"
        onMouseEnter={() => console.log('🏷️ Mouse ENTERED sticky filters section')}
        onMouseLeave={() => console.log('🏷️ Mouse LEFT sticky filters section')}
      >
        <ExplorerFilters 
          filters={filters}
          onFilterChange={updateFilter}
        />
      </div>

      {/* Community Top 100 Leaderboards */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <CommunityLeaderboards />
      </div>

      {/* Video Highlights Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <VideoHighlights />
      </div>

      {/* Map View or Main Content */}
      {filters.showMap ? (
        <div className="px-4 sm:px-6 lg:px-8">
          <MapView 
            region={filters.region}
            audience={filters.audience}
          />
        </div>
      ) : (
        <>
          {/* Random Explorer Grid (Core Content Feed) - Edge to edge */}
          <RandomExplorerGrid filters={filters} />

          {/* Legacy components for specific view modes */}
          {filters.viewMode === 'course' && (
            <div className="px-4 sm:px-6 lg:px-8 space-y-8 py-8">
              {/* Friends Played Scroll */}
              <FriendsPlayedScroll audience={filters.audience} />
              
              {/* Course Feed */}
              <CoursesFeed filters={filters} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Top100ExplorerContent;
