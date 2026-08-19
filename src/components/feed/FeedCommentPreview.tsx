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
 * ONE COMPONENT, TWO SURFACES (addendum). This block is shared by FeedCard
 * (dark, #10151C) and LightFeedCard (light, #F8FAFC). Two copies would drift
 * the first time either was touched, and the rules attached here — render from
 * the comment not the count, "view all" only at two or more, replies and
 * non-post targets filtered upstream, business actors resolved as the business
 * — are exactly the kind that must not be kept in step by hand.
 *
 * INK: three SOLID tiers per surface, and the component TAKES ITS TONES FROM
 * THE CARD IT IS IN rather than declaring one palette. Each tier is the card's
 * own alpha ramp composited against that card's background, so no tone here is
 * produced by opacity on either surface:
 *   dark  (#F8FAFC ramp over #10151C): 1.00 #F8FAFC, 0.65 #A7AAAE, 0.45 #787C81
 *   light (#0F172A ramp over #F8FAFC): 1.00 #0F172A, 0.60 #6E747F, 0.42 #969BA4
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { isEmojiOnly } from '@/features/comments-v2/lib/emojiOnly';
import type { FeedCommentPreview as PreviewData } from '@/hooks/feed/useFeedCommentPreview';

export type CommentPreviewSurface = 'dark' | 'light';

interface Tones { ink: string; mid: string; dim: string; line: string }

/**
 * Flattened, not faded. dark = card's #F8FAFC ramp over #10151C; light = the
 * light card's own T100/T60/T40 (#0F172A at 1 / 0.60 / 0.42) over #F8FAFC.
 * Rounded to the nearest sRGB byte, so these render identically to the ramps
 * the two cards already ship — with no alpha in the preview itself.
 */
const TONES: Record<CommentPreviewSurface, Tones> = {
  dark: {
    ink: '#F8FAFC',
    mid: '#A7AAAE',
    dim: '#787C81',
    line: 'rgba(255,255,255,0.08)',
  },
  light: {
    ink: '#0F172A',
    mid: '#6E747F',
    dim: '#969BA4',
    // The light card's shipped divider, not a computed one.
    line: '#E5E7EA',
  },
};

interface Props {
  preview?: PreviewData | null;
  /** comment_count — the TALLY. Never decides whether the preview renders. */
  commentCount: number;
  onOpenComments: () => void;
  /** Viewing member's avatar for the prompt row. */
  viewerAvatarUrl?: string | null;
  viewerName?: string | null;
  /** Which card this block is sitting in. Decides the ink tiers, nothing else. */
  surface?: CommentPreviewSurface;
}

export const FeedCommentPreview: React.FC<Props> = ({
  preview,
  commentCount,
  onOpenComments,
  viewerAvatarUrl,
  viewerName,
  surface = 'dark',
}) => {
  const { ink: INK, mid: MID, dim: DIM, line: LINE } = TONES[surface];
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
