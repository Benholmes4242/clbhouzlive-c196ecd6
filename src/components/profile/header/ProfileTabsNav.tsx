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
 * ProfileTabsNav - Premium floating tab bar with glassy effect and glowing underline
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

  // Mobile: Floating pill tabs
  if (isMobile) {
    return (
      <nav className="mt-5 px-3">
        <div
          ref={containerRef}
          className={cn(
            "flex items-center justify-between",
            "rounded-full p-1",
            "bg-black/22 border border-white/16",
            "backdrop-blur-xl"
          )}
        >
          {tabs.map((tab, index) => {
            const active = tab.id === activeSection;
            return (
              <button
                key={tab.id}
                ref={el => tabsRef.current[index] = el}
                onClick={() => !disabled && onTabChange(tab.id)}
                className={cn(
                  "relative flex-1 py-1.5 text-center text-[13px] rounded-full",
                  "transition-all duration-150",
                  active 
                    ? "text-foreground" 
                    : "text-foreground/60 hover:text-foreground/80",
                  disabled && "pointer-events-none opacity-50"
                )}
                aria-selected={active}
                disabled={disabled}
              >
                {tab.label}
                {/* Glowing underline for active tab */}
                {active && (
                  <span
                    className={cn(
                      "absolute left-1/2 -bottom-[2px] -translate-x-1/2",
                      "h-[2px] w-9 rounded-full",
                      "bg-primary/90",
                      "shadow-[0_0_6px_hsl(var(--primary)/0.9)]"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Desktop: Sliding underline tabs
  return (
    <div className="w-full border-t border-border/50 mt-6 pt-2">
      <div 
        ref={containerRef}
        className="relative flex" 
        role="tablist" 
        aria-label="Profile sections"
      >
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
        
        {/* Animated underline with glow */}
        <div 
          className={cn(
            "absolute bottom-0 h-0.5 rounded-full",
            "bg-primary",
            "shadow-[0_0_8px_hsl(var(--primary)/0.8)]",
            "transition-all duration-300 ease-out"
          )}
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
