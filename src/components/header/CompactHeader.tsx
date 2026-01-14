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

  // Theme-specific styling - using CSS variables
  const LIGHT_BG = 'hsl(210 40% 98% / 0.95)';
  const LIGHT_BORDER = 'hsl(215 25% 27% / 0.2)'; // slate-800/20 equivalent
  const DIM_BG = 'hsl(var(--clubhouse-dim-bg-header))';
  const DIM_BORDER = 'hsl(var(--clubhouse-border))';
  const STANDARD_BG = 'hsl(var(--clubhouse-bg-header))';
  const STANDARD_BORDER = 'hsl(var(--clubhouse-border))';
  const CINEMA_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // Get background based on theme
  const getBackground = () => {
    if (useLightTheme) return LIGHT_BG;
    if (isDimmed) return DIM_BG;
    return STANDARD_BG;
  };

  // Get border based on theme
  const getBorder = () => {
    if (useLightTheme) return LIGHT_BORDER;
    if (isDimmed && isClubhouseRoute) return "transparent";
    if (isDimmed) return DIM_BORDER;
    return STANDARD_BORDER;
  };
  
  // Hide brand (logo + wordmark) when dimmed on Clubhouse
  const hideBrand = isDimmed && isClubhouseRoute;

  // Standardized header height: 55px everywhere for consistency
  const headerHeight = 55;
  
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
          borderBottom: `0.5px solid ${getBorder()}`,
          boxShadow: 'none',
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
                "object-contain transition-opacity duration-300",
                "h-9 w-9", // Standardized logo size
                hideBrand ? "opacity-0" : isDimmed ? "opacity-55" : "hover:opacity-80"
              )}
            />
            <span 
              className={cn(
                "hidden md:inline font-semibold tracking-tight transition-colors duration-300 text-lg",
                useLightTheme ? "text-slate-800" : ""
              )}
              style={{ 
                color: useLightTheme 
                  ? 'hsl(215 14% 25%)' 
                  : hideBrand 
                    ? 'hsl(var(--clubhouse-text-primary) / 0)' 
                    : isDimmed 
                      ? 'hsl(var(--clubhouse-text-dimmed))' 
                      : 'hsl(var(--clubhouse-text-primary))' 
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
                    "px-3 py-1.5 text-sm font-medium rounded-sq-sm transition-colors duration-300",
                    useLightTheme 
                      ? isActive 
                        ? "text-slate-800 bg-slate-100/80" 
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      : isActive 
                        ? isDimmed 
                          ? "bg-white/5" 
                          : "text-white bg-white/10"
                        : isDimmed
                          ? "hover:bg-white/5"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  style={!useLightTheme ? {
                    color: isDimmed 
                      ? (isActive ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.55)')
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
                "p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all",
                "h-9 w-9", // Standardized search button size
                useLightTheme
                  ? "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  : isDimmed 
                    ? "hover:bg-[hsl(var(--clubhouse-hover-bg))]" 
                    : "hover:bg-[hsl(var(--clubhouse-active-bg))]"
              )}
              style={{ 
                color: useLightTheme 
                  ? undefined 
                  : isDimmed 
                    ? 'hsl(var(--clubhouse-text-dimmed))' 
                    : 'hsl(var(--clubhouse-text-muted))',
                transition: 'all var(--motion-fast) var(--ease-standard)'
              }}
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
