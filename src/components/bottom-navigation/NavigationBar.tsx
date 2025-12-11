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
    <nav className="w-full flex flex-col">
      {/* Actual nav bar - tight 56px */}
      <div 
        className="h-14 flex items-center justify-around px-4 sm:px-6"
        style={{
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.35)',
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
                "h-9 w-9",
                "transition-all duration-150 ease-out",
                "active:scale-[0.94]",
                "focus:outline-none"
              )}
              aria-label={tab.label}
            >
              {/* Active background squircle */}
              {isActive && (
                <span 
                  className="absolute inset-0 rounded-2xl bg-white/6"
                  style={{
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)',
                  }}
                />
              )}
              
              <Icon 
                className={cn(
                  "h-[22px] w-[22px] relative z-10 transition-colors duration-150",
                  isActive 
                    ? "text-primary" // Brand orange for active
                    : "text-white/60 hover:text-white/80"
                )}
              />
            </button>
          );
        })}
      </div>
      
      {/* Safe area spacer - separate from bar */}
      <div 
        className="w-full"
        style={{
          height: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--header-bg)',
        }}
      />
    </nav>
  );
};

export default NavigationBar;
