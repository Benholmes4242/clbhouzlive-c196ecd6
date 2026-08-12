/**
 * Top100MoversSection — "Opinion is moving".
 *
 * The list is fixed; opinion is not. Three rows inline, the rest behind
 * "View all". Hidden entirely when fewer than two courses have moved: a
 * movers list of one is not a story.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AMBER, HAIRLINE_INK_8, INK, INK_MUTE, INK_TINT_04, SURFACE } from '@/features/courses/_shared/tokens';
import type { Top100Mover } from '@/hooks/top100/useTop100Movers';

/** Numerals stay in the Geist stack: monospace faces slash their zeros. */
const MONO = 'inherit';
const GREEN = '#047857';
const RED = '#B91C1C';

export function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`;
}

export const MoverRow: React.FC<{
  mover: Top100Mover;
  showCount?: boolean;
  onClick: () => void;
  divider: boolean;
}> = ({ mover, showCount = false, onClick, divider }) => {
  const { t } = useTranslation('courses');
  const up = mover.rating_delta > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        padding: '9px 12px',
        borderTop: divider ? `1px solid ${HAIRLINE_INK_8}` : 'none',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: 40,
          height: 30,
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
          background: INK_TINT_04,
        }}
      >
        {mover.thumbnail_url && (
          <img
            src={mover.thumbnail_url}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {mover.course_name}
        </div>
        <div style={{ ...FIGS, fontSize: 11, fontWeight: 500, color: INK_MUTE, marginTop: 2 }}>
          {mover.avg_rating != null
            ? t('top100.movers.now', { rating: mover.avg_rating.toFixed(1) })
            : mover.country}
          {showCount && mover.rating_count > 0
            ? ` \u00b7 ${t('top100.movers.fromRatings', { count: mover.rating_count })}`
            : ''}
        </div>
      </div>

      <span
        style={{
          fontFamily: MONO,
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"zero" 0, "tnum" 1',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: up ? GREEN : RED,
          flexShrink: 0,
        }}
      >
        {formatDelta(mover.rating_delta)}
      </span>
    </button>
  );
};

interface Props {
  movers: Top100Mover[];
  onViewAll: () => void;
}

export const Top100MoversSection: React.FC<Props> = ({ movers, onViewAll }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();

  if (movers.length < 2) return null;

  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${HAIRLINE_INK_8}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 12px',
          borderBottom: `1px solid ${HAIRLINE_INK_8}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            {t('top100.movers.kicker')}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.02em',
              marginTop: 3,
            }}
          >
            {t('top100.movers.title')}
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          style={{ fontSize: 11.5, fontWeight: 700, color: AMBER, whiteSpace: 'nowrap' }}
        >
          {t('top100.movers.viewAll')}
        </button>
      </div>

      {movers.slice(0, 3).map((mover, i) => (
        <MoverRow
          key={mover.course_id}
          mover={mover}
          divider={i > 0}
          onClick={() => navigate(`/courses/${mover.course_id}`)}
        />
      ))}
    </div>
  );
};

export default Top100MoversSection;
