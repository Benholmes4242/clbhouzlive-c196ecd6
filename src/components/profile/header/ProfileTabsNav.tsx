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
 * ProfileTabsNav - Apple/TikTok style segment control
 * Pill-shaped with rounded-full container
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
    <section className="mt-6 px-4">
      <div className="flex items-center justify-center">
        <div 
          className={cn(
            "inline-flex rounded-full bg-muted p-1 text-xs shadow-inner",
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
                  'relative rounded-full px-4 py-2 transition-all',
                  'text-xs font-medium',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                  disabled && 'pointer-events-none opacity-50'
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
