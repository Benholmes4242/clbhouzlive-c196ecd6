import React from 'react';
import { navigationTabs } from './navigationTabs';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
  variant?: 'default' | 'clubhouse';
  isDimmed?: boolean;
  useLightTheme?: boolean;
}

// Light theme colors
const LIGHT_ICON = '#5A6270';
const LIGHT_ICON_ACTIVE = '#1F2428';
const LIGHT_TEXT = '#8A919C';
const LIGHT_TEXT_ACTIVE = '#1F2428';

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  activeTab, 
  onTabClick, 
  variant = 'default', 
  isDimmed = false,
  useLightTheme = false 
}) => {
  return (
    <nav className="w-full h-14 flex items-center justify-around">
      {navigationTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        // Determine icon color based on theme
        const getIconColor = () => {
          if (useLightTheme) {
            return isActive ? LIGHT_ICON_ACTIVE : LIGHT_ICON;
          }
          if (isDimmed) {
            return isActive ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.55)';
          }
          return isActive ? undefined : 'rgba(255, 255, 255, 0.7)';
        };
        
        // Determine label color based on theme
        const getLabelColor = () => {
          if (useLightTheme) {
            return isActive ? LIGHT_TEXT_ACTIVE : LIGHT_TEXT;
          }
          if (isDimmed) {
            return isActive ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.42)';
          }
          return isActive ? 'white' : 'rgba(255, 255, 255, 0.6)';
        };
        
        return (
          <button
            key={tab.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTabClick(tab);
            }}
            className={cn(
              "nav-tab flex flex-col items-center justify-center gap-1 flex-1 py-1",
              "transition-transform duration-[120ms] ease-out",
              "active:scale-95",
              "focus:outline-none"
            )}
            aria-label={tab.label}
          >
            <Icon 
              className={cn(
                "nav-icon h-7 w-7 transition-colors duration-300",
                isActive && !useLightTheme && !isDimmed && "text-primary",
                isActive && "active"
              )}
              style={{ 
                color: (useLightTheme || isDimmed || !isActive) ? getIconColor() : undefined 
              }}
            />
            
            {/* Label */}
            <span 
              className={cn(
                "nav-label text-[11px] leading-none transition-colors duration-300",
                isActive && "active"
              )}
              style={{ color: getLabelColor() }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default NavigationBar;
