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
    <nav className="w-full h-14 flex items-center justify-around">
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
              "flex flex-col items-center justify-center gap-1 flex-1 py-1",
              "transition-transform duration-[120ms] ease-out",
              "active:scale-95",
              "focus:outline-none"
            )}
            aria-label={tab.label}
          >
            <Icon 
              className={cn(
                "h-7 w-7",
                isActive ? "text-primary" : "text-white/70"
              )}
            />
            
            {/* Label */}
            <span className={cn(
              "text-[11px] leading-none",
              isActive ? "text-white" : "text-white/60"
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default NavigationBar;
