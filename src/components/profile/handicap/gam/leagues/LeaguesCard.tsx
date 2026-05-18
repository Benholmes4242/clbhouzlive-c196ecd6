import React from 'react';
import { useMyPodStandings } from '@/hooks/gam/useMyPodStandings';
import { GamCard, Skeleton, RetryStub } from '../_shared/GamAtoms';
import { bracketEmoji, bracketLabel, daysUntil } from '@/lib/gam/visuals';
import type { PodStanding, LeagueBracket } from '@/lib/gam/types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const COLOR_GREEN = '#059669';
const COLOR_RED = '#DC2626';
const COLOR_AMBER = '#F7931E';

interface Props {
  userId: string;
  isOwner: boolean;
}

const Eyebrow: React.FC = () => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-60)',
      padding: '0 16px',
      marginTop: 24,
      marginBottom: 10,
    }}
  >
    <span style={{ color: COLOR_AMBER, marginRight: 6 }}>•</span>
    LEAGUES
  </div>
);

function formatSeason(s: string | null | undefined): string {
  if (!s) return 'SEASON';
  return s.replace(/[-_]/g, ' ').toUpperCase();
}

const PROMOTE_PCT = (7 / 30) * 100; // 23.333
const RELEGATE_START_PCT = (25 / 30) * 100; // 83.333

const PromoteRelegateBar: React.FC<{ liveRank: number; podSize: number }> = ({
  liveRank,
  podSize,
}) => {
  const dotLeftPct = ((liveRank - 0.5) / podSize) * 100;
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 8,
          borderRadius: 4,
          background: `linear-gradient(90deg,
            ${COLOR_GREEN} 0%, ${COLOR_GREEN} ${PROMOTE_PCT}%,
            rgba(255,255,255,0.10) ${PROMOTE_PCT}%, rgba(255,255,255,0.10) ${RELEGATE_START_PCT}%,
            ${COLOR_RED} ${RELEGATE_START_PCT}%, ${COLOR_RED} 100%
          )`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${dotLeftPct}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: COLOR_AMBER,
            border: '2px solid #FFFFFF',
            boxShadow: '0 0 4px rgba(0,0,0,0.4)',
            zIndex: 1,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: FONT,
        }}
      >
        <span style={{ color: COLOR_GREEN }}>↑ promote (7)</span>
        <span style={{ color: 'var(--hcp-t-40)' }}>middle</span>
        <span style={{ color: COLOR_RED }}>↓ relegate (5)</span>
      </div>
    </div>
  );
};

const ContextCell: React.FC<{ self: PodStanding; allStandings: PodStanding[] }> = ({
  self,
  allStandings,
}) => {
  const rank7 = allStandings.find((s) => s.live_rank === 7);
  const rank8 = allStandings.find((s) => s.live_rank === 8);
  const rank25 = allStandings.find((s) => s.live_rank === 25);
  const rank26 = allStandings.find((s) => s.live_rank === 26);

  if (self.zone === 'promotion') {
    const buffer = rank8 ? self.current_points - rank8.current_points : null;
    return (
      <div
        style={{
          background: 'rgba(5,150,105,0.10)',
          border: '1px solid rgba(5,150,105,0.32)',
          borderRadius: 8,
          padding: '10px 12px',
          marginTop: 14,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 700,
          color: COLOR_GREEN,
          textAlign: 'center',
        }}
      >
        {buffer != null && buffer > 0
          ? `+${buffer} pts buffer to keep promotion`
          : 'Holding promotion spot'}
      </div>
    );
  }

  if (self.zone === 'relegation') {
    const cushion = rank25 ? rank25.current_points - self.current_points : null;
    return (
      <div
        style={{
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.32)',
          borderRadius: 8,
          padding: '10px 12px',
          marginTop: 14,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 700,
          color: COLOR_RED,
          textAlign: 'center',
        }}
      >
        {cushion != null && cushion > 0
          ? `Drop ${cushion} pts and you relegate`
          : 'In the relegation zone'}
      </div>
    );
  }

  const ptsToPromote = rank7 ? rank7.current_points - self.current_points : null;
  const bufferDown = rank26 ? self.current_points - rank26.current_points : null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 1,
        marginTop: 14,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          background: 'var(--hcp-bg-2)',
          padding: '10px 12px',
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', fontWeight: 500, marginBottom: 2 }}>
          To promote
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLOR_GREEN,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {ptsToPromote != null ? `${ptsToPromote} pts` : '—'}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          background: 'var(--hcp-bg-2)',
          padding: '10px 12px',
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', fontWeight: 500, marginBottom: 2 }}>
          Buffer down
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {bufferDown != null ? `+${bufferDown} pts` : '—'}
        </div>
      </div>
    </div>
  );
};

