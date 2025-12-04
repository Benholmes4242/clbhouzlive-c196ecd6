import React, { useRef, useEffect, useState } from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { cn } from '@/lib/utils';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav - Apple-style pill segmented control
 * Clean iOS-style tabs with raised active pill
 */
const ProfileTabsNav: React.FC<ProfileTabsNavProps> = ({
  userType,
  activeSection,
  onTabChange,
  isMobile,
  disabled = false
}) => {
  const tabs = getProfileTabs(userType);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  
  // Update underline position when active tab changes (for desktop)
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeSection);
    const activeTab = tabsRef.current[activeIndex];
    const container = containerRef.current;
    
    if (activeTab && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const left = tabRect.left - containerRect.left;
      setUnderlineStyle({ left, width: tabRect.width });
    }
  }, [activeSection, tabs]);

  // Mobile: Apple-style pill segmented control
  if (isMobile) {
    return (
      <div className="px-4 mt-4 mb-2">
        <div className="flex rounded-full bg-black/4 dark:bg-white/6 p-1 backdrop-blur-md border border-white/15">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeSection;
            return (
              <button
                key={tab.id}
                ref={el => tabsRef.current[index] = el}
                onClick={() => !disabled && onTabChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                disabled={disabled}
                className={cn(
                  'flex-1 rounded-full py-1.5 text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-background shadow-[0_4px_12px_rgba(0,0,0,0.18)] text-foreground'
                    : 'text-muted-foreground hover:text-foreground/90',
                  disabled && 'pointer-events-none opacity-50'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: Underline tabs with emerald glow
  return (
    <div className="mt-4 border-t border-white/10">
      <div 
        ref={containerRef}
        className="relative flex items-center justify-between max-w-[360px] mx-auto"
        role="tablist"
        aria-label="Profile sections"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeSection;
          
          return (
            <button
              key={tab.id}
              ref={el => tabsRef.current[index] = el}
              onClick={() => !disabled && onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              className={cn(
                'relative flex-1 py-3 text-center text-[13px] font-medium',
                'transition-colors duration-200',
                isActive
                  ? 'text-foreground'
                  : 'text-foreground/60 hover:text-foreground/85',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              {tab.label}
            </button>
          );
        })}
        
        {/* Animated underline */}
        <div
          className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.85)] transition-all duration-200"
          style={{
            transform: `translateX(${underlineStyle.left}px)`,
            width: underlineStyle.width || 0,
          }}
        />
      </div>
    </div>
  );
};

export default ProfileTabsNav;
