/**
 * FeedCard — Phases 1 & 2
 *
 * Single post = single card. Header, media block, body, footer.
 *
 * Media block:
 *  - Single media → adaptive frame (frame ratio = media's true ratio →
 *    `object-fit: cover` fills with zero crop and zero letterbox). Extreme
 *    ratios are clamped + ambient-filled with a blurred backdrop.
 *  - Multi media → `MediaCarousel`: stable 4:5 frame for all slides
 *    (height never jumps), per-slide blurred ambient backdrop + contained
 *    image/video, dots + n/total chip, swipe navigation, persisted index.
 *
 * Inline video lifecycle is driven by the `isActive` prop from `CardFeed`
 * (most-in-view card). Only one inline video plays at a time across the
 * whole feed; tapping any media opens the immersive `FullscreenFeedOverlay`.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import { buildReviewSheetPayload } from '@/components/posts/buildReviewSheetPayload';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { PostOwnerMenu } from '@/components/posts/PostOwnerMenu';
import { useManageableBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FeedCommentPreview } from '@/components/feed/FeedCommentPreview';
import type { FeedCommentPreview as FeedCommentPreviewData } from '@/hooks/feed/useFeedCommentPreview';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { ReviewGhostNumeral, ReviewVerdictLabel } from '@/components/shared/ReviewGhostScore';
import { formatRatingValue } from '@/utils/formatters';
import { useActiveActor } from '@/context/ActiveActorContext';

import type { FeedPost } from '@/components/media-system/types/media';
import { InlineVideo } from './InlineVideo';
import { buildImageThumbnailUrl } from '@/utils/mediaThumbs';
import LqipUnderlay from '@/components/shared/LqipUnderlay';
import { MediaCarousel } from './MediaCarousel';
import { FeedFollowPill } from './FeedFollowPill';
import { FeedActorPicker } from './FeedActorPicker';
import Pressable from '@/components/ui/Pressable';
import { HeartBurst } from './HeartBurst';
import { createTapHandler } from './mediaTap';
import { triggerHaptic } from '@/lib/ui/haptics';
import type { ActiveActor } from '@/types/actor';
import { MentionText } from '@/components/mentions/MentionText';
import { formatCountKilo as formatCount, formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { useImpressionObserver } from '@/lib/impressions/useImpressionObserver';
import { PostCourseBand } from './PostCourseBand';
import { CourseStatsSheet } from './CourseStatsSheet';
import { PostRoundCard } from './PostRoundCard';
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import { PostRoundShell } from '@/components/feed/PostRoundShell';
import { PostRoundDegraded } from '@/components/feed/PostRoundDegraded';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';



// Full-bleed slab chrome — the post slab is #10151C and the feed canvas behind
// it (#05070A) is darker, so the gap between posts does the separating.
// Text constants flip to light-on-dark; LINE becomes a white hairline.
const CARD = '#10151C';
const T100 = '#F8FAFC';
const T60 = 'rgba(248,250,252,0.65)';
const T40 = 'rgba(248,250,252,0.45)';
const LINE = 'rgba(255,255,255,0.08)';
const AMBER = '#F7931E';
const GREEN = '#22C55E';

const RATIO_MIN = 0.8;   // tallest allowed = 4:5 (portrait capped)
const RATIO_MAX = 1.91;  // widest = ~cinematic landscape
const FALLBACK_RATIO = 4 / 5;

// Chrome measured on a 390x844 card. Standard: header 54.7 + caption 49.2
// + unified band incl. actions 100.2 + hairline + 88 nav = 293, reserved at
// 305 (12px margin). Review posts carry the tier word (absolute ghost
// numeral + header chip, zero layout) and a THIRD clamped line of review
// text plus the absolutely-positioned "Read review" affordance, so the only
// real layout delta is one 14/1.4 line: measured caption block 68.8 (review,
// 3 lines) vs 49.2 (standard, 2 lines) = 19.6 -> reserve 20.
const MEDIA_CHROME_RESERVE = 305;
const REVIEW_HEADER_EXTRA = 20;
const mediaMaxHeight = (isReview: boolean) =>
  `max(280px, calc(100svh - ${MEDIA_CHROME_RESERVE + (isReview ? REVIEW_HEADER_EXTRA : 0)}px - env(safe-area-inset-bottom)))`;


// formatCount / timeAgo moved to @/i18n/format (Wave 1 drift-consolidation).


export interface FeedCardProps {
  post: FeedPost;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: (post: FeedPost, actor?: ActiveActor | null) => void;
  onComment: (post: FeedPost, actor?: ActiveActor | null) => void;
  onShare: (post: FeedPost) => void;
  onOpenMedia: (
    post: FeedPost,
    mediaIndex: number,
    origin?: { el: HTMLElement | null; posterUrl?: string | null },
    mediaId?: string | null,
    ownerKey?: string | null,
  ) => void;
  onProfile: (post: FeedPost) => void;
  onReviewTap?: (post: FeedPost) => void;
  onCourse?: (post: FeedPost) => void;
  /** True when this card is the most-in-view → drives inline video autoplay. */
  isActive?: boolean;
  /**
   * Whether this card should actually mount a `<video>` element. iOS WebViews
   * cap concurrent `<video>` decoders, so we only mount the active card +
   * immediate neighbours; other cards show the thumbnail poster only.
   */
  mountVideo?: boolean;
  /** Early-motion handover — see InlineVideo.earlyMotion. */
  earlyMotion?: boolean;
  /** Initial carousel slide for multi-media posts (from persisted store). */
  initialMediaIndex?: number;
  /** Notified when user swipes the multi-media carousel. */
  onCarouselIndexChange?: (post: FeedPost, idx: number) => void;
  onFollow?: (post: FeedPost) => void;
  currentUserId?: string;
  /** Feed index — threaded down to InlineVideo for greppable per-tile traces. */
  feedIndex?: number;
  /** True only for the index-0 card — gates `onContentReady` to one signal. */
  isFirstCard?: boolean;
  /** Fires once when this card's primary content is paint-ready (decoded image / first video frame / rAF for text). */
  onContentReady?: () => void;
  /** Batched course data for this post's course (resolved in Clubhouse.tsx). */
  courseContext?: PostCourseContext | null;
  /** Batched round attached to this post (resolved in Clubhouse.tsx). */
  postRound?: PostRound | null;
  /**
   * True when this post carries a round that has not arrived yet: the block
   * renders as a shell at its own height rather than as nothing, so the card
   * never paints without its scorecard and then gains one.
   */
  postRoundPending?: boolean;
  /**
   * SETTLED-AND-ABSENT: the round map has finished and has no entry for this
   * post. Distinct from `postRoundPending` on purpose — see PostRoundDegraded.
   */
  postRoundMissing?: boolean;
  /** Opens the attached round's scorecard. */
  onRoundTap?: (post: FeedPost, round: PostRound) => void;
  /**
   * Newest top-level comment for this post (batched by the host feed).
   * RENDERS FROM THE COMMENT, NEVER FROM comment_count — absent means no
   * preview row, whatever the counter says.
   */
  commentPreview?: FeedCommentPreviewData | null;
  /**
   * Host opts the card into the comment block (preview + add-a-comment prompt).
   * Grid hosts that do not batch comment data leave it off.
   */
  commentPreviewEnabled?: boolean;
}

