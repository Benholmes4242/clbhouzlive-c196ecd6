import React, { useState, useMemo } from 'react';
import { Info, ArrowUp, ArrowDown } from 'lucide-react';
import type { WhsScore } from '@/lib/whs/types';
import {
  computeStablefordDistribution,
  type StablefordScope,
} from './computeStablefordDistribution';
import StablefordDetailSheet from './StablefordDetailSheet';
import SectionHeader from '../SectionHeader';

interface Props {
  scores: WhsScore[];
}

const T = {
  ink: '#0F172A',
  ink70: '#475569',
  inkMute: 'rgba(15,23,42,0.55)',
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
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 14,
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
      <div style={SECTION_STYLE}>
        <CardHeader scope={scope} setScope={setScope} onOpenSheet={() => setSheetOpen(true)} />
        <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
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
  const prevLabel =
    scope === '30d' ? 'vs prior 30D' :
    scope === '90d' ? 'vs prior 90D' :
    null;

  const GREEN_GRAD = 'linear-gradient(90deg, #15803D 0%, #4ADE80 100%)';
  const AMBER_GRAD = 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)';
  const RED_GRAD = 'linear-gradient(90deg, #991B1B 0%, #DC2626 100%)';

  const segs = [
    { count: dist.inZoneCount, color: T.green, gradient: GREEN_GRAD },
    { count: dist.solidCount, color: T.amber, gradient: AMBER_GRAD },
    { count: dist.offDayCount, color: T.red, gradient: RED_GRAD },
  ].filter((s) => s.count > 0);

  return (
    <div style={SECTION_STYLE}>
      <CardHeader scope={scope} setScope={setScope} onOpenSheet={() => setSheetOpen(true)} />

      {/* Hero: AVG number + delta pill */}
      <div style={{ padding: '16px 20px 12px' }}>
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
              {Math.abs(delta).toFixed(1)} {prevLabel}
            </span>
          )}
        </div>
      </div>

      {/* Horizontal segmented bar — taller, with confident counts inside */}
      <div style={{ padding: '0 20px 16px' }}>
        <div
          style={{
            display: 'flex',
            height: 64,
            borderRadius: 12,
            overflow: 'hidden',
            background: T.ink04,
            boxShadow: '0 2px 4px rgba(15,23,42,0.04)',
          }}
          role="img"
          aria-label={`Distribution: ${dist.inZoneCount} in zone, ${dist.solidCount} solid, ${dist.offDayCount} off`}
        >
          {segs.map((s, i) => (
            <div
              key={i}
              style={{
                flex: s.count,
                background: s.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: FONT,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.count > dist.total * 0.1 ? `${s.count}` : ''}
            </div>
          ))}
        </div>
        {/* Anchored keys — colour dot + band name + range·pct, columns mirror bar segments */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${Math.max(dist.inZoneCount, 0.5)}fr ${Math.max(dist.solidCount, 0.5)}fr ${Math.max(dist.offDayCount, 0.5)}fr`,
            gap: 0,
            marginTop: 10,
            fontFamily: FONT,
          }}
        >
          <KeyCell color={T.green} label="IN THE ZONE" meta={`36+ · ${dist.inZonePct}%`} />
          <KeyCell color={T.amber} label="SOLID" meta={`33–35 · ${dist.solidPct}%`} />
          <KeyCell color={T.red} label="OFF DAY" meta={`<33 · ${dist.offDayPct}%`} />
        </div>
      </div>

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
  <div style={{ paddingBottom: 14, borderBottom: `1px solid ${T.hairline}` }}>
    <SectionHeader
      eyebrow="STABLEFORD POINTS"
      title="How you're scoring on points"
      right={
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
      }
    />

    {/* Scope toggle */}
    <div style={{ padding: '0 16px' }}>
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
    </div>
  </div>
);

interface KeyCellProps {
  color: string;
  label: string;
  meta: string;
}

const KeyCell: React.FC<KeyCellProps> = ({ color, label, meta }) => (
  <div style={{ textAlign: 'center', padding: '0 4px', fontFamily: FONT }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: T.ink,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        marginBottom: 3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}
      />
      {label}
    </div>
    <div
      style={{
        fontSize: 10.5,
        color: T.inkMute,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {meta}
    </div>
  </div>
);

export default StablefordCard;
