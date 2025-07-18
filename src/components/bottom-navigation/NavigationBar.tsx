
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
    <nav className={`fixed bottom-0 left-0 right-0 z-40 ${
      isClubhouse 
        ? 'bg-black border-t border-white/10' 
        : 'bg-background border-t border-border'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16 relative">
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
                className={`flex flex-col items-center justify-center space-y-1 transition-colors relative focus:outline-none min-h-[60px] min-w-[60px] ${
                  isClubhouse
                    ? isActive
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                    : isActive
                      ? 'text-black'
                      : 'text-black/70 hover:text-black'
                }`}
              >
                <Icon
                  className={tab.id === 'discover' ? 'h-6 w-6' : 'h-5 w-5'} 
                />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