interface CaptionBlockProps {
  body: string;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isClamped: boolean;
  setIsClamped: (v: boolean) => void;
  textRef: React.MutableRefObject<HTMLDivElement | null>;
  /** When set, renders an inline "Read review ›" affordance (review posts) instead of more/less. */
  onReadReview?: (e: React.MouseEvent) => void;
}

const CaptionBlock: React.FC<CaptionBlockProps> = ({ body, expanded, setExpanded, isClamped, setIsClamped, textRef, onReadReview }) => {
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Measure against clamped state: when expanded the element has no clamp,
    // so we rely on the previously-measured value to keep "less" available.
    if (!expanded) {
      const clamped = el.scrollHeight > el.clientHeight + 1;
      setIsClamped(clamped);
    }
  }, [body, expanded, setIsClamped, textRef]);

  // Review posts: always clamp to 3 lines and show "Read review ›" affordance
  // that navigates straight to the course review page (no inline expand).
  const isReviewMode = !!onReadReview;
  const showMore = !isReviewMode && !expanded && isClamped;
  const showReadReview = isReviewMode && !!body;

  if (!body && !showReadReview) return null;

  return (
    <div style={{ padding: '0px 14px 10px', position: 'relative', zIndex: 2, marginTop: -1 }}>
      <div style={{ position: 'relative' }}>
        <div
          ref={textRef}
          style={{
            fontSize: 15,
            lineHeight: 1.4,
            color: T100,
            ...((isReviewMode || !expanded)
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
              : {}),
          }}
        >
          <MentionText text={body} />
          {!isReviewMode && expanded && isClamped && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              style={{
                background: 'transparent', border: 'none', padding: 0, marginLeft: 6,
                color: T60, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              less
            </button>
          )}
        </div>
        {showMore && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              paddingLeft: 28,
              background: 'linear-gradient(90deg, rgba(16,21,28,0) 0%, #10151C 40%)',
              border: 'none',
              color: T60,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            more
          </button>
        )}
        {showReadReview && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReadReview!(e); }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              paddingLeft: 64,
              background: 'linear-gradient(90deg, rgba(16,21,28,0) 0%, #10151C 38%)',
              border: 'none',
              color: T60,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}
          >
            Read review ›
          </button>
        )}
      </div>
    </div>
  );
};



