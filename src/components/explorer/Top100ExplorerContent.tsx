
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
    <div className="space-y-8">
      {/* Sticky Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4">
        <ExplorerFilters 
          filters={filters}
          onFilterChange={updateFilter}
        />
      </div>

      {/* Community Top 100 Leaderboards */}
      <CommunityLeaderboards />

      {/* Video Highlights Section */}
      <VideoHighlights />

      {/* Map View or Main Content */}
      {filters.showMap ? (
        <MapView 
          region={filters.region}
          audience={filters.audience}
        />
      ) : (
        <>
          {/* Random Explorer Grid (Core Content Feed) */}
          <RandomExplorerGrid filters={filters} />

          {/* Legacy components for specific view modes */}
          {filters.viewMode === 'course' && (
            <>
              {/* Friends Played Scroll */}
              <FriendsPlayedScroll audience={filters.audience} />
              
              {/* Course Feed */}
              <CoursesFeed filters={filters} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Top100ExplorerContent;
