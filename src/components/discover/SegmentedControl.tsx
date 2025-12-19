import React from 'react';
import { cn } from '@/lib/utils';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { DISCOVER_TABS, DiscoverTab, DEFAULT_DISCOVER_TAB, LEGACY_TO_NEW_TAB } from '@/constants/discoverTabs';
import '@/styles/discover-light.css';

interface SegmentedControlProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenVideoSearch?: () => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  activeTab, 
  onTabChange,
  onOpenVideoSearch
}) => {
  const { main, setMain } = useDiscoverQuery();
  
  // Map legacy main values to new tab system
  const currentTab: DiscoverTab = LEGACY_TO_NEW_TAB[main] || DEFAULT_DISCOVER_TAB;

  const handleTabClick = (tabId: DiscoverTab) => {
    // Map new tabs back to main param values
    // For Phase 1, Watch maps to 'shorts' (existing shorts feed)
    const tabToMain: Record<DiscoverTab, string> = {
      'watch': 'shorts',
      'learn': 'learn',
      'explore': 'explore',
      'following': 'following',
    };
    setMain(tabToMain[tabId] as any);
  };

  return (
    <nav className="discover-tabs-light">
      {DISCOVER_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            "discover-tab-light",
            currentTab === tab.id && "active"
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default SegmentedControl;
