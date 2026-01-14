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
      className="flex justify-center py-3 bg-[#F8FAFC]"
      onPointerDown={handlePointerDown}
    >
      {/* Hub-style pill toggle bar */}
      <div 
        className="inline-flex items-center gap-1 p-1 rounded-full"
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
                "px-4 py-2 text-sm font-medium rounded-full transition-all duration-150 whitespace-nowrap",
                isActive 
                  ? "bg-white text-[#1e293b] shadow-sm" 
                  : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileTabsNav;
