import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HeaderNavigation from './HeaderNavigation';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import { SearchOverlay } from './SearchOverlay';
import { ActingAsIndicator } from './ActingAsIndicator';
import { cn } from '@/lib/utils';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { NineDotsIcon } from '@/features/tourhub/components/NineDotsIcon';
import { openTourNav } from '@/features/tourhub/contexts/TourNavContext';
import { haptic } from '@/utils/haptics';
import { ClubhouseTabToggle } from '@/components/clubhouse/ClubhouseTabToggle';
import { useClubhouseTab } from '@/contexts/ClubhouseTabContext';

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
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseSession();
  const { hasUnread } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  
  // Clubhouse tab context - may be null if not on Clubhouse page
  const clubhouseTab = useClubhouseTab();
  
  // Cinema Dim context - supports both dark (Clubhouse) and light (Course/Profile) themes
  const { cinemaDim, bumpChrome, isClubhousePage, isLightDimmed, dimmablePage } = useCinemaDimContext();
  const isDarkDimmed = isClubhousePage && cinemaDim;
  const isLightDimmablePage = dimmablePage === 'course-detail' || dimmablePage === 'profile' || dimmablePage === 'tourhub-overview';
  
  // Determine routes
  const isClubhouseRoute = location.pathname === '/' || location.pathname.startsWith('/clubhouse');
  const isTourRoute = location.pathname.startsWith('/tour') || location.pathname.startsWith('/tourhub');
  const isEditProfileRoute = location.pathname === '/edit-profile';
  const isFriendsActivityRoute = location.pathname === '/friends-activity';
  const isAchievementsRoute = location.pathname === '/achievements' || location.pathname === '/profile/quest';
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
  const isBackArrowRoute = isDiscoverSubPage || isTop100Route || isEditProfileRoute || isFriendsActivityRoute || isAchievementsRoute || isMessagesRoute;
  
  // Use light theme for non-clubhouse pages
  const useLightTheme = !isClubhouseRoute;
  
  // Determine if header should be dimmed (either dark or light theme)
  const shouldDim = isDarkDimmed || (isLightDimmablePage && isLightDimmed);

  const handleLogoClick = () => {
    bumpChrome();
    if (isBackArrowRoute) {
      // On back arrow routes, go back
      haptic('light');
      if (isDiscoverSubPage) {
        handleDiscoverBack();
      } else if (isTop100Route) {
        handleTop100Back();
      } else if (isEditProfileRoute) {
        navigate('/profile');
      } else if (isFriendsActivityRoute) {
        navigate(-1);
      } else if (isAchievementsRoute) {
        navigate(-1);
      } else if (isMessagesConversationRoute) {
        // From conversation, go back to messages list
        navigate('/messages');
      } else if (isMessagesRoute) {
        // From messages list, go back
        navigate(-1);
      }
    } else if (isTourRoute) {
      // On tour pages, open the tour navigation menu
      haptic('light');
      openTourNav();
    } else {
      // Otherwise go to clubhouse
      navigate('/clubhouse');
    }
  };

  const handleDiscoverBack = () => {
    // Navigate back to appropriate Discover tab
    if (location.pathname.startsWith('/discover/explore/region/') || 
        location.pathname.startsWith('/discover/explore/theme/')) {
      navigate('/discover?main=channels');
    } else if (searchParams.get('section')) {
      navigate('/discover?main=videos');
    } else {
      navigate('/discover');
    }
  };

  const handleTop100Back = () => {
    if (isTop100HubPage) {
      // From hub page, navigate back to Courses page with Top 100 tab
      navigate('/courses?tab=top100');
    } else {
      // From regional list pages, navigate back to World's Top 100 with courses tab
      navigate('/top100?tab=courses');
    }
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
  const LIGHT_DIM_BG = 'transparent'; // Fully transparent when dimmed on light pages
  const LIGHT_BORDER = 'hsl(215 25% 27% / 0.2)'; // slate-800/20 equivalent
  const DIM_BG = 'hsl(var(--clubhouse-dim-bg-header))';
  const DIM_BORDER = 'hsl(var(--clubhouse-border))';
  const STANDARD_BG = 'hsl(var(--clubhouse-bg-header))';
  const STANDARD_BORDER = 'hsl(var(--clubhouse-border))';
  const CINEMA_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // Get background based on theme and dim state
  const getBackground = () => {
    if (useLightTheme) {
      if (isLightDimmablePage && isLightDimmed) return LIGHT_DIM_BG;
      return LIGHT_BG;
    }
    if (isDarkDimmed) return DIM_BG;
    return STANDARD_BG;
  };

  // Get border based on theme
  const getBorder = () => {
    if (useLightTheme) {
      if (isLightDimmablePage && isLightDimmed) return "transparent";
      return LIGHT_BORDER;
    }
    if (isDarkDimmed && isClubhouseRoute) return "transparent";
    if (isDarkDimmed) return DIM_BORDER;
    return STANDARD_BORDER;
  };
  
  // Hide brand (logo + wordmark) when dimmed on either theme
  const hideBrand = shouldDim;

  // Standardized header height: 55px content, with safe-area on top for Clubhouse
  const contentHeight = 55;
  const SAFE_TOP = 'var(--sat, env(safe-area-inset-top, 0px))';
  
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
          // Position at top
          top: 0,
          background: getBackground(),
          backdropFilter: shouldDim ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: shouldDim ? 'none' : 'blur(20px)',
          // Clubhouse: height includes safe area, with paddingTop to push content below notch
          // Other pages: fixed 55px height, no safe area handling (PageRoot handles it)
          height: isClubhouseRoute ? `calc(${contentHeight}px + ${SAFE_TOP})` : `${contentHeight}px`,
          paddingTop: isClubhouseRoute ? SAFE_TOP : 0,
          borderBottom: `0.5px solid ${getBorder()}`,
          boxShadow: 'none',
          transition: `background-color 800ms ${CINEMA_EASE}, color 800ms ${CINEMA_EASE}, border-color 800ms ${CINEMA_EASE}, backdrop-filter 800ms ${CINEMA_EASE}`,
        }}
      >
        {/* Content wrapper - always 55px, positioned below safe area on Clubhouse */}
        <div 
          className="mx-auto flex items-center px-3 sm:px-4 max-w-5xl"
          style={{ height: `${contentHeight}px` }}
        >
          {/* Left section: Back Button, Tour Menu Icon, or Logo (fixed width) */}
          <div className="w-10 flex-shrink-0">
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 bg-transparent border-0 transition-transform",
                isClubhouseRoute && !isBackArrowRoute ? "pointer-events-none" : "cursor-pointer active:scale-[0.98]"
              )}
              onClick={handleLogoClick}
              aria-label={isBackArrowRoute ? "Go back" : isTourRoute ? "Go to tour menu" : "Go to home"}
            >
              {isBackArrowRoute ? (
                <ArrowLeft 
                  className={cn(
                    "transition-opacity duration-300 h-6 w-6",
                    hideBrand ? "opacity-0" : shouldDim ? "opacity-55" : "text-slate-800"
                  )}
                />
              ) : isTourRoute ? (
                <NineDotsIcon 
                  className={cn(
                    "transition-opacity duration-300",
                    dimmablePage === 'tourhub-overview' 
                      ? "text-white/90" // Always visible white on Tour Hub Overview
                      : shouldDim ? "opacity-55" : "text-slate-800"
                  )}
                  size={28} 
                />
              ) : (
                <img
                  src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
                  alt="clbhouz"
                  className={cn(
                    "object-contain transition-opacity duration-300",
                    "h-9 w-9", // Standardized logo size
                    hideBrand ? "opacity-0" : shouldDim ? "opacity-55" : "hover:opacity-80"
                  )}
                />
              )}
            </button>
          </div>

          {/* Center section: Clubhouse tabs (mobile) or Desktop nav (lg+) */}
          <div className="flex-1 flex justify-center">
            {/* Mobile: Show Clubhouse tabs when on Clubhouse route */}
            {isClubhouseRoute && clubhouseTab && (
              <div className={cn(
                "lg:hidden transition-opacity duration-500",
                isDarkDimmed ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                <ClubhouseTabToggle
                  activeTab={clubhouseTab.activeTab}
                  onTabChange={clubhouseTab.setActiveTab}
                  isBusinessActor={clubhouseTab.isBusinessActor}
                />
              </div>
            )}
            
            {/* Desktop: main nav links */}
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
                          ? shouldDim 
                            ? "bg-slate-100/20" 
                            : "text-slate-800 bg-slate-100/80" 
                          : shouldDim
                            ? "hover:bg-slate-50/20"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        : isActive 
                          ? isDarkDimmed 
                            ? "bg-white/5" 
                            : "text-white bg-white/10"
                          : isDarkDimmed
                            ? "hover:bg-white/5"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                    style={useLightTheme ? {
                      color: shouldDim 
                        ? (isActive ? 'rgba(15, 23, 42, 0.78)' : 'rgba(15, 23, 42, 0.55)')
                        : undefined
                    } : !useLightTheme ? {
                      color: isDarkDimmed 
                        ? (isActive ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.55)')
                        : undefined
                    } : undefined}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right section: Search + Identity pill (fixed width) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all",
                "h-9 w-9", // Standardized search button size
                useLightTheme
                  ? shouldDim 
                    ? "text-slate-600 hover:text-slate-800 hover:bg-slate-50/30"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  : isDarkDimmed 
                    ? "hover:bg-[hsl(var(--clubhouse-hover-bg))]" 
                    : "hover:bg-[hsl(var(--clubhouse-active-bg))]"
              )}
              style={{ 
                color: useLightTheme 
                  ? undefined 
                  : isDarkDimmed 
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
                  isDimmed={shouldDim}
                />
              </div>
            )}
            
            {/* Desktop: Acting as indicator + Full navigation */}
            <div className="hidden sm:flex items-center">
              <ActingAsIndicator useLightTheme={useLightTheme} isDimmed={shouldDim} />
              <HeaderNavigation onInteraction={bumpChrome} useLightTheme={useLightTheme} isDimmed={shouldDim} />
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
