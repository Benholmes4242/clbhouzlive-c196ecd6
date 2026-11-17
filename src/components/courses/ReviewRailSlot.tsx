/**
 * LATEST REVIEWS card B (BRIEF_COURSES_PAGE_V5 §4, whats-been-played-v5 mock):
 * a 260 × 216 text card in the Best lately grammar — REVIEW kicker, face and
 * rating, course name, three-line quote, footer of the reviewer's name and
 * their rounds here. Only LatestReviewsSection renders this rail (the shell
 * reads its geometry). Placement and selection belong to the section.
 */

import { CourseNameLink } from '@/components/shared/CourseNameLink';
import React from 'react';
import { MentionText } from '@/components/mentions/MentionText';
import { useTranslation } from 'react-i18next';

import { INK, INK_FAINT, INK_MUTE } from '@/features/courses/_shared/tokens';
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import type { ReviewAuthorRound } from './reviewAuthorRounds';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

/* Card geometry, read by the card AND its shell. */
export const CARD_W = 260;
export const REVIEW_H = 216;
export const REVIEW_RADIUS = 16;
export const REVIEW_PAD = 12;
export const REVIEW_GAP = 8;
export const REVIEW_RAIL_X = 16;
export const REVIEW_AVATAR = 24;
export const REVIEW_BG = '#16161B';
const QUOTE_INK = 'rgba(248,250,252,.78)';

const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"zero" 0' };
const ELL: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

/** Footer tail after the name: " · {n} round(s) here · best {gross}" ("your best" for the viewer's own). */
export function reviewFootTail(author: ReviewAuthorRound | undefined, mine: boolean): string {
  if (!author || !(author.rounds_here > 0)) return '';
  const rounds = `${author.rounds_here} ${author.rounds_here === 1 ? 'round' : 'rounds'} here`;
  const best = author.best_gross != null ? ` \u00B7 ${mine ? 'your best' : 'best'} ${author.best_gross}` : '';
  return ` \u00B7 ${rounds}${best}`;
}

interface Props {
  reviews: LatestReview[];
  onReviewPress: (r: LatestReview) => void;
  /** The reviewer's own rounds, keyed by review id; absent means name only. */
  authorRounds?: Map<string, ReviewAuthorRound>;
  /** The viewer: their own review names the best score as theirs. */
  viewerId?: string | null;
}

export const ReviewRailSlot: React.FC<Props> = ({ reviews, onReviewPress, authorRounds, viewerId }) => {
  const { t } = useTranslation('courses');
  if (reviews.length === 0) return null;

  return (
    <section>
      <div style={{ display: 'flex', gap: REVIEW_GAP, overflowX: 'auto', padding: `0 ${REVIEW_RAIL_X}px`, scrollbarWidth: 'none' }}>
        {reviews.map((r) => {
          const mine = !!viewerId && !!r.userId && r.userId === viewerId;
          const name = r.reviewerName || t('discover.reviews.member', 'A member');
          return (
          // CB69 — non-button tile so the course name can be a real button.
          <div
            key={r.reviewId}
            role="button"
            tabIndex={0}
            data-review-card=""
            onClick={() => onReviewPress(r)}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onReviewPress(r);
              }
            }}
            style={{
              width: CARD_W, height: REVIEW_H, flexShrink: 0, boxSizing: 'border-box', textAlign: 'left',
              background: REVIEW_BG, border: 0, borderRadius: REVIEW_RADIUS, padding: REVIEW_PAD,
              display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer', color: INK,
            }}
          >
            <span data-review-kicker="" style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', lineHeight: '10px', color: INK }}>REVIEW</span>
            <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <SquircleAvatar src={r.reviewerAvatar} userId={r.userId} alt={name} size={REVIEW_AVATAR} surface="canvas" hairlineRing />
              <span data-review-score="" style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <b style={{ ...FIGS, fontSize: 22, fontWeight: 700, lineHeight: 1, color: courseSubScoreTone(r.rating) }}>{r.rating.toFixed(1)}</b>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: INK_FAINT }}>/10</span>
              </span>
            </div>
            <CourseNameLink
              as="div"
              courseId={r.courseId}
              textProps={{ 'data-review-rail-course': '' }}
              wrapperStyle={{ marginTop: 8, minWidth: 0, maxWidth: '100%' }}
              style={{
                ...(r.courseId ? null : { marginTop: 8 }),
                display: 'block', fontSize: 13.5, fontWeight: 700, lineHeight: 1.25, color: INK, ...ELL,
              }}
            >
              {r.courseName}
            </CourseNameLink>
            <p style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.4, color: QUOTE_INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
              <MentionText text={r.quote} disableNavigation />
            </p>
            <div data-review-foot="" style={{ marginTop: 'auto', fontSize: 11, lineHeight: '14px', color: INK_MUTE, ...ELL }}>
              <b style={{ fontWeight: 600, color: INK }}>{name}</b>{reviewFootTail(authorRounds?.get(r.reviewId), mine)}
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
};

export default ReviewRailSlot;
