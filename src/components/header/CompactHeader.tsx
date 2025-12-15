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
 * On other pages: Uses useScrollDirection for scroll-based hide/show
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

  // Hardcoded RGBA values for reliable iOS rendering (no CSS variable resolution issues)
  const DIM_BG = 'rgba(15, 15, 15, 0.05)';
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
          "fixed top-0 left-0 right-0 z-header",
          "h-14",
          className
        )}
        style={{
          background: isDimmed ? DIM_BG : STANDARD_BG,
          backdropFilter: isDimmed ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: isDimmed ? 'none' : 'blur(20px)',
          paddingTop: 'env(safe-area-inset-top)',
          borderBottom: `1px solid ${isDimmed ? DIM_BORDER : STANDARD_BORDER}`,
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
                isDimmed ? "opacity-55" : "hover:opacity-80"
              )}
            />
            {/* Wordmark - desktop only */}
            <span 
              className="hidden md:inline font-semibold text-lg tracking-tight transition-colors duration-300"
              style={{ color: isDimmed ? 'rgba(255, 255, 255, 0.55)' : 'white' }}
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
                    isActive 
                      ? isDimmed 
                        ? "bg-white/5" 
                        : "text-white bg-white/10"
                      : isDimmed
                        ? "hover:bg-white/5"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  style={{
                    color: isDimmed 
                      ? (isActive ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.55)')
                      : undefined
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
                "h-10 w-10 p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all duration-300",
                isDimmed 
                  ? "hover:bg-white/5" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              style={{ color: isDimmed ? 'rgba(255, 255, 255, 0.55)' : undefined }}
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
              <HeaderNavigation onInteraction={bumpChrome} />
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
