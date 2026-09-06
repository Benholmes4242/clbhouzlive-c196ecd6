import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useModalContext } from '@/contexts/ModalContext';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useAppPrefetch } from '@/hooks/useAppPrefetch';
import { warmChunk } from '@/routes/chunkLoaders';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
import { navigationTabs } from './bottom-navigation/navigationTabs';
import { useDiscoverNewTotal } from '@/stores/discoverNewStore';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';

import { useNavTheme } from '@/hooks/useNavTheme';
import { useNavScrollState, pushForceExpand, resetToExpanded } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { r } from '@/lib/radius';
import CreateSheetV2 from '@/features/post-v2/components/CreateSheetV2';

// ---- Public token: total vertical space to reserve at the bottom of any
// scrollable page so its last content clears the floating control.
// (~60 bar + 20 bottom gap + 16 breathing room = 96)
export const NAV_CLEARANCE = '96px';

// Routes where bottom navigation should be hidden
const HIDDEN_ROUTES = [
  '/auth',
  '/admin-setup',
  '/onboarding',
  
  '/notificationmessages',
  '/followers',
  '/following',
  '/messages',
  '/join',
  '/post-v2',
];

const HIDDEN_ROUTE_PREFIXES = [
  '/echo',
  '/admin-v2',
  '/verified',
  '/manage/',
  '/support/',
  '/legal',
  '/privacy',
  '/terms',
  '/businesses/manage',
  '/business/create',
  '/business/invite/accept',
  '/i/',
  '/rate-course-v2/',
];

const HIDDEN_ROUTE_PATTERNS: RegExp[] = [
  /^\/profile\/[^/]+\/(followers|following)$/,
  /^\/business\/[^/]+\/(followers|following)$/,
  // Hide inside a conversation thread (composer would otherwise sit behind the pill),
  // but keep the nav on the inbox (/messages).
  /^\/messages\/[^/]+$/,
  // Review Wizard (e.g. /courses/:courseId/rate) — composer has its own chrome.
  /^\/courses\/[^/]+\/rate/,
];

interface GlobalBottomNavigationProps {
  chromeState?: 'visible' | 'hidden';
}

// --- Theme tokens ------------------------------------------------------------
type ThemeTokens = {
  fill: string;
  hairline: string;
  shadow: string;
  ink: string;
  dim: string;
  lozenge: string;
};

const DARK_TOKENS: ThemeTokens = {
  fill: 'rgba(27,30,39,0.86)',
  hairline: '1px solid rgba(255,255,255,0.10)',
  // Specular top-rim highlight + drop shadow (kept in both no-blur and blur paths).
  shadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 30px rgba(0,0,0,0.45)',
  ink: '#FFFFFF',
  dim: 'rgba(255,255,255,0.62)',
  lozenge: 'rgba(255,255,255,0.10)',
};

const LIGHT_TOKENS: ThemeTokens = {
  fill: 'rgba(250,251,253,0.88)',
  hairline: '1px solid rgba(15,23,42,0.08)',
  shadow: 'inset 0 1px 0 rgba(255,255,255,0.70), 0 10px 30px rgba(15,23,42,0.16)',
  ink: '#0F172A',
  dim: 'rgba(15,23,42,0.62)',
  lozenge: 'rgba(15,23,42,0.07)',
};


