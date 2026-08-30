import React from 'react';

import { CommentAction } from './CommentAction';
import { ReactionAction, REACTION_SLOT_W } from './ReactionAction';

/**
 * One canonical round-engagement pair for every round surface.
 * Order is invariant: COMMENT, then HEART. Each action owns a fixed-width slot
 * so count changes never move either glyph or resize the parent surface.
 */

interface RoundCommentAction {
  count: number;
  label: string;
  onOpen: () => void;
}

interface RoundLikeAction {
  count: number;
  reacted: boolean;
  label: string;
  onToggle: () => void;
  hidden?: boolean;
  readOnly?: boolean;
}

interface Props {
  comment: RoundCommentAction | null;
  like: RoundLikeAction;
  size?: number;
  gap?: number;
}

function ActionSlot({ children }: { children?: React.ReactNode }) {
  return (
    <span
      style={{
        width: REACTION_SLOT_W,
        flex: `0 0 ${REACTION_SLOT_W}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      {children}
    </span>
  );
}

export function RoundEngagementActions({ comment, like, size = 15, gap = 4 }: Props) {
  return (
    <span
      data-round-engagement="comment-heart"
      style={{ display: 'inline-flex', alignItems: 'center', gap, flexShrink: 0 }}
    >
      <ActionSlot>
        {comment && (
          <CommentAction
            count={comment.count}
            onOpen={comment.onOpen}
            label={comment.label}
            size={size}
            reserveCount
          />
        )}
      </ActionSlot>
      <ActionSlot>
        <ReactionAction
          hidden={like.hidden}
          readOnly={like.readOnly}
          count={like.count}
          reacted={like.reacted}
          onToggle={like.onToggle}
          label={like.label}
          size={size}
          reserveCount
        />
      </ActionSlot>
    </span>
  );
}

export default RoundEngagementActions;