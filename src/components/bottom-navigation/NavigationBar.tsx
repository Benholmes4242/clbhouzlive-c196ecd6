
import React from 'react';
import { navigationTabs } from './navigationTabs';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabClick }) => {
  console.log('NavigationBar: Component rendering with activeTab:', activeTab);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16 relative">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            console.log('NavigationBar: Rendering tab:', tab.id, 'isActive:', isActive);
            
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('NavigationBar: BUTTON CLICKED!!! Tab:', tab.id, 'isAction:', tab.isAction);
                  console.log('NavigationBar: Click event:', e);
                  onTabClick(tab);
                }}
                onTouchStart={(e) => {
                  console.log('NavigationBar: TOUCH START!!! Tab:', tab.id);
                }}
                onTouchEnd={(e) => {
                  console.log('NavigationBar: TOUCH END!!! Tab:', tab.id);
                }}
                onPointerDown={(e) => {
                  console.log('NavigationBar: POINTER DOWN!!! Tab:', tab.id);
                }}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors relative focus:outline-none min-h-[60px] min-w-[60px] ${
                  isActive
                    ? 'text-[#2a2626]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ 
                  background: tab.id === 'post' ? 'rgba(255,0,0,0.1)' : 'transparent',
                  border: tab.id === 'post' ? '2px solid red' : 'none',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
                }}
              >
                <Icon 
                  className="h-5 w-5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={2}
                />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
