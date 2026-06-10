/**
 * HandicapMasthead — Scorecard card surface for the ProfileHubSheet.
 *
 * Variants:
 *   connect          — never linked WHS (dark gradient conversion card)
 *   nodata           — connected, <8 rounds (Building Record scorecard)
 *   steady/improving/drifting/milestone — connected data scorecard
 *
 * The whole card is a tap target → routes to /handicap (or connect flow on
 * the connect variant).
 *
 * Dev override: ?state=connect|nodata|steady|improving|drifting|milestone
 */
import { memo, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useWhsConnection, useHandicapTrend, useLastRound, useHandicapHistory } from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import { ConnectHandicapCard } from '@/components/shared/ConnectHandicapCard';

const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_FAINT = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#D97706';
const SLATE_200 = '#E2E8F0';
const SEASON_GREEN = '#006747';
const CRIMSON = '#9F1D1D';

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
  onConnectTap: () => void;
  onCardTap?: () => void;
}

function classifyState(
  hasConnection: boolean,
  trend: any,
): HandicapMastheadState {
  if (!hasConnection) return 'connect';
  if (!trend || trend.current === null) return 'nodata';
  if (trend.totalRoundsInRecord < 8) return 'nodata';

  if (trend.hasHistory && trend.previousHandicap !== null) {
    const cur = trend.current < 0 ? Math.floor(trend.current) : Math.ceil(trend.current);
    const prev = trend.previousHandicap < 0
      ? Math.floor(trend.previousHandicap)
      : Math.ceil(trend.previousHandicap);
    if (cur !== prev) return 'milestone';
  }

  if (!trend.hasHistory || trend.delta === null) return 'steady';
  if (Math.abs(trend.delta) < 0.05) return 'steady';
  return trend.delta < 0 ? 'improving' : 'drifting';
}

function OfficialHandicapMark({ size = 13, color = AMBER }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12l2.5 2.5L15.5 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatHandicap(v: number | null): string {
  if (v === null) return '—';
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

function formatDelta(v: number | null | undefined): string {
  if (v === null || v === undefined) return '+0.0';
  const sign = v < 0 ? '-' : '+';
  return `${sign}${Math.abs(v).toFixed(1)}`;
}

function lastRoundLabel(playDate: string | null | undefined): string {
  if (!playDate) return '—';
  const ms = Date.now() - new Date(playDate).getTime();
  if (ms < 24 * 3600_000) return 'Today';
  if (ms < 48 * 3600_000) return 'Yesterday';
  const days = Math.floor(ms / 86_400_000);
  return `${days} days`;
}

function HandicapMasthead({ userId, onConnectTap, onCardTap }: Props) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: connection } = useWhsConnection(userId);
  const { data: trend } = useHandicapTrend(connection?.id);
  const { data: lastRound } = useLastRound(connection?.id);
  const { data: history90 } = useHandicapHistory(connection?.id, 90);
  const trend12 = useHandicapTrend12mo(connection?.id);

  const realState = useMemo(
    () => classifyState(!!connection, trend as any),
    [connection, trend],
  );

  const override = searchParams.get('state') as HandicapMastheadState | null;
  const allowed: HandicapMastheadState[] = [
    'connect', 'nodata', 'steady', 'improving', 'drifting', 'milestone',
  ];
  const state: HandicapMastheadState =
    override && allowed.includes(override) ? override : realState;

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

  // 90-day delta — hoisted above the state-gated early returns so the hook
  // count is identical across all `state` branches (Rules of Hooks / #300 fix).
  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return history90[history90.length - 1].handicap_index - history90[0].handicap_index;
  }, [history90]);

  const goToHandicap = () => {

    if (onCardTap) onCardTap();
    else navigate('/handicap');
  };

  // ── Connect variant: shared ghost-index card ──
  if (state === 'connect') {
    return (
      <div style={{ paddingTop: 14 }}>
        <ConnectHandicapCard
          headline="Track your handicap."
          sub="Sync your official index, see your trend, compare with friends."
          onTap={onConnectTap}
        />
      </div>
    );
  }

  // ── nodata / Building Record variant ──
  if (state === 'nodata') {
    const played = mockTrend?.totalRoundsInRecord ?? 0;
    const needed = 8;
    const pct = Math.min(100, (played / needed) * 100);
    const remaining = Math.max(0, needed - played);
    const lastRoundText = lastRoundLabel(lastRound?.play_date as any);

    return (
      <div style={{ paddingTop: 14 }}>
        <button
          type="button"
          onClick={goToHandicap}
          className="w-full text-left active:bg-[rgba(15,23,42,0.015)] transition-colors"
          style={{
            display: 'block',
            background: '#FFFFFF',
            border: `0.5px solid ${HAIRLINE}`,
            borderRadius: 14,
            padding: 0,
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* Left: ROUNDS LOGGED */}
            <div
              style={{
                padding: '16px 18px 16px 20px',
                borderRight: `0.5px solid ${HAIRLINE}`,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: INK_FAINT,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 6,
                }}
              >
                Rounds Logged
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, lineHeight: 0.92 }}>
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 200,
                    color: INK,
                    letterSpacing: '-0.025em',
                    ...TABULAR,
                  }}
                >
                  {played}
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 300,
                    color: INK_FAINT,
                    ...TABULAR,
                  }}
                >
                  / {needed}
                </span>
              </div>
            </div>

            {/* Right: STATUS / LAST ROUND stacked */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 18px', borderBottom: `0.5px solid ${HAIRLINE}` }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: INK_FAINT,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  Status
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: AMBER,
                      boxShadow: '0 0 0 3px rgba(247,147,30,0.18)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>Building</span>
                </div>
              </div>
              <div style={{ padding: '10px 18px' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: INK_FAINT,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  Last Round
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: lastRoundText === '—' ? INK_FAINT : INK_SOFT,
                    marginTop: 2,
                    ...TABULAR,
                  }}
                >
                  {lastRoundText}
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Progress meter */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              flex: 1,
              height: 2,
              background: SLATE_200,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: AMBER,
                transition: 'width 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: INK_SOFT,
              whiteSpace: 'nowrap',
              ...TABULAR,
            }}
          >
            {remaining} more round{remaining === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    );
  }

  // ── Data scorecard variant (steady / improving / drifting / milestone) ──
  const current = mockTrend?.current ?? null;

  // 12-month color & icon


  // 12-month color & icon
  const dir = trend12.direction;
  const delta12 = trend12.delta;
  let twelveColor = INK_SOFT;
  let TwelveIcon: typeof ArrowDownRight | null = null;
  if (delta12 !== null) {
    if (dir === 'down') {
      twelveColor = SEASON_GREEN;
      TwelveIcon = ArrowDownRight;
    } else if (dir === 'up') {
      twelveColor = CRIMSON;
      TwelveIcon = ArrowUpRight;
    }
  }
  const twelveText =
    delta12 === null
      ? '—'
      : formatDelta(delta12);
  const twelveColorFinal = delta12 === null ? INK_FAINT : twelveColor;

  // 90-day color & icon — derived from the sign of delta90 (negative = improved).
  let ninetyColor = INK_SOFT;
  let NinetyIcon: typeof ArrowDownRight | null = null;
  if (delta90 !== null) {
    if (delta90 < -0.05) {
      ninetyColor = SEASON_GREEN;
      NinetyIcon = ArrowDownRight;
    } else if (delta90 > 0.05) {
      ninetyColor = CRIMSON;
      NinetyIcon = ArrowUpRight;
    }
  }
  const ninetyText = delta90 === null ? '—' : formatDelta(delta90);
  const ninetyColorFinal = delta90 === null ? INK_FAINT : ninetyColor;

  return (
    <div style={{ paddingTop: 14 }}>
      <button
        type="button"
        onClick={goToHandicap}
        className="w-full text-left active:bg-[rgba(15,23,42,0.015)] transition-colors"
        style={{
          display: 'block',
          background: '#FFFFFF',
          border: `0.5px solid ${HAIRLINE}`,
          borderRadius: 14,
          padding: 0,
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Left: CURRENT INDEX */}
          <div
            style={{
              padding: '16px 18px 16px 20px',
              borderRight: `0.5px solid ${HAIRLINE}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: INK_FAINT,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                marginBottom: 6,
              }}
            >
              Current Index
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 200,
                color: INK,
                letterSpacing: '-0.025em',
                lineHeight: 0.92,
                ...TABULAR,
              }}
            >
              {formatHandicap(current)}
            </div>
          </div>

          {/* Right: 90 DAYS / 12 MONTHS stacked */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 18px', borderBottom: `0.5px solid ${HAIRLINE}` }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: INK_FAINT,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                }}
              >
                90 Days
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 3,
                  marginTop: 2,
                  fontSize: 22,
                  fontWeight: 300,
                  color: ninetyColorFinal,
                  ...TABULAR,
                }}
              >
                <span>{ninetyText}</span>
                {NinetyIcon && (
                  <NinetyIcon
                    size={15}
                    color={ninetyColorFinal}
                    strokeWidth={2.4}
                    style={{ alignSelf: 'center' }}
                  />
                )}
              </div>
            </div>
            <div style={{ padding: '10px 18px' }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: INK_FAINT,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                }}
              >
                12 Months
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 3,
                  marginTop: 2,
                  fontSize: 22,
                  fontWeight: 300,
                  color: twelveColorFinal,
                  ...TABULAR,
                }}
              >
                <span>{twelveText}</span>
                {TwelveIcon && (
                  <TwelveIcon
                    size={15}
                    color={twelveColorFinal}
                    strokeWidth={2.4}
                    style={{ alignSelf: 'center' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default memo(HandicapMasthead);
