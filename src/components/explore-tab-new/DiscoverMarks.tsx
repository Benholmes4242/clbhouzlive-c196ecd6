import { memo } from 'react';

const AMBER = '#F7931E';
const AMBER_SHADOW = '0 4px 10px -2px rgba(247,147,30,0.40)';
const INK_GRADIENT = 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)';
const INK_SHADOW = '0 4px 10px -2px rgba(15,23,42,0.30)';

const TILE: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const amberTile: React.CSSProperties = { ...TILE, background: AMBER, boxShadow: AMBER_SHADOW };
const inkTile: React.CSSProperties = { ...TILE, background: INK_GRADIENT, boxShadow: INK_SHADOW };

/** Best of the best — flame. */
export const FlameMark = memo(function FlameMark() {
  return (
    <div style={amberTile}>
      <svg width="18" height="18" viewBox="0 0 30 30" fill="none" aria-hidden>
        <path
          d="M15 3 C12 8 9 9 9 15 a6 6 0 0 0 12 0 c0-4-3-6-3-9 -2 2-3 4-3 6 -1-2-1-4 0-9 Z"
          fill="#fff"
        />
      </svg>
    </div>
  );
});

/** Your friends — two interlocking rings. */
export const LinkedRingsMark = memo(function LinkedRingsMark() {
  return (
    <div style={amberTile}>
      <svg width="20" height="20" viewBox="0 0 30 30" fill="none" aria-hidden>
        <circle cx="12" cy="15" r="6" fill="none" stroke="#fff" strokeWidth="2.2" />
        <circle cx="18" cy="15" r="6" fill="none" stroke="#fff" strokeWidth="2.2" opacity="0.85" />
      </svg>
    </div>
  );
});

/** Latest records — ribbon seal (medal disc + tails). */
export const RibbonSealMark = memo(function RibbonSealMark() {
  return (
    <div style={amberTile}>
      <svg width="20" height="20" viewBox="0 0 30 30" fill="none" aria-hidden>
        <path d="M11 16 l-1 10 5-3 5 3 -1-10" fill="#fff" opacity="0.85" />
        <circle cx="15" cy="12" r="7" fill="#fff" />
      </svg>
    </div>
  );
});

/** Titles within your reach — tall, elegant trophy outline. */
export const TrophyMark = memo(function TrophyMark() {
  return (
    <div style={amberTile}>
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden>
        <path
          d="M17 7 h14 v8 a7 7 0 0 1 -14 0 Z"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M17 9 h-4.5 a4.5 4.5 0 0 0 5 9 M31 9 h4.5 a4.5 4.5 0 0 1 -5 9"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
        />
        <path
          d="M24 22 v8 M18 38 h12 M20 38 l1-6 h6 l1 6"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
});

/** Toughest courses — ink tile, white mountain peak. */
export const MountainMark = memo(function MountainMark() {
  return (
    <div style={inkTile}>
      <svg width="20" height="20" viewBox="0 0 30 30" fill="none" aria-hidden>
        <path d="M3 24 L11 9 L16 18 L20 12 L27 24 Z" fill="#fff" />
      </svg>
    </div>
  );
});

/** Echo concierge — waveform bars. */
export const WaveformMark = memo(function WaveformMark() {
  return (
    <div style={amberTile}>
      <svg width="20" height="20" viewBox="0 0 30 30" fill="none" aria-hidden>
        <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
          <path d="M8 12 v6" />
          <path d="M13 8 v14" />
          <path d="M17 5 v20" />
          <path d="M22 10 v10" />
        </g>
      </svg>
    </div>
  );
});

/** Destinations — pin teardrop with hole punched to amber. */
export const PinMark = memo(function PinMark() {
  return (
    <div style={amberTile}>
      <svg width="20" height="20" viewBox="0 0 30 30" fill="none" aria-hidden>
        <path
          d="M15 3 a8 8 0 0 1 8 8 c0 6-8 16-8 16 S7 17 7 11 a8 8 0 0 1 8-8 Z"
          fill="#fff"
        />
        <circle cx="15" cy="11" r="3" fill={AMBER} />
      </svg>
    </div>
  );
});
