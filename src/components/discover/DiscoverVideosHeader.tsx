import React, { useState } from 'react';
import SearchActivator from './SearchActivator';
import type { LengthKey } from '@/components/videos/VideoChipRail';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface DiscoverVideosHeaderProps {
  activeDuration: LengthKey;
  onChangeDuration: (key: LengthKey) => void;
  onOpenShorts: () => void;
  onSearchSubmit: (query: string) => void;
  initialQuery?: string;
}

const filterChips: { key: LengthKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'under4', label: 'Under 4 mins' },
  { key: '4to20', label: '4–20 mins' },
  { key: 'over20', label: 'Over 20 mins' }
];

const DiscoverVideosHeader: React.FC<DiscoverVideosHeaderProps> = ({
  activeDuration,
  onChangeDuration,
  onOpenShorts,
  onSearchSubmit,
  initialQuery = ''
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (query: string) => {
    onSearchSubmit(query);
    setIsSearchOpen(false);
  };

  return (
    <div className="sticky top-[var(--header-height,0px)] z-40 bg-white border-b border-gray-100">
      <div 
        className="relative flex items-center px-4 py-3"
        style={{ 
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        {/* Scrollable filter chips */}
        <div className="scrollbar-none -mr-2 flex snap-x snap-mandatory gap-2 overflow-x-auto pr-10 flex-1">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => onChangeDuration(chip.key)}
              className={cn(
                "h-9 rounded-full px-4 whitespace-nowrap text-sm font-medium transition-all flex-shrink-0 snap-start",
                activeDuration === chip.key
                  ? "bg-foreground text-background font-semibold"
                  : "bg-neutral-100 text-foreground/80 hover:bg-neutral-200"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        
        {/* Search icon pinned on the right */}
        <button
          onClick={handleSearchOpen}
          aria-label="Search videos"
          className="absolute right-4 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
        >
          <Search size={20} />
        </button>
      </div>
      
      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute inset-0 z-50 bg-white">
          <SearchActivator
            isOpen={isSearchOpen}
            onOpen={handleSearchOpen}
            onClose={handleSearchClose}
            onSubmit={handleSearchSubmit}
            initialQuery={initialQuery}
          />
        </div>
      )}
    </div>
  );
};

export default DiscoverVideosHeader;
