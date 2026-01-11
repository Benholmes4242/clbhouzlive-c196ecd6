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
              "flex flex-col items-center justify-center gap-1 flex-1 py-1.5",
              "transition-all ease-out",
              "active:scale-95",
              "focus:outline-none",
              // Only clubhouse gets special active/hover backgrounds
              !isLightTheme && isActive && "bg-[var(--clubhouse-bg-active)] mx-0.5 rounded-xl",
              !isLightTheme && !isActive && "hover:bg-[var(--clubhouse-bg-hover)] mx-0.5 rounded-xl"
            )}
            aria-label={tab.label}
          >
            {/* Icon */}
            <div className={cn(
              "relative",
              // Only clubhouse gets scale on active
              !isLightTheme && isActive && "scale-110"
            )}>
              <Icon 
                className={cn(
                  "h-[24px] w-[24px] transition-all",
                  "[stroke-width:1.5]",
                  isLightTheme
                    ? isActive 
                      ? "text-slate-800 opacity-100" 
                      : "text-slate-600 opacity-70"
                    : isActive 
                      ? "text-orange-500" 
                      : isDimmed 
                        ? "text-[var(--clubhouse-text-dimmed)]" 
                        : "text-[var(--clubhouse-text-muted)]"
                )}
              />
            </div>
            
            {/* Label */}
            <span 
              className={cn(
                "text-[10px] leading-none transition-colors font-medium",
                isLightTheme
                  ? isActive 
                    ? "text-slate-800 opacity-100" 
                    : "text-slate-600 opacity-70"
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
