import React from 'react';
import { navigationTabs } from './navigationTabs';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
  variant?: 'default' | 'clubhouse';
  isDimmed?: boolean;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabClick, variant = 'default', isDimmed = false }) => {
  const isLightTheme = variant === 'default';
  const isClubhouseTheme = variant === 'clubhouse';
  
  return (
    <nav 
      className="w-full h-[55px] flex items-center justify-around"
      style={{ borderTop: '0.5px solid hsl(215 25% 27% / 0.2)' }}
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
              "relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 mx-0.5 rounded-xl",
              "active:scale-95",
              "focus:outline-none",
              // Active background for light theme
              isLightTheme && isActive && "bg-slate-100/80",
              // Active background for dark/clubhouse theme - enhanced
              isClubhouseTheme && isActive && "bg-[hsl(var(--clubhouse-active-bg))]",
              // Hover states
              isLightTheme && !isActive && "hover:bg-slate-50",
              isClubhouseTheme && !isActive && "hover:bg-[hsl(var(--clubhouse-hover-bg))]"
            )}
            style={{
              transition: 'all var(--motion-fast) var(--ease-standard)'
            }}
            aria-label={tab.label}
          >
            {/* Icon */}
            <div className="relative">
              <Icon 
                className={cn(
                  "h-[24px] w-[24px] [stroke-width:1.5]",
                  isLightTheme
                    ? isActive 
                      ? "text-slate-800 opacity-100" 
                      : "text-slate-500 opacity-90"
                    : isDimmed 
                      ? "text-[hsl(var(--clubhouse-text-dimmed))]" 
                      : "text-[hsl(var(--clubhouse-text-muted))]"
                )}
                style={{
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all var(--motion-fast) var(--ease-pop)',
                  // Use exact orange for active Clubhouse icons
                  ...(isClubhouseTheme && isActive && { color: '#F79E1B' })
                }}
              />
            </div>
            
            {/* Label */}
            <span 
              className={cn(
                "text-[10px] leading-none font-medium",
                isLightTheme
                  ? isActive 
                    ? "text-slate-800" 
                    : "text-slate-500"
                  : isDimmed 
                    ? "text-[hsl(var(--clubhouse-text-dimmed))]" 
                    : "text-[hsl(var(--clubhouse-text-muted))]"
              )}
              style={{
                transition: 'color var(--motion-fast) var(--ease-standard)',
                // Use exact orange for active Clubhouse labels
                ...(isClubhouseTheme && isActive && { color: '#F79E1B' })
              }}
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
