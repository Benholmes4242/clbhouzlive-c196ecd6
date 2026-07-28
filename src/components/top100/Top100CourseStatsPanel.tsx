/**
 * Top100CourseStatsPanel — the same contained COURSE STATS module the
 * Clubhouse feed and Discover use, in its light-surface form.
 *
 * Cells are omitted when null; a dash is never shown. When no member has
 * rated the course the panel becomes a prompt instead, which is the whole
 * reason this module belongs in the Top 100 tab.
 *
 * This component NEVER fetches — everything arrives batched from
 * useTop100Enrichment.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flag } from 'lucide-react';
import { AMBER, HAIRLINE_INK_8, INK, INK_TINT_02 } from '@/features/courses/_shared/tokens';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';

const RED = '#DC2626';
const LABEL_INK = 'rgba(15,23,42,0.42)';
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

export const STATS_PANEL_HEIGHT = 66;

const figureStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 17,
  fontWeight: 800,
  letterSpacing: '-0.035em',
  lineHeight: 1.1,
};

const labelStyle: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: LABEL_INK,
  lineHeight: 1,
  marginTop: 3,
  whiteSpace: 'nowrap',
};

interface Props {
  data: Top100Enrichment | undefined;
  onRate: () => void;
}

export const Top100CourseStatsPanel: React.FC<Props> = ({ data, onRate }) => {
  const { t } = useTranslation('courses');

  const rating = data?.rating ?? null;
  const ratingCount = data?.ratingCount ?? 0;
  const avgOverPar = data?.avgOverPar ?? null;

  const shell: React.CSSProperties = {
    height: STATS_PANEL_HEIGHT,
    background: INK_TINT_02,
    border: `1px solid ${HAIRLINE_INK_8}`,
    borderRadius: 10,
    padding: '8px 0 9px',
    display: 'flex',
    flexDirection: 'column',
  };

  const heading = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', marginBottom: 6 }}>
      <Flag size={9} color={AMBER} strokeWidth={2.5} />
      <span
        style={{
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: AMBER,
          lineHeight: 1,
        }}
      >
        {t('top100.stats.heading')}
      </span>
    </div>
  );

  // No member has rated it yet -> turn the gap into a prompt.
  if (rating == null || ratingCount === 0) {
    return (
      <div style={shell}>
        {heading}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '0 12px',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(15,23,42,0.55)',
              lineHeight: 1.2,
              letterSpacing: '-0.005em',
            }}
          >
            {t('top100.stats.emptyBody')}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRate();
            }}
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: AMBER,
              padding: '5px 10px',
              borderRadius: 999,
              border: `1px solid ${HAIRLINE_INK_8}`,
              background: '#FFFFFF',
            }}
          >
            {t('top100.stats.beTheFirst')}
          </button>
        </div>
      </div>
    );
  }

  const cells: { key: string; figure: string; label: string; color: string }[] = [
    {
      key: 'rating',
      figure: rating.toFixed(1),
      label: t('top100.stats.memberRating'),
      color: INK,
    },
    {
      key: 'count',
      figure: String(ratingCount),
      label: t('top100.stats.ratings', { count: ratingCount }),
      color: INK,
    },
  ];

  if (avgOverPar != null) {
    cells.push({
      key: 'avg',
      figure: `${avgOverPar > 0 ? '+' : ''}${avgOverPar.toFixed(1)}`,
      label: t('top100.stats.playsOnAvg'),
      color: RED,
    });
  }

  return (
    <div style={shell}>
      {heading}
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
        {cells.map((cell, i) => (
          <div
            key={cell.key}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
              padding: '0 6px',
              borderLeft: i === 0 ? 'none' : `1px solid ${HAIRLINE_INK_8}`,
            }}
          >
            <div style={{ ...figureStyle, color: cell.color }}>{cell.figure}</div>
            <div style={labelStyle}>{cell.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Top100CourseStatsPanel;