const FeedCardImpl: React.FC<FeedCardProps> = ({
  post,
  liked,
  likeCount,
  commentCount,
  onLike,
  onComment,
  onShare,
  onOpenMedia,
  onProfile,
  onReviewTap,
  onCourse,
  isActive = false,
  mountVideo = false,
  earlyMotion = false,
  initialMediaIndex = 0,
  onCarouselIndexChange,
  onFollow,
  currentUserId,
  feedIndex,
  isFirstCard = false,
  onContentReady,
  courseContext,
  postRound,
  postRoundPending,
  postRoundMissing,
  onRoundTap,
  commentPreview,
  commentPreviewEnabled = false,
}) => {
  
  const { activeActor, setActiveActor } = useActiveActor();
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isCaptionClamped, setIsCaptionClamped] = useState(false);
  // Actor selection is GLOBAL — picker reads and writes the session-wide activeActor.
  const effectiveActor: ActiveActor | null = activeActor;
  const captionTextRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  // Phase 0 impression tracker — silently records ≥50%/≥1s dwell views.
  // Signed-out flushes are dropped in the tracker itself; observer is cheap.
  useImpressionObserver(articleRef, post.id);

  // Fire-once paint-ready signal — gated to the first card so the skeleton
  // controller hears exactly one event per feed mount.
  const contentReadyFiredRef = useRef(false);
  const fireContentReady = React.useCallback(() => {
    if (contentReadyFiredRef.current || !isFirstCard || !onContentReady) return;
    contentReadyFiredRef.current = true;
    onContentReady();
  }, [isFirstCard, onContentReady]);

  // Double-tap-to-like: burst overlay + like-only (never unlike) commit.
  const [burstKey, setBurstKey] = useState(0);
  const [burstVisible, setBurstVisible] = useState(false);
  // Course stats sheet. Mounting it is what enables the detail RPC.
  const [statsOpen, setStatsOpen] = useState(false);
  const handleMediaDoubleTap = React.useCallback(() => {
    // Always show the burst (confirms even when already liked)…
    setBurstKey((k) => k + 1);
    setBurstVisible(true);
    // …but only fire the like when currently unliked (TikTok/IG parity).
    if (!liked) {
      triggerHaptic('medium');
      onLike(post, effectiveActor);
    } else {
      triggerHaptic('light');
    }
  }, [liked, onLike, post, effectiveActor]);

  const reviewCourseId = post.review?.courseId ?? post.courseId;
  const openReviewSheet = useReviewSheetStore((s) => s.open);
  const { data: reviewerStats } = useReviewerStats(post.userId);
  const handleReadReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = buildReviewSheetPayload(post, reviewerStats ?? null);
    if (!payload) return;
    openReviewSheet(payload);
    onReviewTap?.(post);
  };
  const mountFollowPill =
    !!onFollow &&
    post.actorType === 'personal' &&
    post.creatorRelation !== 'system' &&
    post.userId !== currentUserId;
  const manageableBusinessIds = useManageableBusinessIds(currentUserId);
  const canManage = canManagePost(
    { userId: post.userId, actorType: post.actorType === 'business' ? 'business' : 'personal', actorId: post.actorId },
    currentUserId,
    manageableBusinessIds,
  );
  const items = post.mediaItems ?? [];
  const isMulti = items.length > 1;
  const media = items[0];

  const ratio = useMemo(() => {
    if (!media || !media.width || !media.height) return FALLBACK_RATIO;
    const r = media.width / media.height;
    return Math.min(RATIO_MAX, Math.max(RATIO_MIN, r));
  }, [media]);

  const reviewRating = post.review?.rating ?? null;
  const isDeal = false;

  const subLine = useMemo(() => {
    const parts: string[] = [];
    if (post.creatorRelation === 'system') parts.push('clbhouz');
    parts.push(timeAgo(post.createdAt));
    return parts.filter(Boolean).join(' · ');
  }, [post]);


  const mediaUrl = media?.imageUrl || media?.thumbnailUrl || '';

  // Single-image / video-poster decode path — drives the paint-ready signal
  // for non-video cards. We use img.decode() (proper decoded-pixels promise),
  // falling back to onLoad and finally to mount + rAF so we never strand the
  // skeleton on a quirky image.
  const primaryImgRef = useRef<HTMLImageElement | null>(null);
  const singleMediaBtnRef = useRef<HTMLButtonElement | null>(null);
  const usesPrimaryImage =
    isFirstCard &&
    !isMulti &&
    !!media &&
    media.type !== 'video';

  // Text-only / multi-media fallback: fire on the next paint (the surrounding
  // shell is already in the DOM and visually settled by then).
  useEffect(() => {
    if (!isFirstCard) return;
    if (isMulti || !media) {
      const raf = requestAnimationFrame(() => fireContentReady());
      return () => cancelAnimationFrame(raf);
    }
  }, [isFirstCard, isMulti, media, fireContentReady]);

  // Image decode path for first card.
  useEffect(() => {
    if (!isFirstCard) return;
    if (isMulti || !media) return;
    if (media.type === 'video') {
      // Video card: if we DON'T mount the player (mountVideo=false), the
      // visible content is the thumbnail <img>, so decode that. If we DO
      // mount the player, InlineVideo's onFirstFrameReady handles it.
      // We can detect "no player mounted" by absence of the video element —
      // but cleaner to attempt decode on the poster ref unconditionally;
      // if the img isn't in the tree the ref is null and we skip.
    }
    const img = primaryImgRef.current;
    if (!img) return;
    let cancelled = false;
    const fire = () => { if (!cancelled) fireContentReady(); };

    if (img.complete && img.naturalWidth > 0) {
      // Already loaded — still pay decode() the courtesy if available.
      if (typeof img.decode === 'function') {
        img.decode().then(fire, fire);
      } else {
        fire();
      }
      return () => { cancelled = true; };
    }
    if (typeof img.decode === 'function') {
      img.decode().then(fire, fire);
    }
    const onLoad = () => fire();
    const onError = () => fire();
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    return () => {
      cancelled = true;
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };
  }, [isFirstCard, isMulti, media, fireContentReady]);
  // Photo backdrop only for round posts that actually have a course photo.
  // The backdrop is claimed by the shell too, so the card surface does not
  // change under the member when the round lands.
  const hasRoundBackdrop = Boolean((postRound || postRoundPending) && post.courseThumbnailImage);

  return (
    <article
      ref={articleRef}
      style={{
        background: CARD,
        overflow: 'hidden',
        marginInline: 0,
        position: 'relative',
        // The first card continues the header zone's surface — a rule there
        // would read as a seam under the island. Later cards keep the hairline
        // above them (paired with the inter-post gap).
        borderTop: feedIndex === 0 ? undefined : `1px solid ${LINE}`,
      }}
    >
      {/* Card-level ghost numeral — overflows the header, clipped by card edges */}
      {reviewRating != null && (
        <ReviewGhostNumeral rating={reviewRating} fontSize={110} right={-7} top={28} />
      )}

      {/* Round posts with a course photo: card-level photo backdrop. Everything
          above the actions row paints on one glass surface over it. No photo
          means no backdrop and no backdrop-filter anywhere. */}
      {hasRoundBackdrop && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${post.courseThumbnailImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      <div
        style={
          hasRoundBackdrop
            ? {
                position: 'relative',
                zIndex: 1,
                background: 'rgba(11,13,16,0.66)',
                backdropFilter: 'blur(22px) saturate(150%)',
                WebkitBackdropFilter: 'blur(22px) saturate(150%)',
              }
            : { position: 'relative', zIndex: 1 }
        }
      >


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 2px', position: 'relative', zIndex: 2 }}>
        <button
          type="button"
          onClick={() => onProfile(post)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <SquircleAvatar src={buildImageThumbnailUrl(post.avatarUrl, { width: 72, height: 72 })} alt={post.displayName} size={34} hairlineRing />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={() => onProfile(post)}
            style={{
              display: 'block',
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              fontSize: 15,
              fontWeight: 700,
              color: T100,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              cursor: 'pointer',
            }}
          >
            {post.displayName}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
            {canManage && (
              <PostOwnerMenu
                postId={post.id}
                isOwnPost
                actorType={post.actorType === 'business' ? 'business' : 'personal'}
                actorId={post.actorId}
                sourceReviewId={post.review?.reviewId ?? null}
                reviewCourseId={post.review?.courseId ?? null}
                variant="inline"
              />
            )}
            <span style={{ fontSize: 12, color: T60 }}>{subLine}</span>
            {mountFollowPill && (
              <FeedFollowPill
                isFollowed={!!post.isFollowedByMe}
                onFollow={() => onFollow!(post)}
              />
            )}
          </div>
        </div>

        {/* THE ROUND SCORE SITS HERE (BRIEF_ROUND_POST_ENRICHMENT §2). The
            author row already had empty space on its right, so the score costs
            no height at all and the course name below keeps the full width. The
            username truncates rather than pushing the score. */}
        {postRound && postRound.grossScore != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"zero" 0',
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: '#FFFFFF',
              }}
            >
              {postRound.grossScore}
            </span>
            {postRound.coursePar != null && (
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: getScoreColor(postRound.grossScore - postRound.coursePar, 'dark'),
                }}
              >
                {(() => {
                  const d = postRound.grossScore - postRound.coursePar;
                  return d === 0 ? 'E' : d > 0 ? `+${d}` : `${d}`;
                })()}
              </span>
            )}
          </div>
        )}

        {/* Right chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isDeal && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: GREEN,
                border: `1px solid ${GREEN}`,
                padding: '3px 6px',
                borderRadius: 4,
              }}
            >
              DEAL
            </span>
          )}
          {reviewRating != null && (
            <ReviewVerdictLabel
              rating={reviewRating}
              onClick={handleReadReview}
              ariaLabel={`Your review: ${formatRatingValue(reviewRating)} ${getRatingTierLabel(reviewRating)}`}
            />
          )}
        </div>
      </div>

      {/* Empty-caption spacer: give the header breathing room when no caption block renders */}
      {!(post.caption || (post.isReview && post.review?.reviewText)) && (
        <div aria-hidden style={{ height: 8 }} />
      )}

      {/* Caption — review text above media, overlapping the ghost numeral's lower edge */}
      <CaptionBlock
        body={post.caption || (post.isReview ? post.review?.reviewText ?? '' : '')}
        expanded={captionExpanded}
        setExpanded={setCaptionExpanded}
        isClamped={isCaptionClamped}
        setIsClamped={setIsCaptionClamped}
        textRef={captionTextRef}
        onReadReview={post.isReview && reviewCourseId ? handleReadReview : undefined}
      />


      {/* Attached round — scorecard block sits ABOVE media. Waiting posts
          render the shell in the same space (no pop-in, no jump). */}
      {!postRound && postRoundPending && <PostRoundShell />}
      {!postRound && !postRoundPending && postRoundMissing && (
        <PostRoundDegraded
          postId={post.id}
          hasScoreId
          courseName={post.courseName ?? null}
          courseRegion={[post.courseRegion || post.courseSubCountry, post.courseCountry].filter(Boolean).join(', ') || null}
        />
      )}
      {postRound && (
        <PostRoundCard
          round={postRound}
          postId={post.id}
          notability={post.roundNotability ?? null}
          courseName={post.courseName ?? null}
          courseRegion={[post.courseRegion || post.courseSubCountry, post.courseCountry].filter(Boolean).join(', ') || null}
          courseCtx={courseContext ?? null}
          crown={
            postRound.crown
              ? {
                  category: crownCategoryLabel(postRound.crown.category),
                  previousHolderName: postRound.crown.previousHolderName,
                  margin:
                    postRound.crown.margin != null
                      ? String(postRound.crown.margin)
                      : null,
                }
              : null
          }
          onTap={onRoundTap ? () => onRoundTap(post, postRound) : undefined}
        />

      )}

      {/* Media */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {isMulti ? (
          <MediaCarousel
            items={items}
            isCardActive={isActive}
            initialIndex={initialMediaIndex}
            maxHeight={mediaMaxHeight(!!post.isReview)}
            mountVideo={mountVideo}
            postId={post.id}
            onIndexChange={(idx) => onCarouselIndexChange?.(post, idx)}
            onOpen={(idx, mediaId, originEl, ownerKey) => {
              const slide = items[idx];
              const posterUrl = slide?.thumbnailUrl ?? (slide as any)?.imageUrl ?? null;
              onOpenMedia(
                post,
                idx,
                originEl ? { el: originEl, posterUrl } : undefined,
                mediaId,
                ownerKey ?? null,
              );
            }}
            onDoubleTap={handleMediaDoubleTap}
          />

        ) : media ? (
          <SingleMediaTapButton
            onSingle={() =>
              onOpenMedia(post, 0, {
                el: singleMediaBtnRef.current,
                posterUrl: media.thumbnailUrl ?? (media as any).imageUrl ?? null,
              })
            }
            onDouble={handleMediaDoubleTap}
            innerRef={singleMediaBtnRef}
            postId={post.id}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: String(ratio),
                // See MEDIA_CHROME_RESERVE / REVIEW_HEADER_EXTRA above.
                maxHeight: mediaMaxHeight(!!post.isReview),
                overflow: 'hidden',
                background: '#10151C',
              }}

            >
              {media.type === 'video' ? (
                <InlineVideo
                  item={media}
                  isActive={isActive}
                  isNear={mountVideo}
                  earlyMotion={earlyMotion}
                  feedIndex={feedIndex}
                  postId={post.id}
                  ownerKey={`${post.id}:0`}
                  objectFit="cover"
                  onFirstFrameReady={isFirstCard ? fireContentReady : undefined}
                />

              ) : mediaUrl ? (
                <>
                  {feedIndex != null && feedIndex >= 1 && (
                    <LqipUnderlay from={mediaUrl} />
                  )}
                  <img
                    ref={isFirstCard ? primaryImgRef : undefined}
                    src={mediaUrl}
                    alt={post.caption || post.displayName}
                    loading="lazy"

                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                </>
              ) : null}
            </div>
          </SingleMediaTapButton>
        ) : null}
        {burstVisible && (
          <HeartBurst key={burstKey} onDone={() => setBurstVisible(false)} />
        )}
      </div>



      {/* Course band: identity + figures + actions in ONE container. */}
      {(() => {
        const courseLocation = [post.courseRegion || post.courseSubCountry, post.courseCountry]
          .filter(Boolean)
          .join(', ');
        const hasCourse = Boolean(post.courseName || courseContext);

        const actionsRow = (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px 12px',
            }}
          >
            <FeedActorPicker value={activeActor} onChange={(a) => setActiveActor(a)} />
            <FooterButton
              icon={Heart}
              label={formatCount(likeCount)}
              active={liked}
              onClick={() => onLike(post, effectiveActor)}
              activeColor={AMBER}
              haptic={!liked ? 'selection' : 'none'}
            />
            <FooterButton
              icon={MessageCircle}
              label={formatCount(commentCount)}
              onClick={() => onComment(post, effectiveActor)}
            />
            <FooterButton icon={Share} onClick={() => onShare(post)} />
          </div>
        );

        if (!hasCourse) {
          return (
            <div
              style={{
                borderTop: `0.5px solid ${LINE}`,
                background: hasRoundBackdrop ? CARD : undefined,
              }}
            >
              {actionsRow}
            </div>
          );
        }

        return (
          <>
            <PostCourseBand
              courseName={post.courseName}
              /**
               * BRIEF_ROUND_CARD_CONTEXT S2 — THE REGION IS PRINTED ONCE PER
               * CARD. On a round post PostRoundCard already states
               * "Kent, Britain & Ireland" under the course name 600px above, so
               * the band's copy is pure duplication and goes. The band KEEPS the
               * course name (it is the label of the tap target) and keeps the
               * region on every OTHER kind of post, where the band is the only
               * place the region appears at all.
               */
              courseLocation={postRound ? null : courseLocation || null}
              courseRating={post.courseRating ?? null}
              ctx={courseContext ?? null}
              onOpenStats={post.courseId ? () => setStatsOpen(true) : undefined}
              actions={actionsRow}
              surface={hasRoundBackdrop ? 'glass' : 'solid'}
            />
            {post.courseId && statsOpen && (
              <CourseStatsSheet
                open={statsOpen}
                onClose={() => setStatsOpen(false)}
                courseId={post.courseId}
                courseName={post.courseName}
                courseLocation={courseLocation || null}
                courseRating={courseContext?.community_rating ?? post.courseRating ?? null}
              />
            )}
          </>
        );
      })()}

      {/* Comment preview + add-a-comment prompt. Sits BETWEEN the action row
          and nothing else: one comment with an invitation beneath it reads as
          an OPEN conversation. Ships as one block — never half of it. */}
      {commentPreviewEnabled && (
        <FeedCommentPreview
          preview={commentPreview ?? null}
          commentCount={commentCount}
          onOpenComments={() => onComment(post, effectiveActor)}
          viewerAvatarUrl={effectiveActor?.avatarUrl ?? null}
          viewerName={effectiveActor?.name ?? null}
        />
      )}
      </div>
    </article>
  );
};

