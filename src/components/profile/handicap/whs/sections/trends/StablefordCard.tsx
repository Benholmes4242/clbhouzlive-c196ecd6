import React, { useState } from 'react';
import { Target, Info } from 'lucide-react';
import type { WhsScore } from '@/lib/whs/types';
import { computeStablefordDistribution, type StablefordDistribution } from './computeStablefordDistribution';
import StablefordDetailSheet from './StablefordDetailSheet';

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
  amberInk: '#854F0B',
  green: '#22C55E',
  greenInk: '#15803D',
  red: '#DC2626',
  redInk: '#991B1B',
  ringTrack: 'rgba(15,23,42,0.06)',
  neutralTint: 'rgba(15,23,42,0.04)',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const CARD_STYLE: React.CSSProperties = {
  background: T.cardBg,
  borderRadius: 16,
  border: `1px solid ${T.hairline}`,
  marginBottom: 14,
  overflow: 'hidden',
  fontFamily: FONT,
};

export const StablefordCard: React.FC<Props> = ({ scores }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const dist = computeStablefordDistribution(scores);

  if (dist.insufficientData) {
    return (
      <div style={CARD_STYLE}>
        <CardHeader onOpenSheet={() => setSheetOpen(true)} />
        <div style={{ padding: '24px 16px 28px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
            Add a few more rounds
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
            We need at least 3 rounds with Stableford to show your distribution. You have {dist.total} so far.
          </p>
        </div>
        <StablefordDetailSheet open={sheetOpen} onClose={() => setSheetOpen(false)} dist={dist} />
      </div>
    );
  }

  return (
    <div style={CARD_STYLE}>
      <CardHeader onOpenSheet={() => setSheetOpen(true)} />

      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px 4px' }}>
        <TriRing dist={dist} size={200} stroke={14} />
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', padding: '0 4px 8px' }}>
        <StatColumn
          color={T.green}
          ink={T.greenInk}
          label="IN THE ZONE"
          count={dist.inZoneCount}
          pctText={`${dist.inZonePct}% of rounds`}
          range="36+ pts"
        />
        <StatDivider />
        <StatColumn
          color={T.amber}
          ink={T.amberInk}
          label="SOLID ROUND"
          count={dist.solidCount}
          pctText={`${dist.solidPct}% of rounds`}
          range="33-35 pts"
        />
        <StatDivider />
        <StatColumn
          color={T.red}
          ink={T.redInk}
          label="OFF DAY"
          count={dist.offDayCount}
          pctText={`${dist.offDayPct}% of rounds`}
          range="< 33 pts"
        />
      </div>

      {(() => {
        const total = dist.inZoneCount + dist.solidCount + dist.offDayCount;
        if (total < 5) return null;
        const zonePct = (dist.inZoneCount / total) * 100;
        const solidPct = (dist.solidCount / total) * 100;
        const offPct = (dist.offDayCount / total) * 100;

        let headline = '';
        let body = '';
        if (offPct >= 40) {
          headline = 'Your floor needs work.';
          body = `${Math.round(offPct)}% off-day rounds is dragging your average — fewer disasters lifts your handicap faster than more peaks.`;
        } else if (zonePct >= 40) {
          headline = 'You score well consistently.';
          body = `${Math.round(zonePct)}% zone rounds — when you play, you tend to deliver. Your handicap reflects your strong games.`;
        } else if (solidPct >= 40) {
          headline = 'Solid is your default.';
          body = `${Math.round(solidPct)}% solid rounds — your typical game is reliable. Pushing into the zone more often will start to lower your handicap.`;
        } else {
          headline = 'Your scoring is variable.';
          body = 'Your rounds are spread across all three brackets — consistency is the next step toward lowering your handicap.';
        }
        return (
          <div
            style={{
              margin: '4px 16px 16px',
              padding: '10px 12px',
              background: T.neutralTint,
              borderRadius: 10,
            }}
          >
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.inkSoft, fontFamily: FONT }}>
              <span style={{ fontWeight: 700, color: T.ink }}>{headline}</span> {body}
            </p>
          </div>
        );
      })()}

      <StablefordDetailSheet open={sheetOpen} onClose={() => setSheetOpen(false)} dist={dist} />
    </div>
  );
};

