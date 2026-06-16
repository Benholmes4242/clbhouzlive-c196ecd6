import { memo } from 'react';
import { Play } from 'lucide-react';

const AMBER = '#F7931E';

/**
 * ClipsMark — bespoke "short clips" identity for the Quick clips rail.
 * Two stacked rounded-square cards: back card is an amber-tint outline
 * rotated slightly counter-clockwise; front card is solid amber rotated
 * slightly clockwise with a centered white play triangle.
 */
function ClipsMarkInner() {
  return (
    <div
      style={{
        position: 'relative',
        width: 28,
        height: 28,
        flexShrink: 0,
      }}
      aria-hidden
    >
      {/* Back card — outline, tilted left */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 7,
          background: 'rgba(247,147,30,0.10)',
          border: '1.5px solid rgba(247,147,30,0.45)',
          transform: 'rotate(-8deg)',
        }}
      />
      {/* Front card — solid amber with play glyph */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 7,
          background: AMBER,
          transform: 'rotate(4deg)',
          boxShadow: '0 4px 10px -2px rgba(247,147,30,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Play size={12} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} style={{ marginLeft: 1 }} />
      </div>
    </div>
  );
}
export const ClipsMark = memo(ClipsMarkInner);

/**
 * VideosMark — dark film/tour glyph for the Latest videos rail.
 * Rounded-square with an ink→slate gradient and a centered amber play
 * triangle.
 */
function VideosMarkInner() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        flexShrink: 0,
        borderRadius: 7,
        background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 10px -2px rgba(15,23,42,0.35)',
      }}
      aria-hidden
    >
      <Play size={13} color={AMBER} fill={AMBER} strokeWidth={0} style={{ marginLeft: 1 }} />
    </div>
  );
}
export const VideosMark = memo(VideosMarkInner);
