import React from 'react';
import { Flame } from 'lucide-react';
import {
  FONT,
  TAB,
  BG_1,
  T100,
  T70,
  T50,
  T35,
  GOLD,
  GREEN,
  RED,
  
  LINE_2,
} from './_shared/tokens';
import { firstName } from './_shared/helpers';
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
  currentStreak,
  ownerView,
}) => {
  const record =
    dim === 'stableford' ? rivalry.stableford_record : rivalry.gross_record;
  const wins = record?.wins ?? 0;
  const losses = record?.losses ?? 0;
  const ties = record?.ties ?? 0;
  const decided = wins + losses;
  const yourPct = decided > 0 ? Math.round((wins / decided) * 100) : null;
  const theirPct = decided > 0 ? Math.round((losses / decided) * 100) : null;

  const rivalFull = reformatFriendName(rivalry.rival_name) || 'Rival';
  const rivalFirst = firstName(rivalFull);
  const leftLabel = ownerView ? 'You' : firstName(yourFullName);

  const youLead = wins > losses;
  const themLead = losses > wins;
  const gradient = youLead
    ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(15,23,42,0.6) 100%)'
    : themLead
      ? 'linear-gradient(180deg, rgba(159,29,29,0.10) 0%, rgba(159,29,29,0.02) 50%, rgba(15,23,42,0.6) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)';

  const streakColor = currentStreak.side === 'you' ? GREEN : RED;
  const streakTint =
    currentStreak.side === 'you'
      ? 'rgba(5,150,105,0.18)'
      : 'rgba(159,29,29,0.18)';

  const rivalAvatar = pickAvatarSrc(
    rivalry.rival_thumbnail_url,
    (rivalry as any).rival_profile_photo_url,
  );

  const winsStr = String(wins);
  const lossesStr = String(losses);
  const winsSize = winsStr.length >= 3 ? 24 : 38;
  const lossesSize = lossesStr.length >= 3 ? 24 : 38;

  return (
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          position: 'relative',
          background: BG_1,
          backgroundImage: gradient,
          border: `1px solid rgba(255,255,255,0.12)`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: '18px 18px 0',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* LEFT */}
          <SideBlock
            avatarUrl={yourAvatarUrl}
            fallbackChar={(leftLabel[0] ?? '?').toUpperCase()}
            label={leftLabel.toUpperCase()}
            labelColor={T100}
            handicap={yourHandicap}
            winPct={yourPct}
            isSelf
            alignRight={false}
          />

          {/* CENTRE — record */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 120,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 6,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontFamily: FONT,
                ...TAB,
              }}
            >
              <span style={{ color: GOLD, fontSize: winsSize, fontWeight: 800 }}>
                {wins}
              </span>
              <span style={{ color: T35, fontSize: 24, fontWeight: 700 }}>
                –
              </span>
              <span style={{ color: T70, fontSize: lossesSize, fontWeight: 800 }}>
                {losses}
              </span>
            </div>
            {ties > 0 && (
              <div
                style={{
                  marginTop: 6,
                  color: T50,
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  fontFamily: FONT,
                  ...TAB,
                }}
              >
                {ties} {ties === 1 ? 'TIE' : 'TIES'}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <SideBlock
            avatarUrl={rivalAvatar}
            fallbackChar={(rivalFirst[0] ?? '?').toUpperCase()}
            label={rivalFirst.toUpperCase()}
            labelColor={T70}
            handicap={rivalry.rival_handicap}
            winPct={theirPct}
            isSelf={false}
            alignRight
          />
        </div>

        {/* Streak ribbon — full bleed */}
        {currentStreak.side && currentStreak.count > 0 ? (
          <div
            style={{
              marginTop: 16,
              padding: '10px 18px',
              background: streakTint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: streakColor,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: FONT,
              ...TAB,
            }}
          >
            <Flame size={13} strokeWidth={2.4} />
            {currentStreak.side === 'you' ? 'You' : rivalFirst} ·{' '}
            {currentStreak.count} round win streak
          </div>
        ) : (
          <div style={{ height: 18 }} />
        )}
      </div>
    </div>
  );
};

interface SideBlockProps {
  avatarUrl: string | null;
  fallbackChar: string;
  label: string;
  labelColor: string;
  handicap: number | null;
  winPct: number | null;
  isSelf: boolean;
  alignRight: boolean;
}

const SideBlock: React.FC<SideBlockProps> = ({
  avatarUrl,
  fallbackChar,
  label,
  labelColor,
  handicap,
  winPct,
  isSelf,
  alignRight,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: avatarUrl
          ? `url(${avatarUrl}) center/cover`
          : 'rgba(255,255,255,0.06)',
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
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: FONT,
      }}
    >
      {label}
    </div>
    {(handicap != null || winPct != null) && (
      <div
        style={{
          color: T50,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: FONT,
          ...TAB,
        }}
      >
        {handicap != null && <span>hcp {Number(handicap).toFixed(1)}</span>}
        {handicap != null && winPct != null && (
          <span style={{ color: T35, margin: '0 4px' }}>·</span>
        )}
        {winPct != null && <span>{winPct}%</span>}
      </div>
    )}
  </div>
);
