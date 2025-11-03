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

import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Z } from '@/config/zIndex';
import './HubShell.css';

interface HubShellProps {
  onClose?: () => void;
}

export function HubShell({ onClose }: HubShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Lock body scroll when hub is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: Z.hub,
          backgroundColor: 'rgba(0,0,0,0.65)',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
        }}
      />
      
      {/* Click catcher for close-on-backdrop */}
      <button
        aria-label="close hub"
        className="fixed inset-0"
        style={{ zIndex: Z.hub }}
        onClick={handleClose}
      />

      {/* Hub Container */}
      <div 
        className="fixed inset-0 flex items-end sm:items-center sm:justify-center animate-fade-in pointer-events-none"
        style={{ zIndex: Z.hub }}
      >
        <div
          className="hub-page hub-shell relative w-full max-w-lg h-full flex flex-col animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto"
          style={{
            maxHeight: '100vh',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            overscrollBehaviorX: 'none',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header 
            className="hub-header sticky top-0 z-20 shrink-0"
          >
            <div className="px-5 pt-4">
              <div className="grid grid-cols-3 items-center mb-3" style={{ userSelect: 'none' }}>
                <div />
                
                <div className="text-center">
                  <h2 className="text-white text-[22px] md:text-[24px] font-semibold tracking-[-0.01em]">
                    My{'\u00A0'}Clubhouz
                  </h2>
                </div>
                
                <div className="flex justify-end">
                  <TapButton
                    onPointerDown={handleClose}
                    className="text-white/60 hover:text-white/90 transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
                    aria-label="Close hub"
                  >
                    <X className="w-5 h-5" />
                  </TapButton>
                </div>
              </div>
            </div>
            <div 
              className="h-px w-full" 
              style={{ 
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)' 
              }} 
            />
          </header>

          {/* Primary Tabs (Nearby | Echo) - Hidden on home page */}
          {!isHomePage && (
            <div className="flex gap-2 px-5 mt-3 border-b border-white/[0.06]">
              {primaryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex-1 py-3 text-sm font-semibold relative transition-all duration-150 ${
                    activePrimary === tab.id
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                  {activePrimary === tab.id && (
                    <div 
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-white/90 rounded-full transition-all duration-150"
                      style={{ width: '56px' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Secondary Tabs (contextual) - Hidden on home page */}
          {!isHomePage && (
            <div className="flex px-5 mt-2 border-b border-white/[0.04]">
              {secondaryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex-1 py-2.5 text-xs font-medium relative transition-all duration-150 ${
                    activeSecondary === tab.id
                      ? 'text-white/90'
                      : 'text-white/45 hover:text-white/65'
                  }`}
                >
                  {tab.label}
                  {activeSecondary === tab.id && (
                    <div 
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-white/70 rounded-full transition-all duration-150"
                      style={{ width: '40px' }}
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
    </>
  );
}
