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
    <nav className="w-full h-[55px] flex items-center justify-around">
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
            {/* Icon with indicator */}
            <div className="relative">
              <Icon 
                className={cn(
                  "h-[24px] w-[24px] [stroke-width:1.5]",
                  isLightTheme
                    ? isActive 
                      ? "text-slate-800 opacity-100" 
                      : "text-slate-500 opacity-90"
                    : isActive 
                      ? "text-primary" 
                      : isDimmed 
                        ? "text-[hsl(var(--clubhouse-text-dimmed))]" 
                        : "text-[hsl(var(--clubhouse-text-muted))]"
                )}
                style={{
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all var(--motion-fast) var(--ease-pop)'
                }}
              />
              
              {/* Active indicator dot - Clubhouse only */}
              {isClubhouseTheme && isActive && (
                <span 
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  style={{
                    animation: 'scale-in 150ms var(--ease-pop)'
                  }}
                />
              )}
            </div>
            
            {/* Label */}
            <span 
              className={cn(
                "text-[10px] leading-none font-medium",
                isLightTheme
                  ? isActive 
                    ? "text-slate-800" 
                    : "text-slate-500"
                  : isActive 
                    ? isDimmed 
                      ? "text-[hsl(var(--clubhouse-text-secondary))]" 
                      : "text-[hsl(var(--clubhouse-text-primary))]"
                    : isDimmed 
                      ? "text-[hsl(var(--clubhouse-text-dimmed))]" 
                      : "text-[hsl(var(--clubhouse-text-muted))]"
              )}
              style={{
                transition: 'color var(--motion-fast) var(--ease-standard)'
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
