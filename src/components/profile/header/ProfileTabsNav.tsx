import React, { useRef, useEffect, useState } from 'react';
import { getProfileType } from '@/hooks/useProfileType';
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
const TAB_ICONS: Record<string, React.ElementType> = {
  activity: LayoutGrid,
  courses: MapPin,
  top100: Trophy,
  stats: TrendingUp,
};

// Personal profile tabs (Achievements hidden)
const PERSONAL_TABS_NEW = [
  { id: 'activity', label: 'Activity' },
  { id: 'courses', label: 'Courses' },
  { id: 'top100', label: 'Top 100 Journey' },
  { id: 'stats', label: 'Handicap' },
];

// Business profile tabs
const BUSINESS_TABS_NEW = [
  { id: 'activity', label: 'Activity' },
];

const getTabsForType = (userType: string | null | undefined) => {
  const { isPersonal } = getProfileType(userType);
  return isPersonal ? PERSONAL_TABS_NEW : BUSINESS_TABS_NEW;
};

/**
 * ProfileTabsNav - Icon + Label tabs with sliding underline
 */
const ProfileTabsNav: React.FC<ProfileTabsNavProps> = ({
  userType,
  activeSection,
  onTabChange,
  isMobile,
  disabled = false
}) => {
  const tabs = getTabsForType(userType);
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
    <div className="w-full mt-6 pt-2">
      <div 
        ref={containerRef}
        className="relative flex justify-around" 
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
                "relative flex flex-col items-center gap-1 py-3 px-4",
                "transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
                isActive 
                  ? "text-foreground" 
                  : "text-foreground/40 hover:text-foreground/70",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              {Icon && <Icon className="w-[18px] h-[18px]" />}
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
        
        {/* Sliding underline */}
        <div 
          className={cn(
            "absolute bottom-0 h-[2px] rounded-full",
            "bg-foreground",
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
