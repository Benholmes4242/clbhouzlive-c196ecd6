import React from 'react';
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
 * ProfileTabsNav - Matches Explore page tabs styling
 * Segmented control with muted background
 */
const ProfileTabsNav: React.FC<ProfileTabsNavProps> = ({
  userType,
  activeSection,
  onTabChange,
  isMobile,
  disabled = false
}) => {
  const tabs = getProfileTabs(userType);

  return (
    <section className="mt-7 flex justify-center">
      <div 
        className={cn(
          "inline-grid rounded-sq-md bg-muted/70 border border-border/60 px-2 py-[3px]",
          tabs.length === 4 && "grid-cols-4",
          tabs.length === 3 && "grid-cols-3",
          tabs.length === 2 && "grid-cols-2",
          tabs.length === 1 && "grid-cols-1"
        )}
        role="tablist"
        aria-label="Profile sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeSection;
          
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              className={cn(
                'rounded-sq-pill text-base px-4 py-2 font-medium transition-all duration-150 ease-out',
                isActive
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
                disabled && 'pointer-events-none opacity-50'
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