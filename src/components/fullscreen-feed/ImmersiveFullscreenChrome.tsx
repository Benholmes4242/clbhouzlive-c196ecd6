/**
 * ImmersiveFullscreenChrome — persistent top+bottom overlay chrome for the
 * fullscreen viewer.
 *
 * Layout (see BRIEF: Fullscreen viewer overlay redesign — Option B):
 *   TOP scrim (persistent, ~70px, linear-gradient(rgba(0,0,0,.45)→transparent)):
 *     - Back chevron (top-LEFT, circular rgba(0,0,0,.32))
 *     - Optional mute toggle (video posts only, next to back)
 *     - Segmented carousel dots (top-CENTER, WHITE active)
 *     - Course-score chip (top-RIGHT, solid rgba(0,0,0,.4), amber ◉ glyph)
 *   BOTTOM scrim (persistent, ~150px, transparent → rgba(0,0,0,.68)):
 *     - LEFT info stack: amber verdict eyebrow · course name · attribution ·
 *       "read review ›" (review posts only)
 *     - RIGHT vertical action rail: avatar (with follow+) · heart+count ·
 *       comment+count · share · more
 *
 * NO fade-on-idle. Chrome is permanent whenever the overlay is open.
 * Chrome only — video playback machinery (SnapFeed / VideoEngine / lanes) is
 * untouched.
 */
import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Plus,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { CarouselDots } from '@/components/media/CarouselDots';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PostOwnerMenu } from '@/components/posts/PostOwnerMenu';
import { getRatingTheme } from '@/lib/globalAchievementMilestoneSystem';
import { Z } from '@/config/zIndex';
import { formatRatingValue } from '@/utils/formatters';
import type { FeedPost } from '@/components/media-system/types/media';

// Shared amber accent — matches FeedCard.tsx:52.
const AMBER = '#F7931E';
const CHEVRON_BG = 'rgba(0,0,0,0.32)';
const CHIP_BG = 'rgba(0,0,0,0.40)';
const ICON_SHADOW = 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))';
const TEXT_SHADOW = '0 1px 3px rgba(0,0,0,0.55)';

