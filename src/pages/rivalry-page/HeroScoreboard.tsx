import React from 'react';
import { Swords, Flame } from 'lucide-react';
import {
  FONT,
  TAB,
  BG_1,
  T100,
  T60,
  T40,
  GOLD,
  GREEN,
  RED,
  AMBER,
  LINE,
  LINE_2,
} from './_shared/tokens';
import { firstName, formatMonthYear } from './_shared/helpers';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';

interface Props {
  rivalry: FriendRivalryHydrated;
  dim: RivalryDimension;
  yourAvatarUrl: string | null;
  yourFirstName: string;
  yourFullName: string | null;
  yourHandicap: number | null;
  firstRoundDate: string | null;
  currentStreak: { side: 'you' | 'them' | null; count: number };
  ownerView: boolean;
}

export const HeroScoreboard: React.FC<Props> = ({
  rivalry,
  dim,
  yourAvatarUrl,
  yourFirstName,
  yourFullName,
  yourHandicap,
  firstRoundDate,
  currentStreak,
  ownerView,
}) => {
  const record =
    dim === 'stableford' ? rivalry.stableford_record : rivalry.gross_record;
  const wins = record?.wins ?? 0;
  const losses = record?.losses ?? 0;
  const ties = record?.ties ?? 0;
  const total = wins + losses + ties;
  const youLead = wins > losses;
  const themLead = losses > wins;

  const rivalFull = rivalry.rival_name ?? 'Rival';
  const rivalFirst = firstName(rivalry.rival_name);
  const leftLabel = ownerView ? 'You' : firstName(yourFullName);
  const titleLeft = ownerView ? 'You' : firstName(yourFullName);

  // Gradient: gold-tinted when you lead, red-tinted when they lead, neutral on tie
  const gradient = youLead
    ? 'linear-gradient(135deg, rgba(251,188,46,0.16) 0%, rgba(247,147,30,0.06) 50%, rgba(255,255,255,0.02) 100%)'
    : themLead
      ? 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.04) 50%, rgba(255,255,255,0.02) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)';

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: AMBER,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: FONT,
          }}
        >
          <Swords size={12} strokeWidth={2.4} />
          Rivalry
        </div>
        <div
          style={{
            color: T60,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: FONT,
            ...TAB,
          }}
        >
          {total} {total === 1 ? 'round' : 'rounds'}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          color: T100,
          fontSize: 26,
          fontWeight: 900,
          lineHeight: 1.1,
          fontFamily: FONT,
          letterSpacing: '-0.01em',
        }}
      >
        {titleLeft} vs {rivalFull}
      </div>
      {firstRoundDate && (
        <div
          style={{
            marginTop: 4,
            color: T60,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          Head-to-head since {formatMonthYear(firstRoundDate)}
        </div>
      )}

      {/* Scoreboard card */}
      <div
        style={{
          position: 'relative',
          marginTop: 16,
          padding: '24px 20px 18px',
          background: BG_1,
          backgroundImage: gradient,
          border: `1px solid ${LINE_2}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Watermark */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -10,
            bottom: -20,
            opacity: 0.06,
            transform: 'rotate(-12deg)',
            color: T100,
            pointerEvents: 'none',
          }}
        >
          <Swords size={130} strokeWidth={1.5} />
        </div>

        {/* Top row: avatars + scores */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Side
            avatarUrl={yourAvatarUrl}
            fallbackChar={(leftLabel[0] ?? '?').toUpperCase()}
            label={leftLabel.toUpperCase()}
            labelColor={AMBER}
            score={wins}
            isWinning={wins > losses}
            handicap={yourHandicap}
            alignRight={false}
          />
          <div
            style={{
              color: T40,
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1,
              ...TAB,
            }}
          >
            —
          </div>
          <Side
            avatarUrl={rivalry.rival_thumbnail_url}
            fallbackChar={(rivalFirst[0] ?? '?').toUpperCase()}
            label={rivalFirst.toUpperCase()}
            labelColor={T100}
            score={losses}
            isWinning={losses > wins}
            handicap={rivalry.rival_handicap}
            alignRight
          />
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: 'relative',
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${LINE}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: T60,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONT,
            ...TAB,
          }}
        >
          <span>
            {ties} {ties === 1 ? 'tie' : 'ties'}
          </span>
          {currentStreak.side && currentStreak.count > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: currentStreak.side === 'you' ? GREEN : RED,
                fontWeight: 700,
              }}
            >
              <Flame size={12} strokeWidth={2.4} />
              {currentStreak.side === 'you' ? 'You' : rivalFirst} ·{' '}
              {currentStreak.count} streak
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface SideProps {
  avatarUrl: string | null;
  fallbackChar: string;
  label: string;
  labelColor: string;
  score: number;
  isWinning: boolean;
  handicap: number | null;
  alignRight: boolean;
}

const Side: React.FC<SideProps> = ({
  avatarUrl,
  fallbackChar,
  label,
  labelColor,
  score,
  isWinning,
  handicap,
  alignRight,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: alignRight ? 'flex-end' : 'flex-start',
      gap: 6,
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '34%',
        background: avatarUrl
          ? `url(${avatarUrl}) center/cover`
          : 'rgba(255,255,255,0.06)',
        border: isWinning ? `2px solid ${GOLD}` : `1px solid ${LINE_2}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: T100,
        fontWeight: 800,
        fontSize: 18,
        fontFamily: FONT,
        flexShrink: 0,
      }}
      aria-hidden
    >
      {!avatarUrl && fallbackChar}
    </div>
    <div
      style={{
        color: labelColor,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontFamily: FONT,
      }}
    >
      {label}
    </div>
    <div
      style={{
        color: isWinning ? GOLD : T60,
        fontSize: 52,
        fontWeight: 900,
        lineHeight: 1,
        fontFamily: FONT,
        ...TAB,
      }}
    >
      {score}
    </div>
    {handicap != null && (
      <div
        style={{
          color: T60,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: FONT,
          ...TAB,
        }}
      >
        hcp {handicap.toFixed(1)}
      </div>
    )}
  </div>
);
