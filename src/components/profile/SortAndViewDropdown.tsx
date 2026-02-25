import React from 'react';
import { MoreHorizontal, Grid3X3, List } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface SortAndViewDropdownProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  viewType: 'cards' | 'list';
  onViewTypeChange: (viewType: 'cards' | 'list') => void;
}

const SortAndViewDropdown: React.FC<SortAndViewDropdownProps> = ({ 
  selectedRegion, 
  onRegionChange, 
  selectedSort, 
  onSortChange,
  viewType,
  onViewTypeChange 
}) => {
  const regions = [
    { value: 'all', label: 'All Courses' },
    { value: 'global', label: 'Global Top 100' },
    { value: 'britain-ireland', label: 'GB&I Top 100' },
    { value: 'usa', label: 'USA Top 100' },
    { value: 'europe', label: 'Europe Top 100' }
  ];

  const sortOptions = [
    { value: 'rank-desc', label: 'Rank: High to Low' },
    { value: 'rank-asc', label: 'Rank: Low to High' },
    { value: 'recent', label: 'Recently Played' }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-muted/50 transition-colors">
          <MoreHorizontal className="w-5 h-5 text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-80 bg-background/95 backdrop-blur-sm border border-border/50 z-50"
        style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
      >
        {/* Top Section - Two Columns */}
        <div className="grid grid-cols-2 gap-4 p-2">
          {/* Left Column - Region Filter */}
          <div className="space-y-1">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
              REGION FILTER
            </DropdownMenuLabel>
            <div className="space-y-1">
              {regions.map((region) => (
                <div
                  key={region.value}
                  onClick={() => onRegionChange(region.value)}
                  className={`cursor-pointer transition-colors px-2 py-1.5 text-sm rounded ${
                    selectedRegion === region.value 
                      ? 'bg-muted text-foreground font-medium' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {region.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Sort Options */}
          <div className="space-y-1">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
              SORT OPTIONS
            </DropdownMenuLabel>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`cursor-pointer transition-colors px-2 py-1.5 text-sm rounded ${
                    selectedSort === option.value 
                      ? 'bg-muted text-foreground font-medium' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Bottom Section - Horizontal View Toggle */}
        <div className="p-2">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
            VIEW TYPE
          </DropdownMenuLabel>
          <div className="flex gap-2">
            <button
              onClick={() => onViewTypeChange('cards')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                viewType === 'cards'
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Card View
            </button>
            <button
              onClick={() => onViewTypeChange('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                viewType === 'list'
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortAndViewDropdown;