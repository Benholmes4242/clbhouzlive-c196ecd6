/**
 * HeartBurst — brand-amber heart overlay for double-tap-to-like.
 *
 * Renders centered on the media surface, springs 0 -> 1.2 -> 1 with fade,
 * unmounts itself after ~600ms via `onDone`. `pointer-events: none` so it
 * never blocks a subsequent tap.
 *
 * Reduced-motion: shows a brief static heart (no scale) but still fires
 * `onDone` on the same schedule.
 */
import React, { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const AMBER = '#F7931E';
const LIFETIME_MS = 600;

interface Props {
  onDone: () => void;
}

export const HeartBurst: React.FC<Props> = ({ onDone }) => {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, LIFETIME_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    >
      <Heart
        size={112}
        color={AMBER}
        fill={AMBER}
        strokeWidth={1}
        style={{
          filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.35))',
          animation: reduced
            ? 'heartburst-static 600ms ease-out forwards'
            : 'heartburst-pop 600ms cubic-bezier(0.2, 1.4, 0.3, 1) forwards',
        }}
      />
      <style>{`
        @keyframes heartburst-pop {
          0%   { transform: scale(0);   opacity: 0; }
          30%  { transform: scale(1.2); opacity: 1; }
          60%  { transform: scale(1);   opacity: 1; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes heartburst-static {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

HeartBurst.displayName = 'HeartBurst';
