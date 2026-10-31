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
import { useTranslation } from 'react-i18next';
import { FEED_CARD_SURFACE, surfaceWithAlpha } from '@/lib/tokens/surfaces';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchReviewSheet } from '@/components/posts/prefetchReviewSheet';
import { buildReviewSheetPayload } from '@/components/posts/buildReviewSheetPayload';
import { MessageCircle, Share } from 'lucide-react';
import { reactionGlyph, ReactionGlyph, AMBER } from '@/lib/reactionKind';
import { PostOwnerMenu } from '@/components/posts/PostOwnerMenu';
import { useManageableBusinessIds, useTeamBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';
import { gateGuestActionNow } from '@/features/guest/useGuestActionGate';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FeedCommentPreview } from '@/components/feed/FeedCommentPreview';
import type { FeedCommentPreview as FeedCommentPreviewData } from '@/hooks/feed/useFeedCommentPreview';
import { useActiveActor } from '@/context/ActiveActorContext';

import type { CommentOpenSource } from '@/types/commentOpenSource';
import type { FeedPost } from '@/components/media-system/types/media';
import { InlineVideo } from './InlineVideo';
import LqipUnderlay from '@/components/shared/LqipUnderlay';
import { postImageProps } from '@/utils/imageSrc';
import { useNavigate } from 'react-router-dom';
import { MediaCarousel } from './MediaCarousel';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { FeedFollowPill } from './FeedFollowPill';
import { LikedByRow } from '@/components/likes/LikedByRow';
import { courseActivityClubName } from '@/features/courses/_shared/courseLabel';
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
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import { SLAB } from './feedSurfaces';
import { ReviewPostCard } from './ReviewPostCard';
import { clampFeedMediaRatio, mediaMaxHeight } from './feedMediaSizing';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { RoundMedalCounts } from '@/features/explore-magazine/useBatchRoundMedals';
import { roundPostItem } from './roundPostItem';
import { featuredRoundFrom, decideFeatured, type FeaturedTrigger } from './featuredRoundTrigger';
import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import type { RoundCourseMeta } from './roundPostItem';
import type { ConsequenceSources } from '@/features/explore-magazine/consequences';
import type { SubjectContext } from '@/components/sheets/SubjectContextLine';
import { PostWithLine, RemoveMeMenu, SlideTagChip } from './PostGolfTags';
import type { SlideTag } from '@/features/post-v2/lib/golfPostRules';
import { holeMediaKey } from '@/lib/courseMedia/holePhotoData';

/** Home's content inset (the header's 12px). The round photo bleeds by it. */
const ROUND_CARD_INSET = 12;

/* Like glyph comes from reactionGlyph('like') — the one place that decides it. */
const LikeGlyph = reactionGlyph('like');



// Full-bleed slab chrome — the post slab is #10151C and the feed canvas behind
// it (#05070A) is darker, so the gap between posts does the separating.
// Text constants flip to light-on-dark; LINE becomes a white hairline.
import { CARD, T100, T60, T40, LINE } from './feedTokens';
export { LINE };
const GREEN = '#22C55E';

/** Shared inset and spacing for the unified footer. */
const FOOTER_GUTTER = 20;
const FOOTER_ACTION_GAP = 22;


// formatCount / timeAgo moved to @/i18n/format (Wave 1 drift-consolidation).