const formatCount = (n: number | null | undefined): string | null => {
  if (n === null || n === undefined || n === 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
};

interface ImmersiveFullscreenChromeProps {
  posts: FeedPost[];
  activeIndex: number;
  onClose: () => void;
  onLike: (post: FeedPost) => void;
  onComment: () => void;
  onShare: (post: FeedPost) => void;
  onMore: () => void;
  getLikeState: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount: (post: FeedPost) => number;
  getFollowState: (post: FeedPost) => boolean;
  onFollow: (post: FeedPost) => void;
  onViewProfile: () => void;
  onReviewTap: () => void;
  isOwnPost: boolean;
  golfCourse?: { id: string; name: string; country?: string } | null;
  readOnly?: boolean;
  onBeforeNavigate?: () => void;
}

export const ImmersiveFullscreenChrome = memo(function ImmersiveFullscreenChrome({
  posts,
  activeIndex,
  onClose,
  onLike,
  onComment,
  onShare,
  onMore,
  getLikeState,
  getCommentCount,
  getFollowState,
  onFollow,
  onViewProfile,
  onReviewTap,
  isOwnPost,
  golfCourse,
  readOnly = false,
  onBeforeNavigate,
}: ImmersiveFullscreenChromeProps) {
  const navigate = useNavigate();
  const isMuted = useClubhouseStore((s) => s.isMuted);
  const toggleMute = useClubhouseStore((s) => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore((s) => s.markUserGestureUnmute);
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const isTournamentCardActive = useClubhouseStore((s) => s.isTournamentCardActive);

  const activePost = posts[activeIndex] ?? null;
  const carouselSlide = carouselPositions.get(activeIndex) ?? 0;
  const mediaCount = activePost?.mediaItems?.length ?? 0;
  const activeMedia = activePost?.mediaItems?.[carouselSlide];
  const isVideo = activeMedia?.type === 'video';

  const handleToggleMute = useCallback(() => {
    if (isMuted) markUserGestureUnmute();
    toggleMute();
  }, [isMuted, markUserGestureUnmute, toggleMute]);

  const ownerMenu = useMemo(() => {
    if (!activePost || !isOwnPost) return null;
    return (
      <PostOwnerMenu
        postId={activePost.id}
        isOwnPost
        actorType={activePost.actorType === 'business' ? 'business' : 'personal'}
        actorId={activePost.actorId}
        sourceReviewId={activePost.review?.reviewId ?? null}
        reviewCourseId={activePost.review?.courseId ?? null}
        variant="overlay"
      />
    );
  }, [
    isOwnPost,
    activePost,
  ]);

  if (!activePost) return null;

  // Editorial / tournament cards own their own chrome — bail out.
  const isEditorialCard =
    activePost.postType === 'tournament_result' ||
    activePost.postType === 'pga_card' ||
    activePost.postType === 'course_of_week_card';
  if (isEditorialCard || isTournamentCardActive) return null;

  const likeState = getLikeState(activePost);
  const commentCount = getCommentCount(activePost);
  const isFollowed = getFollowState(activePost);
  const showFollowPlus = !readOnly && !isOwnPost && !isFollowed;

  // Review verdict eyebrow (only for reviews).
  const reviewRating = activePost.review?.rating ?? null;
  const reviewTierLabel =
    reviewRating != null ? getRatingTheme(reviewRating).label : null;

  // Bottom-left title priority: review course name → tagged course → post title fallback.
  const bigTitle =
    activePost.review?.courseName ??
    golfCourse?.name ??
    activePost.courseName ??
    activePost.displayName;

  // Attribution line — author + a secondary label. For non-reviews, homeClub
  // makes the most sense; for reviews we surface author + verdict/course region
  // secondary if the golf course carries one.
  const attributionSecondary =
    activePost.homeClub ??
    activePost.review?.courseSubCountry ??
    activePost.review?.courseCountry ??
    null;
  const attribution = attributionSecondary
    ? `${activePost.displayName} · ${attributionSecondary}`
    : activePost.displayName;

  // Course chip (top-right) — only when a community rating is known.
  const courseRating = activePost.courseRating ?? null;
  const showCourseChip = courseRating != null;

  const likeStr = formatCount(likeState.count);
  const commentStr = formatCount(commentCount);

  const handleCourseTap = () => {
    const cid = activePost.review?.courseId ?? golfCourse?.id ?? activePost.courseId;
    if (!cid) return;
    onBeforeNavigate?.();
    navigate(`/courses/${cid}`);
  };

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 30, pointerEvents: 'none' }}
      data-immersive-chrome
    >
      {/* ─── TOP scrim ─────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 70px)',
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: Z.echo + 2,
          pointerEvents: 'none',
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)',
          paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(14px, env(safe-area-inset-right, 0px))',
          paddingBottom: 12,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {/* LEFT cluster — back chevron + mute (video only) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifySelf: 'start',
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Back"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: CHEVRON_BG,
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              pointerEvents: 'auto',
              padding: 0,
            }}
          >
            <ChevronLeft size={22} stroke="#fff" strokeWidth={2.5} />
          </button>

          {isVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMute();
              }}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: CHEVRON_BG,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                pointerEvents: 'auto',
                padding: 0,
              }}
            >
              {isMuted ? (
                <VolumeX size={20} stroke="#fff" strokeWidth={2} />
              ) : (
                <Volume2 size={20} stroke="#fff" strokeWidth={2} />
              )}
            </button>
          )}
        </div>

        {/* CENTER — carousel dots (persistent white). Reserved slot so grid
            layout keeps left/right anchored even on single-media posts. */}
        <div
          style={{
            justifySelf: 'center',
            minHeight: 10,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {mediaCount > 1 && (
            <CarouselDots
              count={mediaCount}
              active={carouselSlide}
              tone="light"
              isVisible
            />
          )}
        </div>

        {/* RIGHT — course-score chip (solid bg, amber ◉) */}
        <div style={{ justifySelf: 'end' }}>
          {showCourseChip && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCourseTap();
              }}
              aria-label={`Community rating ${formatRatingValue(courseRating!)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: CHIP_BG,
                border: 'none',
                borderRadius: 8,
                padding: '4px 8px',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                pointerEvents: 'auto',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span
                aria-hidden
                style={{
                  color: AMBER,
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                ◉
              </span>
              {formatRatingValue(courseRating!)}
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── BOTTOM scrim ──────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 150px)',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.30) 55%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Bottom info stack (LEFT) */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 18px)',
          left: 'max(16px, env(safe-area-inset-left, 0px))',
          right: 92, // reserve room for the vertical action rail
          zIndex: Z.echo,
          pointerEvents: 'none',
          fontFamily: 'Geist, system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {reviewTierLabel && reviewRating != null && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: AMBER,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              textShadow: TEXT_SHADOW,
            }}
          >
            {reviewTierLabel} · {formatRatingValue(reviewRating)}
          </span>
        )}

        <span
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: '#fff',
            lineHeight: 1.2,
            textShadow: TEXT_SHADOW,
            wordBreak: 'break-word',
          }}
        >
          {bigTitle}
        </span>

        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: '#fff',
            opacity: 0.78,
            lineHeight: 1.25,
            textShadow: TEXT_SHADOW,
          }}
        >
          {attribution}
        </span>

        {activePost.isReview && activePost.review && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReviewTap();
            }}
            aria-label="Read review"
            style={{
              alignSelf: 'flex-start',
              marginTop: 2,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              pointerEvents: 'auto',
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: 500,
              color: '#fff',
              opacity: 0.62,
              lineHeight: 1,
              textShadow: TEXT_SHADOW,
            }}
          >
            read review ›
          </button>
        )}
      </div>

      {/* Bottom-RIGHT vertical action rail */}
      <div
        style={{
          position: 'fixed',
          right: 'max(12px, env(safe-area-inset-right, 0px))',
          bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 24px)',
          zIndex: Z.echo,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          pointerEvents: 'none',
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {/* Creator squircle (38px) with amber follow+ badge */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            filter: ICON_SHADOW,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            aria-label={`View ${activePost.displayName}'s profile`}
            style={{
              width: 38,
              height: 38,
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SquircleAvatar
              size={38}
              src={activePost.avatarUrl}
              alt={activePost.displayName}
              fallback={activePost.displayName?.[0] ?? '?'}
              hairlineRing
            />
          </button>

          {showFollowPlus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFollow(activePost);
              }}
              aria-label="Follow"
              style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: AMBER,
                border: '2px solid rgba(255,255,255,0.95)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              <Plus size={12} strokeWidth={2.5} color="#fff" />
            </button>
          )}
          {!readOnly && !isOwnPost && isFollowed && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: AMBER,
                border: '2px solid rgba(255,255,255,0.95)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
              }}
            >
              <Check size={12} strokeWidth={3} color="#fff" />
            </span>
          )}
        </div>

        {!readOnly && (
          <>
            <RailButton
              onClick={() => onLike(activePost)}
              ariaLabel={likeState.isLiked ? 'Unlike' : 'Like'}
              count={likeStr}
              accent={likeState.isLiked}
            >
              <Heart
                size={26}
                fill={likeState.isLiked ? AMBER : 'transparent'}
                stroke={likeState.isLiked ? AMBER : '#fff'}
                strokeWidth={2}
              />
            </RailButton>

            <RailButton
              onClick={onComment}
              ariaLabel="Comments"
              count={commentStr}
            >
              <MessageCircle size={26} stroke="#fff" strokeWidth={2} />
            </RailButton>

            <RailButton onClick={() => onShare(activePost)} ariaLabel="Share">
              <Send size={26} stroke="#fff" strokeWidth={2} />
            </RailButton>

            {ownerMenu ? (
              <div
                style={{ filter: ICON_SHADOW, pointerEvents: 'auto' }}
              >
                {ownerMenu}
              </div>
            ) : (
              <RailButton onClick={onMore} ariaLabel="More options">
                <MoreHorizontal size={26} stroke="#fff" strokeWidth={2} />
              </RailButton>
            )}
          </>
        )}
      </div>
    </div>
  );
});

// ── Rail button (icon + optional count below) ──
interface RailButtonProps {
  onClick: () => void;
  ariaLabel: string;
  count?: string | null;
  accent?: boolean;
  children: React.ReactNode;
}
const RailButton: React.FC<RailButtonProps> = ({
  onClick,
  ariaLabel,
  count,
  accent,
  children,
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={ariaLabel}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      background: 'transparent',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      pointerEvents: 'auto',
      filter: ICON_SHADOW,
      fontFamily: 'Geist, system-ui, sans-serif',
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </span>
    {count && (
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: accent ? AMBER : '#fff',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          textShadow: TEXT_SHADOW,
        }}
      >
        {count}
      </span>
    )}
  </button>
);

export default ImmersiveFullscreenChrome;
