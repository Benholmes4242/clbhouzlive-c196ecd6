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
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
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
  const decided = wins + losses;
  const yourPct = decided > 0 ? Math.round((wins / decided) * 100) : null;
  const theirPct = decided > 0 ? Math.round((losses / decided) * 100) : null;

  const rivalFull = reformatFriendName(rivalry.rival_name) || 'Rival';
  const rivalFirst = firstName(rivalFull);
  const leftLabel = ownerView ? 'You' : firstName(yourFullName);
  const titleLeft = ownerView ? 'You' : firstName(yourFullName);

  const gradient = youLead
    ? 'linear-gradient(180deg, rgba(247,147,30,0.08) 0%, rgba(247,147,30,0.02) 50%, rgba(15,23,42,0.6) 100%)'
    : themLead
      ? 'linear-gradient(180deg, rgba(159,29,29,0.10) 0%, rgba(159,29,29,0.02) 50%, rgba(15,23,42,0.6) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)';

  const streakColor = currentStreak.side === 'you' ? GREEN : RED;
  const streakTint =
    currentStreak.side === 'you'
      ? 'rgba(5,150,105,0.14)'
      : 'rgba(159,29,29,0.14)';

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
            padding: '3px 8px',
            border: `1px solid rgba(247,147,30,0.25)`,
            borderRadius: 999,
            color: AMBER,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
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
          background: BG_1,
          backgroundImage: gradient,
          border: `1px solid rgba(247,147,30,0.20)`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Crossed-swords watermark */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -16,
            bottom: -28,
            opacity: 0.04,
            transform: 'rotate(15deg)',
            color: T100,
            pointerEvents: 'none',
          }}
        >
          <Swords size={160} strokeWidth={1.5} />
        </div>

        {/* Body */}
        <div style={{ position: 'relative', padding: '22px 18px 16px' }}>
          {/* Top row: avatars + scores with centre VS column */}
          <div
            style={{
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
              isWinning={youLead}
              isLosing={themLead}
              handicap={yourHandicap}
              winPct={yourPct}
              alignRight={false}
            />

            <CentreDivider ties={ties} />

            <Side
              avatarUrl={pickAvatarSrc(rivalry.rival_thumbnail_url, (rivalry as any).rival_profile_photo_url)}
              fallbackChar={(rivalFirst[0] ?? '?').toUpperCase()}
              label={rivalFirst.toUpperCase()}
              labelColor={T100}
              score={losses}
              isWinning={themLead}
              isLosing={youLead}
              handicap={rivalry.rival_handicap}
              winPct={theirPct}
              alignRight
            />
          </div>
        </div>

        {/* Streak banner (separate strip) */}
        {currentStreak.side && currentStreak.count > 0 && (
          <div
            style={{
              position: 'relative',
              padding: '10px 16px',
              borderTop: `0.5px solid ${LINE}`,
              background: streakTint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: streakColor,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: FONT,
              ...TAB,
            }}
          >
            <Flame size={13} strokeWidth={2.4} />
            {currentStreak.side === 'you' ? 'You' : rivalFirst} ·{' '}
            {currentStreak.count} round win streak
          </div>
        )}
      </div>
    </div>
  );
};

const CentreDivider: React.FC<{ ties: number }> = ({ ties }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      minWidth: 36,
    }}
  >
    <div
      style={{
        color: T40,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontFamily: FONT,
      }}
    >
      VS
    </div>
    <div
      aria-hidden
      style={{
        width: 1,
        height: 80,
        background:
          'linear-gradient(180deg, rgba(247,147,30,0) 0%, rgba(247,147,30,0.55) 50%, rgba(247,147,30,0) 100%)',
      }}
    />
    <div
      style={{
        color: T40,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        fontFamily: FONT,
        ...TAB,
      }}
    >
      {ties} {ties === 1 ? 'tie' : 'ties'}
    </div>
  </div>
);

interface SideProps {
  avatarUrl: string | null;
  fallbackChar: string;
  label: string;
  labelColor: string;
  score: number;
  isWinning: boolean;
  isLosing: boolean;
  handicap: number | null;
  winPct: number | null;
  alignRight: boolean;
}

const Side: React.FC<SideProps> = ({
  avatarUrl,
  fallbackChar,
  label,
  labelColor,
  score,
  isWinning,
  isLosing,
  handicap,
  winPct,
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
        borderRadius: 14,
        background: avatarUrl
          ? `url(${avatarUrl}) center/cover`
          : 'rgba(255,255,255,0.06)',
        border: isWinning
          ? `2px solid ${GOLD}`
          : isLosing
            ? `2px solid rgba(255,255,255,0.20)`
            : `1px solid ${LINE_2}`,
        boxShadow: isWinning
          ? '0 0 24px -8px rgba(247,147,30,0.45)'
          : 'none',
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
    {(handicap != null || winPct != null) && (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: T60,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: FONT,
          ...TAB,
        }}
      >
        {handicap != null && <span>hcp {handicap.toFixed(1)}</span>}
        {handicap != null && winPct != null && <span style={{ color: T40 }}>·</span>}
        {winPct != null && (
          <span style={{ color: isWinning ? AMBER : T60, fontWeight: 700 }}>
            {winPct}%
          </span>
        )}
      </div>
    )}
  </div>
);
