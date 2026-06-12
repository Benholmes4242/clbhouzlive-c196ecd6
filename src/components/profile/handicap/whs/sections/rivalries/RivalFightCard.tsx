import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { useRivalryDimension } from '@/lib/whs/utils/useRivalryDimension';
import { rivalKey } from '@/lib/whs/utils/rivalryTiering';
import { computeStreak } from './_shared/streakUtils';
import {
  pickHeadline,
  computeCrowns,
  emptyCrowns,
  type RivalCrowns,
} from './_shared/headlineEngine';
import { CrownStrip } from './_shared/crowns/CrownStrip';

const FONT_GEIST =
  'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const GOLD  = '#FBBC2E';
const AMBER = '#F7931E';
const MUTED = 'rgba(255,255,255,0.5)';

interface Props {
  rivalry: FriendRivalryHydrated;
  crowns?: RivalCrowns;
  rank: number;
  total: number;
  onTap?: () => void;
  youLabel?: string;
}

export const RivalFightCard: React.FC<Props> = ({
  rivalry,
  crowns,
  rank,
  total,
  onTap,
  youLabel = 'YOU',
}) => {
  const key = rivalKey(rivalry);
  const [dimension, setDimension] = useRivalryDimension(key);
  const record =
    (dimension === 'gross' ? rivalry.gross_record : rivalry.stableford_record) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
    };
  const results = rivalry.shared_round_results ?? [];
  const streakInfo = useMemo(() => computeStreak(results, dimension), [results, dimension]);
  const signedStreak =
    streakInfo == null ? 0 : streakInfo.who === 'you' ? streakInfo.count : -streakInfo.count;

  const safeCrowns: RivalCrowns = crowns ?? emptyCrowns(key ?? '');
  const crownInfos = useMemo(() => computeCrowns(safeCrowns), [safeCrowns]);

  const headline = useMemo(
    () => pickHeadline({
      crowns: safeCrowns,
      wins: record.wins,
      losses: record.losses,
      streak: signedStreak,
    }),
    [safeCrowns, record.wins, record.losses, signedStreak],
  );

  const rivalDisplayName = reformatFriendName(rivalry.rival_name ?? 'Unknown');

  // Hero photo fallback chain — venue isn't on the hydrated type yet, so we
  // fall back through the available portrait sources.
  const heroPhoto =
    (rivalry as any).most_played_venue_photo_url ??
    rivalry.rival_header_photo_url ??
    rivalry.rival_profile_photo_url ??
    rivalry.rival_thumbnail_url ??
    null;

  const isWinningOverall = record.wins > record.losses;
  const themLeads = record.losses > record.wins;
  const youColor = isWinningOverall ? GOLD : MUTED;
  const themColor = themLeads ? GOLD : MUTED;
  const accentColor = isWinningOverall ? GOLD : '#94A3B8';

  const tappable = typeof onTap === 'function';
  const Tag: any = tappable ? 'button' : 'div';

  return (
    <Tag
      {...(tappable ? { type: 'button' as const, onClick: onTap } : {})}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#06080C',
        fontFamily: FONT_GEIST,
        cursor: tappable ? 'pointer' : 'default',
        color: '#FFFFFF',
        boxShadow: '0 12px 28px -16px rgba(0,0,0,0.5)',
      }}
    >
      {/* HERO */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 6',
          ...(heroPhoto
            ? {
                backgroundImage: `url(${heroPhoto})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                background: 'var(--hcp-bg-2)',
              }),
        }}
      >
        {/* Amber warm overlay (screen blend) */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(247,147,30,0.22) 0%, rgba(247,147,30,0) 55%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Bottom scrim for legibility */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top row: badge + rank */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 10px 5px 7px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <Star size={11} strokeWidth={2.4} color="#FFFFFF" />
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 900,
                letterSpacing: '0.18em',
                color: '#FFFFFF',
              }}
            >
              RIVAL
            </span>
          </div>

          {total > 1 && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.7)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rank} / {total}
            </div>
          )}
        </div>

        {/* Bottom: headline */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: accentColor,
              marginBottom: 4,
            }}
          >
            {headline.title}
          </div>
          {headline.sub && (
            <div
              style={{
                fontSize: 11.5,
                color: 'rgba(255,255,255,0.78)',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"kern" 1, "liga" 1',
              }}
            >
              {headline.sub}
            </div>
          )}
        </div>
      </div>

      {/* IDENTITY + SCORE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 14px 12px',
        }}
      >
        <SquircleAvatar
          size={44}
          hideRing
          src={pickAvatarSrc(rivalry.rival_thumbnail_url, rivalry.rival_profile_photo_url)}
          alt={rivalDisplayName}
          fallback={initials(rivalDisplayName)}
        />

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {rivalDisplayName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 2,
            }}
          >
            HCP {fmtHcp(rivalry.rival_handicap)} · {rivalry.shared_rounds_count} rounds
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {/* Scoring dimension toggle */}
          <div
            role="group"
            aria-label="Scoring dimension"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              padding: 2,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {(['gross', 'stableford'] as const).map((opt) => {
              const active = dimension === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDimension(opt);
                  }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: active ? '#FFFFFF' : 'transparent',
                    color: active ? '#0F172A' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {opt === 'gross' ? 'Gross' : 'Stbl'}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFeatureSettings: '"kern" 1, "liga" 1',
            }}
          >
            {/* Left column: you / owner */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span
                style={{
                  color: youColor,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 800,
                  fontSize: 27,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {record.wins}
              </span>
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: youColor,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {youLabel}
              </span>
            </div>

            <span
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: 18,
                fontWeight: 800,
                alignSelf: 'flex-start',
                marginTop: 4,
              }}
            >
              –
            </span>

            {/* Right column: them */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span
                style={{
                  color: themColor,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 800,
                  fontSize: 27,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {record.losses}
              </span>
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: themColor,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {firstName(rivalry.rival_name ?? 'Them')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CROWN STRIP */}
      <CrownStrip crowns={crownInfos} />
    </Tag>
  );
};

export default RivalFightCard;
