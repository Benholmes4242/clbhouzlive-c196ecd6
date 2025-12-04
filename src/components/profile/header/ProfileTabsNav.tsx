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
 * ProfileTabsNav - Premium Golf underline-only tabs with emerald glow
 * Clean, Apple-like design with subtle top border
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
    <div className="px-4 pt-4 pb-1">
      <div 
        ref={containerRef}
        className="relative flex justify-between border-t border-white/10 pt-3"
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
                'relative flex-1 text-center text-[13px] font-medium',
                'pb-2 transition-colors duration-200',
                isActive
                  ? 'text-foreground'
                  : 'text-foreground/55 hover:text-foreground/85',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              {tab.label}
              {/* Glowing emerald underline for active tab */}
              {isActive && (
                <span 
                  className={cn(
                    'pointer-events-none absolute left-1/2 -bottom-[1px]',
                    'h-[2px] w-9 -translate-x-1/2 rounded-full',
                    'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.65)]'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileTabsNav;