const SingleMediaTapButton: React.FC<{
  onSingle: () => void;
  onDouble: () => void;
  innerRef: React.RefObject<HTMLButtonElement>;
  postId: string;
  children: React.ReactNode;
}> = ({ onSingle, onDouble, innerRef, postId, children }) => {
  const handleTap = React.useMemo(
    () => createTapHandler({
      onSingle: () => onSingle(),
      onDouble: () => onDouble(),
    }),
    [onSingle, onDouble],
  );
  return (
    <button
      type="button"
      ref={innerRef}
      data-post-id={postId}
      onClick={handleTap}
      style={{
        display: 'block',
        width: '100%',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
};

const FooterButton: React.FC<{
  icon: React.ComponentType<any>;
  label?: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  haptic?: 'none' | 'selection' | 'success' | 'warning';
}> = ({ icon: Icon, label, onClick, active, activeColor, haptic = 'none' }) => (
  <Pressable
    as="button"
    variant="icon"
    haptic={haptic}
    onPress={(e) => {
      (e as React.MouseEvent).stopPropagation?.();
      onClick();
    }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'transparent',
      border: 'none',
      padding: 0,
      color: active ? activeColor ?? T100 : T60,
      fontSize: 13,
      fontVariantNumeric: 'tabular-nums',
    }}
    innerStyle={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
  >
    <Icon
      /* §6 condense. The engagement row is SHARED by every feed card, so it
         steps 24 -> 21 rather than to the mock's 19: a round-post-only figure
         would restyle photo and review posts too. */
      size={21}
      strokeWidth={1.75}
      color={active ? activeColor ?? T100 : T60}
      fill={active ? activeColor ?? 'none' : 'none'}
    />
    {label && <span>{label}</span>}
  </Pressable>
);


export const FeedCard = React.memo(FeedCardImpl);
FeedCard.displayName = 'FeedCard';
