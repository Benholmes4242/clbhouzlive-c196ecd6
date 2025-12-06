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
 * ProfileTabsNav - iOS-style segmented control
 * Pill-shaped container with rounded pill tabs
 */
const ProfileTabsNav: React.FC<ProfileTabsNavProps> = ({
  userType,
  activeSection,
  onTabChange,
  isMobile,
  disabled = false
}) => {
  const tabs = getProfileTabs(userType);

  // Mobile: iOS segmented control style
  if (isMobile) {
    return (
      <section className="mt-5 px-4">
        <div className="flex items-center rounded-full bg-black/[0.03] p-2 backdrop-blur-md">
          {tabs.map((tab) => {
            const isActive = tab.id === activeSection;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => !disabled && onTabChange(tab.id)}
                disabled={disabled}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all",
                  "flex items-center justify-center gap-1.5",
                  isActive
                    ? "bg-background shadow-[0_8px_20px_rgba(0,0,0,0.18)] text-foreground"
                    : "text-foreground/60",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  // Desktop: Standard segmented control matching Explore
  return (
    <section className="mt-8">
      <div 
        className={cn(
          "grid w-full rounded-sq-md bg-muted/70 border border-border/60 px-2 py-[3px]",
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
                'rounded-sq-pill text-sm px-3 py-[6px] font-medium transition-all duration-motion-fast ease-standard',
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