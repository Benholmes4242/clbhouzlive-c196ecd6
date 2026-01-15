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
    <section className="flex justify-center py-3 bg-[#F8FAFC]">
      {/* Hub-style pill toggle bar - matches Profile page */}
      <div 
        className="inline-flex items-center gap-1 p-1 rounded-full"
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
                "px-4 py-2 text-sm font-medium rounded-full transition-all duration-150 whitespace-nowrap",
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
