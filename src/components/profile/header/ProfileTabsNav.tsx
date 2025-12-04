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
 * ProfileTabsNav - Premium tab navigation with animated underline
 * Personal: Activity, Courses, Top 100 Journey, Achievements, Handicap
 * Business: Activity only
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
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  
  // Update underline position when active tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeSection);
    const activeTab = tabsRef.current[activeIndex];
    
    if (activeTab) {
      const { offsetLeft, offsetWidth } = activeTab;
      setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeSection, tabs]);

  if (isMobile) {
    return (
      <nav className="mt-4 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 min-w-max pb-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={el => tabsRef.current[index] = el}
              onClick={() => !disabled && onTabChange(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap",
                "transition-all duration-200 ease-out",
                activeSection === tab.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                disabled && "pointer-events-none opacity-50"
              )}
              aria-selected={activeSection === tab.id}
              disabled={disabled}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    );
  }

  // Desktop layout with sliding underline
  return (
    <div className="w-full border-t border-border/50 mt-6 pt-2">
      <div className="relative flex" role="tablist" aria-label="Profile sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => tabsRef.current[index] = el}
            onClick={() => !disabled && onTabChange(tab.id)}
            role="tab"
            aria-selected={activeSection === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeSection === tab.id ? 0 : -1}
            disabled={disabled}
            className={cn(
              "relative py-4 px-4 text-sm font-medium transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
              activeSection === tab.id 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
              "flex-1 text-center"
            )}
          >
            {tab.label}
          </button>
        ))}
        
        {/* Animated underline indicator */}
        <div 
          className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
          style={{
            left: underlineStyle.left,
            width: underlineStyle.width,
          }}
        />
      </div>
    </div>
  );
};

export default ProfileTabsNav;
