/**
 * Fsv2Overlay — the app-root fullscreen viewer for V2. Mounted once
 * behind the `fsv2` flag in App.tsx. Reads state from `useFsv2Store`,
 * paints the vertical pager + chrome, owns the body-scroll lock, the
 * `route-fullscreen-overlay` body class, status-bar theme, and the
 * safe-area shield.
 *
 * Cleanup restores shield to transparent (v1 defect 16: never the light
 * default) and applies the current route's chrome (v1 defect 14).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import {
  lockBodyScroll,
  unlockBodyScroll,
} from '@/lib/bodyScrollLock';
import {
  setStatusBarStyleColor,
  resetShieldToTransparent,
  applyShieldColor,
  currentShieldColor,
  ensureStatusBarOverlayBooted,
} from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';

import { FSV2 } from '../tokens';
import { useFsv2Store } from '../store/fsv2Store';
import { startFsv2EngagementBridge } from '../store/engagementBridge';
import { startOpenSpan, endOpen, startCloseSpan, endCloseSpan } from '../perf/spans';
import { hudEvent } from '../perf/trace';
import { registerOverlayEl } from '../debug/hudBus';
import { useFsv2Viewport } from '../player/viewport';
import { WATCHDOG_MS, useWatchdog } from './Watchdogs';
import { Fsv2Chrome } from './Chrome';
import { Fsv2VerticalSnapPager } from './VerticalSnapPager';

startFsv2EngagementBridge();

function getSafeAreaTop(): number {
  if (typeof window === 'undefined') return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--sat');
  const n = parseFloat(v);
  if (Number.isFinite(n) && n > 0) return n;
  return Math.max(20, 44);
}

function getSafeAreaBottom(): number {
  if (typeof window === 'undefined') return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--sab');
  const n = parseFloat(v);
  if (Number.isFinite(n) && n > 0) return n;
  return 16;
}

export const Fsv2Overlay: React.FC = () => {
  const isOpen = useFsv2Store((s) => s.isOpen);
  const openId = useFsv2Store((s) => s.openId);
  const posts = useFsv2Store((s) => s.posts);
  const activeIndex = useFsv2Store((s) => s.activeIndex);
  const activePagerIdx = useFsv2Store((s) => s.activePagerIdx);
  const startPosition = useFsv2Store((s) => s.startPosition);
  const closeStore = useFsv2Store((s) => s.close);
  const openedFrom = useFsv2Store((s) => s.openedFrom);
  const location = useLocation();

  useSetChromeSuppressed(isOpen);

  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  // Enter / exit animation orchestration
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), FSV2.CLOSE_FADE_MS + 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  // Snap-to-visible when a NEW open lands while the overlay is still
  // mounted from a previous open (rapid close→open). Without this the
  // outer div stays mid-fade for ~2 RAFs and the light body underneath
  // shows through as a white flash — or, if state stalls, a fully white
  // viewer. Keyed by openId so every fresh open forces opacity: 1 now.
  useEffect(() => {
    if (!isOpen) return;
    setVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  // Body-scroll lock + chrome/status-bar orchestration
  const shieldPrevRef = useRef<string>('transparent');
  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    document.body.classList.add('route-fullscreen-overlay');
    shieldPrevRef.current = currentShieldColor;
    ensureStatusBarOverlayBooted();
    setStatusBarStyleColor('light', '#000000');
    applyShieldColor('transparent'); // paired transparent shield (defect 16)

    const startPath = location.pathname;
    return () => {
      unlockBodyScroll();
      document.body.classList.remove('route-fullscreen-overlay');
      resetShieldToTransparent();
      try { applyRouteChrome(startPath, true); } catch { /* ignore */ }
    };
  }, [isOpen, location.pathname]);

  // Open perf span — starts when overlay mounts, ends on first reveal.
  const openSpanRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const startPost = posts[activeIndex];
    const startMedia = startPost?.mediaItems?.[activePagerIdx];
    const kind = startMedia?.type === 'video'
      ? 'video'
      : (startPost?.mediaItems?.length ?? 0) > 1
        ? 'carousel'
        : 'image';
    openSpanRef.current = startOpenSpan(openId, kind, {
      openedFrom,
      postId: startPost?.id,
      mediaCount: startPost?.mediaItems?.length ?? 0,
    });
    return () => {
      if (openSpanRef.current) {
        endOpen(openSpanRef.current, { revealed: false, teardown: true });
        openSpanRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openId]);

  const handleFirstReveal = () => {
    if (openSpanRef.current) {
      endOpen(openSpanRef.current, { revealed: true });
      openSpanRef.current = null;
    }
  };

  // Watchdog: if we never reveal within the video-first-frame budget,
  // force the pager to visible and trace the forced reveal.
  useWatchdog(
    openId || 'idle',
    'overlay-reveal-timeout',
    WATCHDOG_MS.VIDEO_FIRST_FRAME,
    () => { handleFirstReveal(); },
    !isOpen,
  );

  const closeSpanRef = useRef<string | null>(null);
  const handleClose = () => {
    closeSpanRef.current = startCloseSpan(openId || 'idle');
    closeStore();
    setTimeout(() => {
      if (closeSpanRef.current) {
        endCloseSpan(closeSpanRef.current);
        closeSpanRef.current = null;
      }
    }, FSV2.CLOSE_FADE_MS);
  };

  const vp = useFsv2Viewport();
  const safeAreaTop = useMemo(getSafeAreaTop, [vp.width, vp.height]);
  const safeAreaBottom = useMemo(getSafeAreaBottom, [vp.width, vp.height]);

  const activePost = posts[activeIndex];
  const mediaCount = activePost?.mediaItems?.length ?? 0;
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    hudEvent(openId, 'overlay.mount', { activeIndex, mediaCount });
    registerOverlayEl(openId, rootRef.current);
    return () => { hudEvent(openId, 'overlay.unmount'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openId]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: vp.width,
        height: vp.height,
        background: FSV2.BACKDROP,
        zIndex: 2147483000,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.98)',
        transition: `opacity ${FSV2.OPEN_FADE_MS}ms ease, transform ${FSV2.OPEN_FADE_MS}ms ease`,
        contain: 'strict',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y pinch-zoom',
      }}
    >
      <Fsv2VerticalSnapPager
        key={openId || 'idle'}
        posts={posts}
        activeIndex={activeIndex}
        openId={openId}
        startPosition={startPosition}
        initialMediaIndex={activePagerIdx}
        safeAreaBottom={safeAreaBottom}
        onFirstReveal={handleFirstReveal}
      />

      {activePost ? (
        <Fsv2Chrome
          onClose={handleClose}
          mediaCount={mediaCount}
          authorName={activePost.displayName || activePost.username || ''}
          authorAvatar={activePost.avatarUrl || null}
          caption={activePost.caption || ''}
          courseName={activePost.courseName || null}
          safeAreaTop={safeAreaTop}
        />
      ) : null}
    </div>
  );
};
