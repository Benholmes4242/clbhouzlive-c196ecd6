import React, { useState } from 'react';
import AllDropdown from './AllDropdown';
import ShortsTab from './ShortsTab';
import SearchActivator from './SearchActivator';
import type { LengthKey } from '@/components/videos/VideoChipRail';

interface DiscoverVideosHeaderProps {
  activeDuration: LengthKey;
  onChangeDuration: (key: LengthKey) => void;
  onOpenShorts: () => void;
  onSearchSubmit: (query: string) => void;
  initialQuery?: string;
}

const DiscoverVideosHeader: React.FC<DiscoverVideosHeaderProps> = ({
  activeDuration,
  onChangeDuration,
  onOpenShorts,
  onSearchSubmit,
  initialQuery = ''
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isShorts = activeDuration === 'shorts';

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
        className="relative flex items-center gap-2 px-4 py-3"
        style={{ 
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        {!isSearchOpen && (
          <>
            <AllDropdown
              activeDuration={activeDuration}
              onChangeDuration={onChangeDuration}
            />
            <ShortsTab
              isActive={isShorts}
              onOpenShorts={onOpenShorts}
            />
          </>
        )}
        <SearchActivator
          isOpen={isSearchOpen}
          onOpen={handleSearchOpen}
          onClose={handleSearchClose}
          onSubmit={handleSearchSubmit}
          initialQuery={initialQuery}
        />
      </div>
    </div>
  );
};

export default DiscoverVideosHeader;
