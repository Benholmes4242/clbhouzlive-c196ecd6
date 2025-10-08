import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { MainPill } from '@/constants/discoverPills';

interface SegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'shorts', label: 'Shorts' },
  { id: 'channels', label: 'Channels' },
  { id: 'videos', label: 'Videos' },
  { id: 'photos', label: 'Photos' },
  { id: 'friends', label: 'Friends' }
];

const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  activeTab, 
  onTabChange 
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
      className="relative w-full bg-white border-b border-gray-200"
    >
      {/* Tab buttons */}
      <div className="flex w-full">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => tabRefs.current[index] = el}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "flex-1 py-3 px-4 text-center transition-all duration-200 relative z-10 text-base",
              main === tab.id 
                ? "text-foreground font-bold" 
                : "text-muted-foreground font-medium hover:text-foreground/70"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Sliding underline indicator */}
      <div
        className="absolute bottom-0 h-0.5 bg-brand-orange transition-all duration-300 ease-out"
        style={indicatorStyle}
      />
    </div>
  );
};

export default SegmentedControl;