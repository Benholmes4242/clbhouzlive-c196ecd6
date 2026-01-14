import React, { useRef } from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { cn } from '@/lib/utils';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string, scrollSnapshot?: number) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav - Hub-style toggle bar
 * Captures scroll position at click time before any state changes
 */
const ProfileTabsNav: React.FC<ProfileTabsNavProps> = ({
  userType,
  activeSection,
  onTabChange,
  isMobile,
  disabled = false
}) => {
  const tabs = getProfileTabs(userType);
  const scrollSnapshotRef = useRef<number>(0);

  // Capture scroll position on mousedown/touchstart (before click completes)
  const handlePointerDown = () => {
    scrollSnapshotRef.current = window.scrollY;
  };

  // Pass captured scroll snapshot when tab changes
  const handleTabClick = (tabId: string) => {
    if (disabled) return;
    onTabChange(tabId, scrollSnapshotRef.current);
  };

  return (
    <section 
      className="py-2 bg-[#F8FAFC]"
      onPointerDown={handlePointerDown}
    >
      <div className="px-4">
        {/* Full-width segmented control - matches ScheduleFilterPills exactly */}
        <div 
          className="flex items-stretch rounded-xl overflow-hidden"
          style={{ background: '#e2e8f0' }}
        >
          {tabs.map((tab) => {
            const isActive = activeSection === tab.id;
            
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(tab.id)}
                disabled={disabled}
                className={cn(
                  "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap",
                  "min-h-[44px]", // Accessibility touch target
                  isActive 
                    ? "bg-white text-slate-800 shadow-sm m-1 rounded-lg" 
                    : "text-slate-500 hover:text-slate-700",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProfileTabsNav;
