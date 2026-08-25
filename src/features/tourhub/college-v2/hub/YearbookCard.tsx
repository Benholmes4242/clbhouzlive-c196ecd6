/**
 * YearbookCard - one row of the College Hub feed.
 *
 * Left: rank. Center: crest squircle + college name + a sub-line of
 * "{n} alumni . {n} wins . {n} top 10 . {movement}" (each segment omitted
 * when absent). Right: season earnings + the EARNINGS label + the live
 * count. No facepile: the three faces that used to sit here were an
 * arbitrary slice of an unordered query, not "top" anything.
 *
 * Every row sits on the same grid - rank 1 gets no gold and no inset.
 *
 * Card tap navigates to the existing college profile:
 *   /tourhub/college-golf/:normalizedName
 * (contract preserved for C2 rebuild.)
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AMBER,
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
  TREND_UP,
  TREND_DOWN,
  STATUS_LIVE,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { formatEarnings } from '@/features/tourhub/_shared/formatEarnings';
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
  /** Fired on tap in both navigate and pick modes (analytics). */
  onTap?: (mode: 'navigate' | 'pick') => void;
}

const DOT = '\u00B7';

function YearbookCardInner({ standing, liveCount, onSelect, selected, onTap }: Props) {
  const { t } = useTranslation('tourhub');

  const cardBg = selected ? 'rgba(247,147,30,0.10)' : SURFACE;
  const cardBorder = selected ? `1px solid ${AMBER}` : 'none';

  const move = standing.rankChange;
  const hasMove = move != null && move !== 0;
  const moveText = hasMove
    ? move > 0
      ? `\u25B2 ${Math.abs(move)}`
      : `\u25BC ${Math.abs(move)}`
    : '';
  const moveColor = hasMove && move > 0 ? TREND_UP : TREND_DOWN;

  const wrapperStyle = {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '13px 16px',
    background: cardBg,
    border: cardBorder,
    borderRadius: selected ? 10 : 0,
    margin: selected ? '8px 8px 0' : 0,
    textDecoration: 'none',
    color: 'inherit',
    fontFamily: FONT,
    cursor: 'pointer',
  };

  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 22,
          flex: '0 0 22px',
          fontSize: 15,
          fontWeight: 500,
          color: INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
          textAlign: 'right',
          letterSpacing: '-0.02em',
        }}
      >
        {standing.rank}
      </div>

      {/* Crest */}
      <div
        style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: INK,
              }}
            >
              {(standing.shortName ?? standing.collegeName).slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        {/* Traced canonical hairline (light surface). */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            border: '1px solid rgba(255,255,255,0.18)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Name + sub */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
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
            fontSize: 11,
            fontWeight: 600,
            color: INK_MUTE,
            marginTop: 2,
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums lining-nums',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{t('college.row.alumni', { count: standing.alumniCount })}</span>
          {standing.winsTotal > 0 && (
            <span>
              {` ${DOT} `}
              {t('college.row.wins', { count: standing.winsTotal })}
            </span>
          )}
          {standing.top10Total > 0 && (
            <span>
              {` ${DOT} `}
              {t('college.row.top10', { count: standing.top10Total })}
            </span>
          )}
          {hasMove && (
            <span>
              {` ${DOT} `}
              <span style={{ color: moveColor, fontWeight: 700 }}>{moveText}</span>
            </span>
          )}
        </div>
      </div>

      {/* Earnings + live */}
      <div style={{ width: 84, flex: '0 0 84px', textAlign: 'right' }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {formatEarnings(standing.earningsTotal)}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: INK_FAINT,
            marginTop: 3,
          }}
        >
          {t('college.row.earningsLabel')}
        </div>
        {liveCount > 0 && (
          <div
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: STATUS_LIVE,
              fontVariantNumeric: 'tabular-nums lining-nums',
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
            {t('college.row.live', { count: liveCount })}
          </div>
        )}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => {
          onTap?.('pick');
          onSelect(standing.normalizedName);
        }}
        aria-pressed={selected ? true : false}
        style={{ ...wrapperStyle, appearance: 'none' }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={`/tourhub/college-golf/${standing.normalizedName}`}
      style={wrapperStyle}
      onClick={() => onTap?.('navigate')}
    >
      {content}
    </Link>
  );
}

export const YearbookCard = memo(YearbookCardInner);
export default YearbookCard;
