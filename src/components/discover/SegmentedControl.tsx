import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
  const [pillStyle, setPillStyle] = useState<{ width: number; transform: string }>({ 
    width: 0, 
    transform: "translateX(0)" 
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const idx = tabs.findIndex(t => t.id === main);
    const el = tabRefs.current[idx];
    const row = containerRef.current;
    if (!el || !row) return;
    const rowRect = row.getBoundingClientRect();
    const tabRect = el.getBoundingClientRect();
    setPillStyle({
      width: tabRect.width,
      transform: `translateX(${tabRect.left - rowRect.left}px)`
    });
  }, [main]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).analytics?.track) {
      (window as any).analytics.track("discover_tab_view", { tab: main });
    }
  }, [main]);

  const handleTabClick = (tabId: string) => {
    setMain(tabId as MainPill);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex(t => t.id === main);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setMain(tabs[(idx + 1) % tabs.length].id as MainPill);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setMain(tabs[(idx - 1 + tabs.length) % tabs.length].id as MainPill);
    } else if (e.key === "Home") {
      e.preventDefault();
      setMain(tabs[0].id as MainPill);
    } else if (e.key === "End") {
      e.preventDefault();
      setMain(tabs[tabs.length - 1].id as MainPill);
    }
  };

  return (
    <div className="discover-header relative w-full z-30">
      <div 
        ref={containerRef}
        role="tablist"
        aria-label="Discover sections"
        className="discover-tabs relative flex items-center gap-8 px-4 py-3 overflow-x-auto no-scrollbar"
      >
        {/* Tab buttons */}
        {tabs.map((tab, index) => {
          const active = main === tab.id;
          return (
            <button
              key={tab.id}
              ref={el => tabRefs.current[index] = el}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={handleKeyDown}
              data-analytics="discover_tab_click"
              data-tab={tab.id}
              className={cn(
                "relative text-[17px] font-semibold transition-colors focus:outline-none whitespace-nowrap",
                active ? "tab-active" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              {tab.label}
            </button>
          );
        })}
        
        {/* Search icon */}
        {onOpenVideoSearch && (
          <button
            aria-label="Search videos"
            onClick={onOpenVideoSearch}
            className="p-2 ml-auto hover:bg-black/5 rounded-full transition-colors z-10"
          >
            <Search size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SegmentedControl;