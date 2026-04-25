import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HeaderNavigation from './HeaderNavigation';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { ActingAsIndicator } from './ActingAsIndicator';
import { cn } from '@/lib/utils';
import { NineDotsIcon } from '@/features/tourhub/components/NineDotsIcon';
import { openTourNav } from '@/features/tourhub/contexts/TourNavContext';
import { haptic } from '@/utils/haptics';
import { useLiveTournamentCount, usePrefetchNavMenu } from '@/features/tourhub/hooks/useNavMenuData';

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
 */
const CompactHeader: React.FC<CompactHeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseSession();
  const { hasUnread, unreadCount } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  
  // Live tournament data for Tour routes
  // Only the Overview tab shows the nine-dot tour menu icon. Sub-tabs (schedule,
  // players, leaderboards) match the Discover compact header style with the clbhouz logo.
  const isTourPath = location.pathname.startsWith('/tour') || location.pathname.startsWith('/tourhub');
  const tourTabParam = searchParams.get('tab');
  const isTourOverview = isTourPath && (!tourTabParam || tourTabParam === 'overview');
  const isTourRoute = isTourOverview;
  const { data: liveCount } = useLiveTournamentCount();
  const prefetchNavMenu = usePrefetchNavMenu();
  const hasLiveTournaments = isTourRoute && (liveCount ?? 0) > 0;
  
  // Determine routes
  const isEditProfileRoute = location.pathname === '/edit-profile';
  const isAchievementsRoute = location.pathname === '/achievements' || location.pathname.startsWith('/achievements/') || location.pathname === '/profile/quest';
  const isMessagesRoute = location.pathname.startsWith('/messages');
  const isMessagesConversationRoute = location.pathname.startsWith('/messages/');


  // Discover sub-page detection:
  // - Region pages: /discover/explore/region/:slug
  // - Theme pages: /discover/explore/theme/:slug
  // - Video section pages: /discover with ?section= param on videos tab
  const isDiscoverSubPage = location.pathname.startsWith('/discover') && (
    location.pathname.startsWith('/discover/explore/region/') ||
    location.pathname.startsWith('/discover/explore/theme/') ||
    (searchParams.get('main') === 'videos' && searchParams.get('section'))
  );
  
  // Top 100 page detection:
  // - Hub page: /top100 (navigates back to /courses?tab=top100)
  // - List detail pages: /top100/:slug (navigates back to /top100?tab=courses)
  const isTop100HubPage = location.pathname === '/top100';
  const isTop100SubPage = location.pathname.startsWith('/top100/') && 
    location.pathname.split('/').length > 2;
  const isTop100Route = isTop100HubPage || isTop100SubPage;
  
  // Routes that should show back arrow instead of logo
  const isBackArrowRoute = isDiscoverSubPage || isTop100Route || isEditProfileRoute || isAchievementsRoute || isMessagesRoute;
  
  // Search overlay always uses light mode app-wide
  const useLightTheme = true;

  const handleLogoClick = () => {
    if (isBackArrowRoute) {
      haptic('light');
      if (isDiscoverSubPage) {
        handleDiscoverBack();
      } else if (isTop100Route) {
        handleTop100Back();
      } else if (isEditProfileRoute) {
        navigate('/profile');
      } else if (isAchievementsRoute) {
        navigate(-1);
      } else if (isMessagesConversationRoute) {
        navigate('/messages');
      } else if (isMessagesRoute) {
        navigate(-1);
      }
    } else if (isTourRoute) {
      haptic('light');
      openTourNav();
    } else {
      navigate('/clubhouse');
    }
  };

  const handleDiscoverBack = () => {
    if (location.pathname.startsWith('/discover/explore/region/') || 
        location.pathname.startsWith('/discover/explore/theme/')) {
      navigate('/discover?main=explore');
    } else if (searchParams.get('section')) {
      navigate('/discover?main=videos');
    } else {
      navigate('/discover');
    }
  };

  const handleTop100Back = () => {
    if (isTop100HubPage) {
      navigate('/courses?tab=top100');
    } else {
      navigate('/top100?tab=courses');
    }
  };
  
  const handleSearchClick = () => {
    setSearchOpen(true);
  };
  
  const handleMenuClick = () => {
    setMenuOpen(v => !v);
  };

  // Standardized header height: 55px content
  const contentHeight = 55;
  
  return (
    <>
      <header
        data-chrome="header"
        className={cn(
          "compact-header clubhouse-header",
          "fixed inset-x-0 mx-auto w-full max-w-[480px] z-header",
          className
        )}
        style={{
          top: 0,
          background: 'hsl(var(--background))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          height: `calc(${contentHeight}px + var(--sat, 0px))`,
          paddingTop: 'var(--sat, 0px)',
          borderBottom: `0.5px solid hsl(var(--border) / 0.5)`,
          boxShadow: 'none',
        }}
      >
        {/* Content wrapper - always 55px, positioned below safe area on Clubhouse */}
        <div 
          className="mx-auto flex items-center justify-between px-3 sm:px-4 max-w-5xl"
          style={{ height: `${contentHeight}px` }}
        >
          {/* Left section: Back Button, Tour Menu Icon, or Logo (fixed width, 44px tap target) */}
          <div className="flex-shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 bg-transparent border-0 transition-transform min-h-[44px] cursor-pointer active:scale-[0.98]"
              onClick={handleLogoClick}
              onTouchStart={isTourRoute ? prefetchNavMenu : undefined}
              aria-label={isBackArrowRoute ? "Go back" : isTourRoute ? "Go to tour menu" : "Go to home"}
            >
              {isBackArrowRoute ? (
                <ArrowLeft className="h-6 w-6 text-foreground" />
              ) : isTourRoute ? (
                <span className="relative inline-flex">
                  <NineDotsIcon 
                    className="text-foreground"
                    size={28} 
                  />
                  {hasLiveTournaments && (
                    <motion.span
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
                      style={{ background: 'hsl(var(--destructive))' }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </span>
              ) : (
                <img
                  src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
                  alt="clbhouz"
                  className="object-contain h-9 w-9"
                />
              )}
            </button>
          </div>

          {/* Center section: Clubhouse tabs (mobile) or Desktop nav (lg+) */}
          <div className="hidden lg:flex flex-1 justify-center">
            {/* Desktop: main nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Clbhouz', path: '/clubhouse' },
                { label: 'Discover', path: '/discover' },
                { label: 'Courses', path: '/courses' },
                { label: 'Tour', path: '/tour' },
              ].map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path === '/clubhouse' && location.pathname === '/');
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-sq-sm transition-all duration-300 active:scale-[0.97]",
                      useLightTheme 
                        ? isActive 
                          ? "text-foreground bg-muted/80" 
                          : "text-muted-foreground"
                        : isActive 
                          ? "text-white bg-white/10"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right section: Search + Identity pill (fixed width) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Search Button — 44px tap target */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all",
                "h-11 w-11",
                useLightTheme
                  ? "text-muted-foreground"
                  : "hover:bg-[hsl(var(--clubhouse-active-bg))]"
              )}
              style={{ 
                color: useLightTheme 
                  ? undefined 
                  : 'hsl(var(--clubhouse-text-muted))',
                transition: 'all var(--motion-fast) var(--ease-standard)'
              }}
              onClick={handleSearchClick}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Identity pill (mobile only) */}
            <div className="sm:hidden">
              {user ? (
                <PostingAsPill 
                  ref={pillRef}
                  onClick={handleMenuClick} 
                  isOpen={menuOpen}
                  hasUnreadNotifications={hasUnread}
                  notificationCount={unreadCount}
                  useLightTheme={useLightTheme}
                />
              ) : (
                /* Skeleton placeholder while auth resolves — prevents layout shift */
                <div 
                  className="rounded-full bg-muted/50 animate-pulse"
                  style={{ width: 34, height: 34 }}
                />
              )}
            </div>
            
            {/* Desktop: Acting as indicator + Full navigation */}
            <div className="hidden sm:flex items-center">
              <ActingAsIndicator useLightTheme={useLightTheme} />
              <HeaderNavigation useLightTheme={useLightTheme} />
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
      <GlobalSearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
};

export default CompactHeader;