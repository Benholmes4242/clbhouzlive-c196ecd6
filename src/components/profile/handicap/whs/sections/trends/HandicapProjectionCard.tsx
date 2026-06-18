import React from 'react';
import type { WhsScore } from '@/lib/whs/types';
import { predictHandicap, VERDICT_META } from './predictHandicap';

interface Props {
  scores: WhsScore[];
}

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkSoft: 'var(--hcp-t-80)',
  hairline: 'var(--hcp-line-2)',
  cardBg: 'var(--hcp-bg-1)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  green: '#059669',
  greenInk: '#065F46',
  greenTint: 'rgba(5,150,105,0.10)',
  red: '#9F1D1D',
  redInk: '#7F1D1D',
  redTint: 'rgba(159,29,29,0.10)',
  slate: 'var(--hcp-t-80)',
  slateInk: '#334155',
  slateTint: 'var(--hcp-bg-2)',
  neutralTint: 'var(--hcp-bg-2)',
  hotRed: '#DC2626',
  hotRedInk: '#991B1B',
  hotRedTint: 'rgba(220,38,38,0.10)',
  coldBlue: '#0EA5E9',
  coldBlueInk: '#0369A1',
  coldBlueTint: 'rgba(14,165,233,0.10)',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Theme {
  headerBg: string;
  headerBorder: string;
  headerInk: string;
  accent: string;
  accentInk: string;
}

const THEMES: Record<'positive' | 'neutral' | 'negative', Theme> = {
  positive: {
    headerBg: T.hotRedTint,
    headerBorder: 'rgba(220,38,38,0.20)',
    headerInk: T.hotRedInk,
    accent: T.hotRed,
    accentInk: T.hotRedInk,
  },
  neutral: {
    headerBg: T.slateTint,
    headerBorder: T.hairline,
    headerInk: T.ink,
    accent: T.slate,
    accentInk: T.slateInk,
  },
  negative: {
    headerBg: T.coldBlueTint,
    headerBorder: 'rgba(14,165,233,0.20)',
    headerInk: T.coldBlueInk,
    accent: T.coldBlue,
    accentInk: T.coldBlueInk,
  },
};

export const HandicapProjectionCard: React.FC<Props> = ({ scores }) => {
  const prediction = predictHandicap(scores);
  const meta = VERDICT_META[prediction.verdict];
  const theme = THEMES[meta.theme];

  if (prediction.insufficientData) {
    return (
      <div style={SECTION_STYLE}>
        <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
            Add a few more rounds
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
            We need at least 8 rounds to compute a handicap and a projection. You have {prediction.totalRounds} so far.
          </p>
        </div>
      </div>
    );
  }

  const curve = curveFor(prediction.direction);

  return (
    <div style={SECTION_STYLE}>
      <div style={{ padding: '0 20px' }}>
        {/* CHART CARD with verdict halo */}
        <div
          style={{
            position: 'relative',
            padding: '20px 16px 16px',
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line-2)',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          {/* Verdict halo backdrop */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -40,
              top: -20,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background:
                meta.theme === 'positive'
                  ? 'radial-gradient(circle, rgba(220, 38, 38, 0.10), transparent 70%)'
                  : meta.theme === 'negative'
                    ? 'radial-gradient(circle, rgba(14, 165, 233, 0.10), transparent 70%)'
                    : 'radial-gradient(circle, var(--hcp-bg-2), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* SHARED CONVERGENCE CHART */}
          <svg
            viewBox="0 0 320 110"
            width="100%"
            height={110}
            preserveAspectRatio="none"
            style={{ display: 'block', overflow: 'visible', position: 'relative' }}
            role="img"
            aria-label={`Handicap timeline showing past trajectory and projected ${prediction.direction} movement`}
          >
            <line
              x1="160" x2="160" y1="14" y2="84"
              stroke="var(--hcp-t-20)"
              strokeWidth={1}
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x="160" y="10"
              textAnchor="middle"
              style={{
                fontSize: 9,
                fontWeight: 800,
                fill: T.inkMute,
                letterSpacing: '0.10em',
                fontFamily: FONT,
              }}
            >
              TODAY
            </text>
            <path
              d={`M 12 ${curve.pastY1} Q 50 ${(curve.pastY1 + curve.pastY2) / 2}, 80 ${curve.pastY2} T 160 ${curve.pastY3}`}
              fill="none"
              stroke={T.inkMute}
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M 160 ${curve.pastY3} Q 200 ${(curve.pastY3 + curve.futureY2) / 2}, 240 ${curve.futureY2} T 308 ${curve.futureY3}`}
              fill="none"
              stroke={theme.accent}
              strokeWidth={2.6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="12" cy={curve.pastY1} r="3" fill={T.inkMute} />
            <circle cx="80" cy={curve.pastY2} r="3" fill={T.inkMute} />
            <circle cx="160" cy={curve.pastY3} r="5" fill={T.cardBg} stroke={T.ink} strokeWidth={2} />
            <circle cx="240" cy={curve.futureY2} r="3" fill={theme.accent} />
            <circle cx="308" cy={curve.futureY3} r="6" fill={theme.accent} stroke={T.cardBg} strokeWidth={2} />
            {prediction.direction === 'up' && (
              <text
                x="12" y="20"
                textAnchor="start"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fill: T.inkMute,
                  letterSpacing: '0.10em',
                  fontFamily: FONT,
                  opacity: 0.85,
                }}
              >
                ↑ HIGHER = WORSE FORM
              </text>
            )}
            {prediction.direction === 'down' && (
              <text
                x="12" y="20"
                textAnchor="start"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fill: T.inkMute,
                  letterSpacing: '0.10em',
                  fontFamily: FONT,
                  opacity: 0.85,
                }}
              >
                ↓ LOWER = BETTER FORM
              </text>
            )}
          </svg>
          {/* Bigger endpoint labels below the chart */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginTop: 12,
              position: 'relative',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: T.ink,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  fontFamily: FONT,
                }}
              >
                {prediction.current !== null ? prediction.current.toFixed(1) : '—'}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: T.inkMute,
                  marginTop: 4,
                  fontFamily: FONT,
                }}
              >
                90 days ago
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: theme.accentInk,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  fontFamily: FONT,
                }}
              >
                {prediction.projected !== null ? prediction.projected.toFixed(1) : '—'}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: theme.accentInk,
                  marginTop: 4,
                  fontFamily: FONT,
                }}
              >
                Projected
              </div>
            </div>
          </div>
        </div>
        {/* The "why" prose paragraph */}
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.55,
            color: T.ink,
            fontFamily: FONT,
          }}
        >
          {prediction.recentFormAvg !== null && prediction.countersAvg !== null
            ? meta.why(prediction.recentFormAvg, prediction.countersAvg)
            : ''}
        </p>
      </div>
    </div>
  );
};



const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 28,
  fontFamily: FONT,
};

interface CurveCoords {
  pastY1: number;
  pastY2: number;
  pastY3: number;
  futureY2: number;
  futureY3: number;
}

function curveFor(direction: 'down' | 'up' | 'flat'): CurveCoords {
  switch (direction) {
    // SVG y-axis is inverted (y=0 at top). Chart shows handicap VALUE, so:
    // - 'down' (handicap dropping = good) must slope downward on screen → larger y values
    // - 'up'   (handicap rising  = bad)  must slope upward   on screen → smaller y values
    case 'down':
      return { pastY1: 42, pastY2: 50, pastY3: 55, futureY2: 65, futureY3: 78 };
    case 'up':
      return { pastY1: 70, pastY2: 60, pastY3: 55, futureY2: 42, futureY3: 32 };
    case 'flat':
    default:
      return { pastY1: 58, pastY2: 56, pastY3: 55, futureY2: 55, futureY3: 56 };
  }
}

export default HandicapProjectionCard;
