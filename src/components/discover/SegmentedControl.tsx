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
  { id: 'following', label: 'Friends' }
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
    <section className="py-3 px-4" style={{ background: '#F8FAFC' }}>
      <div 
        className="flex p-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(0, 0, 0, 0.06)' }}
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
                "flex-1 py-2.5 px-4 text-sm rounded-full transition-all duration-200",
                isActive 
                  ? "bg-white font-semibold shadow-sm" 
                  : "font-medium hover:bg-white/40"
              )}
              style={{ 
                color: isActive ? '#111827' : '#6b7280',
              }}
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