export interface FeedCardProps {
  post: FeedPost;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: (post: FeedPost, actor?: ActiveActor | null) => void;
  onComment: (post: FeedPost, actor?: ActiveActor | null, source?: CommentOpenSource) => void;
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
  /** When set, the carousel's restored slide is read from the clubhouse
   *  store for this card's feedIndex (per-card selector), so one card's
   *  carousel settling never re-renders the list. Value = store tab key, or
   *  '' for the legacy mirror. */
  carouselRestoreTab?: string;
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
  /** Opens the attached round's scorecard. */
  onRoundTap?: (post: FeedPost, round: PostRound) => void;
  /** Batched hole shape for this round (useRoundHoleShapes, page level).
   *  undefined = unresolved; null = settled without usable hole detail. */
  roundShape?: HoleShape | null;
  /** Batched medal counts (useBatchRoundMedals, page level). undefined = none. */
  roundMedals?: RoundMedalCounts;
  /** Page-level consequence sources; null until every source has fetched. */
  consequenceSources?: ConsequenceSources | null;
  /** Page-level course meta for round cards (image, region). */
  roundCourseMeta?: RoundCourseMeta | null;
  /** Home: this week's Round of the week score id (its pill wins). */
  /** undefined = not yet known (decides ordinary). */
  weekPickScoreId?: string | null;
  /** Feed-owned first-paint hero decisions; cleared on feed reset. */
  featuredDecisions?: Map<string, FeaturedTrigger | null>;
  /**
   * Newest top-level comment for this post (batched by the host feed).
   * RENDERS FROM THE COMMENT, NEVER FROM comment_count — absent means no
   * preview row, whatever the counter says.
   */
  commentPreview?: FeedCommentPreviewData | null;
  /** HOME ONLY (BRIEF_ROUND_TILE_1): the round trace leaves the photograph
   *  and draws on the canvas under the text block. Profile/grid hosts never
   *  pass it. */
  homeRoundPlot?: boolean;
  /**
   * Host opts the card into the comment block (preview + add-a-comment prompt).
   * Grid hosts that do not batch comment data leave it off.
   */
  commentPreviewEnabled?: boolean;
  /** CB108: 'mediaFirst' (club profile feed) reorders the existing parts:
   *  header, media, actions, liked-by, name-led caption, comments, add-a-comment.
   *  'standard' (default) is the unchanged Clubhouse order. */
  layout?: 'standard' | 'mediaFirst';
  /** Played with (post_with), batched by the host feed — never per card. */
  playedWith?: ReadonlyArray<{ userId: string; name: string; avatarUrl?: string | null }>;
  /** Per-slide course tags keyed by holeMediaKey(mediaItem), batched by the host. */
  slideTags?: ReadonlyMap<string, SlideTag>;
}

interface CaptionBlockProps {
  body: string;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isClamped: boolean;
  setIsClamped: (v: boolean) => void;
  textRef: React.MutableRefObject<HTMLDivElement | null>;
  /** CB108 mediaFirst: actor short name, inline before the caption. */
  lead?: string | null;
  /** CB108 mediaFirst text-only body typography. */
  textStyle?: React.CSSProperties;
}

