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
  /** Set of tab IDs that have live content right now */
  liveTabs?: Set<string>;
  /** Show a burger/menu button as the first item */
  showBurger?: boolean;
  /** Called when the burger button is clicked */
  onBurgerClick?: () => void;
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
  liveTabs = new Set(),
  showBurger = false,
  onBurgerClick,
}) => {
  const isLightTheme = variant === 'default';
  const isClubhouseTheme = variant === 'clubhouse';
  const borderColor = isClubhouseTheme ? 'hsl(var(--clubhouse-border))' : 'hsl(215 25% 27% / 0.2)';

  
  return (
    <>
      <style>{`
        @keyframes navLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50% { opacity: 0.75; transform: scale(0.85); box-shadow: 0 0 0 3px rgba(34,197,94,0); }
        }
      `}</style>
      <nav
        className="w-full h-[55px] flex items-center justify-around"
        style={showBorder ? { borderTop: `0.5px solid ${borderColor}` } : undefined}
      >
      {showBurger && (
        <>
          <button
            onClick={onBurgerClick}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 mx-0.5 rounded-xl focus:outline-none active:scale-95"
            style={{ transition: 'all var(--motion-fast) var(--ease-standard)' }}
            aria-label="Tour sections menu"
          >
            {/* 2×2 grid icon */}
            <div style={{
              width: 24,
              height: 24,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 3,
              padding: 4,
              background: 'rgba(15,23,42,0.07)',
              borderRadius: 7,
            }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ background: '#475569', borderRadius: 2 }} />
              ))}
            </div>
            <span className="text-[9px] min-[375px]:text-[10px] leading-none font-semibold whitespace-nowrap text-slate-500">
              Sections
            </span>
          </button>
          {/* Vertical divider — separates Sections from main nav tabs */}
          <div style={{
            width: 1,
            height: 28,
            background: 'rgba(0,0,0,0.08)',
            flexShrink: 0,
          }} />
        </>
      )}
      {navigationTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isLive = liveTabs.has(tab.id);
        const Icon = tab.icon;
        
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
              isLightTheme && !isActive && "hover:bg-slate-50",
              isClubhouseTheme && !isActive && "hover:bg-[hsl(var(--clubhouse-hover-bg))]"
            )}
            style={{
              transition: 'all var(--motion-fast) var(--ease-standard)'
            }}
            aria-label={tab.label}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-[24px] w-[24px] [stroke-width:1.5]",
                  isLive && tab.id === 'tourhub'
                    ? "opacity-100"
                    : isLive
                    ? "text-green-500 opacity-100"
                    : isLightTheme
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
                  ...(isClubhouseTheme && isActive && !isLive && { color: useAmberActive ? '#F79E1B' : 'rgba(255,255,255,1.0)' }),
                  ...(tab.id === 'tourhub' && isLive && { color: '#22C55E' }),
                }}
              />

              {/* Tab badge */}
              {(tabBadges[tab.id] ?? 0) > 0 && (
                <span
                  className={cn(
                    "absolute -top-1.5 -right-2.5 flex items-center justify-center rounded-full bg-[#F7931E] font-bold text-white",
                    isClubhouseTheme ? "ring-[1.5px] ring-[#0d0d0d]" : "ring-[1.5px] ring-[hsl(210_40%_98%)]",
                    (tabBadges[tab.id] ?? 0) > 9
                      ? "h-[16px] min-w-[16px] px-[3px] text-[8px]"
                      : "h-[14px] w-[14px] text-[8px]"
                  )}
                >
                  <span style={{ lineHeight: 1 }}>
                    {(tabBadges[tab.id] ?? 0) > 99 ? '99+' : tabBadges[tab.id]}
                  </span>
                </span>
              )}

            </div>
            
            {/* Label */}
            {(
              <span 
                className={cn(
                  "text-[9px] min-[375px]:text-[10px] leading-none font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center",
                  isLive
                    ? "text-green-500"
                    : isLightTheme
                      ? isActive 
                        ? useAmberActive ? "text-amber-700" : "text-slate-800"
                        : "text-slate-500"
                      : isDimmed 
                        ? "text-[hsl(var(--clubhouse-text-dimmed))]" 
                        : "text-[hsl(var(--clubhouse-text-muted))]"
                )}
                style={{
                  transition: 'color var(--motion-fast) var(--ease-standard)',
                  ...(isClubhouseTheme && isActive && !isLive && { color: useAmberActive ? '#F79E1B' : 'rgba(255,255,255,1.0)' }),
                  ...(tab.id === 'tourhub' && isLive && { color: '#22C55E' }),
                }}
              >
                {isLive ? 'LIVE' : tab.label}
              </span>
            )}
          </button>
        );
      })}
      </nav>
    </>
  );
};

export default NavigationBar;
