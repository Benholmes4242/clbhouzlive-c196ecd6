import React, { useRef, useEffect, useState } from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { cn } from '@/lib/utils';
import { LayoutGrid, MapPin, Trophy, TrendingUp } from 'lucide-react';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string) => void;
  isMobile: boolean;
  disabled?: boolean;
}

// Icon mapping for tabs
const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: LayoutGrid,
  courses: MapPin,
  top100: Trophy,
  stats: TrendingUp,
};

/**
 * ProfileTabsNav - Icon + Label tabs with sliding underline
 * Personal: Activity, Courses, Top 100 Journey, Handicap
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

  return (
    <div className="w-full mt-5 pt-2">
      <div 
        ref={containerRef}
        className="relative flex justify-center" 
        role="tablist" 
        aria-label="Profile sections"
      >
        {tabs.map((tab, index) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeSection === tab.id;
          
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
                "relative flex flex-col items-center gap-1 py-3 px-4 transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
                isActive 
                  ? "text-foreground" 
                  : "text-foreground/40 hover:text-foreground/70",
                disabled && "pointer-events-none opacity-50",
                isMobile ? "flex-1" : "min-w-[80px]"
              )}
            >
              {Icon && <Icon className={cn("w-[16px] h-[16px]", isActive ? "text-foreground" : "text-foreground/40")} />}
              <span className={cn(
                "text-[11px] font-medium",
                isActive ? "text-foreground" : "text-foreground/50"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
        
        {/* Animated underline */}
        <div 
          className={cn(
            "absolute bottom-0 h-[2px] rounded-full",
            "bg-current",
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