interface CardHeaderProps {
  onOpenSheet: () => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({ onOpenSheet }) => (
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
        <Target size={15} color={T.amberDeep} strokeWidth={2.2} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em', fontFamily: FONT }}>
          Stableford Points
        </p>
        <p style={{ margin: 0, fontSize: 10, color: T.inkMute, marginTop: 1, fontFamily: FONT }}>
          How you&apos;re scoring on points over your last 20 rounds
        </p>
      </div>
    </div>
    <button
      onClick={onOpenSheet}
      aria-label="Open Stableford detail sheet"
      style={{
        width: 26,
        height: 26,
        borderRadius: 999,
        border: `1px solid ${T.hairline}`,
        background: 'transparent',
        color: T.inkMute,
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

interface TriRingProps {
  dist: StablefordDistribution;
  size: number;
  stroke: number;
}

const TriRing: React.FC<TriRingProps> = ({ dist, size, stroke }) => {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const inZoneLen = (dist.inZoneCount / dist.total) * circumference;
  const solidLen = (dist.solidCount / dist.total) * circumference;
  const offDayLen = (dist.offDayCount / dist.total) * circumference;

  let cursor = 0;
  const segments: { color: string; length: number; offset: number }[] = [];
  if (dist.inZoneCount > 0) {
    segments.push({ color: T.green, length: inZoneLen, offset: cursor });
    cursor += inZoneLen;
  }
  if (dist.solidCount > 0) {
    segments.push({ color: T.amber, length: solidLen, offset: cursor });
    cursor += solidLen;
  }
  if (dist.offDayCount > 0) {
    segments.push({ color: T.red, length: offDayLen, offset: cursor });
    cursor += offDayLen;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Stableford distribution ring: ${dist.inZoneCount} in the zone, ${dist.solidCount} solid, ${dist.offDayCount} off days`}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.ringTrack} strokeWidth={stroke} />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${seg.length} ${circumference - seg.length}`}
          strokeDashoffset={-seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: T.inkMute, letterSpacing: '0.14em', fontFamily: FONT }}
      >
        AVG
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        style={{
          fontSize: 36,
          fontWeight: 300,
          fill: T.ink,
          letterSpacing: '-0.04em',
          fontFamily: FONT,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {dist.avg !== null ? dist.avg.toFixed(1) : '—'}
      </text>
      <text
        x={cx}
        y={cy + 44}
        textAnchor="middle"
        style={{ fontSize: 12, fontWeight: 500, fill: T.inkMute, letterSpacing: '0.04em', fontFamily: FONT }}
      >
        pts
      </text>
    </svg>
  );
};

interface StatColumnProps {
  color: string;
  ink: string;
  label: string;
  count: number;
  pctText: string;
  range: string;
}

const StatColumn: React.FC<StatColumnProps> = ({ color, ink, label, count, pctText, range }) => (
  <div
    style={{
      flex: 1,
      textAlign: 'center',
      padding: '14px 12px 14px 18px',
      position: 'relative',
    }}
  >
    <span
      style={{
        position: 'absolute',
        left: 6,
        top: 12,
        bottom: 12,
        width: 4,
        borderRadius: 2,
        background: color,
      }}
    />
    <p
      style={{
        margin: '0 0 6px',
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: T.inkMute,
        fontFamily: FONT,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: 22,
        fontWeight: 200,
        color: T.ink,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        fontFamily: FONT,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {count}
    </p>
    <p style={{ margin: '6px 0 0', fontSize: 10, color: T.inkMute, fontFamily: FONT }}>{pctText}</p>
    <p style={{ margin: '2px 0 0', fontSize: 10, color: T.inkMute, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
      {range}
    </p>
  </div>
);

const StatDivider: React.FC = () => (
  <div
    style={{
      width: 1,
      background: T.hairline,
      alignSelf: 'stretch',
      marginTop: 12,
      marginBottom: 12,
    }}
  />
);

export default StablefordCard;
