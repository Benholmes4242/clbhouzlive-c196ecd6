import { memo } from 'react';
import { Trophy, Crown, Flame, UsersRound, Mountain, AudioLines, MapPin } from 'lucide-react';

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

/** Best of the best — lucide Flame. */
export const FlameMark = memo(function FlameMark() {
  return (
    <div style={amberTile}>
      <Flame size={18} color="#fff" strokeWidth={2.2} aria-hidden />
    </div>
  );
});

/** Your friends — lucide UsersRound. */
export const LinkedRingsMark = memo(function LinkedRingsMark() {
  return (
    <div style={amberTile}>
      <UsersRound size={18} color="#fff" strokeWidth={2.2} aria-hidden />
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

/** Toughest courses — lucide Mountain (ink tile). */
export const MountainMark = memo(function MountainMark() {
  return (
    <div style={inkTile}>
      <Mountain size={18} color="#fff" strokeWidth={2.2} aria-hidden />
    </div>
  );
});

/** Echo concierge — lucide AudioLines. */
export const WaveformMark = memo(function WaveformMark() {
  return (
    <div style={amberTile}>
      <AudioLines size={18} color="#fff" strokeWidth={2.2} aria-hidden />
    </div>
  );
});

/** Destinations — lucide MapPin. */
export const PinMark = memo(function PinMark() {
  return (
    <div style={amberTile}>
      <MapPin size={18} color="#fff" strokeWidth={2.2} aria-hidden />
    </div>
  );
});
