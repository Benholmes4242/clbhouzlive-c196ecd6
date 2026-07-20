/**
 * TickerShell — shared marquee shell used by every wire ticker on the platform.
 *
 * Owns: dark background, fixed height, seamless -50% translateX loop,
 * pause-on-touch, reduced-motion swap to a plain horizontal scroller, and the
 * left-accessory slot (e.g. "TOP 10" fixed label with fade).
 *
 * Consumers own item rendering — hand it an ordered ReactNode[] and a stable
 * key function; the shell duplicates the array once and renders the loop.
 *
 * Single source of truth: WireTicker (Explore) + HeroWireTicker (Tour Hub hero)
 * both delegate here so they stay pixel-identical.
 */
import { ReactNode, useEffect, useMemo, useState } from 'react';

const STYLE_ID = 'ticker-shell-keyframes';
function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
@keyframes ticker-shell-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.ticker-shell-track {
  display: inline-flex; align-items: center; gap: var(--ticker-shell-gap, 24px);
  width: max-content;
  animation-name: ticker-shell-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-duration: var(--ticker-shell-duration, 40s);
  will-change: transform;
}
.ticker-shell-track[data-paused="true"] { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .ticker-shell-track { animation: none !important; } }
`;
  document.head.appendChild(s);
}

interface TickerShellProps {
  items: ReactNode[];
  itemKey: (index: number) => string;
  height?: number;
  background?: string;
  gap?: number;
  durationSec?: number;
  padding?: string;
  ariaLabel?: string;
  /** Fixed left slot (e.g. "TOP 10" chip). Rendered outside the scrolling track. */
  leftAccessory?: ReactNode;
  /** Optional right-edge fade colour matched to background for seamless blend. */
  edgeFadeColor?: string;
}

export function TickerShell({
  items,
  itemKey,
  height = 36,
  background = '#15171F',
  gap = 24,
  durationSec = 40,
  padding = '0 14px',
  ariaLabel,
  leftAccessory,
  edgeFadeColor,
}: TickerShellProps) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    ensureStyles();
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  const loop = useMemo(() => [...items, ...items], [items]);

  if (items.length === 0) {
    return <section style={{ background, height, width: '100%' }} aria-hidden="true" />;
  }

  const track = reduced ? (
    <div style={{ display: 'flex', alignItems: 'center', gap, padding, overflowX: 'auto', flex: 1 }}>
      {items.map((n, i) => <div key={itemKey(i)} style={{ flexShrink: 0 }}>{n}</div>)}
    </div>
  ) : (
    <div style={{ overflow: 'hidden', padding, flex: 1, position: 'relative' }}>
      <div
        className="ticker-shell-track"
        data-paused={paused || undefined}
        style={{
          ['--ticker-shell-duration' as string]: `${durationSec}s`,
          ['--ticker-shell-gap' as string]: `${gap}px`,
        }}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onTouchCancel={() => setPaused(false)}
      >
        {loop.map((n, i) => (
          <div key={`${itemKey(i % items.length)}-${i}`} style={{ flexShrink: 0 }}>{n}</div>
        ))}
      </div>
      {edgeFadeColor && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: 0, right: 0, width: 32, height: '100%',
            background: `linear-gradient(90deg, transparent 0%, ${edgeFadeColor} 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );

  return (
    <section
      style={{
        background, height, display: 'flex', alignItems: 'center',
        width: '100%', overflow: 'hidden',
      }}
      aria-label={ariaLabel}
    >
      {leftAccessory}
      {track}
    </section>
  );
}
