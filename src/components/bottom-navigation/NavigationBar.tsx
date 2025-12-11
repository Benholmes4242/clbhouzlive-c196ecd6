import React from 'react';
import { navigationTabs } from './navigationTabs';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
  variant?: 'default' | 'clubhouse';
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabClick, variant = 'default' }) => {
  return (
    <nav 
      className="w-full"
      style={{
        minHeight: '56px',
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div className="w-full px-4 sm:px-6">
        {/* Main row: 56px + safe area */}
        <div 
          className="flex items-center justify-between"
          style={{
            height: '56px',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
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
                  "flex items-center justify-center relative",
                  "min-h-[44px] min-w-[44px] p-2",
                  "transition-all duration-150 ease-out",
                  "active:scale-[0.94]",
                  "focus:outline-none"
                )}
                aria-label={tab.label}
              >
                {/* Active background squircle */}
                {isActive && (
                  <span 
                    className="absolute inset-1 rounded-sq-sm bg-white/6"
                    style={{
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)',
                    }}
                  />
                )}
                
                <Icon 
                  className={cn(
                    "h-6 w-6 relative z-10 transition-colors duration-150",
                    isActive 
                      ? "text-primary" // Brand orange for active
                      : "text-white/60 hover:text-white/80"
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
