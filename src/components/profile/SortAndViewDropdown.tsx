import React from 'react';
import { ChevronDown, Grid3X3, List } from 'lucide-react';
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
    { value: 'britain-ireland', label: 'Britain & Ireland Top 100' },
    { value: 'usa', label: 'USA Top 100' },
    { value: 'europe', label: 'Europe Top 100' }
  ];

  const sortOptions = [
    { value: 'rank-asc', label: 'Rank: Low to High' },
    { value: 'rank-desc', label: 'Rank: High to Low' },
    { value: 'recent', label: 'Recently Played' }
  ];

  const viewOptions = [
    { value: 'cards' as const, label: 'Card View', icon: Grid3X3 },
    { value: 'list' as const, label: 'List View', icon: List }
  ];

  const currentRegion = regions.find(r => r.value === selectedRegion);
  const currentSort = sortOptions.find(s => s.value === selectedSort);
  const currentView = viewOptions.find(v => v.value === viewType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex items-center cursor-pointer bg-white/10 backdrop-blur-2xl border border-white/20 px-3 py-1.5 text-white shadow-lg hover:bg-white/20 transition-all duration-300 rounded-full"
          style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
        >
          <span className="text-sm font-medium text-black">
            Sort & View
          </span>
          <ChevronDown className="w-4 h-4 ml-2 text-black" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 bg-background/95 backdrop-blur-sm border border-border/50"
        style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
      >
        {/* Region Section */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Region Filter
        </DropdownMenuLabel>
        {regions.map((region) => (
          <DropdownMenuItem
            key={region.value}
            onClick={() => onRegionChange(region.value)}
            className={`cursor-pointer transition-colors ${
              selectedRegion === region.value 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-muted/50'
            }`}
          >
            {region.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Sort Section */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sort Options
        </DropdownMenuLabel>
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`cursor-pointer transition-colors ${
              selectedSort === option.value 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-muted/50'
            }`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* View Section */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          View Type
        </DropdownMenuLabel>
        {viewOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onViewTypeChange(option.value)}
              className={`cursor-pointer transition-colors flex items-center ${
                viewType === option.value 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <IconComponent className="w-4 h-4 mr-2" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortAndViewDropdown;