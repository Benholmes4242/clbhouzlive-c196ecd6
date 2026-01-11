import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HeaderNavigation from './HeaderNavigation';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import { SearchOverlay } from './SearchOverlay';
import { cn } from '@/lib/utils';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';

interface CompactHeaderProps {
  className?: string;
}

/**
 * Compact Header (56px) - used on Discover, Tour, Notifications, Clubhouse
 * On Clubhouse: Uses chrome-header class for auto-hide system (body.chrome-hidden)
 * On other pages: Uses useScrollDirection for scroll-based hide/show
 * 
 * ⚠️ HEADER SAFE-AREA BEHAVIOR - DO NOT REGRESS ⚠️
 * 
 * CLUBHOUSE PAGE (/clubhouse or /):
 *   - Header background extends INTO the safe area (notch)
 *   - Uses: paddingTop: env(safe-area-inset-top), height: calc(56px + env(safe-area-inset-top))
 *   - This allows the header bg to sit flush to the very top of the screen
 * 
 * ALL OTHER PAGES (Discover, Tour, Courses, etc.):
 *   - Header uses standard h-14 (56px) height with NO safe-area padding
 *   - Safe-area is handled by the PageRoot component instead
 * 
 * This distinction was intentionally designed and MUST be preserved.
 * See lines 96, 104-105 for the conditional implementation.
 */
