/**
 * CommentCard - one top-level comment rendered as a ROW (no card, no shadow,
 * no radius). Rows are separated by a hairline; the first row has no top
 * border. Replies stay threaded in-row via ReplyRow.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MoreHorizontal } from 'lucide-react';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { getActorRouteByType } from '@/types/actor';
import { CommentImageV2 } from './CommentImageV2';
import { ReplyRow } from './ReplyRow';
import { FIGS, A } from '@/features/courses/components/holes/analytical/tokens';
import { isEmojiOnly } from '../lib/emojiOnly';
import type { CommentV2 } from '../hooks/useCommentsV2';

/* Dark baseline (MICRO_BRIEF_COMMENTS_DARK §2). Row separation is hairline
   only, so the border sits one step stronger than its light counterpart. */
const INK = A.INK;
const MUTE = A.MUTE;
const DIM = 'rgba(248,250,252,0.42)';
const AMBER = '#F7931E';
const BORDER = A.BORDER;
const CONNECTOR = 'rgba(255,255,255,0.14)';

const INITIAL_REPLIES = 3;

interface Props {
  comment: CommentV2;
  currentUserId: string | null;
  isFirst?: boolean;
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
  isFirst,
  registerRef,
  highlightedId,
  onReply,
  onLike,
  onMore,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);

  const deleted = !comment.user_id || comment.display_name === 'Deleted user';
  const replies = comment.replies;
  const showAll = expanded || replies.length <= INITIAL_REPLIES;
  const visibleReplies = showAll ? replies : replies.slice(replies.length - INITIAL_REPLIES);
  const hiddenCount = replies.length - visibleReplies.length;
  const big = isEmojiOnly(comment.content);

  return (
    <div
      ref={registerRef?.(comment.id)}
      style={{
        padding: isFirst ? '0 0 16px' : '16px 0',
        borderTop: isFirst ? undefined : `1px solid ${BORDER}`,
        transition: 'background-color 300ms',
        background: highlightedId === comment.id ? 'rgba(247,147,30,0.12)' : 'transparent',
      }}
    >
      {/* Parent row */}
      <div className="flex" style={{ gap: 11 }}>
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
            size={34}
            src={comment.avatar_url}
            alt={comment.display_name}
            userId={comment.actor_id ?? comment.user_id}
            fallback={comment.display_name?.charAt(0) || '?'}
            hairlineRing ringColor={DARK_HAIRLINE}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate" style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
              {comment.display_name}
            </span>
            {comment.actor_type === 'business' && (
              <span style={{
                padding: '1px 5px', borderRadius: 3, fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                background: 'rgba(247,147,30,0.16)', color: AMBER,
              }}>{t('comments.business')}</span>
            )}
            <span style={{ ...FIGS, fontSize: 13, color: DIM }}>
              {relativeTime(comment.created_at)}
            </span>
            {comment.is_edited && <span style={{ ...FIGS, fontSize: 13, color: DIM }}>{'\u00B7'} {t('comments.edited')}</span>}
          </div>

          {comment.content && (
            <MentionText
              as="div"
              text={comment.content}
              className="mt-1 whitespace-pre-wrap"
              style={big
                ? { fontSize: 32, lineHeight: 1.15, color: INK }
                : { fontSize: 14, lineHeight: 1.5, color: INK }}
              onMentionTap={(m) => {
                onClose?.();
                navigate(m.entityType === 'business' ? `/business/${m.entityId}` : `/profile/${m.entityId}`);
              }}
            />
          )}

          {comment.media_url && comment.media_type === 'image' && (
            <CommentImageV2 mediaUrl={comment.media_url} />
          )}

          {/* Action bar */}
          <div className="flex items-center gap-4 mt-2">
            <button
              type="button"
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
              aria-label={comment.has_liked ? t('comments.unlike') : t('comments.like')}
            >
              <Heart
                size={15}
                strokeWidth={2}
                style={{
                  fill: comment.has_liked ? AMBER : 'none',
                  color: comment.has_liked ? AMBER : MUTE,
                  transition: 'color 150ms, fill 150ms',
                }}
              />
              {comment.likes_count > 0 && (
                <span style={{ ...FIGS, fontSize: 13, fontWeight: 600, color: comment.has_liked ? AMBER : MUTE }}>
                  {comment.likes_count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="bg-transparent border-0 p-0 cursor-pointer"
              style={{ ...FIGS, fontSize: 13, fontWeight: 600, color: MUTE }}
            >
              {t('comments.reply')}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onMore(comment)}
          className="shrink-0 self-start bg-transparent border-0 p-1 cursor-pointer"
          aria-label={t('comments.more')}
          style={{ color: DIM }}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div style={{ marginLeft: 17, paddingLeft: 20, marginTop: 8, borderLeft: `1px solid ${CONNECTOR}` }}>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="bg-transparent border-0 p-0 cursor-pointer"
              style={{ ...FIGS, fontSize: 13, fontWeight: 600, color: MUTE, marginBottom: 4 }}
            >
              {t('comments.viewMoreReplies', { count: hiddenCount })}
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
