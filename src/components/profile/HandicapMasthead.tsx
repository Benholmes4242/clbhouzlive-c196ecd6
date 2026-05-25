/**
 * HandicapMasthead — inline data masthead (no card chrome) for the
 * ProfileHubSheet. Sits directly on the #F8FAFC sheet surface.
 *
 * Variants:
 *   connect          — never linked WHS (amber CTA pill)
 *   nodata           — connected, <8 rounds (Building Record)
 *   steady           — connected, |delta|<0.05
 *   improving        — connected, delta<0
 *   drifting         — connected, delta>0
 *   milestone        — crossed a whole-handicap boundary in window
 *
 * Dev override: append ?state=connect|nodata|steady|improving|drifting|milestone
 * to the URL to manually force any state for QA.
 */
import { memo, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';

const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_FAINT = '#94A3B8';
const SLATE_200 = '#E2E8F0';
const AMBER = '#F7931E';
const AMBER_DEEP = '#D97706';
const TABULAR: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"kern" 1, "liga" 1',
};

export type HandicapMastheadState =
  | 'connect'
  | 'nodata'
  | 'steady'
  | 'improving'
  | 'drifting'
  | 'milestone';

interface Props {
  userId: string;
  /** Tapping the Connect CTA on the connect-state. */
  onConnectTap: () => void;
  /** Federation name displayed on connect state. Hardcoded today. */
  federationLabel?: string;
}

function classifyState(
  hasConnection: boolean,
  trend:
    | {
        current: number | null;
        delta: number | null;
        previousHandicap: number | null;
        totalRoundsInRecord: number;
        hasHistory: boolean;
      }
    | undefined,
): HandicapMastheadState {
  if (!hasConnection) return 'connect';
  if (!trend || trend.current === null) return 'nodata';
  if (trend.totalRoundsInRecord < 8) return 'nodata';

  if (trend.hasHistory && trend.previousHandicap !== null) {
    const cur = trend.current < 0 ? Math.floor(trend.current) : Math.ceil(trend.current);
    const prev =
      trend.previousHandicap < 0
        ? Math.floor(trend.previousHandicap)
        : Math.ceil(trend.previousHandicap);
    if (cur !== prev) return 'milestone';
  }

  if (!trend.hasHistory || trend.delta === null) return 'steady';
  if (Math.abs(trend.delta) < 0.05) return 'steady';
  return trend.delta < 0 ? 'improving' : 'drifting';
}

