/**
 * CB68 — Business home Section 3: Do next. Signed-off biz-donext.html.
 *
 * Renders NOTHING until every source its role can see has settled, then
 * once; with no trigger it renders nothing at all (no heading, no space).
 * A source that errors drops only its own trigger (see doNext.ts). Sources:
 * the membership row (already settled by the page), pending team requests,
 * the unreplied-reviews read and useBusinessWeek (shared cache with This week).
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';
import { useBusinessPendingRequestsOldest } from '@/hooks/useBusinessPendingRequestsOldest';
import { useBusinessReviews } from '@/hooks/useBusinessReviews';
import { useBusinessWeek } from '@/hooks/useBusinessWeek';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { H } from './BusinessHomeHeader';
import { buildDoNext, type DoNextItem } from './doNext';

/** Unreplied reviews read for the oldest wait; the summary count is authoritative. */
export const DO_NEXT_REVIEWS_LIMIT = 500;

export function BusinessDoNextCard({ membership }: { membership: BusinessMembership }) {
  const navigate = useNavigate();
  const { role, business } = membership;
  const manager = role === 'owner' || role === 'admin';
  const editorPlus = manager || role === 'editor';
  const needReviews = manager && !!business.club_id && business.is_verified === true;

  const pendingQ = useBusinessPendingRequestsOldest(manager ? business.id : undefined);
  const reviewsQ = useBusinessReviews(needReviews ? business.id : undefined, {
    filter: 'unreplied', sort: 'recent', limit: DO_NEXT_REVIEWS_LIMIT,
  });
  const weekQ = useBusinessWeek(editorPlus ? business.id : undefined);

  const settled =
    (!manager || !pendingQ.isPending) &&
    (!needReviews || !reviewsQ.isPending) &&
    (!editorPlus || !weekQ.isPending);

  const items = useMemo<DoNextItem[]>(() => {
    if (!editorPlus || !settled) return [];
    const reviewsData = reviewsQ.data;
    const oldestReview = reviewsData?.reviews.reduce<string | null>(
      (min, r) => (!min || r.review_date < min ? r.review_date : min), null,
    ) ?? null;
    return buildDoNext({
      role,
      business,
      pending: pendingQ.isError ? undefined : pendingQ.data,
      reviews: reviewsQ.isError || !reviewsData ? undefined : { awaiting: reviewsData.summary.awaiting_reply, oldestAt: oldestReview },
      week: weekQ.isError ? undefined : weekQ.data,
    });
  }, [editorPlus, settled, role, business, pendingQ.isError, pendingQ.data, reviewsQ.isError, reviewsQ.data, weekQ.isError, weekQ.data]);

  if (items.length === 0) return null;

  const tap = (item: DoNextItem) => {
    if (item.onTap.type === 'post') {
      usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: item.onTap.actorId });
    } else {
      navigate(item.onTap.to);
    }
  };

  return (
    <section
      data-business-do-next=""
      style={{ margin: '12px 16px 0', background: H.card, border: `1px solid ${H.line}`, borderRadius: 18, padding: 16 }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: H.mute }}>
        Do next
      </div>
      <div style={{ marginTop: 10 }}>
        {items.map((item, i) => (
          <div
            key={item.kind}
            data-do-next={item.kind}
            style={{
              display: 'flex', gap: 12, alignItems: 'center',
              padding: i === 0 ? '4px 0 11px' : '11px 0',
              borderTop: i === 0 ? 0 : `1px solid ${H.hair}`,
            }}
          >
            <div
              data-do-next-num=""
              style={{
                width: 22, height: 22, borderRadius: 11, border: '1px solid rgba(255,255,255,0.18)', flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: H.mute,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: 14, fontWeight: 700, color: H.ink }}>{item.title}</b>
              {item.sub && (
                <span style={{ display: 'block', marginTop: 2, fontSize: 12, lineHeight: 1.38, color: H.mute }}>{item.sub}</span>
              )}
            </div>
            <button
              type="button"
              data-do-next-action=""
              onClick={() => tap(item)}
              style={{
                flex: 'none', height: 30, padding: '0 13px', borderRadius: 15, border: `1px solid ${H.btnHair}`,
                background: H.actFill, color: H.ink, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center',
              }}
            >
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
