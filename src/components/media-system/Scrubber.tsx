/**
 * Scrubber — Interactive progress bar with seeking, fine scrub, and loop animation.
 *
 * Visual states:
 *   1. Default  — 2px bar, always visible
 *   2. Hover    — 4px bar + 12px thumb (touch enters bottom 60px)
 *   3. Scrubbing — 6px bar + 16px thumb + timestamp tooltip
 *   4. Fine Scrub — same as scrubbing + "Fine Scrubbing" label, 0.25× sensitivity
 *
 * The bottom 60px zone captures all touch events to prevent feed scroll / tap-to-play.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { haptic } from '@/utils/haptics';

type ScrubState = 'default' | 'hover' | 'scrubbing' | 'fine-scrub';

interface ScrubberProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  duration: number | null;
  /** Called when scrubbing starts — parent can hide overlay */
  onScrubStart?: () => void;
  /** Called when scrubbing ends */
  onScrubEnd?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const BAR_HEIGHTS: Record<ScrubState, number> = {
  default: 2,
  hover: 4,
  scrubbing: 6,
  'fine-scrub': 6,
};

const THUMB_SIZES: Record<ScrubState, number> = {
  default: 0,
  hover: 12,
  scrubbing: 16,
  'fine-scrub': 16,
};

const TOUCH_ZONE_HEIGHT = 60;
const FINE_SCRUB_THRESHOLD = -40; // deltaY px (negative = upward)
const FINE_SCRUB_FACTOR = 0.25;
const HIDE_DELAY = 2000;
const LOOP_PULSE_WINDOW = 0.5; // seconds before loop

