import React from 'react';
import { navigationTabs } from './navigationTabs';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
  /** Called on hover/touch to trigger route prefetch */
  onPrefetch?: (path: string) => void;
  variant?: 'default' | 'clubhouse';
  isDimmed?: boolean;
  /** When true, use amber accent for active tab (Hub/warm pages only) */
  useAmberActive?: boolean;
  /**
   * When NavigationBar is wrapped by GlobalBottomNavigation (which already draws a hairline),
   * set this to false to avoid a double-thick border.
   */
  showBorder?: boolean;
  /** Map of tab ID → badge count. Only rendered when count > 0. */
  tabBadges?: Record<string, number>;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabClick,
  onPrefetch,
  variant = 'default',
  isDimmed = false,
  useAmberActive = false,
  showBorder = true,
  tabBadges = {},
}) => {
  const isLightTheme = variant === 'default';
  const isClubhouseTheme = variant === 'clubhouse';
  const borderColor = isClubhouseTheme ? 'hsl(var(--clubhouse-border))' : 'hsl(215 25% 27% / 0.2)';

  
  return (
    <nav
      className="w-full h-[55px] flex items-center justify-around"
      style={showBorder ? { borderTop: `0.5px solid ${borderColor}` } : undefined}
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
            onMouseEnter={() => {
              if (tab.path && onPrefetch) {
                onPrefetch(tab.path);
              }
            }}
            onTouchStart={() => {
              if (tab.path && onPrefetch) {
                onPrefetch(tab.path);
              }
            }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 mx-0.5 rounded-xl",
              "active:scale-95",
              "focus:outline-none",
              // Active background highlight removed — clean flat style everywhere
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
                      ? useAmberActive ? "text-amber-700 opacity-100" : "text-slate-800 opacity-100"
                      : "text-slate-500 opacity-90"
                    : isDimmed 
                      ? "text-[hsl(var(--clubhouse-text-dimmed))]" 
                      : "text-[hsl(var(--clubhouse-text-muted))]"
                )}
                style={{
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all var(--motion-fast) var(--ease-pop)',
                  // Active Clubhouse icons: amber for warm routes, white for everything else
                  ...(isClubhouseTheme && isActive && { color: useAmberActive ? '#F79E1B' : 'rgba(255,255,255,1.0)' })
                }}
              />
            </div>
            
            {/* Label */}
            <span 
              className={cn(
                "text-[9px] min-[375px]:text-[10px] leading-none font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center",
                isLightTheme
                  ? isActive 
                    ? useAmberActive ? "text-amber-700" : "text-slate-800"
                    : "text-slate-500"
                  : isDimmed 
                    ? "text-[hsl(var(--clubhouse-text-dimmed))]" 
                    : "text-[hsl(var(--clubhouse-text-muted))]"
              )}
              style={{
                transition: 'color var(--motion-fast) var(--ease-standard)',
                // Active Clubhouse labels: amber for warm routes, white for everything else
                ...(isClubhouseTheme && isActive && { color: useAmberActive ? '#F79E1B' : 'rgba(255,255,255,1.0)' })
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
