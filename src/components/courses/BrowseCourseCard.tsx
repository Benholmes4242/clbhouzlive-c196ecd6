import React from 'react';

import { getOptimizedImageUrl, generateImageSrcSet } from '@/utils/enhancedImageOptimization';
import { COURSE_RATING_THEMES } from '@/lib/globalAchievementMilestoneSystem';
import { getRatingTier } from '@/lib/ratingTier';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import type { StatBrowseRow } from './useStatBrowse';

const PHOTO_H = 196;
const TRACK = 'rgba(248,250,252,0.10)';
const PHOTO_MUTE = 'rgba(255,255,255,0.66)';
const PHOTO_DIM = 'rgba(255,255,255,0.55)';
const RANK_GLASS = 'rgba(15,23,42,0.42)';

const CATEGORY_LABELS = [
  ['design_score', 'Design'],
  ['condition_score', 'Condition'],
  ['clubhouse_score', 'Clubhouse'],
  ['facilities_score', 'Facilities'],
] as const;

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

function CategoryBreakdown({ row }: { row: StatBrowseRow }) {
  const scores = CATEGORY_LABELS.flatMap(([key, label]) => {
    const score = row[key];
    return score == null ? [] : [{ label, score }];
  });
  if (scores.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 13 }}>
      {scores.map(({ label, score }) => {
        const fill = Math.max(0, Math.min(100, ((score - 6) / 4) * 100));
        const tier = getRatingTier(score);
        return (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ height: 3, borderRadius: 2, background: TRACK, overflow: 'hidden' }}>
              <div
                data-category-score={score.toFixed(1)}
                style={{ height: '100%', width: `${fill}%`, borderRadius: 2, background: COURSE_RATING_THEMES[tier].accent }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6, minWidth: 0, whiteSpace: 'nowrap' }}>
              <span style={{ ...FIGS, fontSize: 13, fontWeight: 700, letterSpacing: '-0.04em', color: A.INK }}>
                {score.toFixed(1)}
              </span>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11, color: A.DIM }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface BrowseCourseCardProps {
  row: StatBrowseRow;
  difficultyPercentile?: number | null;
  onClick: () => void;
}

export function BrowseCourseCard({ row, difficultyPercentile, onClick }: BrowseCourseCardProps) {
  const hasRoundFacts = row.rounds > 0 && row.avg_to_par != null;
  const avg = row.avg_to_par == null
    ? null
    : row.avg_to_par > 0
      ? `+${row.avg_to_par.toFixed(1)}`
      : row.avg_to_par < 0
        ? `−${Math.abs(row.avg_to_par).toFixed(1)}`
        : 'E';
  const location = [row.region, row.sub_country].filter(Boolean).join(', ') || row.country;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${row.name}`}
      style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', fontFamily: SANS }}
    >
      <div style={{ position: 'relative', height: PHOTO_H, overflow: 'hidden' }}>
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
          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 22%, rgba(10,14,20,0.14) 50%, #15171F 100%)' }}
        />
        <RankBadge memberships={row.memberships} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 14, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: A.INK, fontSize: 18, fontWeight: 700, letterSpacing: '-0.028em', lineHeight: 1.12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.name}
            </div>
            <div style={{ marginTop: 3, color: PHOTO_MUTE, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location}
            </div>
          </div>
          {row.community_rating != null ? (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ ...FIGS, color: A.INK, fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 11 }}>
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ ...FIGS, color: A.INK, fontSize: 14, fontWeight: 700, letterSpacing: '-0.04em' }}>{avg}</span>{' '}
              <span style={{ color: A.DIM, fontSize: 11 }}>avg to par</span>
            </div>
            {difficultyPercentile != null ? (
              <div style={{ whiteSpace: 'nowrap' }}>
                <span style={{ ...FIGS, color: A.INK, fontSize: 14, fontWeight: 700, letterSpacing: '-0.04em' }}>{difficultyPercentile}%</span>{' '}
                <span style={{ color: A.DIM, fontSize: 11 }}>harder than</span>
              </div>
            ) : null}
          </div>
        ) : null}
        <CategoryBreakdown row={row} />
      </div>
    </button>
  );
}

export default BrowseCourseCard;