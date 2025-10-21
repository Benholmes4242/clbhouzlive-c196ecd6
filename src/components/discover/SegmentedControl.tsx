import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { MainPill } from '@/constants/discoverPills';
import { Search } from 'lucide-react';
import '@/styles/discover-tabs.css';

interface SegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenVideoSearch?: () => void;
}

const tabs = [
  { id: 'shorts', label: 'Shorts' },
  { id: 'videos', label: 'Videos' },
  { id: 'channels', label: 'Channels' },
  { id: 'following', label: 'Following' }
];

const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  activeTab, 
  onTabChange,
  onOpenVideoSearch
}) => {
  const { main, setMain } = useDiscoverQuery();
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === main);
    const activeTabElement = tabRefs.current[activeIndex];
    
    if (activeTabElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      
      setIndicatorStyle({
        width: tabRect.width,
        transform: `translateX(${tabRect.left - containerRect.left}px)`,
      });
    }
  }, [main]);

  const handleTabClick = (tabId: string) => {
    setMain(tabId as MainPill);
  };

  return (
    <div 
      ref={containerRef}
      className="discover-header relative w-full"
    >
      {/* Tab buttons */}
      <div className="discover-tabs flex w-full items-center">
        <div className="flex flex-1 relative">
          {/* Floating grey pill indicator */}
          <div
            className="absolute pill-indicator transition-all duration-300 ease-out"
            style={indicatorStyle}
          />
          
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={el => tabRefs.current[index] = el}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "discover-tab flex-1 py-3 px-4 text-center relative z-10 text-[16px]",
                main === tab.id 
                  ? "active" 
                  : "hover:text-foreground/70"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Search icon */}
        {onOpenVideoSearch && (
          <button
            aria-label="Search videos"
            onClick={onOpenVideoSearch}
            className="p-2 mr-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <Search size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SegmentedControl;