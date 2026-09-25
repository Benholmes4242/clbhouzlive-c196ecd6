import React from 'react';

import { CommentAction } from './CommentAction';
import { ReactionAction } from './ReactionAction';
import { CELEBRATE_GLYPH_SIZE, celebrateFigureSize, type ReactionKind } from '@/lib/reactionKind';

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
  /** ReviewBottomSheet shares this pair and keeps the heart; round surfaces pass 'celebrate'. */
  kind?: ReactionKind;
}

export function RoundEngagementActions({ comment, like, size: sizeProp, kind = 'like' }: Props) {
  // One size feeds BOTH glyphs so the comment bubble moves with the clap.
  const celebrateDefault = kind === 'celebrate' && sizeProp == null;
  const size = sizeProp ?? (celebrateDefault ? CELEBRATE_GLYPH_SIZE : 15);
  const figureSize = celebrateDefault ? celebrateFigureSize(size) : undefined;
  return (
    <span
      data-round-engagement="comment-heart"
      style={{ display: 'inline-flex', alignItems: 'center', gap: celebrateDefault ? 18 : 12, flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      {comment && (
        <CommentAction
          count={comment.count}
          onOpen={comment.onOpen}
          label={comment.label}
          size={size}
          figureSize={figureSize}
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
        figureSize={figureSize}
        kind={kind}
      />
    </span>
  );
}

export default RoundEngagementActions;