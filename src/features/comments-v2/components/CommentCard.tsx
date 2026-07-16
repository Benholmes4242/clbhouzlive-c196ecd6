/**
 * CommentCard — a full "conversation card" for one top-level comment.
 * White surface, hairline border, subtle shadow. Encloses replies in-card
 * with a left connector; shows the latest 3 replies + a "View N more" expander.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MoreHorizontal } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { getActorRouteByType } from '@/types/actor';
import { CommentImageV2 } from './CommentImageV2';
import { ReplyRow } from './ReplyRow';
import type { CommentV2 } from '../hooks/useCommentsV2';

const INK = '#1F2428';
const MUTED = '#AEB4BC';
const SECONDARY = '#8A9099';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(0,0,0,0.07)';
const CONNECTOR = '#EDEFF2';

const INITIAL_REPLIES = 3;

interface Props {
  comment: CommentV2;
  currentUserId: string | null;
  registerRef?: (id: string) => (el: HTMLDivElement | null) => void;
  highlightedId?: string | null;
  onReply: (c: CommentV2) => void;
  onLike: (id: string) => void;
  onMore: (c: CommentV2) => void;
  onClose?: () => void;
}

export function CommentCard({
  comment,
  currentUserId,
  registerRef,
  highlightedId,
  onReply,
  onLike,
  onMore,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const deleted = !comment.user_id || comment.display_name === 'Deleted user';
  const replies = comment.replies;
  const showAll = expanded || replies.length <= INITIAL_REPLIES;
  const visibleReplies = showAll ? replies : replies.slice(replies.length - INITIAL_REPLIES);
  const hiddenCount = replies.length - visibleReplies.length;

  return (
    <div
      ref={registerRef?.(comment.id)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 16,
        boxShadow: '0 2px 10px rgba(31,36,40,0.04)',
        padding: 14,
        transition: 'background-color 300ms',
        ...(highlightedId === comment.id ? { background: 'rgba(247,147,30,0.05)' } : null),
      }}
    >
      {/* Parent row */}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={deleted}
          onClick={() => {
            if (deleted) return;
            onClose?.();
            navigate(getActorRouteByType(comment.actor_type, comment.actor_id, comment.slug));
          }}
          className="shrink-0 bg-transparent border-0 p-0"
          style={{ cursor: deleted ? 'default' : 'pointer' }}
        >
          <SquircleAvatar
            size={40}
            src={comment.avatar_url}
            alt={comment.display_name}
            fallback={comment.display_name?.charAt(0) || '?'}
            hairlineRing ringColor={LIGHT_HAIRLINE}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate" style={{ fontSize: 13.5, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
              {comment.display_name}
            </span>
            {comment.actor_type === 'business' && (
              <span style={{
                padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                background: 'rgba(247,147,30,0.10)', color: AMBER,
              }}>BUSINESS</span>
            )}
            <span style={{ fontSize: 11, color: MUTED }}>
              {relativeTime(comment.created_at)}
            </span>
            {comment.is_edited && <span style={{ fontSize: 11, color: MUTED }}>· edited</span>}
          </div>

          {comment.content && (
            <MentionText
              as="div"
              text={comment.content}
              className="mt-1 whitespace-pre-wrap"
              style={{ fontSize: 14, lineHeight: 1.5, color: INK }}
              onMentionTap={(m) => {
                onClose?.();
                navigate(m.entityType === 'business' ? `/business/${m.entityId}` : `/profile/${m.entityId}`);
              }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => onMore(comment)}
          className="shrink-0 self-start bg-transparent border-0 p-1 cursor-pointer"
          aria-label="More"
          style={{ color: MUTED }}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Full-width image */}
      {comment.media_url && comment.media_type === 'image' && (
        <CommentImageV2 mediaUrl={comment.media_url} />
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 mt-2" style={{ paddingLeft: 51 }}>
        <button
          type="button"
          onClick={() => onLike(comment.id)}
          className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
          aria-label={comment.has_liked ? 'Unlike' : 'Like'}
        >
          <Heart
            size={15}
            strokeWidth={2}
            style={{
              fill: comment.has_liked ? AMBER : 'none',
              color: comment.has_liked ? AMBER : SECONDARY,
              transition: 'color 150ms, fill 150ms',
            }}
          />
          {comment.likes_count > 0 && (
            <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 600, color: comment.has_liked ? AMBER : SECONDARY }}>
              {comment.likes_count}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onReply(comment)}
          className="bg-transparent border-0 p-0 cursor-pointer"
          style={{ fontSize: 12, fontWeight: 600, color: SECONDARY }}
        >
          Reply
        </button>
      </div>

      {/* Replies enclosed */}
      {replies.length > 0 && (
        <div style={{ marginLeft: 19, paddingLeft: 20, marginTop: 10, borderLeft: `2px solid ${CONNECTOR}` }}>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="bg-transparent border-0 p-0 cursor-pointer"
              style={{ fontSize: 12, fontWeight: 600, color: SECONDARY, marginBottom: 4 }}
            >
              View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {visibleReplies.map((r) => (
            <ReplyRow
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              registerRef={registerRef}
              highlighted={highlightedId === r.id}
              onLike={onLike}
              onMore={onMore}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentCard;