export function Scrubber({ videoRef, isActive, duration, onScrubStart, onScrubEnd }: ScrubberProps) {
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [scrubState, setScrubState] = useState<ScrubState>('default');
  const [tooltipTime, setTooltipTime] = useState('0:00');
  const [loopPulse, setLoopPulse] = useState(false);
  const [loopReset, setLoopReset] = useState(false);

  const rafRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const touchStartRef = useRef<{ x: number; y: number; time: number; progress: number }>({
    x: 0, y: 0, time: 0, progress: 0,
  });
  const wasPausedRef = useRef(false);
  const lastScrubTimeRef = useRef(0); // video time at last fine-scrub anchor
  const isScrubbing = scrubState === 'scrubbing' || scrubState === 'fine-scrub';
  const prevProgressRef = useRef(0);

  // ── RAF progress polling (paused during scrubbing) ────────────
  useEffect(() => {
    if (!isActive || isScrubbing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      const dur = video.duration;
      if (dur && isFinite(dur)) {
        const newProgress = video.currentTime / dur;

        // Detect loop reset (progress jumped from near-end to near-start)
        if (prevProgressRef.current > 0.95 && newProgress < 0.05) {
          setLoopReset(true);
          setTimeout(() => setLoopReset(false), 250);
        }
        prevProgressRef.current = newProgress;
        setProgress(newProgress);

        // Buffered
        if (video.buffered.length > 0) {
          setBuffered(video.buffered.end(video.buffered.length - 1) / dur);
        }

        // Loop pulse: short videos near end
        if (dur < 30) {
          setLoopPulse(dur - video.currentTime < LOOP_PULSE_WINDOW);
        }
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, isScrubbing, videoRef]);

  // ── Auto-hide back to default ─────────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setScrubState('default'), HIDE_DELAY);
  }, []);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  // ── Seek the video ────────────────────────────────────────────
  const seekTo = useCallback((fraction: number) => {
    const video = videoRef.current;
    const dur = duration ?? video?.duration;
    if (!video || !dur || !isFinite(dur)) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    video.currentTime = clamped * dur;
    setProgress(clamped);
    setTooltipTime(formatTime(clamped * dur));
  }, [videoRef, duration]);

  // ── Touch handlers ────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const bar = barRef.current;
    if (!bar || !touch) return;

    const rect = bar.getBoundingClientRect();
    const frac = (touch.clientX - rect.left) / rect.width;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      progress: frac,
    };
    lastScrubTimeRef.current = frac;

    // Pause video for scrubbing
    const video = videoRef.current;
    if (video) {
      wasPausedRef.current = video.paused;
      if (!video.paused) video.pause();
    }

    setScrubState('scrubbing');
    haptic('light');
    onScrubStart?.();
    seekTo(frac);

    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, [videoRef, seekTo, onScrubStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const bar = barRef.current;
    if (!touch || !bar) return;

    const rect = bar.getBoundingClientRect();
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Fine scrub detection
    const isFine = deltaY < FINE_SCRUB_THRESHOLD;
    setScrubState(isFine ? 'fine-scrub' : 'scrubbing');

    if (isFine) {
      // Fine scrub: 0.25× speed relative to last anchor
      const deltaX = touch.clientX - touchStartRef.current.x;
      const frac = lastScrubTimeRef.current + (deltaX / rect.width) * FINE_SCRUB_FACTOR;
      seekTo(frac);
    } else {
      // Normal 1:1 mapping
      const frac = (touch.clientX - rect.left) / rect.width;
      seekTo(frac);
      lastScrubTimeRef.current = Math.max(0, Math.min(1, frac));
    }
  }, [seekTo]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const elapsed = Date.now() - touchStartRef.current.time;
    const touch = e.changedTouches[0];
    const totalMove = touch
      ? Math.hypot(touch.clientX - touchStartRef.current.x, touch.clientY - touchStartRef.current.y)
      : 0;

    // Quick tap: seek directly without lingering in scrubbing state
    if (elapsed < 200 && totalMove < 10) {
      // Already seeked in touchStart
    }

    // Resume playback
    const video = videoRef.current;
    if (video && !wasPausedRef.current) {
      video.play().catch(() => {});
    }

    setScrubState('hover');
    onScrubEnd?.();
    scheduleHide();
  }, [videoRef, onScrubEnd, scheduleHide]);

  const barHeight = BAR_HEIGHTS[scrubState];
  const thumbSize = THUMB_SIZES[scrubState];
  const showThumb = scrubState !== 'default';
  const showTooltip = isScrubbing;

  return (
    <>
      {/* Invisible touch capture zone — fixed above bottom nav */}
      <div
        className="fixed left-0 right-0"
        style={{ bottom: 'calc(30px + var(--bottom-nav-height, 64px))', height: TOUCH_ZONE_HEIGHT, zIndex: 101 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Visual bar container — fixed above bottom nav */}
      <div
        ref={barRef}
        className="fixed left-0 right-0 pointer-events-none"
        style={{
          bottom: 'calc(30px + var(--bottom-nav-height, 64px))',
          height: barHeight,
          transition: 'height 100ms ease-out',
          zIndex: 101,
        }}
      >
        {/* Background track */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        />

        {/* Buffered range */}
        <div
          className="absolute inset-0"
          style={{
            width: `${buffered * 100}%`,
            backgroundColor: 'rgba(255,255,255,0.3)',
          }}
        />

        {/* Played progress */}
        <div
          className="absolute inset-0"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: 'rgba(255,255,255,0.8)',
            transition: loopReset
              ? 'width 200ms ease-in-out'
              : isScrubbing
                ? 'none'
                : 'width 100ms linear',
          }}
        />

        {/* Loop pulse indicator */}
        {loopPulse && (
          <div
            className="absolute right-0 top-0 bottom-0 w-4"
            style={{
              background: 'rgba(255,255,255,0.3)',
              animation: 'scrubber-loop-pulse 500ms ease-in-out infinite',
            }}
          />
        )}

        {/* Thumb */}
        {showThumb && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: thumbSize,
              height: thumbSize,
              borderRadius: '50%',
              backgroundColor: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              left: `${progress * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              transition: isScrubbing ? 'width 50ms, height 50ms' : 'all 100ms ease-out',
            }}
          />
        )}

        {/* Timestamp tooltip */}
        {showTooltip && (
          <div
            className="absolute pointer-events-none flex flex-col items-center"
            style={{
              left: `${progress * 100}%`,
              bottom: 24 + barHeight,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="px-2 py-1 rounded text-center"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontSize: 12,
                lineHeight: '16px',
                whiteSpace: 'nowrap',
              }}
            >
              {tooltipTime}
            </div>
            {scrubState === 'fine-scrub' && (
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: 2,
                }}
              >
                Fine Scrubbing
              </span>
            )}
          </div>
        )}
      </div>

    </>
  );
}
