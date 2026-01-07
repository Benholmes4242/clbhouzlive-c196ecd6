/**
 * Hub Home Page - iPhone-Style Fixed Layout
 * NO VERTICAL SCROLLING - All content fits within viewport
 * Apple/Strava dashboard style
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHub } from '../useHub';
import { prefersReduced } from '@/lib/ui/motion';
import { useChromeState } from '@/hooks/useChromeState';

// Hub components - fixed layout versions
import { HubHeaderToday } from '../home/tiles/HubHeaderToday';
import { HubMessagesCard } from '../home/tiles/HubMessagesCard';
import { YourGamesTile } from '../home/tiles/YourGamesTile';
import { HubActionDock } from '../home/tiles/HubActionDock';

import '../home/hubThemeLight.css';

// Animation constants
const HUB_ENTRY_DURATION = 500;
const HUB_EXIT_DURATION = 500;
const HUB_ENTRY_EASING = 'ease-in-out';
const HUB_EXIT_EASING = 'ease-in-out';

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
    <div className="fixed inset-0 z-[9999]">
      {/* Glass Sheet */}
      <div 
        ref={sheetRef}
        className="hub-glass-page fixed inset-0"
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
          FIXED LAYOUT - NO SCROLL
          Using flex with fixed heights for each zone
        */}
        <div 
          className="w-full h-full flex flex-col px-3.5"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 55px)', // 55px nav, tight 10px gap
            overflow: 'hidden',
          }}
        >
          {/* Zone 1: Header - Fixed ~68px */}
          <HubHeaderToday />

          {/* Zone 2: Messages - Fixed ~198px, no internal scroll */}
          <div className="h-[198px] shrink-0">
            <HubMessagesCard />
          </div>

          {/* Zone 3: Games - Primary section, flex-1 with internal scroll */}
          <div className="mt-2 mb-2.5 flex-1 min-h-[180px]">
            <YourGamesTile />
          </div>
        </div>

        {/* Action Dock - Fixed at bottom */}
        <HubActionDock />
      </div>
    </div>
  );
}
