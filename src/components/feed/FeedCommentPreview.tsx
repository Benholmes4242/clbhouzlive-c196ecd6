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
 *   light (#0F172A ramp over #F8FAFC): 1.00 #0F172A, 0.60 #6C727E, 0.42 #969BA4
 */
import React from 'react';
import { MentionText } from '@/components/mentions/MentionText';
// SECTION C removed the avatar, the verified badge, the timestamp and the
// emoji-only sizing from this block's output. Their modules stay in the repo
// (SquircleAvatar, VerifiedBadge, formatRelativeWithSeconds, isEmojiOnly) and
// are used elsewhere; only the imports here are gone.
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
    mid: '#6C727E',
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
  /** Viewing member's avatar for the prompt row. DEAD after section C. */
  viewerAvatarUrl?: string | null;
  viewerName?: string | null;
  /** Viewing actor's id — keys the fallback hue. Never the display name. */
  viewerId?: string | null;
  /** Which card this block is sitting in. Decides the ink tiers, nothing else. */
  surface?: CommentPreviewSurface;
  /**
   * SECTION C: the block now lives INSIDE the card footer, which already owns
   * the rule above it. Default true so any other consumer renders as before.
   */
  topRule?: boolean;
  /** Container padding. Default is the pre-section-C value. */
  padding?: string;
}

export const FeedCommentPreview: React.FC<Props> = ({
  preview,
  commentCount,
  onOpenComments,
  viewerAvatarUrl,
  viewerName,
  viewerId,
  surface = 'dark',
  topRule = true,
  padding = '9px 14px 11px',
}) => {
  const { ink: INK, mid: MID, line: LINE } = TONES[surface];

  /**
   * SECTION C — THE COMMENT ROW STOPS BEING PERMANENT.
   * Zero comments renders NOTHING: no prompt, no reserved height. The footer's
   * comment glyph is the single entry point on an uncommented card. The
   * always-visible "Add a comment..." prompt and its viewer avatar are gone
   * from the output; the viewer props stay on the interface (dead list).
   */
  const lines = (preview?.recent && preview.recent.length
    ? preview.recent
    : preview
      ? [{
          comment_id: preview.comment_id,
          content: preview.content,
          created_at: preview.created_at,
          display_name: preview.display_name,
        }]
      : []
  )
    .filter(l => (l.content ?? '').trim().length > 0)
    .slice(0, 2);

  if (!lines.length) return null;

  /**
   * THE SEE-ALL IS THE STORED COLUMN, NEVER A LIVE RECOUNT — the glyph beside
   * it reads posts.comment_count and the two must not disagree. But the lines
   * above are real comments_v2 rows, and on the handful of posts where the
   * stored count lags the rows, a see-all would print a total SMALLER than
   * what is already on screen. In that case say nothing about a total: show
   * the comments, suppress the see-all entirely.
   */
  const total = commentCount;
  const showSeeAll = total > lines.length;


  return (
    <div
      style={{
        // 1px, matching every other hairline on this surface.
        borderTop: topRule ? `1px solid ${LINE}` : undefined,
        padding,
      }}
    >
      {lines.map((l, i) => (
        <div
          key={l.comment_id}
          role="button"
          tabIndex={0}
          onClick={onOpenComments}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenComments();
            }
          }}
          style={{
            display: 'block',
            width: '100%',
            marginTop: i === 0 ? 0 : 5,
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span style={{ color: INK, fontWeight: 600 }}>{l.display_name}</span>
          <span style={{ color: MID, fontWeight: 500, marginLeft: 5 }}>
            <MentionText text={(l.content ?? '').trim()} />
          </span>
        </div>
      ))}

      {showSeeAll && (
        <button
          type="button"
          onClick={onOpenComments}
          style={{
            display: 'block',
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginTop: 7,
            color: MID,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.19em',
            textTransform: 'uppercase',
            textAlign: 'left',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {`See all ${total} comments`}
        </button>
      )}
    </div>
  );
};

export default FeedCommentPreview;

