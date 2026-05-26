import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useMyPodStandings, type PodStandingRow } from '@/hooks/gam/useMyPodStandings';
import { GamCard, Skeleton, RetryStub } from '../_shared/GamAtoms';
import { openLeaguesSheet } from '../../whs/gam/events';
import PromoteRelegateBar from './PromoteRelegateBar';
import {
  POD_SIZE,
  PROMOTE_COUNT,
  RELEGATE_COUNT,
  bracketLabel,
  bracketEmoji,
  seasonLabel,
  daysLeft,
} from './leagueTokens';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface LeaguesCardProps {
  /** Read-only view (friend mode) — kept for future copy tweaks. */
  readOnly?: boolean;
}

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-60)',
      padding: '0 16px',
      marginBottom: 10,
      marginTop: 24,
    }}
  >
    <span style={{ color: '#F7931E', marginRight: 6 }}>•</span>
    {children}
  </div>
);

const StatCell: React.FC<{
  label: string;
  value: string;
  tone?: 'green' | 'amber' | 'red' | 'neutral';
}> = ({ label, value, tone = 'neutral' }) => {
  const tones: Record<string, { bg: string; fg: string; border: string }> = {
    green:   { bg: 'rgba(5,150,105,0.10)', fg: '#10B981', border: 'rgba(5,150,105,0.28)' },
    amber:   { bg: 'rgba(247,147,30,0.10)', fg: '#F7931E', border: 'rgba(247,147,30,0.28)' },
    red:     { bg: 'rgba(220,38,38,0.10)', fg: '#F87171', border: 'rgba(220,38,38,0.28)' },
    neutral: { bg: 'rgba(148,163,184,0.10)', fg: 'var(--hcp-t-100)', border: 'rgba(148,163,184,0.20)' },
  };
  const t = tones[tone];
  return (
    <div
      style={{
        flex: 1,
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: '8px 10px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--hcp-t-40)',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 800,
          color: t.fg,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
    </div>
  );
};

function buildContext(self: PodStandingRow, pod: PodStandingRow[]) {
  const ranked = [...pod].sort((a, b) => a.live_rank - b.live_rank);
  const promoteCutoff = ranked.find((r) => r.live_rank === PROMOTE_COUNT);
  const relegateCutoff = ranked.find((r) => r.live_rank === POD_SIZE - RELEGATE_COUNT + 1);
  const lastSafe = ranked.find((r) => r.live_rank === POD_SIZE - RELEGATE_COUNT);

  switch (self.zone) {
    case 'promotion': {
      // Buffer below = pts above the 8th-place row.
      const eighth = ranked.find((r) => r.live_rank === PROMOTE_COUNT + 1);
      const buffer = eighth ? self.current_points - eighth.current_points : 0;
      return {
        tone: 'green' as const,
        cells: [{ label: 'Buffer to safe', value: `+${Math.max(0, buffer)} pts`, tone: 'green' as const }],
      };
    }
    case 'relegation': {
      // Need = pts to climb out of bottom 5 (above last_safe).
      const need = lastSafe ? Math.max(0, lastSafe.current_points - self.current_points + 1) : 0;
      return {
        tone: 'red' as const,
        cells: [{ label: 'Drop zone', value: `−${need} pts to safe`, tone: 'red' as const }],
      };
    }
    case 'safe':
    default: {
      const toPromote = promoteCutoff
        ? Math.max(0, promoteCutoff.current_points - self.current_points + 1)
        : 0;
      const buffer = relegateCutoff
        ? Math.max(0, self.current_points - relegateCutoff.current_points + 1)
        : 0;
      return {
        tone: 'neutral' as const,
        cells: [
          { label: 'To promote', value: `+${toPromote} pts`, tone: 'green' as const },
          { label: 'Buffer down', value: `+${buffer} pts`, tone: 'neutral' as const },
        ],
      };
    }
  }
}

export const LeaguesCard: React.FC<LeaguesCardProps> = ({ readOnly = false }) => {
  const { data, isLoading, isError, refetch } = useMyPodStandings();

  if (isError) {
    return (
      <>
        <Eyebrow>Leagues</Eyebrow>
        <div style={{ padding: '0 16px' }}>
          <RetryStub message="Couldn't load your league standings" onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Eyebrow>Leagues</Eyebrow>
        <div style={{ padding: '0 16px' }}>
          <Skeleton height={220} radius={12} />
        </div>
      </>
    );
  }

  const pod = data ?? [];
  const self = pod.find((r) => r.is_self);

  // Empty: not yet placed in a pod.
  if (!self) {
    return (
      <>
        <Eyebrow>Leagues</Eyebrow>
        <div style={{ padding: '0 16px' }}>
          <GamCard>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: 'var(--hcp-t-100)', marginBottom: 6 }}>
              Your league starts soon
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12.5, color: 'var(--hcp-t-60)', lineHeight: 1.45 }}>
              Pods refresh at season start. You'll be placed automatically based on your current handicap.
            </div>
          </GamCard>
        </div>
      </>
    );
  }

  const ctx = buildContext(self, pod);
  const dl = daysLeft(self.season_end);
  const bracket = bracketLabel(self.bracket);
  const emoji = bracketEmoji(self.bracket);

  return (
    <>
      <Eyebrow>
        Leagues · {seasonLabel(self.season)} · {dl}d left
      </Eyebrow>
      <div style={{ padding: '0 16px' }}>
        <GamCard
          onClick={openLeaguesSheet}
          style={{
            background:
              'linear-gradient(135deg, var(--hcp-bg-1) 0%, var(--hcp-bg-2) 60%, rgba(247,147,30,0.06) 100%)',
            border:
              self.zone === 'relegation'
                ? '1px solid rgba(220,38,38,0.45)'
                : '1px solid rgba(247,147,30,0.22)',
            position: 'relative',
            overflow: 'hidden',
            padding: '18px 18px 16px',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 30, lineHeight: 1 }} aria-hidden>
                {emoji}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--hcp-t-60)',
                    marginBottom: 2,
                  }}
                >
                  {bracket} · Pod {self.pod_number}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 32,
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      color: 'var(--hcp-t-100)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    #{self.live_rank}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 13,
                      color: 'var(--hcp-t-60)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    of {POD_SIZE}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 11.5,
                    color: 'var(--hcp-t-60)',
                    marginTop: 2,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {self.current_points} pts · {self.rounds_counted} rounds counted
                </div>
              </div>
            </div>
            <ChevronRight size={20} color="var(--hcp-t-40)" />
          </div>

          {/* Promote/Relegate bar */}
          <PromoteRelegateBar rank={self.live_rank} height={6} dotSize={12} />

          {/* Bar legend */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontFamily: FONT,
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--hcp-t-40)',
              letterSpacing: '0.04em',
            }}
          >
            <span>↑ Promote ({PROMOTE_COUNT})</span>
            <span>Hold</span>
            <span>Relegate ({RELEGATE_COUNT}) ↓</span>
          </div>

          {/* Context cells */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {ctx.cells.map((c, i) => (
              <StatCell key={i} label={c.label} value={c.value} tone={c.tone} />
            ))}
          </div>
        </GamCard>
        {readOnly && null}
      </div>
    </>
  );
};

export default LeaguesCard;
