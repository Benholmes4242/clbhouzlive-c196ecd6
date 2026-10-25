// MediaPreviewViewer — Fullscreen media viewer with swipe and pinch-zoom
//
// Matches the canonical fullscreen viewer treatment used by FullscreenFeedOverlay:
//   • blurred self-backdrop of the current media (never black), crossfaded on
//     carousel swipe
//   • immersive status-bar bleed via body.route-fullscreen-overlay + shield
//     transparency + Median status-bar style push
//   • edge-to-edge chrome sitting directly on the blurred backdrop
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { MuteButton, TapForSoundPill } from '@/audio/MuteButton';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { VERDICT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import type { OrderedMediaItem } from './types';

interface MediaPreviewViewerProps {
  items: OrderedMediaItem[];
  initialIndex: number;
  onClose: () => void;
  onSetCover?: (index: number) => void;
  coverIndex?: number;
  showStudio?: boolean;
  /** BRIEF_HOLE_PANEL_CAROUSEL §5 — reports the showing item so a caller can
   * restore its own selection when the viewer closes. Optional; existing
   * callers see no change. */
  onIndexChange?: (index: number) => void;
  /** BRIEF_COURSES_LATEST_FROM_COURSES §8 — rubber-band at the first/last
   * shot: a drag past either edge moves the media by dx * 0.35 (max 80px)
   * and springs back on release without changing the index. Default false;
   * callers that omit it behave exactly as before. */
  edgeBounce?: boolean;
}

/** Edge-bounce travel cap and spring-back timing (BRIEF §8). */
const EDGE_BOUNCE_CAP = 80;
const EDGE_BOUNCE_FACTOR = 0.35;
const EDGE_BOUNCE_MS = 250;

export function MediaPreviewViewer({
  items,
  initialIndex,
  onClose,
  onSetCover,
  coverIndex = 0,
  onIndexChange,
  edgeBounce = false,
}: MediaPreviewViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { ref: zoomRef, imgRef, style: zoomStyle, scale, reset: resetZoom } = usePinchZoomPointer();
  const isZoomed = scale > 1;
  const item = items[currentIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showPill, setShowPill] = useState(false);
  const [edgeOffset, setEdgeOffset] = useState(0);
  const edgeOffsetRef = useRef(0);
  edgeOffsetRef.current = edgeOffset;
  const edgeAnimRef = useRef(0);
  useEffect(() => () => { if (edgeAnimRef.current) cancelAnimationFrame(edgeAnimRef.current); }, []);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (!isZoomed && currentIndex < items.length - 1) setCurrentIndex(currentIndex + 1);
    },
    onSwipeRight: () => {
      if (!isZoomed && currentIndex > 0) setCurrentIndex(currentIndex - 1);
    },
    onSwipeDown: () => {
      if (!isZoomed) onClose();
    },
    onSwiping: edgeBounce ? (deltaX) => {
      if (isZoomed) return;
      const single = items.length === 1;
      const pastFirst = currentIndex === 0 && deltaX > 0;
      const pastLast = currentIndex === items.length - 1 && deltaX < 0;
      if (pastFirst || pastLast || (single && deltaX !== 0)) {
        if (edgeAnimRef.current) { cancelAnimationFrame(edgeAnimRef.current); edgeAnimRef.current = 0; }
        setEdgeOffset(Math.max(-EDGE_BOUNCE_CAP, Math.min(EDGE_BOUNCE_CAP, deltaX * EDGE_BOUNCE_FACTOR)));
      }
    } : undefined,
    onSwipeEnd: edgeBounce ? () => {
      const from = edgeOffsetRef.current;
      if (!from) return;
      // The clock comes from the first rAF tick, not performance.now(): the
      // rAF timestamp origin is not guaranteed to match it.
      let start: number | null = null;
      const tick = (now: number) => {
        if (start === null) start = now;
        const t = Math.min(1, (now - start) / EDGE_BOUNCE_MS);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setEdgeOffset(t >= 1 ? 0 : from * (1 - eased));
        if (t < 1) edgeAnimRef.current = requestAnimationFrame(tick);
      };
      edgeAnimRef.current = requestAnimationFrame(tick);
    } : undefined,
    threshold: 60,
  });

  // Reset zoom on slide change
  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  // Report the showing item so a caller (the hole walk) can restore its own
  // selection to the shot showing when the viewer closes.
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  useEffect(() => {
    onIndexChangeRef.current?.(currentIndex);
  }, [currentIndex]);

  // Session-wired playback for video items. We drive play() imperatively so
  // an unmuted rejection is catchable — degrade this element to muted and
  // show the "Tap for sound" pill (does NOT touch the session store).
  // An item with hlsUrl attaches the stream (native HLS on Safari/iOS, hls.js
  // elsewhere) instead of src=previewUrl; the attachment is torn down on
  // slide change and on close.
  useEffect(() => {
    if (!item || item.type !== 'video') return;
    setShowPill(false);
    const el = videoRef.current;
    if (!el) return;
    const attachment = item.hlsUrl ? attachTileHls(el, item.hlsUrl, () => {}) : null;
    el.muted = useSessionAudio.getState().isMuted;
    Promise.resolve(el.play()).catch(() => {
      if (!el.muted) {
        el.muted = true;
        setShowPill(true);
        Promise.resolve(el.play()).catch(() => {});
      }
    });
    return () => { attachment?.detach(); };
  }, [item?.id, item?.type]);

  // Session store → element sync while open (both directions of change).
  useEffect(() => {
    const unsub = useSessionAudio.subscribe((s) => {
      const el = videoRef.current;
      if (el) el.muted = s.isMuted;
      if (!s.isMuted) setShowPill(false);
    });
    return unsub;
  }, []);

  // Immersive shield — mirrors FullscreenFeedOverlay's open/close hooks so the
  // notch/status bar bleeds under the blurred backdrop. useLayoutEffect so the
  // shield/statusbar mutations land BEFORE first paint.
  useLayoutEffect(() => {
    const shield = document.getElementById('safe-area-shield');
    const prevShield = shield?.style.backgroundColor ?? '';
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;

    document.body.classList.add('route-fullscreen-overlay');
    if (shield) shield.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = '#000000';
    document.body.style.backgroundColor = '#000000';
    try {
      setStatusBarStyleColor('dark', '00000000');
    } catch {}

    return () => {
      document.body.classList.remove('route-fullscreen-overlay');
      if (shield) shield.style.backgroundColor = prevShield;
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
      window.dispatchEvent(new CustomEvent('media-viewer-closed'));
    };
  }, []);

  if (!item) return null;

  const backdropUrl = item.type === 'video' ? item.thumbnailUrl : item.previewUrl;

  // PORTAL TO BODY (invariant, see lib/zLayers.ts): rendered in place this
  // viewer was clamped inside any ancestor stacking context (transform /
  // will-change / backdrop-filter / -webkit-overflow-scrolling on iOS), so
  // body-portaled BottomSheets painted over it whatever its z-index. All
  // layout here is position:fixed/absolute inset-0, so portalling changes
  // nothing visually.
  return createPortal(
    <motion.div

      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999]"
      style={{ background: '#000' }}
    >
      {/* Blurred self-backdrop — crossfades on carousel swipe (keyed on url). */}
      <AnimatePresence>
        {backdropUrl && (
          <motion.div
            key={backdropUrl}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${backdropUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.6) saturate(1.2)',
              transform: 'scale(1.2)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Header — absolute so backdrop bleeds under the notch */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 12,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,0,0,0.32)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.35))',
          }}
        >
          <X className="w-6 h-6 text-white" />
        </button>
        {items.length > 1 && (
          <span
            style={{
              background: 'rgba(0,0,0,0.32)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
              textShadow: '0 1px 8px rgba(0,0,0,0.35)',
            }}
          >
            {currentIndex + 1} / {items.length}
          </span>
        )}
        {onSetCover && currentIndex !== coverIndex ? (
          <button
            onClick={() => onSetCover(currentIndex)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F7931E',
              padding: '7px 14px',
              borderRadius: 24,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(247,147,30,0.30)',
            }}
          >
            <Star className="w-3 h-3" style={{ color: '#ffffff' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Set as Cover</span>
          </button>
        ) : (
          <div className="w-11" />
        )}
      </div>

      {/* Media — absolute inset so image centers in the full viewport (bleeds under the notch) */}
      <div
        ref={swipeRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          touchAction: isZoomed ? 'none' : 'pan-y',
          transform: edgeOffset ? `translateX(${edgeOffset}px)` : undefined,
        }}
      >

        {item.type === 'video' ? (
          // NOTE: play() is driven imperatively via useEffect so an unmuted
          // rejection is catchable (no autoPlay attribute). The native
          // <controls> volume acts on the element only and does not write
          // the session store — acceptable for the local scrub UX; the
          // MuteButton overlay is the canonical session writer.
          <video
            key={item.id}
            ref={videoRef}
            src={item.hlsUrl ? undefined : item.previewUrl}
            poster={item.thumbnailUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div ref={zoomRef} style={zoomStyle}>
            <img
              ref={imgRef}
              src={item.previewUrl}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}

        {/* Nav buttons — hidden when zoomed */}
        {currentIndex > 0 && !isZoomed && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            aria-label="Previous"
            style={{
              position: 'absolute', left: 8,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,0.32)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.35))',
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {currentIndex < items.length - 1 && !isZoomed && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            aria-label="Next"
            style={{
              position: 'absolute', right: 8,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,0.32)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.35))',
            }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Session mute — top-right, video only. Sits below the close chip so
          it doesn't compete with the "Set as Cover" affordance. */}
      {item.type === 'video' && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(max(env(safe-area-inset-top, 0px), 48px) + 60px)',
            right: 12,
            zIndex: 12,
          }}
        >
          <MuteButton size="md" />
        </div>
      )}

      {/* Caption — bottom-left over the backdrop, only when the caller
          supplied one (the hole walk does; every other caller is unchanged). */}
      {item.caption && (
        <div
          data-viewer-caption
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
            zIndex: 11,
            pointerEvents: 'none',
          }}
        >
          <div style={VERDICT_KICKER}>{item.caption.kicker}</div>
          <div style={{ marginTop: 6, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
            {item.caption.title}
          </div>
          {item.caption.credit && (
            <div style={{ marginTop: 5, fontSize: 12.5, color: 'rgba(255,255,255,0.72)' }}>
              {item.caption.credit}
            </div>
          )}
        </div>
      )}

      {/* Autoplay-blocked pill — bottom-centre. */}
      {item.type === 'video' && showPill && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            transform: 'translateX(-50%)',
            zIndex: 12,
          }}
        >
          <TapForSoundPill
            onClick={() => {
              useSessionAudio.getState().unmute();
              setShowPill(false);
            }}
          />
        </div>
      )}
    </motion.div>,
    document.body,
  );
}

