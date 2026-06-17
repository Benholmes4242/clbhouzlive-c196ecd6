import { memo } from 'react';
import { Trophy } from 'lucide-react';

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

/** Titles within reach — three ascending bars (podium/climb). */
export const ReachMark = memo(function ReachMark() {
  return (
    <div style={{ ...TILE, background: AMBER, boxShadow: AMBER_SHADOW }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
          height: 16,
        }}
      >
        <div style={{ width: 4, height: 8, background: 'rgba(255,255,255,0.55)', borderRadius: 1 }} />
        <div style={{ width: 4, height: 16, background: 'rgba(255,255,255,1)', borderRadius: 1 }} />
        <div style={{ width: 4, height: 12, background: 'rgba(255,255,255,0.75)', borderRadius: 1 }} />
      </div>
    </div>
  );
});

/** Latest records — ringed disc with a star (medal). */
export const RecordsMark = memo(function RecordsMark() {
  return (
    <div style={{ ...TILE, background: AMBER, boxShadow: AMBER_SHADOW }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M12 2l2.9 6.9L22 9.6l-5.4 4.7L18.2 22 12 18.3 5.8 22l1.6-7.7L2 9.6l7.1-.7L12 2z" />
        </svg>
      </div>
    </div>
  );
});

/** Toughest courses — dark tile with amber summit peak. */
export const ToughestMark = memo(function ToughestMark() {
  return (
    <div style={{ ...TILE, background: INK_GRADIENT, boxShadow: INK_SHADOW }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 20 L9 9 L13 15 L16 11 L21 20 Z"
          fill={AMBER}
          stroke={AMBER}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="6" r="1.6" fill={AMBER} />
      </svg>
    </div>
  );
});