function Eyebrow({ amber, children }: { amber: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: amber ? AMBER : INK_FAINT,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: amber ? AMBER_DEEP : INK_FAINT,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function ProgressBar({ pct, amber = true }: { pct: number; amber?: boolean }) {
  return (
    <div
      style={{
        marginTop: 4,
        height: 2,
        width: '100%',
        background: SLATE_200,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: '100%',
          background: amber ? AMBER : INK_SOFT,
          transition: 'width 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      />
    </div>
  );
}

function HandicapMasthead({ userId, onConnectTap, federationLabel = 'England Golf' }: Props) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: connection } = useWhsConnection(userId);
  const { data: trend } = useHandicapTrend(connection?.id);

  const realState = useMemo(
    () => classifyState(!!connection, trend as any),
    [connection, trend],
  );

  // Dev override
  const override = searchParams.get('state') as HandicapMastheadState | null;
  const allowedOverrides: HandicapMastheadState[] = [
    'connect', 'nodata', 'steady', 'improving', 'drifting', 'milestone',
  ];
  const state: HandicapMastheadState =
    override && allowedOverrides.includes(override) ? override : realState;

  // Mock trend for overrides so the UI still has something to render
  const mockTrend = useMemo(() => {
    if (!override) return trend as any;
    switch (state) {
      case 'steady':     return { current: 12.4, delta: 0.0, previousHandicap: 12.4, totalRoundsInRecord: 20, hasHistory: true };
      case 'improving':  return { current: 10.8, delta: -0.4, previousHandicap: 11.2, totalRoundsInRecord: 22, hasHistory: true };
      case 'drifting':   return { current: 13.7, delta: 0.3, previousHandicap: 13.4, totalRoundsInRecord: 18, hasHistory: true };
      case 'milestone':  return { current: 9.4, delta: -0.6, previousHandicap: 10.1, totalRoundsInRecord: 24, hasHistory: true };
      case 'nodata':     return { current: null, delta: null, previousHandicap: null, totalRoundsInRecord: 4, hasHistory: false };
      default:           return trend as any;
    }
  }, [override, state, trend]);

  // ── Connect variant ──
  if (state === 'connect') {
    return (
      <div style={{ paddingTop: 18, paddingBottom: 22 }}>
        <Eyebrow amber>CONNECT · HANDICAP</Eyebrow>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.015em',
            lineHeight: 1.15,
          }}
        >
          Track your index.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            marginTop: 6,
            fontSize: 13,
            fontWeight: 600,
            color: INK_SOFT,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={INK_SOFT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>{federationLabel} · WHS</span>
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 11.5,
            color: INK_FAINT,
            textAlign: 'center',
          }}
        >
          Takes 30 seconds · We never post on your behalf
        </div>
        <button
          type="button"
          onClick={onConnectTap}
          className="active:scale-[0.98] transition-transform"
          style={{
            marginTop: 10,
            width: '100%',
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DEEP})`,
            border: 'none',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(247,147,30,0.30)',
          }}
        >
          <span>Connect handicap</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // ── nodata / Building Record variant ──
  if (state === 'nodata') {
    const played = mockTrend?.totalRoundsInRecord ?? 0;
    const needed = 8;
    const pct = Math.min(100, (played / needed) * 100);
    const remaining = Math.max(0, needed - played);
    return (
      <div style={{ paddingTop: 18, paddingBottom: 22 }}>
        <Eyebrow amber>HANDICAP · BUILDING RECORD</Eyebrow>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
            marginBottom: 18,
            alignItems: 'baseline',
          }}
        >
          <Col label="INDEX">
            <span style={{ fontSize: 48, fontWeight: 200, color: 'rgba(15,23,42,0.25)', letterSpacing: '-0.02em', ...TABULAR }}>
              —
            </span>
          </Col>
          <Col label="ROUNDS">
            <span style={{ fontSize: 28, fontWeight: 300, color: INK, ...TABULAR }}>{played}</span>
            <span style={{ fontSize: 18, fontWeight: 400, color: INK_FAINT, marginLeft: 4, ...TABULAR }}>/ {needed}</span>
          </Col>
          <Col label="LAST ROUND">
            <span style={{ fontSize: 20, fontWeight: 500, color: played > 0 ? INK_SOFT : INK_FAINT, ...TABULAR }}>
              {played > 0 ? '—' : '—'}
            </span>
          </Col>
        </div>
        <ProgressBar pct={pct} />
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 500,
            color: INK_SOFT,
          }}
        >
          Play{' '}
          <span style={{ fontWeight: 700, color: INK }}>
            {remaining} more counting round{remaining === 1 ? '' : 's'}
          </span>{' '}
          to see your index.
        </div>
      </div>
    );
  }

  // ── Active / connected variants: steady / improving / drifting / milestone ──
  const current = mockTrend?.current ?? null;
  const delta = mockTrend?.delta ?? 0;
  const isMilestone = state === 'milestone';
  const eyebrow =
    state === 'steady'    ? 'HANDICAP · STEADY · 30D'
    : state === 'improving' ? 'HANDICAP · IMPROVING · 30D'
    : state === 'drifting'  ? 'HANDICAP · DRIFTING · 30D'
    : 'HANDICAP · NEW MILESTONE';

  const displayedHandicap =
    current === null
      ? '—'
      : current < 0
        ? `+${Math.abs(current).toFixed(1)}`
        : current.toFixed(1);

  const deltaLabel = (() => {
    if (delta === null || delta === undefined) return '+0.0';
    const sign = delta < 0 ? '-' : '+';
    return `${sign}${Math.abs(delta).toFixed(1)}`;
  })();

  // NEXT HCP progress
  const milestoneDisplayed =
    current === null ? null : (current < 0 ? Math.floor(current) : Math.ceil(current));
  const nextTarget = milestoneDisplayed !== null ? milestoneDisplayed - 1 : null;
  const progressPct = (() => {
    if (current === null || milestoneDisplayed === null) return 0;
    const top = milestoneDisplayed + 0.4;
    const bottom = milestoneDisplayed - 0.6;
    const p = (top - current) / (top - bottom);
    return Math.max(0, Math.min(100, p * 100));
  })();

  return (
    <div style={{ paddingTop: 18, paddingBottom: 22 }}>
      <Eyebrow amber={isMilestone}>{eyebrow}</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
          marginBottom: 18,
          alignItems: 'baseline',
        }}
      >
        <Col label="INDEX" milestoneDot={isMilestone}>
          <span style={{ fontSize: 48, fontWeight: 200, color: INK, letterSpacing: '-0.02em', ...TABULAR }}>
            {displayedHandicap}
          </span>
        </Col>
        <Col label="30 DAYS">
          <span style={{ fontSize: 28, fontWeight: 300, color: INK_SOFT, ...TABULAR }}>
            {deltaLabel}
          </span>
        </Col>
        <Col label="NEXT HCP">
          <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 28, fontWeight: 300, color: INK, ...TABULAR }}>
              {Math.round(progressPct)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: INK_SOFT, marginLeft: 2, ...TABULAR }}>%</span>
            {nextTarget !== null && (
              <span style={{ fontSize: 13, fontWeight: 400, color: INK_FAINT, marginLeft: 6, ...TABULAR }}>
                → {nextTarget}
              </span>
            )}
          </span>
        </Col>
      </div>
      <ProgressBar pct={progressPct} />
    </div>
  );
}

function Col({ label, milestoneDot, children }: { label: string; milestoneDot?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', minHeight: 48 }}>
        {children}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
        }}
      >
        {milestoneDot && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, flexShrink: 0 }} />
        )}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: INK_FAINT,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default memo(HandicapMasthead);
