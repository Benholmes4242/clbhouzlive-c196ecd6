import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { MainPill } from '@/constants/discoverPills';
import '@/styles/discover-tabs.css';

interface SegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// New Discover tabs structure for Phase 1
// Watch is the only fully implemented tab; others are stubs
const tabs = [
  { id: 'watch', label: 'Watch' },
  { id: 'learn', label: 'Learn' },
  { id: 'explore', label: 'Explore' },
  { id: 'following', label: 'Following' }
];

const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  activeTab, 
  onTabChange,
}) => {
  const { main, setMain } = useDiscoverQuery();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Map old main values to new tab structure for backwards compatibility
  const currentTab = React.useMemo(() => {
    // If current main is one of the old values, map to 'watch'
    if (['shorts', 'videos', 'channels'].includes(main)) {
      return 'watch';
    }
    // If it's already a new tab value, use it
    if (['watch', 'learn', 'explore', 'following'].includes(main)) {
      return main;
    }
    return 'watch';
  }, [main]);

  const handleTabClick = (tabId: string) => {
    // Map new tabs to main pill values
    // For now, 'watch' maps to 'shorts' (the shorts grid)
    // Other tabs will be stubs
    if (tabId === 'watch') {
      setMain('shorts' as MainPill);
    } else {
      setMain(tabId as MainPill);
    }
  };

  return (
    <div className="discover-header relative w-full">
      {/* Tab buttons */}
      <div className="discover-tabs flex w-full items-center">
        <div className="flex flex-1">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={el => tabRefs.current[index] = el}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "discover-tab flex-1 py-[10px] px-4 text-center relative z-10 text-heading-md font-medium leading-tight",
                "transition-all duration-motion-fast ease-standard",
                "active:scale-[0.97] motion-reduce:active:scale-100",
                currentTab === tab.id 
                  ? "active text-primary" 
                  : "text-secondary hover:text-primary/80 motion-reduce:transition-none"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SegmentedControl;