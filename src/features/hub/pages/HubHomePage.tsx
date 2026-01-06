/**
 * Hub Home Page
 * Standalone glass page showing Hub dashboard with tiles
 * Apple-level design with Today header, Messages, Games, Echo, Golf Life, and Action Dock
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHub } from '../useHub';
import { prefersReduced } from '@/lib/ui/motion';
import { useChromeState } from '@/hooks/useChromeState';

// New Hub components
import { HubHeaderToday } from '../home/tiles/HubHeaderToday';
import { HubMessagesCard } from '../home/tiles/HubMessagesCard';
import { YourGamesTile } from '../home/tiles/YourGamesTile';
import { EchoTile } from '../home/tiles/EchoTile';
import { QuickActionsTile } from '../home/tiles/QuickActionsTile';
import { HubGolfLifeCarousel } from '../home/tiles/HubGolfLifeCarousel';
import { HubActionDock } from '../home/tiles/HubActionDock';

import '../home/hubThemeLight.css';

// Animation constants - matches expanded map sheet
const HUB_ENTRY_DURATION = 500; // ms – buttery smooth slide-up
const HUB_EXIT_DURATION = 500;  // ms – buttery smooth slide-down
const HUB_ENTRY_EASING = 'ease-in-out'; // smooth standard easing
const HUB_EXIT_EASING = 'ease-in-out';   // smooth standard easing

export function HubHomePage() {
  const { close } = useHub();
  
  // Subscribe to realtime join request notifications
  useJoinRequestNotifications();

  // Animation & swipe-to-dismiss state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const reduced = prefersReduced();
    // If user prefers reduced motion, start at rest (no animation)
    if (reduced) return 0;
    // Otherwise, start off-screen at the bottom
    return window.innerHeight;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window === 'undefined') return true;
    // If reduced motion, we never animate, so we consider it "entered"
    return prefersReduced();
  });
  const [isExiting, setIsExiting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [revealChrome, setRevealChrome] = useState(false);

  const CHROME_REVEAL_OFFSET = 40; // Reveal chrome 40ms before Hub finishes sliding down

  // Wire Hub into chrome auto-hide system
  // Keep chrome hidden until near the end of close animation
  useChromeState({
    forceHidden: !revealChrome,
    disabled: false,
  });
  
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const DRAG_THRESHOLD = 120; // px to trigger dismiss

  // Helper: is this touch inside a scroll container?
  const isInsideScrollContainer = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('[data-hub-scroll-container="true"]');
  };

  // Animated close with slide-down
  const animateAndClose = useCallback(() => {
    const reduced = prefersReduced();

    if (reduced) {
      // no animation for users who prefer reduced motion
      close();
      return;
    }

    if (typeof window === 'undefined') {
      close();
      return;
    }

    // Start closing sequence
    setIsClosing(true);
    setIsExiting(true);
    // slide down off-screen
    setTranslateY(window.innerHeight);

    // Reveal chrome near the end of the slide-down so footer/HUD bounce after Hub is mostly gone
    window.setTimeout(() => {
      setRevealChrome(true);
    }, HUB_EXIT_DURATION - CHROME_REVEAL_OFFSET);

    // Wait for Hub slide-down animation to complete before navigating
    window.setTimeout(() => {
      close();
    }, HUB_EXIT_DURATION);
  }, [close]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (isExiting) return;

    const touch = e.touches[0];
    const target = e.target;

    // Ignore touches starting inside scroll containers
    if (isInsideScrollContainer(target)) {
      return;
    }

    setIsDragging(true);
    setDragStartY(touch.clientY);
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging || dragStartY == null || isExiting) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;

    if (deltaY <= 0) {
      // Don't drag upwards
      setTranslateY(0);
      return;
    }

    // Directly follow the finger
    setTranslateY(deltaY);
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (!isDragging || isExiting) return;

    if (translateY > DRAG_THRESHOLD) {
      animateAndClose();
    } else {
      // Snap back
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
      // No animation path: just appear in place
      setTranslateY(0);
      setHasEntered(true);
      return;
    }

    // At this point, translateY is already window.innerHeight from initial state,
    // and hasEntered is false, so there's no transition yet.
    // Next frame: enable transition and slide up to 0
    requestAnimationFrame(() => {
      setHasEntered(true);
      setTranslateY(0);
    });
  }, []);

  // hub-open class is now managed by HubProvider to prevent race conditions

  // Track Hub open on mount
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
      {/* Glass Sheet - unified background and backdrop */}
      <div 
        ref={sheetRef}
        className="hub-glass-page fixed inset-0"
        style={{
          background: 'var(--hub-bg-start)',
          borderTop: '1px solid var(--hub-stroke)',
          transform: `translateY(${translateY}px)`,
          transition:
            // no transition while dragging or before first frame
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

        {/* Hub Dashboard - scrollable content */}
        <div 
          className="no-header-offset w-full overflow-y-auto px-3.5 pb-28"
          style={{
            height: '100vh',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
          }}
        >
          {/* A. Today Header */}
          <HubHeaderToday />

          {/* B. Messages Card */}
          <div style={{ height: '200px' }}>
            <HubMessagesCard />
          </div>

          {/* C. Your Golf Schedule (Games) */}
          <div 
            className="mt-3.5" 
            style={{ height: '280px' }}
          >
            <YourGamesTile />
          </div>

          {/* D. Echo & Quick Actions */}
          <div
            className="grid mt-3.5"
            style={{ 
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
              gap: '0.875rem',
            }}
          >
            <div style={{ aspectRatio: '1', width: '100%' }}>
              <EchoTile />
            </div>
            <div style={{ aspectRatio: '1', width: '100%' }}>
              <QuickActionsTile />
            </div>
          </div>

          {/* E. Your Golf Life Carousel */}
          <HubGolfLifeCarousel />
        </div>

        {/* F. Persistent Action Dock */}
        <HubActionDock />
      </div>
    </div>
  );
}
