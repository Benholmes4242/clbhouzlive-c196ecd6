
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
      className={`fixed bottom-0 left-0 right-0 z-50 md:z-40 ${
        isClubhouse 
          ? 'bg-black' 
          : 'bg-background/95 backdrop-blur-md border-t border-border/50'
      }`}
    >
      <div className={`w-full px-2 ${isClubhouse ? 'bg-transparent' : ''}`}>
        <div className={`flex items-center justify-between h-16 relative ${isClubhouse ? 'bg-transparent' : ''}`}>
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
                className={`flex items-center justify-center relative focus:outline-none min-h-[60px] min-w-[60px] p-3 ${
                  isClubhouse
                    ? tab.id === 'post'
                      ? '' // Camera icon gets its own styling
                      : tab.id === 'clubhouse'
                        ? 'text-white' // Home icon stays white always on clubhouse
                        : 'text-white hover:text-white/80'
                    : tab.id === 'post'
                      ? '' // Camera icon gets its own styling
                      : 'text-black'
                }`}
                aria-label={tab.label}
              >
                <Icon 
                  className="h-9 w-9" 
                  style={tab.id === 'post' ? { color: '#f7931e' } : undefined}
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
