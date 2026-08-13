/**
 * PostRoundDegraded — the SETTLED-AND-ABSENT state for a post that carries a
 * round which did not resolve (BRIEF_ROUND_POST_HOLLOW_CARD §2).
 *
 * This is NOT a pending state. `PostRoundShell` means "a query is in flight";
 * this means "the round map has settled and has no entry for this post". The
 * two must stay distinguishable — conflating them is what hides the next
 * occurrence.
 *
 * A card degrades to LESS DETAIL, never into a different kind of object: the
 * post still says which course it was played at, so that line renders at the
 * same position and type scale the full block uses for it.
 *
 * RENDER ONLY WHAT THE POST ROW CARRIES. `FeedPost` has `courseName` and the
 * course region fields; it carries NO gross score and NO to-par (those live on
 * `gam_round_stats`, which is exactly what failed to resolve). So no figure is
 * rendered — nothing is computed, inferred, or replaced with a dash. No error
 * text, no retry: this is a member's feed, not a diagnostic surface.
 */
import React, { useEffect, useRef } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';

const MUTE = 'rgba(255,255,255,0.62)';

/** One-shot per post per session. */
const reported = new Set<string>();

interface Props {
  postId: string;
  /** Whether the post resolved a whs_score_id — separates the two failure paths. */
  hasScoreId: boolean;
  courseName?: string | null;
  courseRegion?: string | null;
}

export const PostRoundDegraded: React.FC<Props> = ({
  postId,
  hasScoreId,
  courseName,
  courseRegion,
}) => {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (reported.has(postId)) return;
    reported.add(postId);
    analyticsEvents.track('round_post_degraded', {
      post_id: postId,
      has_score_id: hasScoreId,
    });
  }, [postId, hasScoreId]);

  if (!courseName) return null;

  return (
    <div style={{ background: 'transparent', padding: '14px 14px 16px' }}>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {courseName}
      </div>
      {courseRegion && (
        <div style={{ fontSize: 11.5, color: MUTE, marginTop: 2 }}>{courseRegion}</div>
      )}
    </div>
  );
};

export default PostRoundDegraded;
