import React, { useState } from 'react';
import { Info } from 'lucide-react';
import type { WhsScore } from '@/lib/whs/types';
import { predictHandicap, VERDICT_META } from './predictHandicap';

interface Props {
  scores: WhsScore[];
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  hairline: 'rgba(15,23,42,0.08)',
  cardBg: '#FFFFFF',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  green: '#059669',
  greenInk: '#065F46',
  greenTint: 'rgba(5,150,105,0.10)',
  red: '#9F1D1D',
  redInk: '#7F1D1D',
  redTint: 'rgba(159,29,29,0.10)',
  slate: '#475569',
  slateInk: '#334155',
  slateTint: 'rgba(15,23,42,0.04)',
  neutralTint: 'rgba(15,23,42,0.04)',
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
  const [showInfo, setShowInfo] = useState(false);
  const prediction = predictHandicap(scores);
  const meta = VERDICT_META[prediction.verdict];
  const theme = THEMES[meta.theme];

  if (prediction.insufficientData) {
    return (
      <div style={SECTION_STYLE}>
        <CardHeader showInfo={showInfo} onToggleInfo={() => setShowInfo((v) => !v)} />
        {showInfo && <InfoPanel />}
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

  const arrow =
    prediction.direction === 'down' ? '↓' : prediction.direction === 'up' ? '↑' : '→';

  const curve = curveFor(prediction.direction);

  return (
    <div style={SECTION_STYLE}>
      <CardHeader showInfo={showInfo} onToggleInfo={() => setShowInfo((v) => !v)} />
      {showInfo && <InfoPanel />}

      {/* DUAL-PANEL: Where you are / Heading to */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          margin: '0 20px',
          borderTop: `1px solid ${T.hairline}`,
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        {/* LEFT — WHERE YOU ARE */}
        <div style={{ padding: '18px 16px 14px', position: 'relative', borderRight: `1px solid ${T.hairline}` }}>
          <p style={{
            margin: 0,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: T.inkMute,
            fontFamily: FONT,
          }}>
            Where you are
          </p>
          <p style={{
            margin: '10px 0 0',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.10em',
            color: theme.accentInk,
            textTransform: 'uppercase',
            fontFamily: FONT,
          }}>
            {meta.label}
          </p>
          <p style={{
            margin: '4px 0 0',
            fontSize: 32,
            fontWeight: 800,
            color: T.ink,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: FONT,
          }}>
            {prediction.current !== null ? prediction.current.toFixed(1) : '—'}
          </p>
          <p style={{
            margin: '6px 0 0',
            fontSize: 11,
            color: T.inkMute,
            fontWeight: 500,
            fontFamily: FONT,
          }}>
            Today's index
          </p>
        </div>

        {/* RIGHT — HEADING TO */}
        <div style={{ padding: '18px 16px 14px' }}>
          <p style={{
            margin: 0,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: theme.accentInk,
            fontFamily: FONT,
          }}>
            Heading to
          </p>
          <div style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}>
            <span style={{
              fontSize: 32,
              fontWeight: 800,
              color: theme.accentInk,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: FONT,
            }}>
              {prediction.projected !== null ? prediction.projected.toFixed(1) : '—'}
            </span>
            {prediction.delta > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '3px 8px',
                  background: theme.headerBg,
                  borderRadius: 99,
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: theme.accentInk,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                  fontFamily: FONT,
                }}
              >
                {arrow} {prediction.delta.toFixed(1)}
              </span>
            )}
          </div>
          <p style={{
            margin: '6px 0 0',
            fontSize: 11,
            color: T.inkMute,
            fontWeight: 500,
            fontFamily: FONT,
          }}>
            {prediction.direction === 'flat' ? 'If form holds · 5 rounds' : 'If form continues · 5 rounds'}
          </p>
        </div>
      </div>

