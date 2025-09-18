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

  // Check if content overflows (needs scroll)
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Check overflow state
  const checkOverflow = React.useCallback(() => {
    if (tabsRef.current) {
      const { scrollWidth, clientWidth } = tabsRef.current;
      const hasOverflow = scrollWidth > clientWidth;
      setIsOverflowing(hasOverflow);
      
      if (hasOverflow) {
        const { scrollLeft } = tabsRef.current;
        setShowLeftFade(scrollLeft > 0);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth);
      } else {
        setShowLeftFade(false);
        setShowRightFade(false);
      }
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

  // Initialize scroll and overflow checks
  useEffect(() => {
    checkOverflow();
    const handleResize = () => {
      checkOverflow();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkOverflow]);

  return (
    <div className="relative">
      {/* Desktop centering wrapper */}
      <div className={`${isOverflowing ? '' : 'max-w-2xl mx-auto flex justify-center'}`}>
        {/* Left fade indicator */}
        {showLeftFade && isOverflowing && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/35 to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Right fade indicator */}
        {showRightFade && isOverflowing && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/35 to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable tabs container */}
        <div 
          ref={tabsRef}
          className={`flex items-center scrollbar-hide min-h-[32px] md:min-h-[44px] py-1 md:py-3 ${
            isOverflowing 
              ? 'overflow-x-auto px-6 space-x-4 md:space-x-8' 
              : 'justify-center space-x-6 md:space-x-8 px-6'
          }`}
          style={{ 
            scrollSnapType: isOverflowing ? 'x mandatory' : 'none',
            scrollBehavior: 'smooth'
          }}
          onScroll={checkOverflow}
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
            className={`relative font-medium transition-all duration-200 whitespace-nowrap ${
              item.id === activeTab 
                ? 'text-white font-semibold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-white after:rounded-full' 
                : 'text-white/70 hover:text-white'
            }`}
            style={{
              scrollSnapAlign: isOverflowing ? 'start' : 'none',
              minHeight: '40px',
              minWidth: '40px',
              padding: '8px',
              fontSize: 'clamp(13px, 1.4vw, 15px)',
              lineHeight: '1.2'
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
            className="text-white/70 hover:text-white transition-colors duration-200 flex-shrink-0 p-2"
            style={{
              scrollSnapAlign: isOverflowing ? 'start' : 'none',
              minHeight: '40px',
              minWidth: '40px'
            }}
            aria-label="Search"
          >
            <Search size={18} className="compact-icon-size" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScrollableTabs;