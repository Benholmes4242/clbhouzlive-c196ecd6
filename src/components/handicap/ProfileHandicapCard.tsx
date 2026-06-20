/**
 * ProfileHandicapCard — light-mode handicap summary card for the profile page.
 *
 * Replaces the legacy FriendHandicapHero / HeroHandicapCard dual-ring block.
 * Mirrors the visual language of HeroHandicapCardDark (verdict ring) but
 * themed light via the `.hcp-light` scope. Whole card taps through:
 *   own profile  → /handicap
 *   friend       → /handicap/:userId   (fires friend_handicap_page_viewed)
 *
 * Renders null when the user has no WHS connection or no current handicap
 * — same gating as FriendHandicapHero.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  useWhsConnection,
  useHandicapTrend,
  useHandicapHistory,
  useAllScores,
} from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import { fmtHcp } from '@/lib/whs/format';
import { analyticsEvents } from '@/utils/analyticsEvents';

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const AMBER = '#F7931E';

type Verdict = 'good' | 'bad' | 'steady';

function verdictFor(delta: number | null): Verdict {
  if (delta == null) return 'steady';
  if (delta < -0.05) return 'good';
  if (delta > 0.05) return 'bad';
  return 'steady';
}

function arcGradient(v: Verdict) {
  if (v === 'good') return { from: '#22C55E', to: '#4ADE80', solid: '#22C55E' };
  if (v === 'bad') return { from: '#EF4444', to: '#F87171', solid: '#EF4444' };
  return { from: AMBER, to: '#FFB45A', solid: AMBER };
}

// Ring geometry
const RING_BOX = 108;
const STROKE_W = 9;
const CIRC_R = (RING_BOX - STROKE_W) / 2;
const CIRCUMFERENCE = 2 * Math.PI * CIRC_R;

interface Props {
  userId: string;
  viewerUserId: string;
  isOwnProfile: boolean;
  displayName?: string | null;
}

const ProfileHandicapCard: React.FC<Props> = ({
  userId,
  viewerUserId,
  isOwnProfile,
  displayName,
}) => {
  const navigate = useNavigate();
  const { data: connection, isLoading: connLoading } = useWhsConnection(userId);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection?.id);
  const { data: history90 } = useHandicapHistory(connection?.id, 90);
  const { data: allScores } = useAllScores(connection?.id);
  const trend12 = useHandicapTrend12mo(connection?.id);

  const handicap = trend?.current ?? null;

  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return (
      history90[history90.length - 1].handicap_index - history90[0].handicap_index
    );
  }, [history90]);

  const verdict = useMemo<Verdict>(() => verdictFor(delta90), [delta90]);
  const grad = arcGradient(verdict);

  // Fill fraction — magnitude of 90d delta vs a 1.0 stroke target (clamped).
  const fillFraction = useMemo(() => {
    if (delta90 == null) return 0;
    return Math.min(Math.abs(delta90) / 1.0, 1);
  }, [delta90]);
  const dashOffset = CIRCUMFERENCE * (1 - fillFraction);

  // Scoring avg over last 90 days (mirrors HeroHandicapCardDark).
  const scoringAvg90 = useMemo<number | null>(() => {
    const scores = (allScores ?? []) as Array<{
      play_date?: string;
      adjusted_gross?: number;
    }>;
    const cutoff = Date.now() - 90 * 86_400_000;
    const vals = scores
      .filter((s) => {
        if (!s?.play_date) return false;
        const t = new Date(s.play_date).getTime();
        return Number.isFinite(t) && t >= cutoff;
      })
      .map((s) => s.adjusted_gross)
      .filter((v): v is number => typeof v === 'number');
    if (vals.length < 3) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [allScores]);

  // Sparkline points — built from history90.
  const spark = useMemo(() => {
    if (!history90 || history90.length < 2) return null;
    const pts = history90.map((h) => h.handicap_index);
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const W = 100;
    const H = 32;
    const PAD_Y = 3; // keeps the stroke off the top/bottom edges
    const stepX = pts.length > 1 ? W / (pts.length - 1) : 0;
    const plotH = H - PAD_Y * 2;
    const path = pts
      .map((v, i) => {
        const x = i * stepX;
        const y = PAD_Y + (plotH - ((v - min) / range) * plotH);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
    const firstDate = history90[0]?.observed_at
      ? new Date(history90[0].observed_at)
      : null;
    const lastDate = history90[history90.length - 1]?.observed_at
      ? new Date(history90[history90.length - 1].observed_at)
      : null;
    const fmtMonth = (d: Date) =>
      d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    return {
      path,
      W,
      H,
      startLabel: firstDate ? fmtMonth(firstDate) : '',
      endLabel: lastDate ? fmtMonth(lastDate) : '',
    };
  }, [history90]);

  // Gating — match FriendHandicapHero behaviour.
  if (connLoading || trendLoading) return null;
  if (!connection) return null;
  if (handicap == null) return null;

  const handleTap = () => {
    if (!isOwnProfile) {
      analyticsEvents.track?.('friend_handicap_page_viewed', {
        viewer_id: viewerUserId,
        friend_id: userId,
        source: 'profile_hero_ring',
      });
      navigate(`/handicap/${userId}`);
    } else {
      navigate('/handicap');
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTap();
    }
  };

  const deltaColor = (d: number | null) => {
    if (d == null) return 'var(--hcp-t-60)';
    if (d < -0.05) return '#16A34A';
    if (d > 0.05) return '#DC2626';
    return 'var(--hcp-t-60)';
  };
  const fmtDelta = (d: number | null) => {
    if (d == null) return '—';
    const abs = Math.abs(d).toFixed(1);
    if (d < -0.05) return `−${abs}`;
    if (d > 0.05) return `+${abs}`;
    return '0.0';
  };

  const resolvedName = (displayName ?? '').trim().split(/\s+/)[0] || 'this golfer';

  return (
    <div className="hcp-light" style={{ padding: '8px 16px 16px' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleTap}
        onKeyDown={handleKey}
        aria-label={
          isOwnProfile
            ? 'See your full handicap — trends, records, rounds'
            : `See ${resolvedName}'s full handicap — trends, records, rounds`
        }
        style={{
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 14,
          padding: '14px 14px 12px',
          fontFamily: FONT,
          cursor: 'pointer',
          boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.22em',
              color: 'var(--hcp-t-60)',
            }}
          >
            HANDICAP INDEX
          </span>
        </div>

        {/* Ring + KPI trio */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Verdict ring */}
          <div
            style={{
              position: 'relative',
              width: RING_BOX,
              height: RING_BOX,
              flexShrink: 0,
            }}
          >
            <svg
              width={RING_BOX}
              height={RING_BOX}
              viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
              style={{ transform: 'rotate(-90deg)' }}
              aria-hidden
            >
              <defs>
                <linearGradient
                  id="hcp-light-arc"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2={RING_BOX}
                  y2={RING_BOX}
                >
                  <stop offset="0%" stopColor={grad.from} />
                  <stop offset="100%" stopColor={grad.to} />
                </linearGradient>
              </defs>
              <circle
                cx={RING_BOX / 2}
                cy={RING_BOX / 2}
                r={CIRC_R}
                fill="none"
                stroke="var(--hcp-bg-3)"
                strokeWidth={STROKE_W}
              />
              <circle
                cx={RING_BOX / 2}
                cy={RING_BOX / 2}
                r={CIRC_R}
                fill="none"
                stroke="url(#hcp-light-arc)"
                strokeWidth={STROKE_W}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{
                  transition:
                    'stroke-dashoffset 700ms cubic-bezier(0.22,0.61,0.36,1)',
                  transform: verdict === 'bad' ? 'scaleX(-1)' : undefined,
                  transformOrigin: 'center',
                  transformBox: 'fill-box',
                }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: 'var(--hcp-t-100)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmtHcp(handicap)}
              </span>
            </div>
          </div>

          {/* KPI trio */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
            }}
          >
            <KPI
              label="SCORING"
              value={scoringAvg90 != null ? scoringAvg90.toFixed(1) : '—'}
              sub="90d avg"
              color="var(--hcp-t-100)"
            />
            <KPI
              label="90D"
              value={fmtDelta(delta90)}
              sub="vs start"
              color={deltaColor(delta90)}
            />
            <KPI
              label="12MO"
              value={fmtDelta(trend12.delta)}
              sub="vs year"
              color={deltaColor(trend12.delta)}
            />
          </div>
        </div>

        {/* Sparkline */}
        {spark && (
          <div style={{ marginTop: 14 }}>
            <svg
              width="100%"
              height={spark.H}
              viewBox={`0 0 ${spark.W} ${spark.H}`}
              preserveAspectRatio="none"
              aria-hidden
              style={{ display: 'block', overflow: 'visible' }}
            >
              <path
                d={spark.path}
                fill="none"
                stroke={grad.solid}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: 'var(--hcp-t-40)',
              }}
            >
              <span>{spark.startLabel}</span>
              <span>{spark.endLabel}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--hcp-line)',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              color: 'var(--hcp-t-60)',
            }}
          >
            See full handicap — trends, records, rounds
          </span>
          <ChevronRight size={14} color="var(--hcp-t-60)" />
        </div>
      </div>
    </div>
  );
};

interface KPIProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

const KPI: React.FC<KPIProps> = ({ label, value, sub, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0, textAlign: 'center' }}>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.18em',
        color: 'var(--hcp-t-40)',
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.1,
        color,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--hcp-t-40)',
      }}
    >
      {sub}
    </span>
  </div>
);

export default ProfileHandicapCard;
