import React from 'react';
import { navigationTabs } from './navigationTabs';
import { cn } from '@/lib/utils';
import { useMessaging } from '@/hooks/useMessaging';

interface NavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
  /** Called on hover/touch to trigger route prefetch */
  onPrefetch?: (path: string) => void;
  variant?: 'default' | 'clubhouse';
  isDimmed?: boolean;
  /**
   * When NavigationBar is wrapped by GlobalBottomNavigation (which already draws a hairline),
   * set this to false to avoid a double-thick border.
   */
  showBorder?: boolean;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabClick,
  onPrefetch,
  variant = 'default',
  isDimmed = false,
  showBorder = true,
}) => {
  const isLightTheme = variant === 'default';
  const isClubhouseTheme = variant === 'clubhouse';
  const borderColor = isClubhouseTheme ? 'hsl(var(--clubhouse-border))' : 'hsl(215 25% 27% / 0.2)';

  // Get unread messages count for Hub badge
  const { conversations } = useMessaging();
  const totalUnreadMessages = conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
  
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
              console.log('[NavigationBar] onMouseEnter:', tab.id, tab.path, 'onPrefetch:', !!onPrefetch);
              if (tab.path && onPrefetch) {
                try {
                  console.log('[NavigationBar] Calling onPrefetch with:', tab.path);
                  onPrefetch(tab.path);
                  console.log('[NavigationBar] onPrefetch called successfully');
                } catch (err) {
                  console.error('[NavigationBar] onPrefetch ERROR:', err);
                }
              }
            }}
            onTouchStart={() => {
              console.log('[NavigationBar] onTouchStart:', tab.id, tab.path, 'onPrefetch:', !!onPrefetch);
              if (tab.path && onPrefetch) {
                try {
                  onPrefetch(tab.path);
                } catch (err) {
                  console.error('[NavigationBar] onTouchStart ERROR:', err);
                }
              }
            }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 mx-0.5 rounded-xl",
              "active:scale-95",
              "focus:outline-none",
              // Active background for light theme — amber tint matching canonical page top
              isLightTheme && isActive && "bg-amber-100/60",
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
                      ? "text-amber-700 opacity-100" 
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
              {/* Unread badge for Hub tab */}
              {tab.id === 'hub' && totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#2A9D5C] rounded-full border-2 border-white" />
              )}
            </div>
            
            {/* Label */}
            <span 
              className={cn(
                "text-[10px] leading-none font-medium",
                isLightTheme
                  ? isActive 
                    ? "text-amber-700" 
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
