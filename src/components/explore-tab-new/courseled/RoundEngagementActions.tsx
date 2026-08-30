import React from 'react';

import { CommentAction } from './CommentAction';
import { ReactionAction } from './ReactionAction';

/**
 * One canonical round-engagement pair for every round surface.
 * Order is invariant: COMMENT, then HEART. The pair is deliberately content-
 * sized: zero counts render no node and reserve no width.
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

export function RoundEngagementActions({ comment, like, size = 15, gap = 12 }: Props) {
  return (
    <span
      data-round-engagement="comment-heart"
      style={{ display: 'inline-flex', alignItems: 'center', gap, flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      {comment && (
        <CommentAction
          count={comment.count}
          onOpen={comment.onOpen}
          label={comment.label}
          size={size}
        />
      )}
      <ReactionAction
        hidden={like.hidden}
        readOnly={like.readOnly}
        count={like.count}
        reacted={like.reacted}
        onToggle={like.onToggle}
        label={like.label}
        size={size}
      />
    </span>
  );
}

export default RoundEngagementActions;