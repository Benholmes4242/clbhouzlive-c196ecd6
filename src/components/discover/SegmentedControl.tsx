import React from 'react';
import { cn } from '@/lib/utils';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { MainPill } from '@/constants/discoverPills';

interface SegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenVideoSearch?: () => void;
}

const tabs = [
  { id: 'shorts', label: 'Watch' },
  { id: 'videos', label: 'Videos' },
  { id: 'channels', label: 'Explore' },
  { id: 'following', label: 'Community' }
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
    <section className="py-3 px-4 bg-[#F8FAFC]">
      {/* Rectangular tab bar with overflow-hidden to contain active state */}
      <div 
        className="flex items-center w-full gap-0.5 p-1 rounded-xl overflow-hidden"
        style={{ background: '#e2e8f0' }}
      >
        {tabs.map((tab) => {
          const isActive = main === tab.id;
          
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex-1 min-w-0 px-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 truncate",
                isActive 
                  ? "bg-white text-[#1e293b] shadow-sm" 
                  : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SegmentedControl;
