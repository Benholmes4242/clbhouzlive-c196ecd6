
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
        background: isClubhouse ? undefined : 'var(--surface-nav)',
        borderTop: isClubhouse ? undefined : '1px solid var(--border-subtle)',
        boxShadow: isClubhouse ? undefined : 'var(--shadow-soft)',
      }}
    >
      <div className="w-full px-2">
        {/* Reduced height for compactness: 44px mobile / 48px desktop */}
        <div className="flex items-center justify-between h-11 md:h-12 relative">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
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
                  "min-h-[44px] min-w-[44px] p-2 transition-colors duration-200",
                  // Active state uses accent color for all tabs
                  isActive && "text-accent",
                  // Inactive state
                  !isActive && (isClubhouse ? "text-white/80" : "text-muted-foreground"),
                  // Hover state
                  !isActive && "hover:text-foreground"
                )}
                aria-label={tab.label}
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Icon 
                  className={cn(
                    "h-8 w-8 transition-colors duration-200"
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
