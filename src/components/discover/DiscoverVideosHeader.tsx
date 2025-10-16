import React, { useState } from 'react';
import SearchActivator from './SearchActivator';
import type { LengthKey } from '@/components/videos/VideoChipRail';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';

interface DiscoverVideosHeaderProps {
  activeDuration: LengthKey;
  onChangeDuration: (key: LengthKey) => void;
  onOpenShorts: () => void;
  onSearchSubmit: (query: string) => void;
  initialQuery?: string;
}

type PillType = 'topic' | 'channel' | 'duration';

interface FilterPill {
  key: string;
  label: string;
  type: PillType;
}

const featuredPills: FilterPill[] = [
  { key: 'all', label: 'All', type: 'duration' },
  { key: 'trending', label: 'Trending', type: 'topic' },
  { key: '4-bros', label: 'fourbros', type: 'channel' },
  { key: 'bryson-dechambeau', label: 'Bryson DeChambeau', type: 'channel' },
];

const durationPills: FilterPill[] = [
  { key: 'under4', label: 'Under 4 mins', type: 'duration' },
  { key: '4to20', label: '4–20 mins', type: 'duration' },
  { key: 'over20', label: 'Over 20 mins', type: 'duration' },
];

const allPills = [...featuredPills, ...durationPills];

const DiscoverVideosHeader: React.FC<DiscoverVideosHeaderProps> = ({
  activeDuration,
  onChangeDuration,
  onOpenShorts,
  onSearchSubmit,
  initialQuery = ''
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { topic, channel, setTopic, setChannel, setDuration } = useDiscoverQuery();

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
    <div 
      className="sticky top-[var(--header-height,0px)] z-40 discover-header"
    >
      <div 
        className="flex items-center gap-2 py-2 px-3 pb-3"
        style={{ 
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))'
        }}
      >
        {/* Search icon on the left */}
        <button
          onClick={handleSearchOpen}
          aria-label="Search videos"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
        >
          <Search size={20} />
        </button>

        {/* Scrollable filter chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto flex-1">
          {allPills.map((pill) => {
            const isActive = 
              (pill.type === 'duration' && activeDuration === pill.key) ||
              (pill.type === 'topic' && topic === pill.key) ||
              (pill.type === 'channel' && channel === pill.key);

            const handleClick = () => {
              if (pill.type === 'duration') {
                setDuration(pill.key);
                setTopic(undefined);
                setChannel(undefined);
              } else if (pill.type === 'topic') {
                setTopic(pill.key);
              } else if (pill.type === 'channel') {
                setChannel(pill.key);
              }
            };

            return (
              <button
                key={pill.key}
                onClick={handleClick}
                className={cn("filter-pill", isActive && "active")}
                role="tab"
                aria-selected={isActive}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
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
