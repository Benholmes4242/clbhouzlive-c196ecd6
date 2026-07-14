/**
 * YearbookCard — one row of the College Hub feed.
 *
 * Left: rank number (gold when 1). Center: crest squircle + college name +
 * "{alumniCount} alumni · {movement}" sub. Right: pointsTotal / "PTS" +
 * live badge. Below: 3 overlapping alumni faces + surnames strip.
 *
 * Card tap navigates to the existing college profile:
 *   /tourhub/college-golf/:normalizedName
 * (contract preserved for C2 rebuild.)
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  AMBER,
  FONT,
  GOLD,
  GOLD_DEEP,
  GOLD_BORDER,
  GOLD_TINT_10,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  TREND_UP,
  TREND_DOWN,
  STATUS_LIVE,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import type { YearbookStanding } from './data/useFranchiseStandings';

interface Props {
  standing: YearbookStanding;
  liveCount: number;
  /**
   * When provided, the card behaves as a picker button (compare pick mode)
   * instead of navigating to the profile. Receives the college normalizedName.
   */
  onSelect?: (slug: string) => void;
  /** Visual "chosen" state during compare pick mode. */
  selected?: boolean;
}

function formatPoints(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function YearbookCardInner({ standing, liveCount, onSelect, selected }: Props) {
  const isTop = standing.rank === 1;
  const rankColor = isTop ? GOLD_DEEP : INK;
  const pointsColor = isTop ? GOLD_DEEP : INK;
  const cardBg = selected
    ? 'rgba(247,147,30,0.10)'
    : isTop
    ? `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${SURFACE} 68%)`
    : SURFACE;
  const cardBorder = selected
    ? `1px solid ${AMBER}`
    : isTop
    ? `1px solid ${GOLD_BORDER}`
    : 'none';

  const move = standing.rankChange;
  const moveText =
    move == null || move === 0
      ? '—'
      : move > 0
      ? `▲ ${Math.abs(move)}`
      : `▼ ${Math.abs(move)}`;
  const moveColor =
    move == null || move === 0
      ? INK_FAINT
      : move > 0
      ? TREND_UP
      : TREND_DOWN;

  const alumni = standing.topAlumni.slice(0, 3);
  const surnamesLine = alumni.map((a) => surnameOf(a.name)).join(', ');

  const wrapperStyle = {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '12px 16px',
    borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
    background: cardBg,
    border: cardBorder,
    borderRadius: isTop || selected ? 10 : 0,
    margin: isTop || selected ? '8px 8px 0' : 0,
    textDecoration: 'none',
    color: 'inherit',
    fontFamily: FONT,
    cursor: 'pointer',
  };

  const content = (
    <>
      {/* Top row: rank | crest | name+sub | points */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 22,
            fontSize: 16,
            fontWeight: 200,
            color: rankColor,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
            letterSpacing: '-0.02em',
          }}
        >
          {standing.rank}
        </div>

        {/* Crest */}
        <div
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: '34%',
            overflow: 'hidden',
            background: isTop ? GOLD_TINT_10 : 'rgba(15,23,42,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isTop ? `1px solid ${GOLD_BORDER}` : `0.5px solid ${HAIRLINE_INK_10}`,
          }}
          aria-hidden
        >
          {standing.logoUrl ? (
            <img
              src={standing.logoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: isTop ? GOLD_DEEP : INK,
              }}
            >
              {(standing.shortName ?? standing.collegeName).slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + sub */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {standing.collegeName}
          </div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: INK_MUTE,
              marginTop: 2,
              letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {standing.alumniCount} alumni {'\u00B7'}{' '}
            <span style={{ color: moveColor, fontWeight: 700 }}>{moveText}</span>
          </div>
        </div>

        {/* Points */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 200,
              color: pointsColor,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {formatPoints(standing.pointsTotal)}
          </div>
          <div
            style={{
              fontSize: 6.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: isTop ? GOLD_DEEP : INK_MUTE,
              marginTop: 3,
            }}
          >
            PTS
          </div>
        </div>
      </div>

      {/* Alumni strip */}
      {alumni.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
            paddingLeft: 34,
          }}
        >
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {alumni.map((a, i) => (
              <div
                key={a.id}
                style={{
                  marginLeft: i === 0 ? 0 : -6,
                  border: `1.5px solid ${isTop ? '#FFF7E6' : SURFACE}`,
                  borderRadius: '34%',
                  overflow: 'hidden',
                }}
              >
                <SquircleAvatar
                  size={20}
                  srcCandidates={a.photoUrl ? [a.photoUrl] : []}
                  alt={a.name}
                />
              </div>
            ))}
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: INK_MUTE,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {surnamesLine}
          </div>
          {liveCount > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.10em',
                color: STATUS_LIVE,
                flexShrink: 0,
                textTransform: 'uppercase',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: STATUS_LIVE,
                  display: 'inline-block',
                }}
              />
              {liveCount} LIVE
            </div>
          )}
        </div>
      )}
      {/* Suppress unused-var lint noise for AMBER/GOLD imports used in future variants. */}
      <span style={{ display: 'none' }} aria-hidden data-a={AMBER} data-g={GOLD} />
    </Link>
  );
}

export const YearbookCard = memo(YearbookCardInner);
export default YearbookCard;
