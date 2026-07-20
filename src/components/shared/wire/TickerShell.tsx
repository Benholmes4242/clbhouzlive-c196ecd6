/**
 * TickerShell — presentation-only marquee shell shared between
 * `WireTicker` (Discover / Clubhouse wire) and `HeroWireTicker`
 * (Tour Overview hero). Zero data awareness.
 *
 * Responsibilities:
 *   - horizontal marquee (loop by duplicating items + translateX -50%)
 *   - per-instance duration variable
 *   - pause-on-press / pause-on-hover
 *   - prefers-reduced-motion → native horizontal scroll
 *   - optional fixed leading chip (kept outside the animated track)
 *   - optional top hairline divider
 *
 * Keep this file free of app-specific tokens — call sites pass their
 * own `background`, `height`, `leadingChip`, and item renderers.
 */

import React, {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

const STYLE_ID = 'lovable-wire-ticker-shell-keyframes';

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
@keyframes lovable-wire-ticker-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.lovable-wire-ticker-track {
  display: inline-flex;
  align-items: center;
  gap: var(--lovable-wire-gap, 24px);
  width: max-content;
  animation-name: lovable-wire-ticker-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-duration: var(--lovable-wire-duration, 40s);
  will-change: transform;
}
.lovable-wire-ticker-track[data-paused="true"] { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .lovable-wire-ticker-track { animation: none !important; }
}
`;
  document.head.appendChild(el);
}

export interface TickerShellProps {
  /** Ordered items rendered inside the animated track. Duplicated internally. */
  items: ReactNode[];
  /** CSS background for the shell (e.g. '#15171F'). */
  background: string;
  /** Height in px. Defaults to 36 to match the Discover wire. */
  height?: number;
  /** Gap between items in px. Defaults to 24. */
  gap?: number;
  /** Fixed non-scrolling leading chip. Rendered before the track. */
  leadingChip?: ReactNode;
  /** Optional 0.5px top hairline (rgba). */
  dividerTop?: string;
  /** aria-label for the section. */
  ariaLabel?: string;
  /** Per-item seconds of scroll travel. Defaults to 5.5s. */
  perItemSeconds?: number;
  /** Minimum total duration in seconds. Defaults to 40. */
  minDurationSeconds?: number;
  /** Optional inline style overrides for the shell. */
  style?: CSSProperties;
  /**
   * Force-disable the marquee animation. When false, items render statically
   * (still horizontally swipeable). Defaults to true.
   */
  animated?: boolean;
}

export function TickerShell({
  items,
  background,
  height = 36,
  gap = 24,
  leadingChip,
  dividerTop,
  ariaLabel,
  perItemSeconds = 5.5,
  minDurationSeconds = 40,
  style,
}: TickerShellProps) {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureStyles();
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const durationSec = useMemo(
    () => Math.max(minDurationSeconds, items.length * perItemSeconds),
    [items.length, perItemSeconds, minDurationSeconds],
  );

  // Duplicate for seamless -50% wrap.
  const looped = useMemo(() => [...items, ...items], [items]);

  if (items.length === 0) return null;

  const shellStyle: CSSProperties = {
    background,
    height,
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    overflow: 'hidden',
    borderTop: dividerTop ? `0.5px solid ${dividerTop}` : undefined,
    ...style,
  };

  const trackContainer = reducedMotion ? (
    <div
      className="flex items-center overflow-x-auto scrollbar-hide"
      style={{ gap, padding: '0 14px', flex: 1 }}
    >
      {items.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  ) : (
    <div style={{ overflow: 'hidden', padding: '0 14px', flex: 1, display: 'flex', alignItems: 'center' }}>
      <div
        ref={trackRef}
        className="lovable-wire-ticker-track"
        data-paused={paused || undefined}
        style={{
          ['--lovable-wire-duration' as string]: `${durationSec}s`,
          ['--lovable-wire-gap' as string]: `${gap}px`,
        }}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onTouchCancel={() => setPaused(false)}
      >
        {looped.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <section style={shellStyle} aria-label={ariaLabel}>
      {leadingChip}
      {trackContainer}
    </section>
  );
}

export default TickerShell;
