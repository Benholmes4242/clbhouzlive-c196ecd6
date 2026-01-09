/**
 * Hub Home Page - Golf OS Dashboard
 * Matches the Golf OS Dashboard mock 1:1
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHub } from '../useHub';
import { prefersReduced } from '@/lib/ui/motion';
import { useChromeState } from '@/hooks/useChromeState';

// Hub components
import { HubHeaderToday } from '../home/tiles/HubHeaderToday';
import { UpNextHeroTile } from '../home/tiles/UpNextHeroTile';
import { HubMessagesCard } from '../home/tiles/HubMessagesCard';
import { ActiveGamesNearYouTile } from '../home/tiles/ActiveGamesNearYouTile';
import { EchoTile } from '../home/tiles/EchoTile';
import { YourGamesGradientCTA } from '../home/tiles/YourGamesGradientCTA';
import { HubFloatingDock } from '../home/tiles/HubFloatingDock';

import '../home/hubThemeLight.css';

// Animation constants
const HUB_ENTRY_DURATION = 500;
const HUB_EXIT_DURATION = 500;
const HUB_ENTRY_EASING = 'ease-in-out';
const HUB_EXIT_EASING = 'ease-in-out';

// Layout constants
const DOCK_HEIGHT = 88;
const DOCK_GAP = 14;

export function HubHomePage() {
  const { close } = useHub();
  
  useJoinRequestNotifications();

  // Animation & swipe-to-dismiss state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const reduced = prefersReduced();
    if (reduced) return 0;
    return window.innerHeight;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window === 'undefined') return true;
    return prefersReduced();
  });
  const [isExiting, setIsExiting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [revealChrome, setRevealChrome] = useState(false);

  const CHROME_REVEAL_OFFSET = 40;

  useChromeState({
    forceHidden: !revealChrome,
    disabled: false,
  });
  
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const DRAG_THRESHOLD = 120;

  const animateAndClose = useCallback(() => {
    const reduced = prefersReduced();

    if (reduced) {
      close();
      return;
    }

    if (typeof window === 'undefined') {
      close();
      return;
    }

    setIsClosing(true);
    setIsExiting(true);
    setTranslateY(window.innerHeight);

    window.setTimeout(() => {
      setRevealChrome(true);
    }, HUB_EXIT_DURATION - CHROME_REVEAL_OFFSET);

    window.setTimeout(() => {
      close();
    }, HUB_EXIT_DURATION);
  }, [close]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (isExiting) return;
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging || dragStartY == null || isExiting) return;

    const deltaY = e.touches[0].clientY - dragStartY;
    if (deltaY <= 0) {
      setTranslateY(0);
      return;
    }
    setTranslateY(deltaY);
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (!isDragging || isExiting) return;

    if (translateY > DRAG_THRESHOLD) {
      animateAndClose();
    } else {
      setTranslateY(0);
    }

    setIsDragging(false);
    setDragStartY(null);
  };

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        animateAndClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [animateAndClose]);

  // Slide-in from bottom on mount
  useEffect(() => {
    const reduced = prefersReduced();

    if (reduced || typeof window === 'undefined') {
      setTranslateY(0);
      setHasEntered(true);
      return;
    }

    requestAnimationFrame(() => {
      setHasEntered(true);
      setTranslateY(0);
    });
  }, []);

  // Track Hub open
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col h-[100svh] overflow-hidden">
      {/* Glass Sheet */}
      <div 
        ref={sheetRef}
        className="hub-glass-page flex-1 flex flex-col h-[100svh] overflow-hidden"
        style={{
          background: 'var(--hub-bg-start)',
          borderTop: '1px solid var(--hub-stroke)',
          transform: `translateY(${translateY}px)`,
          transition:
            isDragging || !hasEntered || prefersReduced()
              ? 'none'
              : isExiting
                ? `transform ${HUB_EXIT_DURATION}ms ${HUB_EXIT_EASING}`
                : `transform ${HUB_ENTRY_DURATION}ms ${HUB_ENTRY_EASING}`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grabber bar */}
        <div className="hub-grabber" />

        {/* 
          FIXED LAYOUT - No scroll
          Content area is flex-1 with overflow hidden, dock is anchored
        */}
        <div 
          className="flex-1 overflow-hidden flex flex-col"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
            paddingBottom: `calc(${DOCK_HEIGHT}px + ${DOCK_GAP}px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <div className="px-5 flex flex-col gap-3 flex-1 min-h-0">
            {/* Zone 1: Header - Greeting + Right Button */}
            <HubHeaderToday />

            {/* Zone 2: What's Up Next Hero Tile */}
            <UpNextHeroTile />

            {/* Zone 3: Messages Card */}
            <HubMessagesCard />

            {/* Zone 4: 2-up Grid - Active Games + Echo */}
            <div className="grid grid-cols-2 gap-3">
              <ActiveGamesNearYouTile />
              <EchoTile />
            </div>

            {/* Spacer to push Your Games to bottom */}
            <div className="flex-1" />

            {/* Zone 5: Full-width "Your Games" Gradient CTA - 12px above dock */}
            <div className="pb-3">
              <YourGamesGradientCTA />
            </div>
          </div>
        </div>

        {/* Anchored Dock - at bottom */}
        <HubFloatingDock />
      </div>
    </div>
  );
}
