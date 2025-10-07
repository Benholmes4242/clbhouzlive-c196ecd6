import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'Shorts', label: 'Shorts' },
  { id: 'Channels', label: 'Channels' },
  { id: 'Videos', label: 'Videos' },
  { id: 'Photos', label: 'Photos' },
  { id: 'Friends', label: 'Friends' }
];

const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabRefs.current[activeIndex];
    
    if (activeTabElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      
      setIndicatorStyle({
        width: tabRect.width,
        transform: `translateX(${tabRect.left - containerRect.left}px)`,
      });
    }
  }, [activeTab]);

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
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 py-3 px-4 text-center transition-all duration-200 relative z-10 text-base",
              activeTab === tab.id 
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