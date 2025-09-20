
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
        "fixed bottom-0 left-0 right-0 z-bottom-nav",
        isClubhouse 
          ? "bg-black/60 backdrop-blur-md border-t border-white/10" 
          : "bg-background/95 backdrop-blur-md border-t border-border/50"
      )}
      style={{
        ['--safe-bottom' as any]: 'env(safe-area-inset-bottom)',
        paddingBottom: 'max(var(--safe-bottom, 0px), 6px)',
      }}
    >
      <div className="w-full px-2">
        {/* Compact height: 48px mobile / 56px desktop */}
        <div className="flex items-center justify-between h-12 md:h-14 relative">
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
                  !isActive && (isClubhouse ? "text-white/80" : "text-foreground/60"),
                  // Hover state
                  !isActive && "hover:text-foreground"
                )}
                aria-label={tab.label}
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-colors duration-200",
                    // Special handling for camera/post icon
                    tab.id === 'post' && isActive && "text-accent",
                    tab.id === 'post' && !isActive && "text-accent/60"
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
