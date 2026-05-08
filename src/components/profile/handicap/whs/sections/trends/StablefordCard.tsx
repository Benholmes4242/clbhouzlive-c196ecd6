import React, { useState, useMemo } from 'react';
import { Target, Info, ArrowUp, ArrowDown } from 'lucide-react';
import type { WhsScore } from '@/lib/whs/types';
import {
  computeStablefordDistribution,
  type StablefordScope,
} from './computeStablefordDistribution';
import StablefordDetailSheet from './StablefordDetailSheet';

interface Props {
  scores: WhsScore[];
}

const T = {
  ink: '#0F172A',
  ink70: '#475569',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  ink40: 'rgba(15,23,42,0.40)',
  hairline: 'rgba(15,23,42,0.08)',
  ink04: 'rgba(15,23,42,0.04)',
  cardBg: '#FFFFFF',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  amberInk: '#854F0B',
  green: '#22C55E',
  greenInk: '#15803D',
  greenSoft: 'rgba(34,197,94,0.12)',
  red: '#DC2626',
  redInk: '#991B1B',
  redSoft: 'rgba(220,38,38,0.10)',
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

const SCOPE_BTN_LABEL: Record<StablefordScope, string> = {
  '30d': '30D',
  '90d': '90D',
  all: 'ALL',
};

const SCOPE_LABEL_LONG: Record<StablefordScope, string> = {
  '30d': 'LAST 30 DAYS',
  '90d': 'LAST 90 DAYS',
  all: 'ALL TIME',
};

export const StablefordCard: React.FC<Props> = ({ scores }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scope, setScope] = useState<StablefordScope>('90d');

  const dist = useMemo(
    () => computeStablefordDistribution(scores, scope),
    [scores, scope],
  );

  if (dist.insufficientData) {
    return (
      <div style={CARD_STYLE}>
        <CardHeader scope={scope} setScope={setScope} onOpenSheet={() => setSheetOpen(true)} />
        <div style={{ padding: '24px 16px 28px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
            Add a few more rounds
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
            We need at least 3 rounds with Stableford
            {scope !== 'all' ? ` in ${SCOPE_LABEL_LONG[scope].toLowerCase()}` : ''} to show your distribution. You have {dist.total} so far.
          </p>
        </div>
        <StablefordDetailSheet open={sheetOpen} onClose={() => setSheetOpen(false)} dist={dist} />
      </div>
    );
  }

  const avg = dist.avg ?? 0;
  const delta = dist.deltaVsPrev;
  const showDelta = delta !== null && Math.abs(delta) >= 0.05;

  const segs = [
    { count: dist.inZoneCount, color: T.green },
    { count: dist.solidCount, color: T.amber },
    { count: dist.offDayCount, color: T.red },
  ].filter((s) => s.count > 0);

  return (
    <div style={CARD_STYLE}>
      <CardHeader scope={scope} setScope={setScope} onOpenSheet={() => setSheetOpen(true)} />

      {/* Hero: AVG number + delta pill */}
      <div style={{ padding: '16px 16px 12px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: T.inkMute,
            fontFamily: FONT,
          }}
        >
          AVG · {SCOPE_LABEL_LONG[scope]} · {dist.total} ROUNDS
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 56,
              fontWeight: 200,
              color: T.ink,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {avg.toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: T.inkMute, fontFamily: FONT }}>pts avg</span>
          {showDelta && delta !== null && (
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                borderRadius: 999,
                background: delta > 0 ? T.greenSoft : T.redSoft,
                color: delta > 0 ? T.greenInk : T.redInk,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: FONT,
              }}
            >
              {delta > 0 ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
              {Math.abs(delta).toFixed(1)} vs prev
            </span>
          )}
        </div>
      </div>

      {/* Horizontal segmented bar */}
      <div style={{ padding: '0 16px 10px' }}>
        <div
          style={{
            display: 'flex',
            height: 36,
            borderRadius: 8,
            overflow: 'hidden',
            background: T.ink04,
          }}
          role="img"
          aria-label={`Distribution: ${dist.inZoneCount} in zone, ${dist.solidCount} solid, ${dist.offDayCount} off`}
        >
          {segs.map((s, i) => (
            <div
              key={i}
              style={{
                flex: s.count,
                background: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                fontFamily: FONT,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.count > dist.total * 0.1 ? `${s.count}` : ''}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 10,
            color: T.ink40,
            fontFamily: FONT,
            letterSpacing: '0.04em',
          }}
        >
          <span>36+ · zone</span>
          <span>33–35 · solid</span>
          <span>&lt;33 · off</span>
        </div>
      </div>

      {/* 3-cell summary row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          padding: '4px 16px 14px',
        }}
      >
        <SummaryCell color={T.green} label="IN THE ZONE" count={dist.inZoneCount} pct={dist.inZonePct} range="36+" />
        <SummaryCell color={T.amber} label="SOLID" count={dist.solidCount} pct={dist.solidPct} range="33–35" />
        <SummaryCell color={T.red} label="OFF DAY" count={dist.offDayCount} pct={dist.offDayPct} range="<33" />
      </div>

      {/* Narrative footer (preserved) */}
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
              margin: '0 16px 16px',
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
  scope: StablefordScope;
  setScope: (s: StablefordScope) => void;
  onOpenSheet: () => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({ scope, setScope, onOpenSheet }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderBottom: `1px solid ${T.hairline}`,
    }}
  >
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: T.amberTint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Target size={15} color={T.amberDeep} strokeWidth={2.2} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em', fontFamily: FONT }}>
        Stableford Points
      </p>
      <p style={{ margin: 0, fontSize: 10, color: T.inkMute, marginTop: 1, fontFamily: FONT }}>
        How you&apos;re scoring on points
      </p>
    </div>
    {/* Toggle */}
    <div
      style={{
        display: 'inline-flex',
        background: T.ink04,
        borderRadius: 99,
        padding: 2,
        gap: 2,
      }}
    >
      {(['30d', '90d', 'all'] as StablefordScope[]).map((s) => (
        <button
          key={s}
          onClick={() => setScope(s)}
          aria-pressed={scope === s}
          style={{
            padding: '4px 9px',
            borderRadius: 99,
            background: scope === s ? T.ink : 'transparent',
            color: scope === s ? '#fff' : T.ink70,
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.06em',
          }}
        >
          {SCOPE_BTN_LABEL[s]}
        </button>
      ))}
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
        flexShrink: 0,
      }}
    >
      <Info size={13} strokeWidth={2.2} />
    </button>
  </div>
);

interface SummaryCellProps {
  color: string;
  label: string;
  count: number;
  pct: number;
  range: string;
}

const SummaryCell: React.FC<SummaryCellProps> = ({ color, label, count, pct, range }) => (
  <div
    style={{
      borderRadius: 10,
      background: T.ink04,
      padding: '10px 10px 10px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
    <p
      style={{
        margin: '4px 0 6px',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.10em',
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
    <p
      style={{
        margin: '4px 0 0',
        fontSize: 10,
        color: T.inkMute,
        fontFamily: FONT,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {pct}% · {range}
    </p>
  </div>
);

export default StablefordCard;
