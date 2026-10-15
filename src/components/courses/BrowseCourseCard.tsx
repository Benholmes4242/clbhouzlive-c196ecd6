import React from 'react';

import { getOptimizedImageUrl, generateImageSrcSet } from '@/utils/enhancedImageOptimization';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import type { StatBrowseRow } from './useStatBrowse';
import { courseRankLabels, type RankList } from '@/features/courses/_shared/courseRankLabels';
import { DISCOVER_SHELL_SURFACE, surfaceWithAlpha } from '@/lib/tokens/surfaces';

const PHOTO_H = 196;
const PHOTO_MUTE = 'rgba(255,255,255,0.66)';
const PHOTO_DIM = 'rgba(255,255,255,0.55)';
const RANK_GLASS = 'rgba(15,23,42,0.42)';
const GLASS_CHIP: React.CSSProperties = {
  position: 'absolute', top: 14, padding: '5px 10px', borderRadius: 999,
  background: RANK_GLASS, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  color: A.INK, fontSize: 10.5, fontWeight: 700,
  fontVariantNumeric: 'tabular-nums lining-nums', whiteSpace: 'nowrap',
};

function RankBadge({ memberships }: { memberships: StatBrowseRow['memberships'] }) {
  const SLUG: Record<string, RankList> = { global: 'global', 'gb-i': 'gbi', usa: 'usa', europe: 'europe' };
  const labels = courseRankLabels(
    memberships
      .filter((entry) => entry.list_slug in SLUG && entry.rank != null)
      .map((entry) => ({ list: SLUG[entry.list_slug], rank: Number(entry.rank) })),
  );
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
      {labels.join(' \u00B7 ')}
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
  /** Top 100 only: the viewer's best gross here, or null when unknown. */
  viewerBest?: number | null;
}

export function BrowseCourseCard({
  row,
  difficultyPercentile,
  onClick,
  variant = 'browse',
  rank = null,
  viewerRounds = 0,
  viewerBest = null,
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
        {/* BRIEF_TOP_100_REBUILD §4 — three states. You played: amber-dot chip
            top-left. Members played, you have not: rounds chip top-right.
            Nobody: no chip (the meta strip carries the frontier line). */}
        {top100 && viewerRounds > 0 ? (
          <div style={{ ...GLASS_CHIP, left: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: A.AMBER }} />
            {viewerBest != null ? <>You played · best <span style={FIGS}>{viewerBest}</span></> : 'You played'}
          </div>
        ) : top100 && row.rounds > 0 ? (
          <div style={{ ...GLASS_CHIP, right: 20 }}>
            <span style={FIGS}>{row.rounds}</span> {row.rounds === 1 ? 'round' : 'rounds'} tracked
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
        {top100 && row.rounds === 0 && viewerRounds === 0 ? (
          <div style={{ marginTop: 11, fontSize: 11, lineHeight: 1.5 }}>
            <span style={{ color: A.FAINT }}>No member has played here yet.</span>{' '}
            <span style={{ color: A.DIM }}>Be the first.</span>
          </div>
        ) : null}
        <CategoryScores
          scores={{ design: row.design_score, condition: row.condition_score, clubhouse: row.clubhouse_score, facilities: row.facilities_score }}
          marginTop={14}
        />
      </div>
    </button>
  );
}

export default BrowseCourseCard;