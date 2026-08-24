/**
 * PostRoundShell — the waiting state for a post's attached scorecard block
 * (BRIEF_CLUBHOUSE_ROUND_POP_IN).
 *
 * A post whose round has not landed yet renders THIS in the space the
 * scorecard will occupy, so the card never paints complete-looking-but-wrong
 * and never jumps when the round arrives.
 *
 * Height parity is structural, not numeric: this file mirrors PostRoundCard's
 * element tree, paddings, font sizes and the trajectory svg's viewBox, so the
 * two block heights track each other at every viewport width (measured 411px
 * at 390px wide — the with-holes case, which is ~95% of rounds).
 */
import React from 'react';

const HAIRLINE = 'rgba(255,255,255,0.08)';
const BAR = 'rgba(255,255,255,0.09)';
const BAR_SOFT = 'rgba(255,255,255,0.06)';

const bar = (width: number | string, tone: string = BAR): React.CSSProperties => ({
  display: 'inline-block',
  width,
  background: tone,
  borderRadius: 3,
  color: 'transparent',
  verticalAlign: 'baseline',
});

/** Inline placeholder that inherits the real line box for the given font size. */
const Line: React.FC<{ size: number; width: number | string; tone?: string }> = ({
  size,
  width,
  tone,
}) => (
  <span style={{ fontSize: size, fontWeight: 700, lineHeight: size === 34 ? 1 : undefined }}>
    <span style={bar(width, tone)}>&nbsp;</span>
  </span>
);

const NineShell: React.FC = () => (
  <div style={{ marginTop: 12 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}
    >
      <Line size={11} width={26} />
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <Line size={13.5} width={20} />
        <Line size={12} width={16} />
      </span>
    </div>
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Each placeholder owns its own line box, which is what makes the
              hole-number and par rows the same height as the real card's.
              Do NOT give these an explicit height — measured, it costs 33px. */}
          <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>
            <span style={bar(7, BAR_SOFT)}>&nbsp;</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>
            <span style={bar(7, BAR_SOFT)}>&nbsp;</span>
          </span>
          <div style={{ width: 27, height: 27, borderRadius: 999, background: BAR_SOFT }} />
        </div>
      ))}
    </div>
  </div>
);

export const PostRoundShell: React.FC = () => (
  <div aria-hidden style={{ background: 'transparent' }}>
    <div style={{ position: 'relative' }}>
      <div
        style={{
          background: 'transparent',
                padding: '14px 14px 16px',
        }}
      >
        {/* Date kicker */}
        <div>
          <Line size={11} width={82} />
        </div>

        {/* Course + score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 6,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div>
              <Line size={16} width="62%" />
            </div>
            <div style={{ marginTop: 2 }}>
              <Line size={11.5} width="42%" tone={BAR_SOFT} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexShrink: 0 }}>
            <Line size={34} width={48} />
            <Line size={15} width={22} tone={BAR_SOFT} />
          </div>
        </div>

        {/* Par / slope / index strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
          <Line size={11} width={46} tone={BAR_SOFT} />
          <Line size={11} width={54} tone={BAR_SOFT} />
          <span style={{ marginLeft: 'auto' }}>
            <Line size={11} width={58} tone={BAR_SOFT} />
          </span>
        </div>

        {/* Trajectory — same viewBox, so the height tracks width identically */}
        <div
          style={{
            marginTop: 12,
            borderRadius: 14,
            padding: '12px 14px 10px',
            border: `1px solid ${HAIRLINE}`,
            background: 'rgba(11,13,16,0.66)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Line size={11} width={62} />
            <Line size={12} width={18} tone={BAR_SOFT} />
          </div>
          <svg width="100%" viewBox="0 0 320 74" style={{ display: 'block' }} aria-hidden>
            <line
              x1={5}
              x2={315}
              y1={37}
              y2={37}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          </svg>
        </div>

        <NineShell />
        <NineShell />
      </div>
    </div>
  </div>
);

export default PostRoundShell;
