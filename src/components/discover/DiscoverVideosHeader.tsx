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
  { key: 'trending', label: 'Trending', type: 'topic' },
  { key: '4-bros', label: 'fourbros', type: 'channel' },
  { key: 'bryson-dechambeau', label: 'Bryson DeChambeau', type: 'channel' },
];

const durationPills: FilterPill[] = [
  { key: 'all', label: 'All', type: 'duration' },
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
    <div className="sticky top-[var(--header-height,0px)] z-40 bg-white border-b border-gray-100">
      <div 
        className="relative flex items-center py-3"
        style={{ 
          paddingLeft: 'max(0rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        {/* Scrollable filter chips with fade-out mask */}
        <div className="no-scrollbar mask-fade-right flex gap-3 overflow-x-auto pl-4 pr-16 flex-1">
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
                className={cn(
                  "h-9 rounded-full px-4 whitespace-nowrap text-sm font-medium transition-all flex-shrink-0",
                  isActive
                    ? "bg-foreground text-background font-semibold"
                    : "bg-neutral-100 text-foreground/80 hover:bg-neutral-200"
                )}
                role="tab"
                aria-selected={isActive}
              >
                {pill.label}
              </button>
            );
          })}
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
