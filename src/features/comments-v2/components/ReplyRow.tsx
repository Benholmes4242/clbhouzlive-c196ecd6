/**
 * ReplyRow — in-card reply row for CommentCard. Smaller avatar, own like.
 */
import { useNavigate } from 'react-router-dom';
import { Heart, MoreHorizontal } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { getActorRouteByType } from '@/types/actor';
import { CommentImageV2 } from './CommentImageV2';
import type { CommentV2 } from '../hooks/useCommentsV2';

const INK = '#1F2428';
const MUTED = '#AEB4BC';
const SECONDARY = '#8A9099';
const AMBER = '#F7931E';

interface Props {
  comment: CommentV2;
  currentUserId: string | null;
  registerRef?: (id: string) => (el: HTMLDivElement | null) => void;
  highlighted?: boolean;
  onLike: (id: string) => void;
  onMore: (c: CommentV2) => void;
  onClose?: () => void;
}

export function ReplyRow({ comment, currentUserId, registerRef, highlighted, onLike, onMore, onClose }: Props) {
  const navigate = useNavigate();
  const deleted = !comment.user_id || comment.display_name === 'Deleted user';

  return (
    <div
      ref={registerRef?.(comment.id)}
      className="flex gap-2 pt-2"
      style={{
        transition: 'background-color 300ms',
        background: highlighted ? 'rgba(247,147,30,0.05)' : 'transparent',
        borderRadius: 8,
        padding: highlighted ? '6px 6px 2px' : undefined,
      }}
    >
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
          size={28}
          src={comment.avatar_url}
          alt={comment.display_name}
          fallback={comment.display_name?.charAt(0) || '?'}
          hairlineRing ringColor={LIGHT_HAIRLINE}
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="truncate" style={{ fontSize: 12.5, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
            {comment.display_name}
          </span>
          {comment.actor_type === 'business' && (
            <span style={{
              padding: '1px 5px', borderRadius: 3, fontSize: 8.5, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              background: 'rgba(247,147,30,0.10)', color: AMBER,
            }}>BUSINESS</span>
          )}
          <span style={{ fontSize: 10.5, color: MUTED }}>
            {relativeTime(comment.created_at)}
          </span>
          {comment.is_edited && <span style={{ fontSize: 10.5, color: MUTED }}>· edited</span>}
        </div>

        {comment.content && (
          <MentionText
            as="div"
            text={comment.content}
            className="mt-0.5 whitespace-pre-wrap"
            style={{ fontSize: 12.5, lineHeight: 1.5, color: INK }}
            onMentionTap={(m) => {
              onClose?.();
              navigate(m.entityType === 'business' ? `/business/${m.entityId}` : `/profile/${m.entityId}`);
            }}
          />
        )}

        {comment.media_url && comment.media_type === 'image' && (
          <CommentImageV2 mediaUrl={comment.media_url} height={110} />
        )}

        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => onLike(comment.id)}
            className="flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
            aria-label={comment.has_liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={13}
              strokeWidth={2}
              style={{
                fill: comment.has_liked ? AMBER : 'none',
                color: comment.has_liked ? AMBER : SECONDARY,
              }}
            />
            {comment.likes_count > 0 && (
              <span className="tabular-nums" style={{ fontSize: 11, fontWeight: 600, color: comment.has_liked ? AMBER : SECONDARY }}>
                {comment.likes_count}
              </span>
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onMore(comment)}
        className="shrink-0 self-start bg-transparent border-0 p-1 cursor-pointer"
        aria-label="More"
        style={{ color: MUTED }}
      >
        <MoreHorizontal size={14} />
      </button>
    </div>
  );
}

export default ReplyRow;
