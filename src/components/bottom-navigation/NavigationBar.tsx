
import React from 'react';
import { navigationTabs } from './navigationTabs';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
  variant?: 'default' | 'clubhouse';
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabClick, variant = 'default' }) => {
  const isClubhouse = variant === 'clubhouse';
  
  
  return (
    <nav 
      className={`fixed inset-x-0 bottom-0 z-50 h-12 md:h-14 px-2 pb-[max(env(safe-area-inset-bottom),6px)] ${
        isClubhouse 
          ? 'bg-black/60 backdrop-blur-md border-t border-white/10' 
          : 'bg-background/95 backdrop-blur-md border-t border-border/50'
      }`}
    >
      <div className={`mx-auto flex h-full items-center justify-between ${isClubhouse ? 'bg-transparent' : ''}`}>
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <div 
              key={tab.id}
              className="grid place-items-center h-full w-16"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabClick(tab);
                }}
                className={`grid place-items-center h-full w-full transition-colors duration-200 ${
                  isActive ? 'text-[hsl(var(--accent))]' : 'text-white/80 hover:text-white'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-6 h-6" />
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationBar;
