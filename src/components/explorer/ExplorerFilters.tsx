
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Globe, Search, Grid3X3, List, Map, TrendingUp, Clock, Star } from 'lucide-react';

interface FilterState {
  audience: 'friends' | 'all';
  region: 'global' | 'britain-ireland' | 'usa' | 'europe';
  search: string;
  viewMode: 'media' | 'course';
  showMap: boolean;
  sortBy: 'recent' | 'rating' | 'engagement';
}

interface ExplorerFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
}

const ExplorerFilters: React.FC<ExplorerFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="space-y-4">
      {/* Top Row - Audience & Region & Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Audience Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={filters.audience === 'friends' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('audience', 'friends')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            My Friends
          </Button>
          <Button
            variant={filters.audience === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('audience', 'all')}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            All Users
          </Button>
        </div>

        {/* Region Dropdown */}
        <Select value={filters.region} onValueChange={(value) => onFilterChange('region', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">🌍 Worldwide</SelectItem>
            <SelectItem value="britain-ireland">🇬🇧 Britain & Ireland</SelectItem>
            <SelectItem value="usa">🇺🇸 United States</SelectItem>
            <SelectItem value="europe">🇪🇺 Continental Europe</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Dropdown - NEW */}
        <Select value={filters.sortBy} onValueChange={(value) => onFilterChange('sortBy', value)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Most Recent
              </div>
            </SelectItem>
            <SelectItem value="rating">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Highest Rated
              </div>
            </SelectItem>
            <SelectItem value="engagement">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Most Engaged
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bottom Row - Search & View Options */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Top 100 course names..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={filters.viewMode === 'media' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('viewMode', 'media')}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Media View
          </Button>
          <Button
            variant={filters.viewMode === 'course' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('viewMode', 'course')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Course View
          </Button>
        </div>

        {/* Map Toggle */}
        <Button
          variant={filters.showMap ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('showMap', !filters.showMap)}
          className="flex items-center gap-2"
        >
          <Map className="h-4 w-4" />
          Map View
        </Button>
      </div>
    </div>
  );
};

export default ExplorerFilters;