      {/* SHARED CONVERGENCE CHART */}
      <div
        style={{
          padding: '6px 16px 14px',
          borderTop: `0.5px solid ${T.hairline}`,
          background: 'rgba(247,250,252,0.5)',
        }}
      >
        <svg
          viewBox="0 0 320 110"
          width="100%"
          height={110}
          preserveAspectRatio="none"
          style={{ display: 'block', overflow: 'visible' }}
          role="img"
          aria-label={`Handicap timeline showing past trajectory and projected ${prediction.direction} movement`}
        >
          <line
            x1="160" x2="160" y1="14" y2="84"
            stroke="rgba(15,23,42,0.15)"
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
            strokeWidth={2.4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="12" cy={curve.pastY1} r="3" fill={T.inkMute} />
          <circle cx="80" cy={curve.pastY2} r="3" fill={T.inkMute} />
          <circle cx="160" cy={curve.pastY3} r="5" fill="#FFFFFF" stroke={T.ink} strokeWidth={2} />
          <circle cx="240" cy={curve.futureY2} r="3" fill={theme.accent} />
          <circle cx="308" cy={curve.futureY3} r="6" fill={theme.accent} stroke="#FFFFFF" strokeWidth={2} />
          <text
            x="12" y="102"
            textAnchor="start"
            style={{ fontSize: 10, fontWeight: 600, fill: T.inkMute, fontFamily: FONT }}
          >
            90 days ago
          </text>
          <text
            x="308" y="102"
            textAnchor="end"
            style={{ fontSize: 10, fontWeight: 700, fill: theme.accentInk, fontFamily: FONT }}
          >
            5 rounds out
          </text>
        </svg>
      </div>

      <div
        style={{
          padding: '12px 16px 14px',
          borderTop: `1px solid ${T.hairline}`,
          background: 'rgba(15,23,42,0.02)',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: T.ink, fontFamily: FONT }}>
          {prediction.recentFormAvg !== null && prediction.countersAvg !== null
            ? meta.why(prediction.recentFormAvg, prediction.countersAvg)
            : ''}
        </p>
      </div>
    </div>
  );
};

const CARD_STYLE: React.CSSProperties = {
  background: T.cardBg,
  borderRadius: 16,
  border: `1px solid ${T.hairline}`,
  marginBottom: 14,
  overflow: 'hidden',
  fontFamily: FONT,
};

interface CardHeaderProps {
  showInfo: boolean;
  onToggleInfo: () => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({ showInfo, onToggleInfo }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: `1px solid ${T.hairline}`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: T.amberTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Activity size={15} color={T.amberDeep} strokeWidth={2.2} />
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: T.ink,
            letterSpacing: '-0.01em',
            fontFamily: FONT,
          }}
        >
          Handicap Projection
        </p>
        <p style={{ margin: 0, fontSize: 10, color: T.inkMute, marginTop: 1, fontFamily: FONT }}>
          Based on your last 5 rounds
        </p>
      </div>
    </div>
    <button
      onClick={onToggleInfo}
      aria-label={showInfo ? 'Hide info' : 'Show info'}
      aria-expanded={showInfo}
      style={{
        width: 26,
        height: 26,
        borderRadius: 999,
        border: `1px solid ${showInfo ? T.ink : T.hairline}`,
        background: showInfo ? T.ink : 'transparent',
        color: showInfo ? '#fff' : T.inkMute,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <Info size={13} strokeWidth={2.2} />
    </button>
  </div>
);

const InfoPanel: React.FC = () => (
  <div
    style={{
      margin: '14px 16px 0',
      padding: '12px 14px',
      background: T.neutralTint,
      border: `1px solid ${T.hairline}`,
      borderRadius: 10,
    }}
  >
    <p
      style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 800,
        color: T.ink,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 6,
        fontFamily: FONT,
      }}
    >
      How this works
    </p>
    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: T.inkSoft, fontFamily: FONT }}>
      Your <strong>differential</strong> is each round's score adjusted for course difficulty.
      Lower is better. Your <strong>handicap</strong> is the average of your best 8 differentials
      from your last 20 rounds — those are your <strong>counters</strong>. The{' '}
      <strong>projection</strong> simulates 5 more rounds at your recent average and recomputes
      your handicap.
    </p>
  </div>
);

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
