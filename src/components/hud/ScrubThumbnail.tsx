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

  // container (frame + stroke + shadow)
  const frameStyle: React.CSSProperties = {
    borderRadius: 14,
    boxShadow: '0 6px 14px rgba(0,0,0,.25)',
    outline: '1px solid rgba(255,255,255,.12)',
    overflow: 'hidden',
    width: 'clamp(96px, 28vw, 128px)',
    aspectRatio: '16 / 9',
    background: 'black',
    position: 'relative',
  };

  const chipStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    bottom: 6,
    transform: 'translateX(-50%)',
    fontSize: 12,
    fontWeight: 600,
    color: 'white',
    background: 'rgba(18,18,18,.72)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 10,
    padding: '4px 8px',
    lineHeight: 1,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };

  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 14,
    boxShadow: 'inset 0 0 0 2px rgba(159,214,194,.7)' /* Frosted Aqua edge */,
    pointerEvents: 'none',
  };

  return (
    <div style={posStyle} aria-hidden={!visible}>
      <div style={frameStyle}>
        {/* Show canvas when available (no flicker) */}
        {canvas ? (
          <canvas
            width={canvas.width}
            height={canvas.height}
            ref={(el) => {
              if (!el || !canvas) return;
              const ctx = el.getContext('2d');
              if (!ctx) return;
              // draw the latest captured frame
              ctx.clearRect(0, 0, el.width, el.height);
              ctx.drawImage(canvas, 0, 0, el.width, el.height);
            }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        ) : null}

        {/* progress ring (subtle) */}
        <div style={ringStyle} />

        {/* time chip */}
        <div style={chipStyle}>
          {formatTime(time)}{duration ? ` / ${formatTime(duration)}` : ''}
        </div>
      </div>
    </div>
  );
}
