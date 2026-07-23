import React from 'react';
import {
  APPROACH_STAGES,
  type ApproachStage,
  INK, FAINT, GREEN, TURF, PIN_RED, FONT,
} from './approachStages';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface Props {
  stage: ApproachStage;
}

export const ApproachTracker: React.FC<Props> = ({ stage }) => {
  const s = APPROACH_STAGES[stage];
  const reduced = usePrefersReducedMotion();
  const done = stage === 'done';
  const pct = Math.max(0, Math.min(1, s.pos)) * 100;
  const trans = reduced ? 'none' : 'width 800ms cubic-bezier(.22,1,.36,1)';
  const ballTrans = reduced ? 'none' : 'left 800ms cubic-bezier(.22,1,.36,1)';

  return (
    <div style={{ padding: '0 4px', fontFamily: FONT }}>
      {/* Row 1: number + unit */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: done ? GREEN : INK,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {s.number}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: FAINT,
            textTransform: 'uppercase',
          }}
        >
          {s.unit}
        </div>
      </div>

      {/* Row 2: track / fill / ball / pin */}
      <div style={{ position: 'relative', height: 34, marginTop: 14 }}>
        {/* Track */}
        <div
          style={{
            position: 'absolute',
            top: 15,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: 'rgba(15,23,42,0.07)',
          }}
        />
        {/* Fill */}
        <div
          style={{
            position: 'absolute',
            top: 15,
            left: 0,
            height: 4,
            borderRadius: 2,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${GREEN}, ${TURF})`,
            transition: trans,
          }}
        />
        {/* Pin at right */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 0,
            top: -9,
            width: 12,
            height: 32,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
          }}
        >
          <svg width="12" height="32" viewBox="0 0 12 32">
            <polygon
              points="10,2 2,6 10,10"
              fill={done ? GREEN : PIN_RED}
              style={{ transition: reduced ? 'none' : 'fill 400ms ease' }}
            />
            <rect x="9.5" y="2" width="1.6" height="30" fill={INK} />
          </svg>
        </div>
        {/* Ball */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 10,
            left: `calc(${pct}% - 7px)`,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            border: `2px solid ${INK}`,
            boxShadow: '0 2px 6px rgba(15,23,42,0.20)',
            zIndex: 2,
            transition: ballTrans,
          }}
        />
      </div>

      {/* Row 3: note */}
      <div
        key={stage}
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: GREEN,
          marginTop: 2,
          animation: reduced ? 'none' : 'wcFadeUp 450ms ease',
        }}
      >
        {s.note}
      </div>

      <style>{`
        @keyframes wcFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wcDotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: .55; } }
        @keyframes wcPopIn { 0% { transform: scale(.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ApproachTracker;
