/**
 * LightFeedCard — light-mode profile feed card.
 *
 * Structural clone of `src/components/feed/FeedCard.tsx`, identical DOM and
 * props interface, with only the palette swapped to sit on the light
 * profile/handicap surface (`#F8FAFC`). All sub-components (SquircleAvatar,
 * MediaCarousel, InlineVideo, FeedFollowPill, FeedActorPicker, PostOwnerMenu)
 * are reused from the Clubhouse feed — do NOT fork them.
 *
 * Clubhouse (dark) FeedCard is unchanged; this file is profile-only.
 */
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import { buildReviewSheetPayload } from '@/components/posts/buildReviewSheetPayload';
import { Heart, MapPin, MessageCircle, Share, type LucideIcon } from 'lucide-react';
import { PostOwnerMenu } from '@/components/posts/PostOwnerMenu';
import { useManageableBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { MentionText } from '@/components/mentions/MentionText';
import { formatRatingValue } from '@/utils/formatters';
import { useActiveActor } from '@/context/ActiveActorContext';

import type { FeedPost } from '@/components/media-system/types/media';
import { InlineVideo } from '@/components/feed/InlineVideo';
import { MuteButton } from '@/audio/MuteButton';
import { MediaCarousel } from '@/components/feed/MediaCarousel';
import { FeedFollowPill } from '@/components/feed/FeedFollowPill';
import { FeedActorPicker } from '@/components/feed/FeedActorPicker';
import type { ActiveActor } from '@/types/actor';
import LqipUnderlay from '@/components/shared/LqipUnderlay';
import Pressable from '@/components/ui/Pressable';
import { usePostViewTracker } from '@/hooks/usePostViewTracker';
import { formatCountKilo as formatCount, formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { PostCourseBand } from '@/components/feed/PostCourseBand';
import { ReviewGhostNumeral, ReviewVerdictLabel } from '@/components/shared/ReviewGhostScore';
import { CourseStatsSheet } from '@/components/feed/CourseStatsSheet';
import { PostRoundCard } from '@/components/feed/PostRoundCard';
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import { PostRoundShell } from '@/components/feed/PostRoundShell';
import { PostRoundDegraded } from '@/components/feed/PostRoundDegraded';


// Light palette — cards sit on the page background (#F8FAFC); dividers are
// a touch darker than bg. Text drops to ink (#0F172A) with proportional
// alpha steps for secondary/tertiary.
const CARD = '#F8FAFC';
const T100 = '#0F172A';
const T60 = 'rgba(15,23,42,0.60)';
const T40 = 'rgba(15,23,42,0.42)';
const LINE = '#E5E7EA';
const MEDIA_LETTERBOX = '#E2E8F0';
const CAPTION_FADE_FROM = 'rgba(248,250,252,0)';
const CAPTION_FADE_TO = '#F8FAFC';
const AMBER = '#F7931E';
const GREEN = '#22C55E';

const RATIO_MIN = 0.8;
const RATIO_MAX = 1.91;
const FALLBACK_RATIO = 4 / 5;

// formatCount / timeAgo moved to @/i18n/format (Wave 1 drift-consolidation).


export interface LightFeedCardProps {
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
  isActive?: boolean;
  mountVideo?: boolean;
  /** Early-motion handover — see InlineVideo.earlyMotion. */
  earlyMotion?: boolean;
  initialMediaIndex?: number;
  onCarouselIndexChange?: (post: FeedPost, idx: number) => void;
  onFollow?: (post: FeedPost) => void;
  currentUserId?: string;
  feedIndex?: number;
  /** Batched course enrichment (resolved once at page level). */
  courseContext?: PostCourseContext | null;
  /** Batched round attached to this post (resolved once at page level). */
  postRound?: PostRound | null;
  /** True when the round is still in flight — render the shell, not nothing. */
  postRoundPending?: boolean;
  /**
   * SETTLED-AND-ABSENT: the round map has finished and has no entry for this
   * post. Distinct from `postRoundPending` on purpose — see PostRoundDegraded.
   */
  postRoundMissing?: boolean;
  /** Opens the attached round's scorecard. */
  onRoundTap?: (post: FeedPost, round: PostRound) => void;
}

interface CaptionBlockProps {
  body: string;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  isClamped: boolean;
  setIsClamped: (v: boolean) => void;
  textRef: React.MutableRefObject<HTMLDivElement | null>;
  onReadReview?: (e: React.MouseEvent) => void;
}

const CaptionBlock: React.FC<CaptionBlockProps> = ({ body, expanded, setExpanded, isClamped, setIsClamped, textRef, onReadReview }) => {
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (!expanded) {
      const clamped = el.scrollHeight > el.clientHeight + 1;
      setIsClamped(clamped);
    }
  }, [body, expanded, setIsClamped, textRef]);

  const isReviewMode = !!onReadReview;
  const showMore = !isReviewMode && !expanded && isClamped;
  const showReadReview = isReviewMode && !!body;

  if (!body && !showReadReview) return null;

  const fadeGradient = `linear-gradient(90deg, ${CAPTION_FADE_FROM} 0%, ${CAPTION_FADE_TO} 40%)`;
  const fadeGradientWide = `linear-gradient(90deg, ${CAPTION_FADE_FROM} 0%, ${CAPTION_FADE_TO} 38%)`;

  return (
    <div style={{ padding: '0px 14px 10px', position: 'relative', zIndex: 2, marginTop: -1 }}>
      <div style={{ position: 'relative' }}>
        <div
          ref={textRef}
          style={{
            fontSize: 14,
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
                color: T60, fontSize: 14, fontWeight: 600, cursor: 'pointer',
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
              background: fadeGradient,
              border: 'none',
              color: T60,
              fontSize: 14,
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
              background: fadeGradientWide,
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

const LightFeedCardImpl: React.FC<LightFeedCardProps> = ({
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
  courseContext,
  postRound,
  postRoundPending,
  postRoundMissing,
  onRoundTap,
}) => {
  const { activeActor, setActiveActor } = useActiveActor();
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [isCaptionClamped, setIsCaptionClamped] = useState(false);
  // Actor selection is GLOBAL — picker reads and writes the session-wide activeActor.
  const effectiveActor: ActiveActor | null = activeActor;
  const captionTextRef = useRef<HTMLDivElement | null>(null);
  const singleMediaBtnRef = useRef<HTMLButtonElement | null>(null);

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
  const hasVideo = items.some((m) => m?.type === 'video');

  const ratio = useMemo(() => {
    if (!media || !media.width || !media.height) return FALLBACK_RATIO;
    const r = media.width / media.height;
    return Math.min(RATIO_MAX, Math.max(RATIO_MIN, r));
  }, [media]);

  const reviewRating = post.review?.rating ?? null;
  const isDeal = false;

  const subLine = useMemo(() => {
    const parts: string[] = [];
    if (isDeal) parts.push('Sponsored');
    else if (post.creatorRelation === 'system') parts.push('clbhouz');
    parts.push(timeAgo(post.createdAt));
    return parts.filter(Boolean).join(' · ');
  }, [post, isDeal]);

  const mediaUrl = media?.imageUrl || media?.thumbnailUrl || '';

  const attachViewTracker = usePostViewTracker(post.id, true);
  return (
    <article
      ref={attachViewTracker as React.RefCallback<HTMLElement>}
      style={{
        background: CARD,
        overflow: 'hidden',
        marginInline: 0,
        position: 'relative',
        minHeight: 1,
      }}
    >
      {/* Ghost numeral — shared component, light surface (ink watermark).
          Palettes must never fork: this used to carry a local gold ramp. */}
      {reviewRating != null && (
        <ReviewGhostNumeral rating={reviewRating} surface="light" />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 2px', position: 'relative', zIndex: 2 }}>
        <button
          type="button"
          onClick={() => onProfile(post)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <SquircleAvatar src={post.avatarUrl} alt={post.displayName} size={34} hairlineRing ringColor={LIGHT_HAIRLINE} />
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
              fontSize: 14,
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
            <span style={{ fontSize: 11, color: T60 }}>{subLine}</span>
            {mountFollowPill && (
              <FeedFollowPill
                isFollowed={!!post.isFollowedByMe}
                onFollow={() => onFollow!(post)}
              />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isDeal && (
            <span
              style={{
                fontSize: 10,
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
              surface="light"
              onClick={handleReadReview}
              ariaLabel={`Your review: ${formatRatingValue(reviewRating)} ${getRatingTierLabel(reviewRating)}`}
            />
          )}
        </div>
      </div>

      {!(post.caption || (post.isReview && post.review?.reviewText)) && (
        <div aria-hidden style={{ height: 8 }} />
      )}

      <CaptionBlock
        body={post.caption || (post.isReview ? post.review?.reviewText ?? '' : '')}
        expanded={captionExpanded}
        setExpanded={setCaptionExpanded}
        isClamped={isCaptionClamped}
        setIsClamped={setIsCaptionClamped}
        textRef={captionTextRef}
        onReadReview={post.isReview && reviewCourseId ? handleReadReview : undefined}
      />

      {/* Attached round — scorecard block sits ABOVE media (parity with Clubhouse) */}
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
          crown={
            postRound.crown
              ? {
                  category: crownCategoryLabel(postRound.crown.category),
                  previousHolderName: postRound.crown.previousHolderName,
                  margin: postRound.crown.margin != null ? String(postRound.crown.margin) : null,
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
            mountVideo={mountVideo}
            postId={post.id}
            onIndexChange={(idx) => onCarouselIndexChange?.(post, idx)}
            onOpen={(idx, mediaId, originEl, ownerKey) => {
              const slide = items[idx];
              const posterUrl = slide?.thumbnailUrl ?? slide?.imageUrl ?? null;
              onOpenMedia(
                post,
                idx,
                originEl ? { el: originEl, posterUrl } : undefined,
                mediaId,
                ownerKey ?? null,
              );
            }}
          />

        ) : media ? (
          <button
            type="button"
            ref={singleMediaBtnRef}
            data-post-id={post.id}
            onClick={() =>
              onOpenMedia(post, 0, {
                el: singleMediaBtnRef.current,
                posterUrl: media.thumbnailUrl ?? media.imageUrl ?? null,
              })
            }
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: String(ratio),
                minHeight: 120,
                // SINGLE media only (the carousel keeps its own fixed frame).
                // Parity with the Clubhouse FeedCard's chrome reserve, but 330
                // not 305 — DELIBERATE, not a typo. The light card sits on a
                // wider content column with less surrounding chrome, so it can
                // carry slightly more height without dominating. Do not
                // "correct" this to match Clubhouse.
                maxHeight: 'calc(100vh - 330px - env(safe-area-inset-bottom))',
                overflow: 'hidden',
                background: MEDIA_LETTERBOX,
              }}
            >
              {media.type === 'video' ? (
                mountVideo ? (
                  <InlineVideo
                    item={media}
                    isActive={isActive}
                    isNear={mountVideo}
                    earlyMotion={earlyMotion}
                    feedIndex={feedIndex}
                    postId={post.id}
                    ownerKey={`${post.id}:0`}
                    objectFit="cover"
                  />

                ) : media.thumbnailUrl ? (
                  <>
                    {feedIndex != null && feedIndex >= 1 && (
                      <LqipUnderlay from={media.thumbnailUrl} />
                    )}
                    <img
                      src={media.thumbnailUrl}
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
                ) : null
              ) : mediaUrl ? (
                <>
                  {feedIndex != null && feedIndex >= 1 && (
                    <LqipUnderlay from={mediaUrl} />
                  )}
                  <img
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
          </button>
        ) : null}
      </div>

      {/* Course band + footer — same primitive as the Clubhouse card */}
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
            <FeedActorPicker value={activeActor} onChange={(a) => setActiveActor(a)} theme="light" />
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
            {/* No mute control here: InlineVideo already renders the canonical
                MuteButton bottom-right of the active video tile (parity with
                Clubhouse). A second one in the action row was a duplicate. */}


          </div>
        );

        if (!hasCourse) {
          return <div style={{ borderTop: `0.5px solid ${LINE}` }}>{actionsRow}</div>;
        }

        return (
          <>
            <PostCourseBand
              courseName={post.courseName}
              courseLocation={courseLocation || null}
              courseRating={post.courseRating ?? null}
              ctx={courseContext ?? null}
              onOpenStats={post.courseId ? () => setStatsOpen(true) : undefined}
              actions={actionsRow}
              surface="solid"
              tone="light"
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
    </article>
  );
};

const FooterButton: React.FC<{
  icon: LucideIcon;
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
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
    }}
    innerStyle={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
  >
    <Icon
      size={24}
      strokeWidth={1.75}
      color={active ? activeColor ?? T100 : T60}
      fill={active ? activeColor ?? 'none' : 'none'}
    />
    {label && <span>{label}</span>}
  </Pressable>
);


export const LightFeedCard = React.memo(LightFeedCardImpl);
LightFeedCard.displayName = 'LightFeedCard';
