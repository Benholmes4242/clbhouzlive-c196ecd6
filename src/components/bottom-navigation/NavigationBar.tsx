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
    <nav className="w-full h-14 flex items-center justify-around px-4 sm:px-6">
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
              "h-10 w-10",
              "transition-all duration-150 ease-out",
              "active:scale-[0.94]",
              "focus:outline-none"
            )}
            aria-label={tab.label}
          >
            
            <Icon 
              className={cn(
                "h-6 w-6 relative z-10 transition-colors duration-150",
                isActive 
                  ? "text-primary" // Brand orange for active
                  : "text-white/70 hover:text-white/90"
              )}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default NavigationBar;
