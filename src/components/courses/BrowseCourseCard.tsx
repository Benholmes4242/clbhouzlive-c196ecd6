import React from 'react';

import { getOptimizedImageUrl, generateImageSrcSet } from '@/utils/enhancedImageOptimization';
import { A, FIGS, SANS, SUB_SCORE_GREEN_MIN } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import type { StatBrowseRow } from './useStatBrowse';
import { courseRankLabels, RANK_LIST_BY_SLUG as SLUG } from '@/features/courses/_shared/courseRankLabels';
import { DISCOVER_SHELL_SURFACE, surfaceWithAlpha } from '@/lib/tokens/surfaces';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
  /** Top 100 only: display name pairing with row.course_record. The record
      line renders only when BOTH are present (the course hero's rule), which
      is why no username can reach this card. */
  recordHolder?: string | null;
  /** Top 100 only: up to three members, most rounds first. */
  players?: Array<{ id: string; name: string | null; photoUrl: string | null }>;
}

const NO_PLAYERS: NonNullable<BrowseCourseCardProps['players']> = [];

export function BrowseCourseCard({
  row,
  difficultyPercentile,
  onClick,
  variant = 'browse',
  rank = null,
  viewerRounds = 0,
  viewerBest = null,
  recordHolder = null,
  players = NO_PLAYERS,
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
        {/* THE PHOTOGRAPH IS ABOUT YOU, THE STRIP BELOW IT IS ABOUT EVERYONE ELSE.
            The amber "You played" chip is the only chip the photograph carries.
            The old top-right chip counted rounds and lied about crowds (a dozen
            rounds by one member read as a crowd), so it is gone. The member
            count, the faces and the course record now arrive in the batched
            enrichment read the page already makes (get_post_course_context +
            one user_profiles read) and render in the strip below.
            DELIBERATE OMISSION: no per-card "Rate it" control. This card's
            root is a button, so a control here would nest a button inside a
            button. */}
        {top100 && viewerRounds > 0 ? (
          <div style={{ ...GLASS_CHIP, left: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: A.AMBER }} />
            {viewerBest != null ? <>You played · Best <span style={FIGS}>{viewerBest}</span></> : 'You played'}
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
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              {/* Nine and above takes the shared green so the headline agrees with
                  the category figures beneath it. Below nine stays INK, not MUTE,
                  because this figure sits on a photograph. Do NOT swap this for
                  the shared category tone helper in the analytical tokens module:
                  it returns MUTE below 9 (right in a panel, wrong here — it would
                  dim every card's score), and courseRatingConsistency asserts
                  this card never reaches for it. */}
              <div style={{ ...FIGS, color: row.community_rating >= SUB_SCORE_GREEN_MIN ? A.GREEN : A.INK, fontSize: top100 ? 24 : 26, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {row.community_rating.toFixed(1)}
              </div>
              <div style={{ marginTop: 4, marginRight: '-0.19em', color: PHOTO_DIM, fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {row.review_count} {row.review_count === 1 ? 'rating' : 'ratings'}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ padding: '0 20px' }}>
        {top100 && row.members > 0 ? (
          <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, fontSize: 11, color: A.DIM }}>
            {players.length > 0 ? (
              <span
                aria-hidden="true"
                style={{ flex: 'none', position: 'relative', height: 20, width: 19 + (players.length - 1) * 12 }}
              >
                {players.map((player, index) => (
                  <span
                    key={player.id}
                    style={{
                      position: 'absolute', left: index * 12, top: 0, width: 19, height: 20,
                      borderRadius: '34%', zIndex: 3 - index, boxShadow: `0 0 0 1.5px ${A.CANVAS}`,
                    }}
                  >
                    <SquircleAvatar src={player.photoUrl} userId={player.id} size={19} alt={player.name ?? ''} hairlineRing />
                  </span>
                ))}
              </span>
            ) : null}
            <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: A.BODY, fontWeight: 600 }}>
                <span style={FIGS}>{row.members}</span> {row.members === 1 ? 'member' : 'members'}
              </span>
              {row.course_record != null && recordHolder ? (
                <>
                  {' · Best '}
                  <span style={fig}>{row.course_record}</span>
                  {' by '}
                  <span style={{ color: A.BODY, fontWeight: 600 }}>{recordHolder}</span>
                </>
              ) : null}
            </span>
          </div>
        ) : null}
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
            <span style={{ color: A.FAINT }}>No member has logged an official round yet.</span>{' '}
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