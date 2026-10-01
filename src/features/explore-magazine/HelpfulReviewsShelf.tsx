import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { A, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { r } from '@/lib/radius';
import { ReactionGlyph } from '@/lib/reactionKind';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreShelf } from './ExploreShelf';
import type { StreamItem } from './streamItem';

/**
 * MOST HELPFUL REVIEWS (BRIEF_COURSES_DISCOVERY §B3). Where reviews live now
 * they no longer lead the Courses feed. Landscape tiles on the panel colour,
 * the quote leads. A review's reaction is 'helpful' — a THUMBS-UP, never a clap.
 */
const TILE_W = 236;

export function HelpfulReviewsShelf({
  items,
  countFor,
  pos,
  onPress,
}: {
  items: StreamItem[];
  countFor: (reviewId: string) => number;
  pos: number;
  onPress: (item: StreamItem) => void;
}) {
  const { t } = useTranslation('courses');
  const rows = useMemo(
    () =>
      items
        .filter((item) => item.kind === 'review' && item.facts.review_id && (item.facts.first_sentence ?? '').trim())
        .map((item) => ({ item, count: countFor(item.facts.review_id as string) }))
        .sort((a, b) => b.count - a.count || a.item.id.localeCompare(b.item.id))
        .slice(0, 12),
    [items, countFor],
  );
  if (rows.length === 0) return null;

  return (
    <ExploreShelf
      heading={t('amateur.shelf.helpfulReviews', 'Most helpful reviews')}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'reviews_helpful', pos })}
    >
      {rows.map(({ item, count }) => {
        const own = !!item.who?.is_viewer;
        const name = own ? t('amateur.courseCard.you', 'You') : item.who?.display_name ?? t('amateur.courseCard.aMember', 'A member');
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              analyticsEvents.track('amateur_shelf_tile_tapped', { kind: 'reviews_helpful', pos });
              onPress(item);
            }}
            style={{
              all: 'unset',
              boxSizing: 'border-box',
              flex: `0 0 ${TILE_W}px`,
              width: TILE_W,
              padding: 14,
              borderRadius: r.md,
              background: A.PANEL,
              cursor: 'pointer',
              fontFamily: SANS,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <p
              style={{
                margin: 0, fontSize: 13, fontStyle: 'italic', lineHeight: 1.45, color: A.BODY,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
            >
              {item.facts.first_sentence}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <SquircleAvatar size={22} src={item.who?.photo_url ?? null} alt={name} userId={item.who?.user_id ?? null} hairlineRing hideRing={false} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: own ? A.AMBER : A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.subject?.course_name ?? ''}
                  {item.facts.rating != null ? (
                    <>
                      {' \u00B7 '}
                      <span style={NUMF}>{Number(item.facts.rating).toFixed(1)}</span>
                    </>
                  ) : null}
                </div>
              </div>
              {count > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: A.AMBER, fontSize: 12, ...NUMF }}>
                  {/* A count label, not the viewer's state: outline; inherits the row colour
                      via the shelf-only color override. */}
                  <ReactionGlyph reacted={false} size={14} color="currentColor" />
                  {count}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </ExploreShelf>
  );
}

export default HelpfulReviewsShelf;
