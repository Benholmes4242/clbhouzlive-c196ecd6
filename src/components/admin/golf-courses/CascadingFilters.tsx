import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  regionMapping, 
  RegionKey, 
  RegionalFilter,
  britainIrelandCountries,
  britainIrelandCounties,
  usStates,
  continentalEuropeCountries,
  worldwideCountries,
  top100ListMapping,
  Top100ListKey,
  sortOptionMapping,
  SortOptionKey
} from './types';

interface CascadingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  regionalFilter: RegionalFilter;
  onRegionalFilterChange: (filter: RegionalFilter) => void;
}

const CascadingFilters: React.FC<CascadingFiltersProps> = ({
  searchTerm,
  onSearchChange,
  regionalFilter,
  onRegionalFilterChange,
}) => {
  const [availableSubCountries, setAvailableSubCountries] = useState<string[]>([]);
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);

  // Update available sub-countries when region changes
  useEffect(() => {
    let subCountries: string[] = [];
    
    switch (regionalFilter.region) {
      case 'usa':
        subCountries = usStates;
        break;
      case 'britain-ireland':
        subCountries = britainIrelandCountries;
        break;
      case 'europe':
        subCountries = continentalEuropeCountries;
        break;
      case 'worldwide':
        subCountries = worldwideCountries;
        break;
      default:
        subCountries = [];
    }
    
    setAvailableSubCountries(subCountries);
    
    // Reset sub-country and county when region changes
    if (regionalFilter.region === 'all') {
      onRegionalFilterChange({
        region: 'all',
        subCountry: null,
        county: null,
        top100List: regionalFilter.top100List,
        sortBy: regionalFilter.sortBy
      });
    } else {
      onRegionalFilterChange({
        ...regionalFilter,
        subCountry: null,
        county: null
      });
    }
  }, [regionalFilter.region]);

  // Update available counties when sub-country changes
  useEffect(() => {
    let counties: string[] = [];
    
    if (regionalFilter.region === 'britain-ireland' && regionalFilter.subCountry) {
      counties = britainIrelandCounties[regionalFilter.subCountry] || [];
    }
    
    setAvailableCounties(counties);
    
    // Reset county when sub-country changes
    if (regionalFilter.subCountry) {
      onRegionalFilterChange({
        ...regionalFilter,
        county: null
      });
    }
  }, [regionalFilter.subCountry]);

  const handleRegionChange = (value: RegionKey) => {
    onRegionalFilterChange({
      region: value,
      subCountry: null,
      county: null,
      top100List: regionalFilter.top100List,
      sortBy: regionalFilter.sortBy
    });
  };

  const handleSubCountryChange = (value: string) => {
    onRegionalFilterChange({
      ...regionalFilter,
      subCountry: value,
      county: null
    });
  };

  const handleCountyChange = (value: string) => {
    onRegionalFilterChange({
      ...regionalFilter,
      county: value
    });
  };

  const handleTop100ListChange = (value: Top100ListKey) => {
    onRegionalFilterChange({
      ...regionalFilter,
      top100List: value
    });
  };

  const handleSortChange = (value: SortOptionKey) => {
    onRegionalFilterChange({
      ...regionalFilter,
      sortBy: value
    });
  };

  const clearFilters = () => {
    onRegionalFilterChange({
      region: 'all',
      subCountry: null,
      county: null,
      top100List: 'all',
      sortBy: 'name-asc'
    });
  };

  const hasActiveFilters = regionalFilter.region !== 'all' || regionalFilter.subCountry || regionalFilter.county || (regionalFilter.top100List && regionalFilter.top100List !== 'all') || (regionalFilter.sortBy && regionalFilter.sortBy !== 'name-asc');

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search golf courses by name or location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 focus:ring-[#b66b41] focus:border-[#b66b41]"
          />
        </div>
      </div>

      {/* Cascading Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Top 100 Lists Filter */}
        <Select 
          value={regionalFilter.top100List || 'all'} 
          onValueChange={handleTop100ListChange}
        >
          <SelectTrigger className="w-full sm:w-56 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {Object.entries(top100ListMapping).map(([value, label]) => (
              <SelectItem key={value} value={value} className="hover:bg-accent">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Options */}
        <Select 
          value={regionalFilter.sortBy || 'name-asc'} 
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-60 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {Object.entries(sortOptionMapping).map(([value, label]) => (
              <SelectItem key={value} value={value} className="hover:bg-accent">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Primary Region Selector */}
        <Select value={regionalFilter.region} onValueChange={handleRegionChange}>
          <SelectTrigger className="w-full sm:w-48 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {Object.entries(regionMapping).map(([value, label]) => (
              <SelectItem key={value} value={value} className="hover:bg-accent">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Secondary Sub-Country/State Selector */}
        {availableSubCountries.length > 0 && (
          <Select 
            value={regionalFilter.subCountry || ''} 
            onValueChange={handleSubCountryChange}
          >
            <SelectTrigger className="w-full sm:w-48 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border">
              <SelectValue placeholder={
                regionalFilter.region === 'usa' ? 'Select State' :
                regionalFilter.region === 'britain-ireland' ? 'Select Country' :
                'Select Country'
              } />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50 max-h-60 overflow-y-auto">
              {availableSubCountries.map((subCountry) => (
                <SelectItem key={subCountry} value={subCountry} className="hover:bg-accent">
                  {subCountry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Tertiary County/Region Selector (only for Britain & Ireland) */}
        {availableCounties.length > 0 && regionalFilter.subCountry && (
          <Select 
            value={regionalFilter.county || ''} 
            onValueChange={handleCountyChange}
          >
            <SelectTrigger className="w-full sm:w-48 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border">
              <SelectValue placeholder="Select County" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50 max-h-60 overflow-y-auto">
              {availableCounties.map((county) => (
                <SelectItem key={county} value={county} className="hover:bg-accent">
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {regionalFilter.top100List && regionalFilter.top100List !== 'all' && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground">
              {top100ListMapping[regionalFilter.top100List]}
            </span>
          )}
          {regionalFilter.sortBy && regionalFilter.sortBy !== 'name-asc' && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground">
              {sortOptionMapping[regionalFilter.sortBy]}
            </span>
          )}
          {regionalFilter.region !== 'all' && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground">
              {regionMapping[regionalFilter.region]}
            </span>
          )}
          {regionalFilter.subCountry && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground">
              {regionalFilter.subCountry}
            </span>
          )}
          {regionalFilter.county && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground">
              {regionalFilter.county}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CascadingFilters;