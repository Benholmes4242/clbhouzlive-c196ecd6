import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { activityRoundId } from '../hooks/useActivityRoundSummaries';
/** AC2 folded round row: up to three actor avatars (newest first), the
 * "{n} golfers posted rounds" sentence, an optional Best line and the
 * See-all opener. No score tile. Opening is the page's concern — this row
 * only reports the tap. */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ACT } from './ledgerKinds';
import { bestRoundLine, openOrder } from '../activityFoldRules';
import type { ActivityFeedRowV2 } from '../hooks/useActivityFeedV2';
import type { ActivityRoundSummary } from '../hooks/useActivityRoundSummaries';

interface Props {
  rows: ActivityFeedRowV2[];
  summaries: Map<string, ActivityRoundSummary>;
  onOpen: () => void;
}

export const ActivityFoldedRoundsRow: React.FC<Props> = ({ rows, summaries, onOpen }) => {
  const best = bestRoundLine(rows, summaries);
  const bestActor = openOrder(rows, summaries).find(row => { const id = activityRoundId(row); return id && summaries.get(id)?.holes_played === 18; });
  return (
    <div
      className="activity-fold-row"
      data-testid="activity-fold-row"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{ borderBottom: `0.5px solid ${ACT.HAIR}` }}
    >
      <div className="activity-fold-stack" data-testid="activity-fold-stack">
        {rows.slice(0, 3).map((r) => (
          <SquircleAvatar
            key={r.notif_id}
            size={30}
            src={r.actor_avatar_url}
            alt={r.actor_display_name ?? ''}
            /* userId seeds the fallback colour only — the fold row has no
               per-actor navigation, the whole row opens the fold. */
            userId={r.actor_user_id}
            ringColor={ACT.CANVAS}
            ringWidth={2}
          />
        ))}
      </div>
      <div className="activity-fold-text">
        <div className="activity-fold-sentence">
          <strong>{rows.length} golfers</strong> posted rounds
        </div>
        {best && (
          <div className="activity-fold-best" data-testid="activity-fold-best">
            Best: <InlineProMemberName userId={bestActor?.actor_kind === 'business' ? undefined : bestActor?.actor_user_id}>{best.name}</InlineProMemberName>, {best.gross} at {best.course}
          </div>
        )}
        <div className="activity-fold-more">See all {rows.length} ›</div>
      </div>
    </div>
  );
};

export default ActivityFoldedRoundsRow;
