
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
          ? 'bg-black/60 backdrop-blur-md border-t border-white/10' 
          : 'bg-background/95 backdrop-blur-md border-t border-border/50'
      }`}
      style={{
        // expose safe area to a CSS var so we can use a fallback with var()
        ['--safe-bottom' as any]: 'env(safe-area-inset-bottom)',
        // at least 6px padding; if device has a safe inset, use the larger one
        paddingBottom: 'max(var(--safe-bottom, 0px), 6px)',
      }}
    >
      <div className={`w-full px-2 ${isClubhouse ? 'bg-transparent' : ''}`}>
        {/* Reduce base height on small screens, keep 64px on md+ if you prefer */}
        <div className={`flex items-center justify-between h-14 md:h-16 relative ${isClubhouse ? 'bg-transparent' : ''}`}>
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
                className={`flex items-center justify-center relative focus:outline-none min-h-[60px] min-w-[60px] p-3 transition-colors duration-200 ${
                  isActive 
                    ? 'text-[hsl(var(--accent))]'
                    : isClubhouse
                      ? 'text-white/80 hover:text-white/90'
                      : 'text-black'
                }`}
                aria-label={tab.label}
              >
                <Icon className="h-9 w-9 font-normal" />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
