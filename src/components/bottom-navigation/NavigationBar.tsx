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
              "transition-all duration-[120ms] ease-out",
              "active:scale-95",
              "focus:outline-none",
              // Active background for light theme
              isLightTheme && isActive && "bg-slate-100/80",
              // Active background for dark theme  
              !isLightTheme && isActive && "bg-white/8"
            )}
            aria-label={tab.label}
          >
            {/* Icon with active indicator dot */}
            <div className="relative">
              <Icon 
                className={cn(
                  "h-[24px] w-[24px] transition-all duration-300",
                  "[stroke-width:1.5]",
                  // Scale up slightly when active
                  isActive && "scale-110",
                  isLightTheme
                    ? isActive 
                      ? "text-slate-800 opacity-100" 
                      : "text-slate-500 opacity-90"
                    : isActive 
                      ? "text-primary" 
                      : isDimmed 
                        ? "text-[rgba(255,255,255,0.55)]" 
                        : "text-white/70"
                )}
              />
              
              {/* Active indicator dot above icon */}
              {isActive && (
                <span 
                  className={cn(
                    "absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                    isLightTheme ? "bg-slate-700" : "bg-primary"
                  )} 
                />
              )}
            </div>
            
            {/* Label */}
            <span 
              className={cn(
                "text-[10px] leading-none transition-colors duration-300 font-medium",
                isLightTheme
                  ? isActive 
                    ? "text-slate-800" 
                    : "text-slate-500"
                  : isActive 
                    ? isDimmed 
                      ? "text-[rgba(255,255,255,0.78)]" 
                      : "text-white"
                    : isDimmed 
                      ? "text-[rgba(255,255,255,0.42)]" 
                      : "text-white/60"
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