const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const GlobalBottomNavigation: React.FC<GlobalBottomNavigationProps> = ({ chromeState = 'visible' }) => {
  const location = useLocation();
  const { isVisible } = useBottomNavigation();
  const { shouldHideHeader } = useModalContext();
  const { triggerPrefetch } = useAppPrefetch();
  const { activeTab, handleTabClick, handlePrefetch } = useNavigationHandlers();
  // The courses badge counts NEW SINCE the member last left Discover across the
  // marked sections (friends, tour, reviews, world, moments) — not just friend
  // reviews. It is derived from the data Discover already loaded: no extra
  // query, and leaving Discover writes the stamp, which zeroes it.
  const discoverNewCount = useDiscoverNewTotal();
  const { data: tournamentsCache } = useTournamentsCache();
  const liveTournamentCount = tournamentsCache?.live?.length ?? 0;
  const isTourHubLive = liveTournamentCount > 0;
  const [createOpen, setCreateOpen] = useState(false);

  const theme = useNavTheme();
  const tokens = theme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;
  const navState = useNavScrollState();
  const condensed = navState === 'condensed' && !REDUCED_MOTION;

  const navRef = useRef<HTMLDivElement | null>(null);

  // Route change → reset scroll state to expanded.
  useEffect(() => {
    resetToExpanded();
  }, [location.pathname]);

  // Drawer / sheet active → force expanded (pill sits below sheet scrim).
  const [isDrawerActive, setIsDrawerActive] = useState(false);
  useEffect(() => {
    const check = () => setIsDrawerActive(document.body.classList.contains('drawer-active'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (isDrawerActive || shouldHideHeader) {
      return pushForceExpand();
    }
  }, [isDrawerActive, shouldHideHeader]);

  // Prefetch on hover/touch.
  const warmedRef = useRef<Set<string>>(new Set());
  const handleNavPrefetch = useCallback((path: string) => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (warmedRef.current.has(path)) return;
    warmedRef.current.add(path);
    warmChunk(path);
    triggerPrefetch(path);
    handlePrefetch(path);
  }, [triggerPrefetch, handlePrefetch]);

  // Route hide detection.
  const isOnboardingEditProfile =
    location.pathname === '/edit-profile' &&
    new URLSearchParams(location.search).get('onboarding') === '1';
  const shouldHideForRoute =
    HIDDEN_ROUTES.includes(location.pathname) ||
    HIDDEN_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix)) ||
    HIDDEN_ROUTE_PATTERNS.some(re => re.test(location.pathname)) ||
    isOnboardingEditProfile;
  const showNavigation = isVisible && !shouldHideForRoute;

  // Keep the global --bottom-nav-height CSS var mapped to NAV_CLEARANCE so
  // existing page padding consumers stay correct regardless of pill state.
  useEffect(() => {
    if (!showNavigation) {
      document.documentElement.style.setProperty('--bottom-nav-height', '0px');
      return;
    }
    document.documentElement.style.setProperty('--bottom-nav-height', NAV_CLEARANCE);
  }, [showNavigation]);

  // Chrome hidden — reflect in a11y.
  useEffect(() => {
    if (!navRef.current) return;
    const isHidden = chromeState === 'hidden';
    navRef.current.setAttribute('aria-hidden', String(isHidden));
    const els = navRef.current.querySelectorAll('button, a, input');
    els.forEach(el => {
      if (isHidden) el.setAttribute('tabindex', '-1');
      else el.removeAttribute('tabindex');
    });
  }, [chromeState]);

  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'post') {
      // The + only ever opens the chooser. The native picker is fired from
      // the Post row inside CreateSheetV2 so the tap that opens the OS menu
      // is its own user activation (iOS WKWebView requirement).
      setCreateOpen(true);
      return;
    }
    if (tab.id === 'clubhouse' && (location.pathname === '/' || location.pathname === '/clubhouse')) {
      window.dispatchEvent(new CustomEvent('clbhouz-active-tab-retap', { detail: { tabId: 'clubhouse' } }));
      return;
    }
    if (tab.path && location.pathname === tab.path) {
      scrollPageToTop('smooth');
      window.dispatchEvent(new CustomEvent('clbhouz-active-tab-retap', { detail: { tabId: tab.id } }));
      return;
    }
    handleTabClick(tab);
  };

  // Labelled navigation: glyph, 3px gap, then the column-header label.
  const PILL_MAX_EXPANDED = 'min(396px, 100vw - 22px)';
  const PILL_MAX_CONDENSED = 'min(324px, 100vw - 36px)';
  // Even integers so 1px strokes land on the device pixel grid — SF-crisp.
  const iconSize = condensed ? 22 : 24;
  const iconStroke = 2;

  const pillPadding = condensed ? '3px 7px' : '4px 7px';

  const badges = useMemo<Record<string, number>>(() => ({ courses: discoverNewCount }), [discoverNewCount]);

  // Motion tokens — only max-width + padding + icon size may animate on the
  // blurred pill. Never animate an explicit height/width on the pill itself.
  const PILL_TRANSITION = REDUCED_MOTION
    ? 'none'
    : 'max-width 220ms cubic-bezier(0.2,0.8,0.2,1), padding 220ms cubic-bezier(0.2,0.8,0.2,1)';
  // (Icon size snaps between states — see note in the SVG style block below.)

  const BUTTON_TRANSITION = REDUCED_MOTION
    ? 'none'
    : 'background 180ms linear, color 180ms linear, padding 220ms cubic-bezier(0.2,0.8,0.2,1)';

  return (
    <>
      {/* One-off style: gate translucency + backdrop-filter so unsupported
          WebViews degrade to the opaque token fill. Blur-supported paths get
          a more transparent liquid-glass fill so page content shows through. */}
      <style>{`
        .glass-nav-pill { }
        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .glass-nav-pill {
            backdrop-filter: blur(22px) saturate(180%);
            -webkit-backdrop-filter: blur(22px) saturate(180%);
          }
          .glass-nav-pill[data-theme='dark'] {
            background: rgba(27,30,39,0.62) !important;
          }
          .glass-nav-pill[data-theme='light'] {
            background: rgba(250,251,253,0.66) !important;
          }
        }
      `}</style>


      <AnimatePresence>
        {showNavigation && (
          <motion.div
            key="floating-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}

            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 20,
              zIndex: 100,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'center',
            }}
            role="navigation"
            aria-label="Main"
          >
            <div
              ref={(el) => {
                navRef.current = el;
              }}
              data-chrome="bottom-nav"
              data-theme={theme}
              className={cn('glass-nav-pill')}

              style={{
                pointerEvents: 'auto',
                margin: '0 auto',
                maxWidth: condensed ? PILL_MAX_CONDENSED : PILL_MAX_EXPANDED,
                width: '100%',
                background: tokens.fill,
                border: tokens.hairline,
                boxShadow: tokens.shadow,
                borderRadius: r.xl,
                padding: pillPadding,
                transition: PILL_TRANSITION,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                {navigationTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isLive = tab.id === 'tourhub' && isTourHubLive;
                  const Icon = tab.icon;
                  const badgeCount = badges[tab.id] ?? 0;
                  const activeColor = isLive ? '#22C55E' : tokens.ink;
                  const inactiveColor = tokens.dim;

                  return (
                    <li key={tab.id} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        aria-label={tab.label}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTabClickWithCamera(tab);
                        }}
                        onMouseEnter={() => tab.path && handleNavPrefetch(tab.path)}
                        onTouchStart={() => tab.path && handleNavPrefetch(tab.path)}
                        style={{
                          appearance: 'none',
                          border: 0,
                          background: isActive ? tokens.lozenge : 'transparent',
                          color: isLive ? '#22C55E' : (isActive ? activeColor : inactiveColor),
                          padding: '7px 3px',
                          borderRadius: isActive ? r.xl : r.pill,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                          width: '100%',
                          minWidth: 0,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          transition: BUTTON_TRANSITION,
                        }}
                      >
                        <span style={{ position: 'relative', display: 'inline-flex', flex: '0 0 auto' }}>
                          <Icon
                            aria-hidden="true"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            shapeRendering="geometricPrecision"
                            vectorEffect="non-scaling-stroke"
                            {...(tab.id === 'post'
                              ? { plusColor: '#F7931E' }
                              : {})}
                            style={{
                              width: iconSize,
                              height: iconSize,
                              strokeWidth: iconStroke,
                              // Snap sizes between states — no SVG resize
                              // transition (raster mid-tween reads soft).
                            }}
                          />


                          {badgeCount > 0 && (
                            <span
                              aria-hidden="true"
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -8,
                                minWidth: 14,
                                height: 14,
                                padding: '0 3px',
                                borderRadius: 999,
                                background: '#F7931E',
                                color: '#15171F',
                                fontSize: 8,
                                fontWeight: 700,
                                lineHeight: '14px',
                                textAlign: 'center',
                                boxShadow: theme === 'dark' ? '0 0 0 1.5px rgba(27,30,39,0.9)' : '0 0 0 1.5px rgba(250,251,253,0.9)',
                              }}
                            >
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                        </span>
                        <span
                          aria-hidden="true"
                          style={{
                            color: isActive ? tokens.ink : tokens.dim,
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.13em',
                            lineHeight: 1,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tab.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CreateSheetV2
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        returnPath={location.pathname}
      />
    </>
  );
};

export default GlobalBottomNavigation;
