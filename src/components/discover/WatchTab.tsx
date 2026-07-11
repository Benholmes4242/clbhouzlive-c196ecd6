import { useState } from 'react';
import WatchTabContent from '@/components/watch/WatchTabContent';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';

export default function WatchTab() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <WatchTabContent embedded />
      <SearchOverlayV2
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        mode="commit"
        placeholder="Search shorts…"
        onCommit={() => {
          // WatchTab has no external grid to filter; committing just closes.
          // Video previews inside the overlay handle direct navigation.
          setIsSearchOpen(false);
        }}
      />
    </>
  );
}
