
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
        <div className="flex space-x-2">
          <button
            onClick={() => onFilterChange('audience', 'friends')}
            className={`whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              filters.audience === 'friends' 
                ? "bg-gray-100 text-gray-800 hover:bg-gray-200" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <Users className="h-4 w-4" />
            My Friends
          </button>
          <button
            onClick={() => onFilterChange('audience', 'all')}
            className={`whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              filters.audience === 'all' 
                ? "bg-gray-100 text-gray-800 hover:bg-gray-200" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <Globe className="h-4 w-4" />
            All Users
          </button>
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
    </div>
  );
};

export default ExplorerFilters;
