import React, { useState } from 'react';
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
 * On Clubhouse: Uses dark chrome with cinema dim
 * On other pages: Uses light chrome (slate on light grey)
 */
const CompactHeader: React.FC<CompactHeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { hasUnread } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Cinema Dim context
  const { cinemaDim, bumpChrome, isClubhousePage } = useCinemaDimContext();
  const isDimmed = isClubhousePage && cinemaDim;
  
  // Clubhouse routes use dark chrome, everything else uses light chrome
  const isClubhouseRoute = location.pathname === '/' || location.pathname.startsWith('/clubhouse');
  const useLightChrome = !isClubhouseRoute;

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

  // Dark chrome values (for Clubhouse)
  const DIM_BG = 'rgba(15, 15, 15, 0.02)';
  const DIM_BORDER = 'rgba(255, 255, 255, 0.06)';
  const STANDARD_BG = 'rgba(10, 10, 10, 0.95)';
  const STANDARD_BORDER = 'rgba(255, 255, 255, 0.06)';
  
  // Light chrome values (for non-Clubhouse pages)
  const LIGHT_BG = 'var(--chrome-light-bg-blur)';
  const LIGHT_BORDER = 'var(--chrome-light-border)';
  
  const CINEMA_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // Determine styles based on route
  const headerBg = useLightChrome ? LIGHT_BG : (isDimmed ? DIM_BG : STANDARD_BG);
  const headerBorder = useLightChrome ? LIGHT_BORDER : (isDimmed ? DIM_BORDER : STANDARD_BORDER);

  return (
    <>
      <header
        data-chrome="header"
        className={cn(
          "compact-header",
          isClubhouseRoute && "clubhouse-header chrome-header",
          "fixed top-0 left-0 right-0 z-header",
          "h-14",
          className
        )}
        style={{
          background: headerBg,
          backdropFilter: useLightChrome ? 'blur(20px)' : (isDimmed ? 'none' : 'blur(20px)'),
          WebkitBackdropFilter: useLightChrome ? 'blur(20px)' : (isDimmed ? 'none' : 'blur(20px)'),
          paddingTop: 'env(safe-area-inset-top)',
          borderBottom: `1px solid ${headerBorder}`,
          boxShadow: isDimmed ? 'none' : undefined,
          transition: `background-color 800ms ${CINEMA_EASE}, color 800ms ${CINEMA_EASE}, border-color 800ms ${CINEMA_EASE}`,
        }}
      >
        <div className="mx-auto flex h-full items-center justify-between px-3 sm:px-4 max-w-5xl">
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
                "h-9 w-9 object-contain transition-opacity",
                useLightChrome 
                  ? "opacity-100 hover:opacity-80" 
                  : isDimmed 
                    ? "opacity-55" 
                    : "hover:opacity-80"
              )}
            />
            {/* Wordmark - desktop only */}
            <span 
              className={cn(
                "hidden md:inline font-semibold text-lg tracking-tight transition-colors duration-300",
                useLightChrome && "text-text-primary"
              )}
              style={{ 
                color: useLightChrome 
                  ? 'var(--chrome-light-text)' 
                  : isDimmed 
                    ? 'rgba(255, 255, 255, 0.55)' 
                    : 'white' 
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
                    useLightChrome
                      ? isActive
                        ? "bg-[var(--chrome-light-active)] text-[var(--chrome-light-text)]"
                        : "text-[var(--chrome-light-text-dim)] hover:text-[var(--chrome-light-text)] hover:bg-[var(--chrome-light-hover)]"
                      : isActive 
                        ? isDimmed 
                          ? "bg-white/5" 
                          : "text-white bg-white/10"
                        : isDimmed
                          ? "hover:bg-white/5"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  style={!useLightChrome ? {
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
                "h-10 w-10 p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all duration-300",
                useLightChrome
                  ? "text-[var(--chrome-light-icon)] hover:bg-[var(--chrome-light-hover)]"
                  : isDimmed 
                    ? "hover:bg-white/5" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              style={!useLightChrome ? { color: isDimmed ? 'rgba(255, 255, 255, 0.55)' : undefined } : undefined}
              onClick={handleSearchClick}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Identity pill (mobile only, logged in users) */}
            {user && (
              <div className="sm:hidden">
                <PostingAsPill 
                  onClick={handleMenuClick} 
                  isOpen={menuOpen}
                  hasUnread={hasUnread}
                />
              </div>
            )}
            
            {/* Desktop: Full navigation (notifications, profile, settings) */}
            <div className="hidden sm:flex items-center">
              <HeaderNavigation onInteraction={bumpChrome} useLightTheme={useLightChrome} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: Posting-as menu */}
      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {/* Search Overlay - full-screen, covers header */}
      <SearchOverlay 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </>
  );
};

export default CompactHeader;