const CompactHeader: React.FC<CompactHeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { hasUnread } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  
  // Cinema Dim context
  const { cinemaDim, bumpChrome, isClubhousePage } = useCinemaDimContext();
  const isDimmed = isClubhousePage && cinemaDim;
  
  // Determine routes
  const isClubhouseRoute = location.pathname === '/' || location.pathname.startsWith('/clubhouse');
  const isDiscoverRoute = location.pathname.startsWith('/discover');
  
  // Use light theme for non-clubhouse pages
  const useLightTheme = !isClubhouseRoute;

  const handleLogoClick = () => {
    bumpChrome();
    navigate('/clubhouse');
  };
  
  const handleSearchClick = () => {
    bumpChrome();
    setSearchOpen(true);
  };
  
  const handleMenuClick = () => {
    bumpChrome();
    setMenuOpen(v => !v);
  };

  // Theme-specific styling - using CSS variables for consistency
  const LIGHT_BG = 'rgba(248, 250, 252, 0.95)';
  const LIGHT_BORDER = 'rgba(0, 0, 0, 0.06)';
  const CINEMA_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // Get background based on theme
  const getBackground = () => {
    if (useLightTheme) return LIGHT_BG;
    if (isDimmed) return 'var(--clubhouse-dim-bg-header)';
    return 'var(--clubhouse-bg-header)';
  };

  // Get border based on theme
  const getBorder = () => {
    if (useLightTheme) return LIGHT_BORDER;
    if (isDimmed && isClubhouseRoute) return "transparent";
    if (isDimmed) return 'var(--clubhouse-border)';
    return 'var(--clubhouse-border)';
  };
  
  // Hide brand (logo + wordmark) when dimmed on Clubhouse
  const hideBrand = isDimmed && isClubhouseRoute;

  // Standardized header height - 55px for all routes
  const headerHeight = 55;
  
  // Standardized element sizes
  const logoSize = 'h-9 w-9';
  const searchButtonSize = 'h-9 w-9';
  
  return (
    <>
      <header
        data-chrome="header"
        className={cn(
          "compact-header clubhouse-header",
          isClubhouseRoute && "chrome-header",
          "fixed left-0 right-0 z-header",
          className
        )}
        style={{
          // Position at top - no safe area offset
          top: 0,
          background: getBackground(),
          backdropFilter: isDimmed ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: isDimmed ? 'none' : 'blur(20px)',
          // No safe area padding
          height: `${headerHeight}px`,
          borderBottom: `1px solid ${getBorder()}`,
          boxShadow: isDimmed ? 'none' : useLightTheme ? '0 1px 3px rgba(0,0,0,0.04)' : undefined,
          transition: `background-color 800ms ${CINEMA_EASE}, color 800ms ${CINEMA_EASE}, border-color 800ms ${CINEMA_EASE}`,
        }}
      >
        <div 
          className="mx-auto flex items-center justify-between px-3 sm:px-4 max-w-5xl"
          style={{ height: `${headerHeight}px` }}
        >
          {/* Left: Logo icon (mobile) + wordmark (desktop) */}
          <button
            type="button"
            className="flex items-center gap-2 shrink-0 bg-transparent border-0 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={handleLogoClick}
            aria-label="Go to home"
          >
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="clbhouz"
              className={cn(
                "object-contain transition-opacity duration-[var(--motion-fast)]",
                logoSize,
                hideBrand ? "opacity-0" : isDimmed ? "opacity-55" : "hover:opacity-80"
              )}
            />
            {/* Wordmark - desktop only */}
            <span 
              className={cn(
                "hidden md:inline font-semibold tracking-tight transition-colors duration-[var(--motion-medium)]",
                "text-lg",
                useLightTheme ? "text-slate-800" : ""
              )}
              style={{ 
                color: useLightTheme 
                  ? '#3A3F46' 
                  : hideBrand 
                    ? 'rgba(255, 255, 255, 0)' 
                    : isDimmed 
                      ? 'var(--clubhouse-text-dimmed)' 
                      : 'var(--clubhouse-text-primary)' 
              }}
            >
              clbhouz
            </span>
          </button>

          {/* Desktop center: main nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Clubhouse', path: '/clubhouse' },
              { label: 'Discover', path: '/discover' },
              { label: 'Courses', path: '/courses' },
              { label: 'Tour', path: '/tour' },
            ].map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/clubhouse' && location.pathname === '/');
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    bumpChrome();
                    navigate(item.path);
                  }}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-sq-sm transition-colors duration-[var(--motion-medium)]",
                    useLightTheme 
                      ? isActive 
                        ? "text-slate-800 bg-slate-900/8" 
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-900/5"
                      : isActive 
                        ? isDimmed 
                          ? "bg-[var(--clubhouse-bg-hover)]" 
                          : "text-white bg-[var(--clubhouse-bg-active)]"
                        : isDimmed
                          ? "hover:bg-[var(--clubhouse-bg-hover)]"
                          : "text-[var(--clubhouse-text-muted)] hover:text-white hover:bg-[var(--clubhouse-bg-hover)]"
                  )}
                  style={!useLightTheme ? {
                    color: isDimmed 
                      ? (isActive ? 'var(--clubhouse-text-secondary)' : 'var(--clubhouse-text-dimmed)')
                      : undefined
                  } : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Search + Identity pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all duration-[var(--motion-fast)]",
                searchButtonSize,
                useLightTheme
                  ? "text-slate-600 hover:text-slate-800 hover:bg-slate-900/5"
                  : isDimmed 
                    ? "hover:bg-[var(--clubhouse-bg-hover)]" 
                    : "text-white/70 hover:text-white hover:bg-[var(--clubhouse-bg-active)]"
              )}
              style={!useLightTheme ? { color: isDimmed ? 'var(--clubhouse-text-dimmed)' : undefined } : undefined}
              onClick={handleSearchClick}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Identity pill (mobile only, logged in users) */}
            {user && (
              <div className="sm:hidden">
                <PostingAsPill 
                  ref={pillRef}
                  onClick={handleMenuClick} 
                  isOpen={menuOpen}
                  hasUnread={hasUnread}
                  useLightTheme={useLightTheme}
                />
              </div>
            )}
            
            {/* Desktop: Full navigation (notifications, profile, settings) */}
            <div className="hidden sm:flex items-center">
              <HeaderNavigation onInteraction={bumpChrome} useLightTheme={useLightTheme} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: Posting-as menu */}
      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          useLightTheme={useLightTheme}
          anchorRef={pillRef}
        />
      )}

      {/* Search Overlay - full-screen, covers header */}
      <SearchOverlay 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)}
        useLightTheme={useLightTheme}
      />
    </>
  );
};

export default CompactHeader;
