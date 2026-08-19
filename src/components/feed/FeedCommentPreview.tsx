/**
 * FeedCommentPreview — the newest comment on a feed card, above an
 * add-a-comment prompt.
 *
 * THE PREVIEW RENDERS FROM THE COMMENT, NEVER FROM THE COUNT. Four live rows
 * claim a comment they do not have; a card that trusted comment_count would
 * paint an empty row beneath "1 comment". If no comment is passed, only the
 * prompt renders.
 *
 * The prompt ships WITH the preview: one comment on its own reads as a
 * finished conversation, one comment with an invitation beneath it reads as an
 * open one — and most commented posts here carry one or two.
 *
 * INK: three SOLID tiers, composited from the card's own #F8FAFC ramp over the
 * card surface #10151C so no tone here is produced by opacity.
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { isEmojiOnly } from '@/features/comments-v2/lib/emojiOnly';
import type { FeedCommentPreview as PreviewData } from '@/hooks/feed/useFeedCommentPreview';

const INK = '#F8FAFC';   // strong tier
const MID = '#A7AAAE';   // body tier (0.65 ramp, flattened)
const DIM = '#787C81';   // quietest legible tier (0.45 ramp, flattened)
const LINE = 'rgba(255,255,255,0.08)';

interface Props {
  preview?: PreviewData | null;
  /** comment_count — the TALLY. Never decides whether the preview renders. */
  commentCount: number;
  onOpenComments: () => void;
  /** Viewing member's avatar for the prompt row. */
  viewerAvatarUrl?: string | null;
  viewerName?: string | null;
}

export const FeedCommentPreview: React.FC<Props> = ({
  preview,
  commentCount,
  onOpenComments,
  viewerAvatarUrl,
  viewerName,
}) => {
  const body = preview?.content?.trim() || '';
  const hasComment = !!preview && (!!body || false);
  // "View all n" only above TWO OR MORE. At exactly one, a line pointing at a
  // comment already on screen is noise.
  const total = Math.max(commentCount, preview?.thread_count ?? 0);
  const showViewAll = hasComment && total > 1;
  const emoji = isEmojiOnly(body);

  return (
    <div style={{ borderTop: `0.5px solid ${LINE}`, padding: '9px 14px 11px' }}>
      {showViewAll && (
        <button
          type="button"
          onClick={onOpenComments}
          style={{
            display: 'block',
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginBottom: 7,
            color: MID,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.1,
            textAlign: 'left',
          }}
        >
          View all {total} comments
        </button>
      )}

      {hasComment && (
        <button
          type="button"
          onClick={onOpenComments}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'flex-start',
            gap: 8,
            background: 'transparent',
            border: 'none',
            padding: 0,
            textAlign: 'left',
          }}
        >
          <SquircleAvatar
            src={preview!.avatar_url}
            alt={preview!.display_name}
            size={24}
            hairlineRing
          />
          <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
            <span
              style={{
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: 12.5,
                lineHeight: '17px',
              }}
            >
              <span style={{ color: INK, fontWeight: 700 }}>{preview!.display_name}</span>
              {preview!.actor_type === 'business' && preview!.verified && (
                <VerifiedBadge size="sm" className="inline-block align-[-2px] ml-[3px]" />
              )}
              <span
                style={{
                  color: MID,
                  fontWeight: 500,
                  marginLeft: 6,
                  fontSize: emoji ? 16 : undefined,
                }}
              >
                {body}
              </span>
            </span>
            <span style={{ display: 'block', color: DIM, fontSize: 10.5, fontWeight: 600, marginTop: 2 }}>
              {timeAgo(preview!.created_at)}
            </span>
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={onOpenComments}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          padding: 0,
          marginTop: hasComment ? 9 : 0,
          textAlign: 'left',
        }}
      >
        <SquircleAvatar src={viewerAvatarUrl ?? null} alt={viewerName ?? 'You'} size={22} hairlineRing />
        <span style={{ color: DIM, fontSize: 12.5, fontWeight: 600 }}>Add a comment…</span>
      </button>
    </div>
  );
};

export default FeedCommentPreview;
