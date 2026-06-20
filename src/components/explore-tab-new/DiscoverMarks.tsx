import { memo } from 'react';
import { Trophy, Crown } from 'lucide-react';

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

/** Best of the best — clean teardrop flame with inner curl. */
export const FlameMark = memo(function FlameMark() {
  return (
    <div style={amberTile}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 2 C12 5 9.5 6.5 8.5 9 C7.5 11.3 8 13.5 9.2 15 C9 13.5 9.8 12.2 11 11.5 C10.7 13 11.3 14 12.2 14.8 C13.4 13.9 14 12.4 14 11 C15 12 15.6 13.4 15.5 15 C16.8 13.4 17.2 11 16.3 8.8 C15.2 6 13 5 12 2 Z"
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

/** Latest records — lucide Trophy (matches card badge). */
export const TrophyMark = memo(function TrophyMark() {
  return (
    <div style={amberTile}>
      <Trophy size={18} color="#fff" strokeWidth={2.2} aria-hidden />
    </div>
  );
});

/** Titles within reach — lucide Crown (matches card badge). */
export const CrownMark = memo(function CrownMark() {
  return (
    <div style={amberTile}>
      <Crown size={18} color="#fff" strokeWidth={2.2} aria-hidden />
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
