import React, { useRef, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface ScrollableTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ScrollableTabs: React.FC<ScrollableTabsProps> = ({ activeTab, onTabChange }) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const menuItems = [
    { label: 'Following', id: 'Following' },
    { label: 'Explore', id: 'Explore' },
    { label: 'Trending', id: 'Trending' },
    { label: 'Channels', id: 'Channels' },
  ];

  // Check scroll position to show/hide fade indicators (throttled for performance)
  const checkScroll = React.useCallback(() => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftFade(scrollLeft > 0);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth);
    }
  }, []);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ 
          block: 'nearest', 
          inline: 'center',
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab]);

  // Initialize scroll check
  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative">
      {/* Left fade indicator */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right fade indicator */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none" />
      )}

      {/* Scrollable tabs container */}
      <div 
        ref={tabsRef}
        className="flex items-center overflow-x-auto scrollbar-hide px-6 space-x-8 compact-tab-gap"
        style={{ 
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth'
        }}
        onScroll={checkScroll}
        role="tablist"
        onKeyDown={(e) => {
          // Arrow key navigation for accessibility
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const currentIndex = menuItems.findIndex(item => item.id === activeTab);
            let nextIndex;
            if (e.key === 'ArrowLeft') {
              nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
            } else {
              nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
            }
            onTabChange(menuItems[nextIndex].id);
          }
        }}
      >
        {menuItems.map((item) => (
          <button
            key={item.id}
            data-tab={item.id}
            onClick={() => onTabChange(item.id)}
            className={`relative text-lg font-medium transition-all duration-200 whitespace-nowrap compact-tab-font ${
              item.id === activeTab 
                ? 'text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-white after:rounded-full' 
                : 'text-white/70 hover:text-white'
            }`}
            style={{
              scrollSnapAlign: 'start',
              minHeight: '44px',
              minWidth: '44px', // Ensure minimum tap target
              padding: '12px 8px'
            }}
            role="tab"
            aria-selected={item.id === activeTab}
            aria-controls={`panel-${item.id}`}
          >
            {item.label}
          </button>
        ))}
        
        {/* Search icon button */}
        <button 
          className="text-white/70 hover:text-white transition-colors duration-200 flex-shrink-0 p-3"
          style={{
            scrollSnapAlign: 'start',
            minHeight: '44px',
            minWidth: '44px'
          }}
          aria-label="Search"
        >
          <Search size={18} className="compact-icon-size" />
        </button>
      </div>
    </div>
  );
};

export default ScrollableTabs;