import React from 'react';
import { useTranslation } from 'react-i18next';

import { getOptimizedImageUrl, generateImageSrcSet } from '@/utils/enhancedImageOptimization';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SubScoreStack } from '@/features/courses/_shared/scoreBands';
import type { StatBrowseRow } from './useStatBrowse';
import { DISCOVER_SHELL_SURFACE, surfaceWithAlpha } from '@/lib/tokens/surfaces';

const PHOTO_H = 196;
const PHOTO_MUTE = 'rgba(255,255,255,0.66)';
const PHOTO_DIM = 'rgba(255,255,255,0.55)';
const RANK_GLASS = 'rgba(15,23,42,0.42)';

function RankBadge({ memberships }: { memberships: StatBrowseRow['memberships'] }) {
  const labels = memberships
    .filter((entry) => ['global', 'gb-i', 'usa', 'europe'].includes(entry.list_slug))
    .sort((a, b) => {
      const order = ['global', 'gb-i', 'usa', 'europe'];
      return order.indexOf(a.list_slug) - order.indexOf(b.list_slug);
    })
    .map((entry) => {
      const label = entry.list_slug === 'global'
        ? 'world'
        : entry.list_slug === 'gb-i'
          ? 'GB&I'
          : entry.list_slug.toUpperCase();
      return `#${entry.rank} ${label}`;
    });
  if (labels.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute', top: 14, left: 20, padding: '5px 10px', borderRadius: 999,
        background: RANK_GLASS, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        color: A.INK, fontFamily: SANS, fontSize: 11, fontWeight: 700,
        fontVariantNumeric: 'tabular-nums lining-nums', whiteSpace: 'nowrap',
      }}
    >
      {labels.join(' | ')}
    </div>
  );
}

interface BrowseCourseCardProps {
  row: StatBrowseRow;
  difficultyPercentile?: number | null;
  onClick: () => void;
  variant?: 'browse' | 'top100';
  rank?: number | null;
  viewerRounds?: number;
  ratedWithoutRoundsNote?: string;
}

export function BrowseCourseCard({
  row,
  difficultyPercentile,
  onClick,
  variant = 'browse',
  rank = null,
  viewerRounds = 0,
  ratedWithoutRoundsNote,
}: BrowseCourseCardProps) {
  const top100 = variant === 'top100';
  const hasRoundFacts = row.rounds > 0 && row.avg_to_par != null;
  const avg = row.avg_to_par == null
    ? null
    : row.avg_to_par > 0
      ? `+${row.avg_to_par.toFixed(1)}`
      : row.avg_to_par < 0
        ? `−${Math.abs(row.avg_to_par).toFixed(1)}`
        : null;
  const { t } = useTranslation('courses');
  const fig: React.CSSProperties = { ...FIGS, color: A.INK, fontSize: 14, fontWeight: 700, letterSpacing: '-0.04em' };
  /* Comparison only at the ends of the field (>=80 harder, <=20 easier).
     "Easier" uses 100 - pct: the complement absorbs ties, immaterial at whole
     percentages — deliberate, do not "fix". */
  const pct = difficultyPercentile;
  const comparison = pct == null
    ? null
    : pct >= 80
      ? { word: 'harder', value: pct }
      : pct <= 20
        ? { word: 'easier', value: 100 - pct }
        : null;
  const bars = [
    { label: t('top100.stats.design'), score: row.design_score },
    { label: t('top100.stats.condition'), score: row.condition_score },
    { label: t('top100.stats.clubhouse'), score: row.clubhouse_score },
    { label: t('top100.stats.facilities'), score: row.facilities_score },
  ];
  const location = [row.region, row.sub_country].filter(Boolean).join(', ') || row.country;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${row.name}`}
      style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', fontFamily: SANS }}
    >
      <div style={{ position: 'relative', height: top100 ? 178 : PHOTO_H, overflow: 'hidden' }}>
        {row.image_url ? (
          <img
            src={getOptimizedImageUrl(row.image_url, { width: 640 })}
            srcSet={generateImageSrcSet(row.image_url, [{ width: 400 }, { width: 640 }, { width: 800 }])}
            sizes="100vw"
            alt=""
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : <div style={{ width: '100%', height: '100%', background: A.PANEL }} />}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '58%',
            background: `linear-gradient(0deg, ${surfaceWithAlpha(DISCOVER_SHELL_SURFACE, 0.68)} 0%, ${surfaceWithAlpha(DISCOVER_SHELL_SURFACE, 0.4)} 48%, ${surfaceWithAlpha(DISCOVER_SHELL_SURFACE, 0)} 100%)`,
          }}
        />
        {!top100 ? <RankBadge memberships={row.memberships} /> : null}
        {top100 && viewerRounds > 0 ? (
          <div
            style={{
              position: 'absolute', top: 14, left: 20, padding: '5px 10px', borderRadius: 999,
              background: RANK_GLASS, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              color: A.AMBER, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              fontVariantNumeric: 'tabular-nums lining-nums', whiteSpace: 'nowrap',
            }}
          >
            PLAYED <span style={{ letterSpacing: 0 }}>{viewerRounds}</span>
          </div>
        ) : null}
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 14, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          {top100 && rank != null ? (
            <div
              className="tabular-nums lining-nums"
              style={{ flexShrink: 0, color: PHOTO_DIM, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {rank}
            </div>
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: A.INK, fontSize: 18, fontWeight: 700, letterSpacing: '-0.028em', lineHeight: 1.12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.name}
            </div>
            {!top100 ? (
              <div style={{ marginTop: 3, color: PHOTO_MUTE, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {location}
              </div>
            ) : null}
          </div>
          {row.community_rating != null ? (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ ...FIGS, color: A.INK, fontSize: top100 ? 24 : 26, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {row.community_rating.toFixed(1)}
              </div>
              <div style={{ marginTop: 4, color: PHOTO_DIM, fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {row.review_count} {row.review_count === 1 ? 'rating' : 'ratings'}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ padding: '0 20px' }}>
        {hasRoundFacts ? (
          <div style={{ marginTop: 11, whiteSpace: 'nowrap', color: A.DIM, fontSize: 11 }}>
            Plays to{' '}
            {avg == null ? 'level par' : <span style={fig}>{avg}</span>}
            {' '}on average{comparison ? (
              <>, {comparison.word} than <span style={fig}>{comparison.value}%</span> of courses.</>
            ) : '.'}
          </div>
        ) : null}
        {top100 && row.community_rating != null && row.rounds === 0 && ratedWithoutRoundsNote ? (
          <div style={{ marginTop: 11, color: A.DIM, fontSize: 11, lineHeight: 1.5 }}>
            {ratedWithoutRoundsNote}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 10, marginTop: 13 }}>
          {bars.map(({ label, score }) =>
            score != null ? <SubScoreStack key={label} label={label} score={score} /> : null,
          )}
        </div>
      </div>
    </button>
  );
}

export default BrowseCourseCard;