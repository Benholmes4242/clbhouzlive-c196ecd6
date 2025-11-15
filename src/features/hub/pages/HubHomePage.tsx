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

export function HubHomePage() {
  const { close } = useHub();
  
  // Subscribe to realtime join request notifications
  useJoinRequestNotifications();

  // Swipe-to-dismiss state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const DRAG_THRESHOLD = 120; // px to trigger dismiss

  // Helper: is this touch inside a scroll container?
  const isInsideScrollContainer = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('[data-hub-scroll-container="true"]');
  };

  // Centralized close handler
  const handleClose = useCallback(() => {
    close();
  }, [close]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
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
    if (!isDragging || dragStartY == null) return;

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
    if (!isDragging) return;

    if (translateY > DRAG_THRESHOLD) {
      handleClose();
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
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  // One-time elastic bounce on first open
  useEffect(() => {
    if (prefersReduced()) return;

    const key = 'hub-first-open-v1';
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(key)) return;

    // small initial bounce
    setTranslateY(10);

    const id = window.setTimeout(() => {
      setTranslateY(0);
      window.localStorage.setItem(key, 'true');
    }, 220);

    return () => window.clearTimeout(id);
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
        transition: isDragging
          ? 'none'
          : prefersReduced()
          ? 'transform 0.001ms linear'
          : 'transform 220ms cubic-bezier(.2,.8,.2,1)',
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
