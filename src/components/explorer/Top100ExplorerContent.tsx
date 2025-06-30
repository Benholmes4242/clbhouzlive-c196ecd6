
import React, { useState } from 'react';
import ExplorerFilters from './ExplorerFilters';
import CoursesFeed from './CoursesFeed';
import FriendsPlayedScroll from './FriendsPlayedScroll';
import MapView from './MapView';
import LeaderboardCards from './LeaderboardCards';
import FeaturedMoment from './FeaturedMoment';

interface FilterState {
  audience: 'friends' | 'all';
  region: 'global' | 'britain-ireland' | 'usa' | 'europe';
  search: string;
  viewMode: 'media' | 'course';
  showMap: boolean;
}

const Top100ExplorerContent = () => {
  const [filters, setFilters] = useState<FilterState>({
    audience: 'all',
    region: 'global',
    search: '',
    viewMode: 'media',
    showMap: false
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

      {/* Featured Moment */}
      <FeaturedMoment />

      {/* Friends Played Scroll */}
      <FriendsPlayedScroll audience={filters.audience} />

      {/* Map or Course Feed */}
      {filters.showMap ? (
        <MapView 
          region={filters.region}
          audience={filters.audience}
        />
      ) : (
        <CoursesFeed 
          filters={filters}
        />
      )}

      {/* Leaderboards */}
      <LeaderboardCards />
    </div>
  );
};

export default Top100ExplorerContent;
