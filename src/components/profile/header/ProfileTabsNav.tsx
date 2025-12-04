import React from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav - Tab navigation using getProfileTabs as single source of truth
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

  if (isMobile) {
    return (
      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !disabled && onTabChange(tab.id)}
            className="tab"
            aria-selected={activeSection === tab.id}
            disabled={disabled}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    );
  }

  // Desktop layout with underline animation
  return (
    <div className="w-full border-t border-border mt-4 pt-4">
      <div className="flex" role="tablist" aria-label="Profile sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !disabled && onTabChange(tab.id)}
            role="tab"
            aria-selected={activeSection === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeSection === tab.id ? 0 : -1}
            disabled={disabled}
            className={`
              relative py-3 px-3 text-base font-normal transition-colors duration-200
              ${activeSection === tab.id 
                ? 'text-foreground focus:outline-none' 
                : 'text-muted-foreground hover:text-foreground focus:outline-none'
              }
              ${disabled ? 'pointer-events-none opacity-50' : ''}
              flex-1 text-center
            `}
          >
            {tab.label}
            {/* Brand orange underline animation */}
            <div 
              className={`
                absolute bottom-0 left-0 right-0 h-0.5 bg-primary
                transition-all duration-300 ease-out
                ${activeSection === tab.id 
                  ? 'scale-x-100 opacity-100' 
                  : 'scale-x-0 opacity-0'
                }
                origin-center
              `}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTabsNav;