const EmptyCard: React.FC = () => (
  <div style={{ padding: '0 16px' }}>
    <div
      style={{
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 12,
        padding: 16,
        opacity: 0.7,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--hcp-t-60)',
          marginBottom: 8,
        }}
      >
        SPRING 2026
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--hcp-t-100)', marginBottom: 6 }}>
        Your league starts soon
      </div>
      <div style={{ fontSize: 13, color: 'var(--hcp-t-60)', lineHeight: 1.4 }}>
        Pods refresh at season start. You'll be placed once pods open.
      </div>
    </div>
  </div>
);

function handleCardTap(userId: string) {
  window.dispatchEvent(
    new CustomEvent('leagues-sheet:open', { detail: { userId } }),
  );
}

const LeaguesCard: React.FC<Props> = ({ userId, isOwner }) => {
  const { data, isLoading, isError, refetch } = useMyPodStandings(isOwner);

  if (!isOwner) return null;

  if (isLoading) {
    return (
      <>
        <Eyebrow />
        <div style={{ padding: '0 16px' }}>
          <Skeleton height={220} radius={12} />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Eyebrow />
        <div style={{ padding: '0 16px' }}>
          <RetryStub message="Couldn't load your league" onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  const standings = data ?? [];
  const self = standings.find((s) => s.is_self);

  if (!self) {
    return (
      <>
        <Eyebrow />
        <EmptyCard />
      </>
    );
  }

  const bracket = self.bracket as LeagueBracket;
  const podSize = standings.length || 30;
  const days = daysUntil(self.season_end);
  const isRelegate = self.zone === 'relegation';

  return (
    <>
      <Eyebrow />
      <div style={{ padding: '0 16px' }}>
        <GamCard
          onClick={() => handleCardTap(userId)}
          style={
            isRelegate
              ? { border: '1px solid rgba(220,38,38,0.32)' }
              : undefined
          }
        >
          {/* Top eyebrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-60)',
              }}
            >
              {formatSeason(self.season)}
              {days != null && days >= 0 ? ` · ${days} DAYS LEFT` : ''}
            </div>
            <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
              {bracketEmoji[bracket] ?? '🏆'}
            </span>
          </div>

          {/* Bracket name */}
          <div
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              lineHeight: 1.2,
            }}
          >
            {bracketLabel[bracket] ?? 'League'} League
          </div>

          {/* Rank — visual hero */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              marginTop: 6,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--hcp-t-100)', lineHeight: 1 }}>
              #
            </span>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--hcp-t-100)', lineHeight: 1 }}>
              {self.live_rank}
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--hcp-t-60)' }}>
              of {podSize}
            </span>
          </div>

          {/* Supporting line */}
          <div
            style={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--hcp-t-60)',
              lineHeight: 1.4,
              marginTop: 6,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {self.current_points} pts · {self.rounds_counted} rounds counted
          </div>

          <PromoteRelegateBar liveRank={self.live_rank} podSize={podSize} />

          <ContextCell self={self} allStandings={standings} />
        </GamCard>
      </div>
    </>
  );
};

export default LeaguesCard;
