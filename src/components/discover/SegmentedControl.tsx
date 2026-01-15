import React from 'react';
import { cn } from '@/lib/utils';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { MainPill } from '@/constants/discoverPills';
import '@/styles/discover-tabs.css';

interface SegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenVideoSearch?: () => void;
}

const tabs = [
  { id: 'shorts', label: 'Activity' },
  { id: 'videos', label: 'Courses' },
  { id: 'channels', label: 'Top 100' },
  { id: 'following', label: 'Handicap' }
];

const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  activeTab, 
  onTabChange,
  onOpenVideoSearch
}) => {
  const { main, setMain } = useDiscoverQuery();

  const handleTabClick = (tabId: string) => {
    setMain(tabId as MainPill);
  };

  return (
    <div className="discover-header relative w-full">
      {/* Tab buttons */}
      <div className="discover-tabs flex w-full items-center">
        <div className="flex flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "discover-tab flex-1 py-[10px] px-4 text-center relative z-10 text-heading-md font-medium leading-tight",
                "transition-all duration-motion-fast ease-standard",
                "active:scale-[0.97] motion-reduce:active:scale-100",
                main === tab.id 
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