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
              "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 mx-0.5 rounded-xl",
              "transition-all duration-[var(--motion-fast)] ease-out",
              "active:scale-95",
              "focus:outline-none",
              // Active background for light theme
              isLightTheme && isActive && "bg-orange-50/80",
              // Active background for dark theme  
              !isLightTheme && isActive && "bg-[var(--clubhouse-bg-active)]",
              // Hover states
              isLightTheme && !isActive && "hover:bg-slate-50",
              !isLightTheme && !isActive && "hover:bg-[var(--clubhouse-bg-hover)]"
            )}
            aria-label={tab.label}
          >
            {/* Icon with active indicator */}
            <div className={cn(
              "relative transition-transform duration-[var(--motion-fast)]",
              isActive && "scale-110"
            )}>
              <Icon 
                className={cn(
                  "h-[24px] w-[24px] transition-all duration-[var(--motion-medium)]",
                  "[stroke-width:1.5]",
                  isLightTheme
                    ? isActive 
                      ? "text-orange-600" 
                      : "text-slate-500"
                    : isActive 
                      ? "text-orange-500" 
                      : isDimmed 
                        ? "text-[var(--clubhouse-text-dimmed)]" 
                        : "text-[var(--clubhouse-text-muted)]"
                )}
              />
              
              {/* Active indicator dot */}
              {isActive && (
                <span 
                  className={cn(
                    "absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                    "transition-all duration-[var(--motion-fast)]",
                    isLightTheme ? "bg-orange-600" : "bg-orange-500"
                  )}
                />
              )}
            </div>
            
            {/* Label */}
            <span 
              className={cn(
                "text-[10px] leading-none transition-colors duration-[var(--motion-medium)] font-medium",
                isLightTheme
                  ? isActive 
                    ? "text-orange-600" 
                    : "text-slate-500"
                  : isActive 
                    ? isDimmed 
                      ? "text-orange-500/90" 
                      : "text-orange-500"
                    : isDimmed 
                      ? "text-[var(--clubhouse-text-dimmed)]" 
                      : "text-[var(--clubhouse-text-muted)]"
              )}
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
