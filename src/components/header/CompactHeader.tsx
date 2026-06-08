import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HeaderNavigation from './HeaderNavigation';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { ActingAsIndicator } from './ActingAsIndicator';
import { HandicapChip } from './HandicapChip';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import { safeGoBack } from '@/utils/navigation';

interface CompactHeaderProps {
  className?: string;
}

const LiveStatusInline: React.FC = () => {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'Geist, system-ui, sans-serif',
    }}>
      <span className="hcp-live-dot" />
      <span style={{
        textTransform: 'uppercase',
        fontSize: 10,
        letterSpacing: '0.18em',
        fontWeight: 700,
        color: 'var(--hcp-t-60)',
      }}>
        <span style={{ color: 'var(--hcp-good)', fontWeight: 800 }}>LIVE</span>
      </span>
    </span>
  );
};

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
  
  // Tour routes are treated identically across all sub-tabs.
  // The clbhouz logo renders on the left; tour menu access lives in the bottom-nav 'Tour Nav' button.
  // (isTourPath retained for potential future use; not currently branched on.)

  
  // Determine routes
  const isEditProfileRoute = location.pathname === '/edit-profile';
  const isFriendsActivityRoute = location.pathname === '/friends-activity';
  const isAchievementsRoute = location.pathname === '/achievements' || location.pathname.startsWith('/achievements/') || location.pathname === '/profile/quest';
  const isMessagesRoute = location.pathname.startsWith('/messages');
  const isMessagesConversationRoute = location.pathname.startsWith('/messages/');
  const isHandicapRoute = location.pathname === '/handicap' || location.pathname.startsWith('/handicap/');
  const isWatchSubpageRoute = location.pathname === '/watch/videos' || location.pathname === '/watch/clips';
  // Tour Hub overview + sub-tabs share the handicap dark chrome treatment
  // (dark header background, white controls, dark identity pill) but keep the
  // clbhouz logo on the left — they're top-level hubs, not back-arrow pages.
  const isTourRoute = location.pathname === '/tourhub' || location.pathname.startsWith('/tourhub/');
  const isCoursesLandingRoute = location.pathname === '/courses';
  // Course detail: /courses/:courseId (exactly 3 segments — excludes /reviews, /rate, /share-review subroutes)
  const isCourseDetailRoute = location.pathname.startsWith('/courses/')
    && location.pathname.split('/').length === 3;

  // Tour deep pages: player, tournament, college profile, college H2H
  const isTourPlayerRoute = location.pathname.startsWith('/tourhub/player/');
  const isTourTournamentRoute = location.pathname.startsWith('/tourhub/tournament/');
  const isTourCollegeCompareRoute = location.pathname === '/tourhub/college-golf/compare';
  const isTourCollegeProfileRoute = location.pathname.startsWith('/tourhub/college-golf/')
    && location.pathname !== '/tourhub/college-golf'
    && location.pathname !== '/tourhub/college-golf/compare';
  const isTourDeepRoute = isTourPlayerRoute || isTourTournamentRoute
    || isTourCollegeCompareRoute || isTourCollegeProfileRoute;
  // Editorial-geometry chrome (52px / 30px logo / 38px search) applies to
  // tab-landing surfaces. Tour-specific behaviors (compact avatar pill,
  // back-arrow) stay gated on isTourRoute.
  const isEditorialChromeRoute = isTourRoute || isCoursesLandingRoute || isCourseDetailRoute;
  // Routes that keep the light Dispatch chrome (clubhouse feed + profile pages).
  // NOTE: '/' is the Tour Hub landing — it must use dark chrome like /tourhub.
  // Do not re-add '/' here.
  const isClubhouseChromeRoute = location.pathname === '/clubhouse';
  const isProfileChromeRoute = location.pathname === '/profile' || location.pathname.startsWith('/profile/');


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
  // - List detail pages: /top100/:slug (back goes to Courses → Top 100 tab)
  const isTop100SubPage = location.pathname.startsWith('/top100/') &&
    location.pathname.split('/').length > 2;
  const isTop100Route = isTop100SubPage;
  
  // Routes that should show back arrow instead of logo
  const isBackArrowRoute = isDiscoverSubPage || isTop100Route || isCourseDetailRoute || isEditProfileRoute || isFriendsActivityRoute || isAchievementsRoute || isMessagesRoute || isHandicapRoute || isWatchSubpageRoute || isTourDeepRoute;
  
  // Dark chrome is now the default across the app. Only the Clubhouse feed and
  // Profile pages keep the light Dispatch chrome (identity pill, search icon,
  // posting-as menu palette).
  const isDarkChrome = !(isClubhouseChromeRoute || isProfileChromeRoute);
  const useDarkChrome = isDarkChrome && !searchOpen;
  const useLightTheme = !useDarkChrome;

  const handleLogoClick = () => {
    if (isBackArrowRoute) {
      haptic('light');
      if (isDiscoverSubPage) {
        handleDiscoverBack();
      } else if (isTop100Route) {
        handleTop100Back();
      } else if (isCourseDetailRoute) {
        safeGoBack(navigate, '/courses');
      } else if (isEditProfileRoute) {
        navigate('/profile');
      } else if (isFriendsActivityRoute) {
        navigate(-1);
      } else if (isAchievementsRoute) {
        navigate(-1);
      } else if (isMessagesConversationRoute) {
        navigate('/messages');
      } else if (isMessagesRoute) {
        navigate(-1);
      } else if (isHandicapRoute) {
        // Course Legends drilldown deep-links may have no in-app history — fall back to Compete tab.
        const isCourseLegendsRoute = location.pathname.startsWith('/handicap/legends/courses/');
        if (isCourseLegendsRoute) {
          safeGoBack(navigate, '/handicap?subtab=compete');
        } else {
          navigate(-1);
        }
      } else if (isWatchSubpageRoute) {
        navigate(-1);
      } else if (isTourDeepRoute) {
        navigate(-1);
      }
    } else {
      navigate('/clubhouse');
    }
  };

  const handleDiscoverBack = () => {
    if (location.pathname.startsWith('/discover/explore/region/') || 
        location.pathname.startsWith('/discover/explore/theme/')) {
      navigate('/courses?tab=discover');
    } else if (searchParams.get('section')) {
      navigate('/watch');
    } else {
      navigate('/watch');
    }
  };

  const handleTop100Back = () => {
    navigate('/courses?tab=top100');
  };
  
  const handleSearchClick = () => {
    setSearchOpen(true);
  };
  
  const handleMenuClick = () => {
    setMenuOpen(v => !v);
  };

  // Header height: 52px on tour routes (compact), 55px elsewhere.
  const contentHeight = isEditorialChromeRoute ? 52 : 55;

  // Publish header height as a CSS variable so ShellSlot + --chrome-total-h
  // can adapt without each consumer needing to know about tour-specific sizing.
  React.useEffect(() => {
    document.documentElement.style.setProperty('--header-h', `${contentHeight}px`);
    return () => {
      document.documentElement.style.setProperty('--header-h', '55px');
    };
  }, [contentHeight]);
  
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
          background: useDarkChrome ? '#0A0E14' : 'hsl(var(--background))',
          backdropFilter: useDarkChrome ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: useDarkChrome ? 'none' : 'blur(20px)',
          height: `calc(${contentHeight}px + var(--sat, 0px))`,
          paddingTop: 'var(--sat, 0px)',
          borderBottom: useDarkChrome
            ? '1px solid rgba(255,255,255,0.06)'
            : `0.5px solid hsl(var(--border) / 0.5)`,
          boxShadow: 'none',
        }}
      >
        {/* Content wrapper - always 55px, positioned below safe area on Clubhouse */}
        <div 
          className="mx-auto flex items-center justify-between px-3 sm:px-4 max-w-5xl"
          style={{ height: `${contentHeight}px` }}
        >
          {/* Left section: Back Button or Logo (fixed width, 44px tap target) */}
          <div className="flex-shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 bg-transparent border-0 transition-transform min-h-[44px] cursor-pointer active:scale-[0.98]"
              onClick={handleLogoClick}
              aria-label={isBackArrowRoute ? "Go back" : "Go to home"}
            >
              {isBackArrowRoute ? (
                <ArrowLeft className={cn("h-6 w-6", isDarkChrome ? "text-white" : "text-foreground")} />
              ) : (
                <img
                  src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
                  alt="clbhouz"
                  className={cn("object-contain", isEditorialChromeRoute ? "h-[30px] w-[30px]" : "h-9 w-9")}
                />
              )}
            </button>
          </div>

          {/* Center section */}
          {isDarkChrome ? (
            <div className="flex-1" />
          ) : (
          <div className="hidden lg:flex flex-1 justify-center">
            {/* Desktop: main nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Clbhouz', path: '/clubhouse' },
                { label: 'Watch', path: '/watch' },
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
          )}

          {/* Right section: Search + Identity pill (fixed width) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Search Button — 44px tap target */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all",
                isEditorialChromeRoute ? "h-[38px] w-[38px] text-white" : "h-11 w-11 text-white",
                !isDarkChrome && !useLightTheme && "hover:bg-[hsl(var(--clubhouse-active-bg))]"
              )}
              style={{
                color: '#FFFFFF',
                transition: 'all var(--motion-fast) var(--ease-standard)'
              }}
              onClick={handleSearchClick}
              aria-label="Search"
            >
              <Search className={isEditorialChromeRoute ? "h-[18px] w-[18px]" : "h-5 w-5"} />
            </Button>

            {/* Handicap chip — dark chrome only (Phase 1: dark headers) */}
            {isDarkChrome && <HandicapChip />}

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
                  compact={isEditorialChromeRoute}
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