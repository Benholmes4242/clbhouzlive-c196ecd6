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
 * On Clubhouse: Uses chrome-header class for auto-hide system (body.chrome-hidden)
 * On other pages: Uses light theme with slate colors
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
  
  // Keep for reference
  const isClubhouseRoute = location.pathname === '/' || location.pathname.startsWith('/clubhouse');
  
  // Use light theme for non-Clubhouse pages
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

  // Light theme colors
  const LIGHT_BG = '#FAFBFC';
  const LIGHT_BORDER = '#E4E7EB';
  const LIGHT_TEXT = '#1F2428';
  const LIGHT_TEXT_SECONDARY = '#5A6270';
  const LIGHT_HOVER = '#EDEFF2';

  // Dark theme colors (Clubhouse)
  const DIM_BG = 'rgba(15, 15, 15, 0.02)';
  const DIM_BORDER = 'rgba(255, 255, 255, 0.06)';
  const STANDARD_BG = 'rgba(10, 10, 10, 0.95)';
  const STANDARD_BORDER = 'rgba(255, 255, 255, 0.06)';
  const CINEMA_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <>
      <header
        data-chrome="header"
        className={cn(
          "compact-header clubhouse-header",
          isClubhouseRoute && "chrome-header",
          useLightTheme && "chrome-header-light",
          "fixed top-0 left-0 right-0 z-header",
          "h-14",
          className
        )}
        style={{
          background: useLightTheme 
            ? LIGHT_BG 
            : (isDimmed ? DIM_BG : STANDARD_BG),
          backdropFilter: useLightTheme ? 'none' : (isDimmed ? 'none' : 'blur(20px)'),
          WebkitBackdropFilter: useLightTheme ? 'none' : (isDimmed ? 'none' : 'blur(20px)'),
          paddingTop: 'env(safe-area-inset-top)',
          borderBottom: `1px solid ${useLightTheme ? LIGHT_BORDER : (isDimmed ? DIM_BORDER : STANDARD_BORDER)}`,
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
                useLightTheme 
                  ? "opacity-100 hover:opacity-80"
                  : (isDimmed ? "opacity-55" : "hover:opacity-80")
              )}
            />
            {/* Wordmark - desktop only */}
            <span 
              className="hidden md:inline font-semibold text-lg tracking-tight transition-colors duration-300"
              style={{ color: useLightTheme ? LIGHT_TEXT : (isDimmed ? 'rgba(255, 255, 255, 0.55)' : 'white') }}
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
                    "header-nav-link px-3 py-1.5 text-sm font-medium rounded-sq-sm transition-colors duration-300",
                    isActive && "active"
                  )}
                  style={useLightTheme ? {
                    color: isActive ? LIGHT_TEXT : LIGHT_TEXT_SECONDARY,
                    background: isActive ? LIGHT_HOVER : 'transparent',
                  } : {
                    color: isDimmed 
                      ? (isActive ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.55)')
                      : (isActive ? 'white' : 'rgba(255, 255, 255, 0.6)'),
                    background: isActive 
                      ? (isDimmed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)') 
                      : 'transparent',
                  }}
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
                "header-icon-btn h-10 w-10 p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all duration-300",
              )}
              style={useLightTheme ? {
                color: LIGHT_TEXT_SECONDARY,
              } : {
                color: isDimmed ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.7)',
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
