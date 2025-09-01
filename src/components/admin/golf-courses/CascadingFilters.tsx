import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  scopeMapping, 
  ScopeKey, 
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

  // Update available sub-countries when scope changes
  useEffect(() => {
    let subCountries: string[] = [];
    
    // Only show sub-countries if no Top 100 is selected and scope is specific
    if (!regionalFilter.top100List) {
      switch (regionalFilter.scope) {
        case 'usa':
          subCountries = usStates;
          break;
        case 'britain-ireland':
          subCountries = britainIrelandCountries;
          break;
        case 'europe':
          subCountries = continentalEuropeCountries;
          break;
        default:
          subCountries = [];
      }
    }
    
    setAvailableSubCountries(subCountries);
    
    // Reset sub-country and county when scope changes
    onRegionalFilterChange({
      ...regionalFilter,
      subCountry: null,
      county: null
    });
  }, [regionalFilter.scope, regionalFilter.top100List]);

  // Update available counties when sub-country changes
  useEffect(() => {
    let counties: string[] = [];
    
    if (regionalFilter.scope === 'britain-ireland' && regionalFilter.subCountry && !regionalFilter.top100List) {
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
  }, [regionalFilter.subCountry, regionalFilter.scope, regionalFilter.top100List]);

  const handleScopeChange = (value: ScopeKey) => {
    onRegionalFilterChange({
      scope: value,
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

  const handleTop100ListChange = (value: string) => {
    if (value === 'none') {
      // Clear Top 100 filter
      onRegionalFilterChange({
        ...regionalFilter,
        top100List: null,
        subCountry: null,
        county: null
      });
    } else {
      // Set Top 100 filter and clear/disable scope-related filters
      onRegionalFilterChange({
        scope: 'all',
        subCountry: null,
        county: null,
        top100List: value as Top100ListKey,
        sortBy: regionalFilter.sortBy
      });
    }
  };

  const handleSortChange = (value: SortOptionKey) => {
    onRegionalFilterChange({
      ...regionalFilter,
      sortBy: value
    });
  };

  const clearFilters = () => {
    onRegionalFilterChange({
      scope: 'all',
      subCountry: null,
      county: null,
      top100List: null,
      sortBy: 'name-asc'
    });
  };

  const hasActiveFilters = regionalFilter.scope !== 'all' || regionalFilter.subCountry || regionalFilter.county || regionalFilter.top100List || (regionalFilter.sortBy && regionalFilter.sortBy !== 'name-asc');

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
        {/* Scope Filter (merged All Courses + Regions) */}
        <Select 
          value={regionalFilter.scope} 
          onValueChange={handleScopeChange}
          disabled={!!regionalFilter.top100List}
        >
          <SelectTrigger className={`w-full sm:w-48 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border ${regionalFilter.top100List ? 'opacity-50' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            {Object.entries(scopeMapping).map(([value, label]) => (
              <SelectItem key={value} value={value} className="hover:bg-accent">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Top 100 Courses Filter */}
        <Select 
          value={regionalFilter.top100List || 'none'} 
          onValueChange={handleTop100ListChange}
        >
          <SelectTrigger className="w-full sm:w-56 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border">
            <SelectValue placeholder="Top 100 Courses" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="none" className="hover:bg-accent">
              None Selected
            </SelectItem>
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


        {/* Secondary Sub-Country/State Selector - only when no Top 100 selected */}
        {availableSubCountries.length > 0 && !regionalFilter.top100List && (
          <Select 
            value={regionalFilter.subCountry || ''} 
            onValueChange={handleSubCountryChange}
          >
            <SelectTrigger className="w-full sm:w-48 focus:ring-[#b66b41] focus:border-[#b66b41] bg-background border-border">
              <SelectValue placeholder={
                regionalFilter.scope === 'usa' ? 'Select State' :
                regionalFilter.scope === 'britain-ireland' ? 'Select Country' :
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

        {/* Tertiary County/Region Selector (only for Britain & Ireland, not with Top 100) */}
        {availableCounties.length > 0 && regionalFilter.subCountry && !regionalFilter.top100List && (
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
          {regionalFilter.top100List && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground flex items-center gap-2">
              Top 100: {top100ListMapping[regionalFilter.top100List]}
              <button 
                onClick={() => handleTop100ListChange('none')}
                className="hover:bg-secondary-foreground/20 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {regionalFilter.sortBy && regionalFilter.sortBy !== 'name-asc' && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground">
              {sortOptionMapping[regionalFilter.sortBy]}
            </span>
          )}
          {!regionalFilter.top100List && regionalFilter.scope !== 'all' && (
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground">
              Scope: {scopeMapping[regionalFilter.scope]}
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

      {/* Top 100 Active Notice */}
      {regionalFilter.top100List && (
        <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded border-l-4 border-[#b66b41]">
          Filtering by {top100ListMapping[regionalFilter.top100List]}. Other location filters are disabled.
        </div>
      )}
    </div>
  );
};

export default CascadingFilters;