const CaptionBlock: React.FC<CaptionBlockProps> = ({ body, expanded, setExpanded, isClamped, setIsClamped, textRef, lead, textStyle }) => {
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

  const showMore = !expanded && isClamped;

  if (!body) return null;

  return (
    <div style={{ padding: '0px 14px 10px', position: 'relative', zIndex: 2, marginTop: -1 }}>
      <div style={{ position: 'relative' }}>
        <div
          ref={textRef}
          style={{
            fontSize: 15,
            lineHeight: 1.4,
            color: T100,
            ...textStyle,
            ...(!expanded
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
              : {}),
          }}
        >
          {lead ? <><span data-caption-lead style={{ fontWeight: 600, color: T100 }}>{lead}</span>{' '}</> : null}
          <MentionText text={body} />
          {expanded && isClamped && (
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
               background: `linear-gradient(90deg, ${surfaceWithAlpha(FEED_CARD_SURFACE, 0)} 0%, ${FEED_CARD_SURFACE} 40%)`,
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
      </div>
    </div>
  );
};



const FeedCardImpl: React.FC<FeedCardProps> = ({
  post,
  liked,
  likeCount,
  commentCount,
  onLike: onLikeProp,
  onComment: onCommentProp,
  onShare: onShareProp,
  onOpenMedia,
  onProfile,
  onReviewTap,
  onCourse,
  isActive = false,
  mountVideo = false,
  earlyMotion = false,
  initialMediaIndex: initialMediaIndexProp,
  carouselRestoreTab,
  onCarouselIndexChange,
  onFollow: onFollowProp,
  currentUserId,
  feedIndex,
  isFirstCard = false,
  onContentReady,
  courseContext,
  postRound,
  postRoundPending,
  onRoundTap,
  roundShape,
  roundMedals,
  consequenceSources = null,
  roundCourseMeta = null,
  weekPickScoreId,
  featuredDecisions,
  commentPreview,
  commentPreviewEnabled = false,
  homeRoundPlot = false,
  layout = 'standard',
  playedWith,
  slideTags,
}) => {
  // GUEST §5: every like, comment (footer glyph, preview row and the
  // "Add a comment…" row), share and follow door on the card passes through
  // here; a guest gets the action card and the caller's handler never runs.
  // Members (and the switch off) reach the original handlers unchanged.
  const guestCtx = {
    firstName: post.displayName?.trim().split(/\s+/)[0] || undefined,
    postKind: (post.isReview ? 'review' : postRound || postRoundPending ? 'round' : 'post') as 'post' | 'round' | 'review',
  };
  const onLike: FeedCardProps['onLike'] = (p, a) => {
    if (!gateGuestActionNow('like', guestCtx)) onLikeProp(p, a);
  };
  const onComment: FeedCardProps['onComment'] = (p, a, s) => {
    if (!gateGuestActionNow('comment', guestCtx)) onCommentProp(p, a, s);
  };
  const onShare: FeedCardProps['onShare'] = (p) => {
    if (!gateGuestActionNow('share', guestCtx)) onShareProp(p);
  };
  const onFollow: FeedCardProps['onFollow'] = onFollowProp
    ? (p) => {
        if (!gateGuestActionNow('follow', guestCtx)) onFollowProp(p);
      }
    : undefined;
  const storedSlide = useClubhouseStore((s) => {
    if (carouselRestoreTab == null || feedIndex == null) return 0;
    const map = carouselRestoreTab
      ? (s.carouselPositionsByTab[carouselRestoreTab] ?? s.carouselPositions)
      : s.carouselPositions;
    return map.get(feedIndex) ?? 0;
  });
  const initialMediaIndex = initialMediaIndexProp ?? storedSlide;
  /* The hole chip follows the VISIBLE slide. */
  const [visibleSlide, setVisibleSlide] = useState(initialMediaIndex ?? 0);
  
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
  // The course name's own destination. The legacy `onCourse` prop is left
  // exactly as shipped for its existing callers.
  const navigate = useNavigate();
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
  const queryClient = useQueryClient();
  const { data: reviewerStats } = useReviewerStats(post.userId);
  const prefetchReview = () => prefetchReviewSheet(queryClient, buildReviewSheetPayload(post, reviewerStats ?? null));
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
  const teamBusinessIds = useTeamBusinessIds(currentUserId);
  const canManage = canManagePost(
    { userId: post.userId, actorType: post.actorType === 'business' ? 'business' : 'personal', actorId: post.actorId },
    currentUserId,
    manageableBusinessIds,
    teamBusinessIds,
  );
  const items = post.mediaItems ?? [];
  const isMulti = items.length > 1;
  const media = items[0];

  const ratio = useMemo(() => clampFeedMediaRatio(media), [media]);

  const isDeal = false;

  const subLine = useMemo(() => {
    const parts: string[] = [];
    if (post.creatorRelation === 'system') parts.push('clbhouz');
    /* SECTION D: past 30 days the header states the date instead of softening
       it to "4mo". Opt-in flag — every other caller of this formatter is
       unchanged. */
    parts.push(timeAgo(post.createdAt, { absoluteAfterDays: 30 }));
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
  const { t } = useTranslation('common');
  const { t: tCourses } = useTranslation('courses');

  /* A ROUND POST IS THE EXPLORE ROUND CARD (Phase 1, "exactly the same as they
     are now in explore community"). One difference: the photograph runs full
     bleed to the slab edges like every neighbour in this feed; everything under
     it stays inset at the header's 12px. No glass, no score in an author row,
     no kicker, no headline — ExploreCard's round branch decides all of that.
     A post whose round is still in flight renders the same card (figures fill
     in place). A round post renders the round card or it renders nothing: one
     whose round never resolves is dropped at list level (dropUnresolvedRounds)
     and never reaches this card. Likes use the post-like path
     unchanged: toggle_post_like routes a round post's reaction to
     content_reactions('round', whs_score_id) server-side, for every actor. */

  // Round data decides. FeedPost.postType is not populated by every feed
  // read (get_profile_posts does not project post_type), so a post_type gate
  // here silently disables the round card on Profile Posts. Keep this on
  // round data until post_type reaches the client on every construction site.
  const rendersRoundCard = !!postRound || !!postRoundPending;

  /* The media frame and the footer are shared by the standard card and the
     review card, so likes, comments, sharing, the owner menu and the
     fullscreen viewer keep one path. `fill` = the review card's frame owns
     the size and the media fills it with cover. */
  const renderMedia = (fill: boolean) => (
    <>
{/* Media. A round post never reaches here: it returns the round card
          above, whose photograph is the course's, not post_media's. */}
      <div style={{ position: 'relative', zIndex: 1, ...(fill ? { height: '100%' } : {}) }}>
        <SlideTagChip tag={slideTags && items[isMulti ? visibleSlide : 0] ? slideTags.get(holeMediaKey(items[isMulti ? visibleSlide : 0])) : null} />
        {isMulti ? (
          <MediaCarousel
            items={items}
            isCardActive={isActive}
            initialIndex={initialMediaIndex}
            maxHeight={fill ? '100%' : mediaMaxHeight()}
            mountVideo={mountVideo}
            postId={post.id}
            onIndexChange={(idx) => { setVisibleSlide(idx); onCarouselIndexChange?.(post, idx); }}
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
            fill={fill}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                ...(fill
                  ? { height: '100%' }
                  : { aspectRatio: String(ratio), maxHeight: mediaMaxHeight() }),
                // Ordinary/media-first review: shared intrinsic sizing.
                // Words-first review: the outer frame owns the size.
                overflow: 'hidden',
                background: CARD,
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
                    {...postImageProps(mediaUrl)}
                    alt={post.caption || post.displayName}
                    loading="lazy"
                    decoding="async"
                    {...(isActive ? { fetchpriority: 'high' } : {})}

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
    </>
  );
  /* THE FOOTER (section A). ONE always-present object, last on every card.
     `compact` is the review card's tightened rows (action row 40, liked-by 26). */
  const renderFooter = (gutter: number, compact: boolean, mediaFirstSlots?: { caption: React.ReactNode; addComment: React.ReactNode; likedByRound?: { subjectId: string; isOwnRound: boolean; subject: SubjectContext | null } }) => (() => {
        /* SHOW WHO LIKED A POST — the liked-by line is the SINGLE entry point on
           a card. The like count in the actions row stays untappable: two
           targets six pixels apart is a mis-tap. Zero likes renders no line and
           no gap. */
        /* CB56 — the line always occupies its space (LikedByRow reserve), so a
           first like fills it in place: the review card's photo and the
           standard card's height never move. */

        /* SECTION C — comments live INSIDE the footer, under the liked-by line,
           and only when there are comments to show. Rendered from the COMMENT,
           never from the count: comment_count can claim a comment this page's
           read did not return. */
        const previewLines = commentPreview?.recent?.length
          ? commentPreview.recent
          : commentPreview ? [commentPreview] : [];
        const showComments =
          commentPreviewEnabled &&
          commentCount > 0 &&
          previewLines.some(l => (l.content ?? '').trim().length > 0);

        /* ONE OWNER PER SEAM. Whatever is last in the footer carries the 12px
           bottom padding; everything above it carries none, so the gap above
           the first comment is the comment block's own 10px. */
        const actionsBottom = 0; // the liked-by line is always present (CB56)
        const likedByBottom = showComments || mediaFirstSlots ? 0 : 12;

        return (
          <div
            data-feed-footer
            style={{
              /* 1px, matching PostCourseBand's rules and the card's own top
                 rule. The app gets ONE hairline weight on this surface.
                 CB108 mediaFirst: the signed-off mock draws no rule under the media. */
              borderTop: mediaFirstSlots ? undefined : `1px solid ${LINE}`,
            }}
          >
            {/* POST ACTIONS RIGHT, ACTOR LEFT (Ben, 20 Oct): matches the
                round post footer. The avatar/chevron sits at the 20px reading
                edge; heart+count, comment+count and share form one action
                group pushed to the right edge by the auto-margin spacer, so
                the buttons stay right even when the picker renders nothing.
                Same footer object on a normal post and a review post. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: FOOTER_ACTION_GAP,
                padding: compact ? `9px ${gutter}px ${actionsBottom ? 7 : 0}px` : `10px ${gutter}px ${actionsBottom}px`,
              }}
            >
              <FeedActorPicker value={activeActor} onChange={(a) => setActiveActor(a)} />
              <div style={{ marginLeft: 'auto' }} />
              <FooterButton
                icon={LikeGlyph}
                label={likeCount > 0 ? formatCount(likeCount) : undefined}
                active={liked}
                onClick={() => onLike(post, effectiveActor)}
                activeColor={AMBER}
                glyph={<ReactionGlyph reacted={liked} size={21} />}
                haptic={!liked ? 'selection' : 'none'}
              />
              <FooterButton
                icon={MessageCircle}
                label={commentCount > 0 ? formatCount(commentCount) : undefined}
                onClick={() => onComment(post, effectiveActor, 'footer_glyph')}
              />
              <FooterButton icon={Share} onClick={() => onShare(post)} ariaLabel="Send" />
            </div>


            {(
              /* Ben, 14 Sep: this begins at the same card gutter as the heart.
                  The in-flight count and resolved names occupy this same
                  one-line box, so neither height nor x-position moves. */
              <LikedByRow
                postId={mediaFirstSlots?.likedByRound?.subjectId ?? post.id}
                count={likeCount}
                source={mediaFirstSlots?.likedByRound ? 'round' : 'post'}
                kind={mediaFirstSlots?.likedByRound ? 'celebrate' : 'like'}
                isOwnRound={mediaFirstSlots?.likedByRound?.isOwnRound ?? false}
                subject={mediaFirstSlots?.likedByRound ? mediaFirstSlots.likedByRound.subject : post.review ? {
                  authorName: post.displayName ?? null,
                  courseId: post.review.courseId ?? null,
                  courseName: post.review.courseName ?? null,
                  kind: 'review', gross: null, toPar: null,
                  rating: post.review.rating ?? null,
                } : null}
                surfaceColor={CARD}
                reserve
                style={{
                  padding: compact ? `0 ${gutter}px ${likedByBottom ? 10 : 0}px` : `0 ${gutter}px ${likedByBottom}px`,
                }}
              />
            )}


            {mediaFirstSlots?.caption}

            {showComments && (
              <FeedCommentPreview
                preview={commentPreview ?? null}
                commentCount={commentCount}
                onOpenComments={() => onComment(post, effectiveActor, 'preview_row')}
                viewerAvatarUrl={effectiveActor?.avatarUrl ?? null}
                viewerName={effectiveActor?.name ?? null}
                viewerId={effectiveActor?.id ?? null}
                topRule={false}
                padding={`10px ${gutter}px 12px`}
              />
            )}
            {mediaFirstSlots?.addComment}
          </div>
        );
      })();

  // CB109: ordinary and review media-first posts share this one comment door.
  const addComment = currentUserId ? (
    <button
      type="button"
      data-feed-section="add-comment"
      onClick={() => onComment(post, effectiveActor, 'add_comment_row')}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 16px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <SquircleAvatar src={effectiveActor?.avatarUrl ?? null} alt={effectiveActor?.name ?? ''} userId={effectiveActor?.id ?? currentUserId} size={26} hairlineRing />
      <span style={{ fontSize: 13.5, color: 'rgba(248,250,252,0.42)' }}>Add a comment…</span>
    </button>
  ) : null;

  if (rendersRoundCard) {
    const item = roundPostItem(post, postRound ?? null, currentUserId, consequenceSources, roundCourseMeta);
    const roundEngagement = {
      likeCount,
      liked,
      likeAvailable: true,
      commentCount,
      onToggleLike: () => onLike(post, effectiveActor),
      onOpenComments: () => onComment(post, effectiveActor, 'footer_glyph'),
    };
    /* FEATURED ROUNDS — Home only (consequence sources are Home's). A
       qualifying round renders the shared hero; its reaction and comments are
       the same post-like path as the ordinary card, which routes to
       content_reactions('round', whs_score_id) — one reaction, one count. */
    const trigger = consequenceSources && postRound && featuredDecisions
      ? decideFeatured(featuredDecisions, post, postRound, consequenceSources.records, !!item.subject?.pending, weekPickScoreId)
      : null;
    if (trigger && postRound) {
      return (
        <article ref={articleRef} data-feed-featured-round="true" style={{ background: CARD, position: 'relative', borderTop: feedIndex === 0 ? undefined : `1px solid ${LINE}` }}>
          <FeaturedRoundCard
            round={featuredRoundFrom(post, postRound, trigger, item.subject?.image_url ?? null)}
            viewerId={currentUserId ?? undefined}
            shape={roundShape ?? null}
            medals={roundMedals ?? null}
            engagement={roundEngagement}
            square
            pillLabel={tCourses('courseDetail.featured.featuredPill')}
            isFollowed={mountFollowPill ? !!post.isFollowedByMe : undefined}
            onFollow={mountFollowPill ? () => onFollow!(post) : undefined}
            onOpen={() => onRoundTap?.(post, postRound)}
          />
        </article>
      );
    }
    /* CB111 — mediaFirst feeds (Clubhouse, profile posts) render the round
       SCORE-LED: ExploreCard draws author, score block, course and chart with
       no engagement of its own, and the shared media-first footer ends the
       card exactly like every other post. The celebrated line keeps the
       round's own reaction path (source 'round', whs_score_id). The standard
       layout is byte-identical to before. */
    const scoreLed = layout === 'mediaFirst';
    return (
      <article
        ref={articleRef}
        data-feed-round-card="true"
        style={{
          background: CARD,
          overflow: 'hidden',
          position: 'relative',
          paddingInline: scoreLed ? 0 : ROUND_CARD_INSET,
          paddingBottom: scoreLed ? 0 : 14,
          borderTop: feedIndex === 0 ? undefined : `1px solid ${LINE}`,
        }}
      >
        <ExploreCard
          item={item}
          size="std"
          bleed={scoreLed ? 0 : ROUND_CARD_INSET}
          shape={postRound ? (roundShape === undefined ? undefined : roundShape) : undefined}
          feedPlot={homeRoundPlot}
          feedLayout={scoreLed ? 'scoreLed' : undefined}
          medals={roundMedals}
          onTap={() => { if (postRound) onRoundTap?.(post, postRound); }}
          onWhoTap={() => onProfile(post)}
          isFollowed={mountFollowPill ? !!post.isFollowedByMe : undefined}
          onFollow={mountFollowPill ? () => onFollow!(post) : undefined}
          engagement={scoreLed ? undefined : {
            kind: 'celebrate',
            likeCount,
            liked,
            likeAvailable: true,
            commentCount,
            commentAvailable: true,
            onToggleLike: () => onLike(post, effectiveActor),
            onOpenComments: () => onComment(post, effectiveActor, 'footer_glyph'),
            reactionSubjectId: postRound?.whsScoreId ?? null,
            ownerName: post.displayName ?? null,
            isOwnRound: item.who?.is_viewer === true,
          }}
        />
        {scoreLed ? renderFooter(FOOTER_GUTTER, false, {
          caption: null,
          addComment,
          likedByRound: postRound?.whsScoreId ? {
            subjectId: postRound.whsScoreId,
            isOwnRound: item.who?.is_viewer === true,
            subject: {
              authorName: post.displayName ?? null,
              courseId: item.subject?.course_id ?? null,
              courseName: item.subject?.course_name ?? null,
              kind: 'round',
              gross: item.facts.gross ?? null,
              toPar: item.facts.to_par ?? null,
              rating: null,
            },
          } : undefined,
        }) : null}
      </article>
    );
  }

  /* ONE HOME: every review post, resolved course or not, is ReviewPostCard. */
  if (post.isReview) {
    const reviewOpenCourse = reviewCourseId ? () => navigate(`/courses/${reviewCourseId}`) : undefined;
    return (
      <ReviewPostCard
        layout={layout}
        post={post}
        articleRef={articleRef}
        feedIndex={feedIndex}
        onProfile={() => onProfile(post)}
        onReadReview={handleReadReview}
        onPrefetch={prefetchReview}
        onOpenCourse={reviewOpenCourse}
        followPill={mountFollowPill ? (
          <FeedFollowPill isFollowed={!!post.isFollowedByMe} onFollow={() => onFollow!(post)} />
        ) : null}
        ownerMenu={canManage ? (
          <PostOwnerMenu
            postId={post.id}
            isOwnPost
            actorType={post.actorType === 'business' ? 'business' : 'personal'}
            actorId={post.actorId}
            sourceReviewId={post.review?.reviewId ?? null}
            reviewCourseId={post.review?.courseId ?? null}
            variant="inline"
          />
        ) : null}
        media={items.length ? renderMedia(layout !== 'mediaFirst') : null}
        footer={renderFooter(14, true)}
        mediaFirstFooter={(caption) => renderFooter(14, true, { caption, addComment })}
      />
    );
  }

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

      <div style={{ position: 'relative', zIndex: 1 }}>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 2px', position: 'relative', zIndex: 2 }}>
        <button
          type="button"
          onClick={() => onProfile(post)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <SquircleAvatar src={post.avatarUrl} alt={post.displayName} userId={post.actorId ?? post.userId} size={34} hairlineRing />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', minWidth: 0, gap: 5 }}>
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
              flexShrink: 1,
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            {post.displayName}
          </button>
          {playedWith && playedWith.length > 0 && <PostWithLine people={playedWith} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
            {canManage && (
              <PostOwnerMenu
                postId={post.id}
                isOwnPost
                actorType={post.actorType === 'business' ? 'business' : 'personal'}
                actorId={post.actorId}
                variant="inline"
              />
            )}
            {!canManage && currentUserId && playedWith?.some((p) => p.userId === currentUserId) && (
              <RemoveMeMenu postId={post.id} memberId={currentUserId} />
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
        </div>
      </div>

      {layout === 'mediaFirst' ? (() => {
        const hasMedia = items.length > 0;
        const lead = post.actorType === 'business'
          ? courseActivityClubName(post.displayName ?? '')
          : (post.displayName ?? '');
        const caption = (
          <div data-feed-section="caption">
            <CaptionBlock
              body={post.caption || ''}
              expanded={captionExpanded}
              setExpanded={setCaptionExpanded}
              isClamped={isCaptionClamped}
              setIsClamped={setIsCaptionClamped}
              textRef={captionTextRef}
              lead={hasMedia ? lead : null}
              textStyle={hasMedia ? undefined : { fontSize: 15.5, lineHeight: 1.5, color: 'rgba(248,250,252,0.92)' }}
            />
          </div>
        );
        return (
          <>
            {hasMedia ? <div data-feed-section="media">{renderMedia(false)}</div> : caption}
            {renderCourseBand()}
            <div data-feed-section="footer">{renderFooter(FOOTER_GUTTER, false, { caption: hasMedia ? caption : null, addComment })}</div>
          </>
        );
      })() : <>
      {/* Empty-caption spacer: give the header breathing room when no caption block renders */}
      {!post.caption && (
        <div aria-hidden style={{ height: 8 }} />
      )}

      {/* Caption */}
      <CaptionBlock
        body={post.caption || ''}
        expanded={captionExpanded}
        setExpanded={setCaptionExpanded}
        isClamped={isCaptionClamped}
        setIsClamped={setIsCaptionClamped}
        textRef={captionTextRef}
      />


      {renderMedia(false)}


      {/* Course band: identity + figures. The actions row is NO LONGER passed
          in — section A moved it into one always-present footer below, so a
          post with a course and a post without one end on the same object. */}
      {renderCourseBand()}

      {renderFooter(FOOTER_GUTTER, false)}
      </>}

      </div>
    </article>
  );

  function renderCourseBand() {
    return (() => {
        const courseLocation = [post.courseRegion || post.courseSubCountry, post.courseCountry]
          .filter(Boolean)
          .join(', ');
        const hasCourse = Boolean(post.courseName || courseContext);

        if (!hasCourse) return null;

        return (
          <>
            <PostCourseBand
              courseName={post.courseName}
              /**
               * THE COURSE NAME IS A DOOR. Routes to /courses/:courseId for the
               * id the card ALREADY carries (post.courseId). Review posts never
               * reach here; ReviewPostCard owns their course door. No id -> no
               * prop -> plain text, and
               * never a lookup by name.
               */
              onOpenCourse={
                post.courseId
                  ? () => navigate(`/courses/${post.courseId}`)
                  : undefined
              }
              /**
               * BRIEF_ROUND_CARD_CONTEXT S2 — THE REGION IS PRINTED ONCE PER
               * CARD. On a round post PostRoundCard already states
               * "Kent, Britain & Ireland" under the course name 600px above, so
               * the band's copy is pure duplication and goes. The band KEEPS the
               * course name (it is the label of the tap target) and keeps the
               * region on every OTHER kind of post, where the band is the only
               * place the region appears at all.
               */
              courseLocation={courseLocation || null}
              courseRating={post.courseRating ?? null}
              ctx={courseContext ?? null}
              onOpenStats={post.courseId ? () => setStatsOpen(true) : undefined}
              surface="solid"
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
      })();
  }
};

const SingleMediaTapButton: React.FC<{
  onSingle: () => void;
  onDouble: () => void;
  innerRef: React.RefObject<HTMLButtonElement>;
  postId: string;
  /** Review card: fill the frame's height instead of taking the media's ratio. */
  fill?: boolean;
  children: React.ReactNode;
}> = ({ onSingle, onDouble, innerRef, postId, fill = false, children }) => {
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
        ...(fill ? { height: '100%' } : {}),
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

export const FooterButton: React.FC<{
  icon: React.ComponentType<any>;
  label?: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  /** Overrides Icon — the like button passes ReactionGlyph. */
  glyph?: React.ReactNode;
  haptic?: 'none' | 'selection' | 'success' | 'warning';
  ariaLabel?: string;
}> = ({ icon: Icon, label, onClick, active, activeColor, glyph, haptic = 'none', ariaLabel }) => (
  <Pressable
    as="button"
    variant="icon"
    aria-label={ariaLabel}
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
    {glyph ?? <Icon
      /* §6 condense. The engagement row is SHARED by every feed card, so it
         steps 24 -> 21 rather than to the mock's 19: a round-post-only figure
         would restyle photo and review posts too. */
      size={21}
      strokeWidth={1.75}
      color={active ? activeColor ?? T100 : T60}
      fill={active ? activeColor ?? 'none' : 'none'}
    />}
    {label && <span>{label}</span>}
  </Pressable>
);


export const FeedCard = React.memo(FeedCardImpl);
FeedCard.displayName = 'FeedCard';
