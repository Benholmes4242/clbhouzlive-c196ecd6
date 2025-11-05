/**
 * HubShell - Unified My Clubhouse Hub
 * 
 * Consolidates Nearby Golfers, Games, Your Games, Create Game, and Echo
 * into a single routed experience at /hub/*
 * 
 * Based on NearbyOverlay structure with routing instead of tabs.
 * 
 * @see Phase 1 Audit Report - Section 13.2: Hub Shell Component
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Z } from '@/config/zIndex';
import { HubSheetRouter } from './HubSheetRouter';
import './HubShell.css';

interface HubShellProps {
  onClose?: () => void;
}

export function HubShell({ onClose }: HubShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);

  // Measure header height for bottom sheet positioning
  useLayoutEffect(() => {
    const setHeaderHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty('--hub-header-h', `${headerRef.current.offsetHeight}px`);
      }
    };
    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
    return () => window.removeEventListener('resize', setHeaderHeight);
  }, []);

  // Debug header height
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--hub-header-h');
    console.log('[HubShell] mounted; --hub-header-h=', v);
  }, []);

  // Lock body scroll when hub is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Mark hub-open on html while mounted
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => {
      document.documentElement.classList.remove('hub-open');
    };
  }, []);

  // Track Hub open on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  // Track tab switches
  useEffect(() => {
    const tab = location.pathname.split('/').pop() || 'golfers';
    console.log('[Hub] Tab switched to:', tab);
    
    // Track tab switch analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.tab_switch.event, {
        event_category: analyticsEvents.hub.tab_switch.category,
        event_label: `Hub Tab: ${tab}`,
        tab_name: tab,
      });
    }
  }, [location.pathname]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default: navigate back or to clubhouse
      navigate('/clubhouse');
    }
  };

  // Determine primary tab (Nearby vs Echo)
  const getPrimaryTab = () => {
    const path = location.pathname;
    if (path === '/hub' || path === '/hub/') return 'home';
    if (path.includes('/echo')) return 'echo';
    return 'nearby';
  };

  // Determine secondary tab within primary context
  const getSecondaryTab = () => {
    const path = location.pathname;
    if (path === '/hub' || path === '/hub/') return 'home';
    if (path.includes('/golfers')) return 'golfers';
    if (path.includes('/games')) return 'games';
    if (path.includes('/your-games')) return 'your-games';
    if (path.includes('/create-game')) return 'create-game';
    if (path.includes('/echo/chat')) return 'chat';
    if (path.includes('/echo/swing')) return 'swing';
    if (path.includes('/echo/history')) return 'history';
    return 'home';
  };

  const activePrimary = getPrimaryTab();
  const activeSecondary = getSecondaryTab();
  const isHomePage = location.pathname === '/hub' || location.pathname === '/hub/';

  // Primary tabs
  const primaryTabs = [
    { id: 'nearby', label: 'Nearby', path: '/hub/golfers' },
    { id: 'echo', label: 'Echo', path: '/hub/echo/chat' },
  ];

  // Secondary tabs (contextual based on primary)
  const nearbyTabs = [
    { id: 'golfers', label: 'Golfers', path: '/hub/golfers' },
    { id: 'games', label: 'Games', path: '/hub/games' },
    { id: 'your-games', label: 'Your Games', path: '/hub/your-games' },
  ];

  const echoTabs = [
    { id: 'chat', label: 'Chat', path: '/hub/echo/chat' },
    { id: 'swing', label: 'Swing Coach', path: '/hub/echo/swing' },
    { id: 'history', label: 'History', path: '/hub/echo/history' },
  ];

  const secondaryTabs = activePrimary === 'echo' ? echoTabs : nearbyTabs;

  return (
    <>
      {/* Backdrop - Liquid Glass (matches CinematicCreateMomentModal) */}
      <button
        aria-label="close hub"
        className="fixed inset-0"
        style={{ 
          zIndex: Z.hub,
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={handleClose}
      />

      {/* Hub Container */}
      <div 
        className="fixed inset-0 flex items-end sm:items-center sm:justify-center animate-fade-in pointer-events-none"
        style={{ zIndex: Z.hub }}
      >
        <div
          className="hub-shell relative w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto overflow-x-hidden"
          style={{
            height: 'calc(100vh - env(safe-area-inset-top))',
            maxHeight: '100vh',
            maxWidth: '100%',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            overscrollBehaviorX: 'none',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            backdropFilter: 'blur(var(--hub-backdrop-blur))',
            WebkitBackdropFilter: 'blur(var(--hub-backdrop-blur))',
            border: '1px solid var(--hub-stroke-subtle)',
            borderRadius: '0',
            boxShadow: 'var(--hub-shadow-main)',
            isolation: 'isolate',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            ref={headerRef}
            id="hubHeader"
            className="relative z-30 shrink-0"
            style={{
              background:
                'linear-gradient(180deg, var(--hub-header-bg-start) 0%, var(--hub-header-bg-mid) 60%, var(--hub-header-bg-end) 100%)',
              WebkitBackdropFilter: 'blur(var(--hub-header-blur))',
              backdropFilter: 'blur(var(--hub-header-blur))',
              borderBottom: '1px solid var(--hub-header-stroke)',
              willChange: 'backdrop-filter, background',
              isolation: 'isolate',
            }}
          >
            <div className="px-5 pt-4">
              <div className="flex items-center justify-between mb-3" style={{ userSelect: 'none' }}>
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/logomark-orange.png"
                    alt="Logo mark"
                    className="h-10 md:h-12 w-auto object-contain"
                  />
                  <img
                    src="/assets/clbhouz-white.png"
                    alt="clbhouz"
                    className="h-10 md:h-12 w-auto object-contain"
                  />
                </div>
                
                <TapButton
                  onPointerDown={handleClose}
                  className="transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
                  style={{ color: 'var(--hub-close-idle)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-close-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-close-idle)'}
                  aria-label="Close hub"
                >
                  <X className="w-5 h-5" />
                </TapButton>
              </div>
            </div>
          </div>

          {/* Primary Tabs (Nearby | Echo) - Hidden on home page */}
          {!isHomePage && (
            <div className="flex gap-2 px-5 mt-3" style={{ borderBottom: '1px solid var(--hub-stroke-divider)' }}>
              {primaryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className="flex-1 py-3 text-sm font-semibold relative transition-all duration-150"
                  style={{ 
                    color: activePrimary === tab.id ? 'var(--hub-text)' : 'var(--hub-text-dim)' 
                  }}
                  onMouseEnter={(e) => {
                    if (activePrimary !== tab.id) e.currentTarget.style.color = 'var(--hub-text-sub)';
                  }}
                  onMouseLeave={(e) => {
                    if (activePrimary !== tab.id) e.currentTarget.style.color = 'var(--hub-text-dim)';
                  }}
                >
                  {tab.label}
                  {activePrimary === tab.id && (
                    <div 
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-150"
                      style={{ width: '56px', background: 'var(--hub-tab-indicator)' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Secondary Tabs (contextual) - Hidden on home page */}
          {!isHomePage && (
            <div className="flex px-5 mt-2" style={{ borderBottom: '1px solid var(--hub-stroke-subtle)' }}>
              {secondaryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className="flex-1 py-2.5 text-xs font-medium relative transition-all duration-150"
                  style={{ 
                    color: activeSecondary === tab.id ? 'var(--hub-text-body)' : 'var(--hub-text-muted)' 
                  }}
                  onMouseEnter={(e) => {
                    if (activeSecondary !== tab.id) e.currentTarget.style.color = 'var(--hub-text-sub)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeSecondary !== tab.id) e.currentTarget.style.color = 'var(--hub-text-muted)';
                  }}
                >
                  {tab.label}
                  {activeSecondary === tab.id && (
                    <div 
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-150"
                      style={{ width: '40px', background: 'var(--hub-tab-indicator-subtle)' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Content Area - Routed */}
          <div 
            className={`flex-1 overflow-y-auto ${isHomePage ? '' : 'px-5 pt-4'} pb-3`}
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            <Outlet />
          </div>
        </div>
      </div>

      {/* Sheet Router */}
      <HubSheetRouter />
    </>
  );
}
