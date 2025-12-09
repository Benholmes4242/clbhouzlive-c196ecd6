
import React from 'react';
import { navigationTabs } from './navigationTabs';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
  variant?: 'default' | 'clubhouse';
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabClick, variant = 'default' }) => {
  const isClubhouse = variant === 'clubhouse';
  
  
  return (
    <nav 
      className={cn(
        "w-full",
        // Remove fixed positioning - parent handles it now
        isClubhouse 
          ? "text-white" 
          : "text-foreground"
      )}
      style={{
        // Safe area handling moved to parent
        minHeight: '44px',
        background: isClubhouse ? undefined : 'transparent',
        borderTop: isClubhouse ? undefined : '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="w-full px-2">
        {/* Reduced height for compactness: 44px mobile / 48px desktop */}
        <div className="flex items-center justify-between h-11 md:h-12 relative">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Activity/bell icon should have NO active or hover state - always neutral
            const isActivityTab = tab.id === 'activity';
            
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabClick(tab);
                }}
                className={cn(
                  "flex items-center justify-center relative focus:outline-none",
                  "min-h-[44px] min-w-[44px] p-2",
                  "transition-all duration-motion-fast ease-standard",
                  "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
                  // Activity tab: completely neutral, no hover/active effects
                  isActivityTab && (isClubhouse ? "text-white/70" : "text-white/70"),
                  // Non-activity tabs: normal hover/scale effects
                  !isActivityTab && "hover:scale-[1.05] active:scale-[0.95]",
                  // Active state for non-activity tabs
                  isActive && !isActivityTab && "text-[color:var(--primary-accent)]",
                  // Inactive state for non-activity tabs
                  !isActive && !isActivityTab && (isClubhouse ? "text-white/80" : "text-white/85"),
                  // Hover color for non-activity tabs
                  !isActivityTab && (isClubhouse ? "hover:text-white" : "hover:text-white")
                )}
                aria-label={tab.label}
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Icon 
                  className={cn(
                    "h-8 w-8 transition-all duration-motion-fast ease-standard"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
