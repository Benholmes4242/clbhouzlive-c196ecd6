/**
 * Hub Home Page
 * Standalone glass page showing Hub dashboard with tiles
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHub } from '../useHub';
import { prefersReduced } from '@/lib/ui/motion';
import { EchoTile } from '../home/tiles/EchoTile';
import { QuickActionsTile } from '../home/tiles/QuickActionsTile';
import { NearbyGolfersTile } from '../home/tiles/NearbyGolfersTile';
import { YourGamesTile } from '../home/tiles/YourGamesTile';
import '../home/hubTheme.css';

// Animation constants
const HUB_ENTRY_DURATION = 260; // ms – smooth slide-up timing
const HUB_EXIT_DURATION = 190;  // ms – snappier slide-down
const HUB_ENTRY_EASING = 'cubic-bezier(.2,.8,.2,1)'; // springy entry
const HUB_EXIT_EASING = 'cubic-bezier(.4,0,.2,1)';   // punchy exit

export function HubHomePage() {
  const { close } = useHub();
  
  // Subscribe to realtime join request notifications
  useJoinRequestNotifications();

  // Animation & swipe-to-dismiss state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
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

    setIsExiting(true);
    // slide down off-screen
    setTranslateY(window.innerHeight);

    // match exit duration
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
      setTranslateY(0);
      setHasEntered(true);
      return;
    }

    // Start off-screen at the bottom with no transition
    setHasEntered(false);
    setTranslateY(window.innerHeight);

    // Next frame: enable transition + slide up to 0
    requestAnimationFrame(() => {
      setHasEntered(true);
      setTranslateY(0);
    });
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

  return (
    <div
      ref={sheetRef}
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
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

      {/* Hub Dashboard */}
      <main className="w-full overflow-y-auto h-screen pt-[env(safe-area-inset-top,0px)] px-3.5">
        <div className="pt-1.5">
        {/* Nearby Golfers - Full width */}
        <div style={{ height: 'var(--hub-tile-fixed-h)' }}>
          <NearbyGolfersTile />
        </div>

        {/* Your Games - calculated height to push bottom tiles to 12px from edge */}
        <div 
          className="mt-3.5" 
          style={{ 
            height: 'calc(100vh - var(--hub-tile-fixed-h) - 0.875rem - 0.875rem - 0.75rem - 12px - env(safe-area-inset-top, 0px) - ((100vw - 28px - 0.875rem) / 2))' 
          }}
        >
          <YourGamesTile />
        </div>

        {/* Echo & Quick Actions 2×2 grid - Square tiles */}
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
        </div>
      </main>
    </div>
  );
}
