import * as React from 'react';
import { formatTime, prefersReducedMotion } from './time';

type Props = {
  /** current preview time (seconds) */
  time: number;
  /** is the thumbnail visible (while scrubbing) */
  visible: boolean;
  /** top/left of the *inner* video frame for positioning */
  top: number;
  left: number;
  /** whether to render left of the bar (true) or right (false) */
  alignLeft?: boolean;
  /** canvas containing the latest preview frame (optional) */
  canvas?: HTMLCanvasElement | null;
  /** total duration for mm:ss/total */
  duration?: number;
};

export function ScrubThumbnail({
  time,
  visible,
  top,
  left,
  alignLeft = false,
  canvas,
  duration = 0
}: Props) {
  const reduced = prefersReducedMotion();
  const posStyle: React.CSSProperties = {
    position: 'fixed',
    top,
    left,
    transform: `translate(${alignLeft ? '-100%' : '0'}, -50%)`,
    pointerEvents: 'none',
    zIndex: 110,
    opacity: visible ? 1 : 0,
    transition: reduced ? undefined : 'opacity 120ms ease, transform 120ms ease',
  };

  // container (frame + stroke + shadow) - Frosted White
  const frameStyle: React.CSSProperties = {
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,.35)',
    border: '1px solid rgba(255,255,255,.40)',
    overflow: 'hidden',
    width: 176,
    height: 112,
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(10px) saturate(130%)',
    WebkitBackdropFilter: 'blur(10px) saturate(130%)',
    position: 'relative',
  };

  const chipStyle: React.CSSProperties = {
    position: 'absolute',
    right: 8,
    bottom: 8,
    fontSize: 12,
    lineHeight: '18px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.95)',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: 10,
    padding: '2px 8px',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  };

  return (
    <div style={posStyle} aria-hidden={!visible}>
      <div style={frameStyle}>
        {/* Show canvas when available */}
        {canvas ? (
          <canvas
            width={canvas.width}
            height={canvas.height}
            ref={(el) => {
              if (!el || !canvas) return;
              const ctx = el.getContext('2d');
              if (!ctx) return;
              // Aspect-correct draw
              const cw = el.width;
              const ch = el.height;
              const vw = canvas.width;
              const vh = canvas.height;
              if (vw && vh) {
                const scale = Math.min(cw / vw, ch / vh);
                const dw = vw * scale;
                const dh = vh * scale;
                const dx = (cw - dw) / 2;
                const dy = (ch - dh) / 2;
                ctx.clearRect(0, 0, cw, ch);
                ctx.drawImage(canvas, 0, 0, vw, vh, dx, dy, dw, dh);
              }
            }}
            style={{ width: '100%', height: '100%', display: 'block', borderRadius: 12 }}
          />
        ) : null}

        {/* time chip */}
        <div style={chipStyle}>
          {formatTime(time)}{duration ? ` / ${formatTime(duration)}` : ''}
        </div>
      </div>
    </div>
  );
}
