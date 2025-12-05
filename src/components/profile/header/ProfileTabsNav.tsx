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
 * ProfileTabsNav - White pill with black underline on active tab
 * Premium Golf style - clean, Apple-like
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
  
  // Update underline position when active tab changes
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

  return (
    <section className="mt-5 flex justify-center">
      <div 
        ref={containerRef}
        className="inline-flex max-w-full overflow-x-auto rounded-[20px] bg-background shadow-[0_4px_16px_rgba(15,23,42,0.08)] px-3 py-1"
        role="tablist"
        aria-label="Profile sections"
      >
        <div className="flex gap-2 md:gap-4">
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
                  'relative px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground/80',
                  disabled && 'pointer-events-none opacity-50'
                )}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[4px] mx-auto h-[2px] rounded-full bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProfileTabsNav;
