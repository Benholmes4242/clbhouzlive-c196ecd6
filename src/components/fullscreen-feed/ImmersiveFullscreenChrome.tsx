/**
 * ImmersiveFullscreenChrome — persistent top+bottom chrome for the fullscreen
 * viewer. Chrome-only; playback machinery (SnapFeed / VideoEngine / lanes) is
 * untouched.
 *
 * Layout:
 *   TOP scrim (persistent, ~78px, rgba(0,0,0,.5)→transparent):
 *     - Back chevron top-LEFT (circular rgba(0,0,0,.32))
 *     - Course block top-RIGHT (name 12/500 ellipsis, location 9/.75 w/ map-pin,
 *       amber ◉ score chip below)
 *   BOTTOM scrim (persistent, ~130px, transparent → rgba(0,0,0,.7)):
 *     - LEFT: 32px squircle avatar + column (name · [2mo · FollowPill] · read
 *       review ›)
 *     - CENTER: segmented carousel dots (white active)
 *     - RIGHT: vertical action rail (heart, comment, send, more)
 *
 * NO fade-on-idle. NO carousel dots at top. NO score eyebrow. Course chip in
 * the top-right is the ONLY score surface.
 */
import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { triggerHaptic } from '@/lib/ui/haptics';
import { CarouselDots } from '@/components/media/CarouselDots';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';

import { FeedFollowPill } from '@/components/feed/FeedFollowPill';
import MapPinIcon from '@/components/icons/MapPinIcon';
import { Z } from '@/config/zIndex';
import { formatRatingValue } from '@/utils/formatters';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useFollowState } from '@/hooks/useFollowState';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { FeedPost } from '@/components/media-system/types/media';
import { formatCountKilo, formatRelativeWithSeconds as timeAgo } from '@/i18n/format';

const AMBER = '#F7931E';
const CHEVRON_BG = 'rgba(0,0,0,0.32)';
const CHIP_BG = 'rgba(0,0,0,0.40)';
const ICON_SHADOW = 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))';
const TEXT_SHADOW = '0 1px 3px rgba(0,0,0,0.55)';

function formatCount(n: number | null | undefined): string | null {
  if (n === null || n === undefined || n === 0) return null;
  return formatCountKilo(n);
}

/**
 * FullscreenCaption — the post caption beneath the author sub-row.
 *
 * Clamped to 3 lines; "See more" renders ONLY when the text really overflows
 * (measured scrollHeight vs clientHeight, same approach as the tour hero
 * insight line). Collapses again whenever the pager moves to another post.
 */
const CaptionBlock: React.FC<{
  caption: string;
  resetKey: number;
  onMentionTap: (m: { entityType: 'user' | 'business'; entityId: string; display: string }) => void;
}> = ({ caption, resetKey, onMentionTap }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Reset on pager move — keyed on activeIndex, NOT the caption string, since
  // two neighbouring posts can carry identical text.
  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  // Real overflow measurement (never estimated from string length).
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const measure = () => {
      const node = textRef.current;
      if (!node) return;
      if (expanded) return; // clamp is off — nothing meaningful to measure
      setOverflows(node.scrollHeight > node.clientHeight + 1);
    };
    measure();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener('resize', measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', measure);
    };
  }, [caption, expanded]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      style={{ marginTop: 6, minWidth: 0, pointerEvents: 'auto' }}
      onClick={stop}
      onPointerDown={stop}
      onTouchStart={stop}
      onTouchMove={stop}
    >
      <div
        ref={textRef}
        style={{
          fontSize: 13.5,
          lineHeight: 1.35,
          color: '#fff',
          opacity: 0.92,
          textShadow: TEXT_SHADOW,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...(expanded
            ? {
                WebkitLineClamp: 'unset' as unknown as number,
                overflow: 'auto',
                maxHeight: '40vh',
                overscrollBehavior: 'contain',
              }
            : {
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }),
        }}
      >
        <MentionText text={caption} onMentionTap={onMentionTap} style={{ pointerEvents: 'auto' }} />
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          style={{
            marginTop: 4, alignSelf: 'flex-start', background: 'transparent',
            border: 'none', padding: 0, cursor: 'pointer', pointerEvents: 'auto',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#fff',
            opacity: 0.7, textShadow: TEXT_SHADOW, lineHeight: 1.2,
          }}
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
};




interface Props {
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
  onFollow: (post: FeedPost, followedNow: boolean) => void;
  onViewProfile: () => void;
  onReviewTap: () => void;
  isOwnPost: boolean;
  golfCourse?: { id?: string | null; name?: string | null; courseCountry?: string | null } | null;
  readOnly?: boolean;
  onBeforeNavigate?: () => void;
  /** When true, only the back chevron renders — the user is on the end-of-feed plate. */
  feedEnded?: boolean;
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
  feedEnded = false,
}: Props) {
  const navigate = useNavigate();

  // Mentions inside the caption must dismiss the fullscreen overlay BEFORE
  // routing, otherwise the profile mounts underneath the still-open viewer.
  // The navigate is deferred one frame so the overlay unmounts cleanly.
  const handleMentionTap = useCallback(
    (m: { entityType: 'user' | 'business'; entityId: string; display: string }) => {
      onClose();
      const to = m.entityType === 'business' ? `/business/${m.entityId}` : `/profile/${m.entityId}`;
      requestAnimationFrame(() => navigate(to));
    },
    [onClose, navigate],
  );
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const activePagerIdx = useFullscreenFeedStore((s) => s.activePagerIdx);
  const isTournamentCardActive = useClubhouseStore((s) => s.isTournamentCardActive);
  const isAudioMuted = useSessionAudio((s) => s.isMuted);

  const handleMuteTap = useCallback(() => {
    try { triggerHaptic('light'); } catch {}
    useSessionAudio.getState().toggle();
  }, []);

  const activePost = posts[activeIndex] ?? null;
  // Prefer the FullscreenMediaPager's live index (updates on every scroll
  // settle inside the fullscreen viewer). Fall back to the clubhouseStore
  // position map (which lags horizontal swipes in fullscreen).
  const carouselSlide = activePagerIdx ?? carouselPositions.get(activeIndex) ?? 0;
  const mediaCount = activePost?.mediaItems?.length ?? 0;
  // MUTE GATE — audio control only exists over media that has audio.
  // The slide index is clamped into range before indexing: activePagerIdx is a
  // horizontal position within ONE post's carousel, so a stale value from the
  // outgoing post could otherwise resolve to undefined on a new single-media
  // post and hide the speaker on an actual video.
  const activeSlide = mediaCount > 0 && carouselSlide < mediaCount ? carouselSlide : 0;
  const activeMediaIsVideo =
    mediaCount > 0 && activePost?.mediaItems?.[activeSlide]?.type === 'video';



  if (feedEnded) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 30, pointerEvents: 'none' }} data-immersive-chrome>
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: Z.echo + 2,
            pointerEvents: 'none',
            paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 48px) + 8px)',
            paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))',
            display: 'flex', alignItems: 'flex-start',
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Back"
            style={{
              width: 44, height: 44, borderRadius: '50%', background: CHEVRON_BG,
              border: 'none', display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', cursor: 'pointer',
              pointerEvents: 'auto', padding: 0, flexShrink: 0,
            }}
          >
            <ChevronLeft size={26} stroke="#fff" strokeWidth={2.5} style={{ display: 'block', marginLeft: -2 }} />
          </button>
        </div>
      </div>
    );
  }

  if (!activePost) return null;

  const isEditorialCard =
    activePost.postType === 'tournament_result' ||
    activePost.postType === 'pga_card' ||
    activePost.postType === 'course_of_week_card';
  if (isEditorialCard || isTournamentCardActive) return null;

  const likeState = getLikeState(activePost);
  const commentCount = getCommentCount(activePost);
  const { activeActor } = useActiveActor();
  const canFollowActor =
    activePost.actorType === 'personal' || activePost.actorType === 'business';
  const { isFollowing: canonicalFollowing } = useFollowState({
    targetActorType: canFollowActor ? (activePost.actorType as 'personal' | 'business') : 'personal',
    targetActorId: canFollowActor ? activePost.actorId : undefined,
    viewerActorType: activeActor?.type ?? 'personal',
    viewerActorId: activeActor?.id ?? undefined,
  });
  // Canonical cache wins (DB-seeded + patched live by every toggle);
  // item-embedded state is only the pre-seed fallback.
  const isFollowed = canonicalFollowing ?? getFollowState(activePost);

  const courseName =
    activePost.review?.courseName ??
    golfCourse?.name ??
    activePost.courseName ??
    null;
  const courseLocation =
    activePost.review?.courseSubCountry ??
    activePost.review?.courseCountry ??
    (activePost as any).courseSubCountry ??
    (activePost as any).courseCountry ??
    golfCourse?.courseCountry ??
    null;
  // Fallback: not every feed-post payload path carries course_avg_overall_score
  // (tag-only posts, older RPCs). Resolve the community rating from
  // course_rating_aggregates when the payload is missing it.
  const resolvedCourseId = activePost.review?.courseId ?? golfCourse?.id ?? activePost.courseId ?? null;
  const { data: ratingAggregate } = useCourseRatingAggregates(
    activePost.courseRating == null ? resolvedCourseId ?? undefined : undefined,
  );
  const courseRating =
    activePost.courseRating ??
    (ratingAggregate?.avg_overall_score != null ? Number(ratingAggregate.avg_overall_score) : null);
  const showCourseChip = courseRating != null;

  const likeStr = formatCount(likeState.count);
  const commentStr = formatCount(commentCount);
  const timeLabel = timeAgo(activePost.createdAt);

  const handleCourseTap = () => {
    const cid = activePost.review?.courseId ?? golfCourse?.id ?? activePost.courseId;
    if (!cid) return;
    onBeforeNavigate?.();
    navigate(`/courses/${cid}`);
  };

  return (
    <div className="fixed inset-0" style={{ zIndex: 30, pointerEvents: 'none' }} data-immersive-chrome>
      {/* Top scrim removed — chrome sits directly on the blurred media
          backdrop. Text/icons carry their own drop-shadow for legibility. */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: Z.echo + 2,
          pointerEvents: 'none',
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 48px) + 8px)',
          paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(14px, env(safe-area-inset-right, 0px))',
          paddingBottom: 10,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {/* LEFT — back chevron */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: '50%', background: CHEVRON_BG,
            border: 'none', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', cursor: 'pointer',
            pointerEvents: 'auto', padding: 0, flexShrink: 0,
          }}
        >
          <ChevronLeft size={26} stroke="#fff" strokeWidth={2.5} style={{ display: 'block', marginLeft: -2 }} />
        </button>


        {/* RIGHT — course block */}
        {courseName && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              maxWidth: '60%',
              minWidth: 0,
              textAlign: 'right',
            }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleCourseTap(); }}
              aria-label={`Open ${courseName}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                gap: 4, maxWidth: '100%', minWidth: 0, textAlign: 'right',
                background: 'transparent', border: 'none', padding: 0, margin: 0,
                cursor: 'pointer', pointerEvents: 'auto', fontFamily: 'inherit',
                color: 'inherit',
              }}
            >
              <span
                title={courseName}
                style={{
                  fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2,
                  textShadow: TEXT_SHADOW,
                  maxWidth: '100%', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {courseName}
              </span>
              {courseLocation && (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, color: '#fff', opacity: 0.8, lineHeight: 1.1,
                    textShadow: TEXT_SHADOW,
                    maxWidth: '100%', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  <MapPinIcon width={12} height={12} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {courseLocation}
                  </span>
                </span>
              )}
            </button>
            {showCourseChip && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCourseTap(); }}
                aria-label={`Community rating ${formatRatingValue(courseRating!)}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '5px 12px 5px 6px', borderRadius: 999,
                  cursor: 'pointer', marginTop: 3,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  pointerEvents: 'auto', fontFamily: 'inherit',
                }}
              >
                <img
                  src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 20, height: 20, flexShrink: 0, objectFit: 'contain' }}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums lining', lineHeight: 1 }}>
                  {formatRatingValue(courseRating!)}
                </span>
              </button>
            )}

          </div>
        )}

      </div>

      {/* Bottom scrim removed — author strip + action rail sit on the
          blurred backdrop; each element carries its own drop-shadow. */}

      {/* Carousel dots — bottom-center, above scrubber (~16px from bottom) */}
      {mediaCount > 1 && (
        <div
          style={{
            position: 'fixed',
            left: 0, right: 0,
            bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 12px) + 12px)',
            display: 'flex', justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: Z.echo + 1,
          }}
        >
          <CarouselDots count={mediaCount} active={carouselSlide} tone="light" isVisible />
        </div>
      )}

      {/* Bottom-LEFT — author + info stack */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 26px)',
          left: 'max(14px, env(safe-area-inset-left, 0px))',
          right: 64, // reserve space for right rail
          zIndex: Z.echo,
          pointerEvents: 'none',
          fontFamily: 'Geist, system-ui, sans-serif',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
          aria-label={`View ${activePost.displayName}'s profile`}
          style={{
            width: 40, height: 40, padding: 0, background: 'transparent',
            border: 'none', cursor: 'pointer', pointerEvents: 'auto',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, filter: ICON_SHADOW,
          }}
        >
          <SquircleAvatar
            size={40}
            src={activePost.avatarUrl}
            alt={activePost.displayName}
            fallback={activePost.displayName?.[0] ?? '?'}
            hairlineRing
          />
        </button>

        <div
          style={{
            display: 'flex', flexDirection: 'column', minWidth: 0, gap: 3, flex: 1,
          }}
        >
          {/* Name row — name ellipses first, follow never pushed off */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
              style={{
                fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2,
                textShadow: TEXT_SHADOW,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                minWidth: 0, flex: '0 1 auto', pointerEvents: 'auto', cursor: 'pointer',
              }}
            >
              {activePost.displayName}
            </span>
          </div>

          {/* Sub-row: timeAgo · Follow pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 20 }}>
            {timeLabel && (
              <span
                style={{
                  fontSize: 12, color: '#fff', opacity: 0.75, lineHeight: 1,
                  textShadow: TEXT_SHADOW, flexShrink: 0,
                }}
              >
                {timeLabel}
              </span>
            )}
            {!readOnly && !isOwnPost && (
              <div style={{ pointerEvents: 'auto', flexShrink: 0 }}>
                <FeedFollowPill
                  isFollowed={isFollowed}
                  onFollow={() => onFollow(activePost, isFollowed)}
                />
              </div>
            )}
          </div>

          {/* Caption — 3-line clamp + See more/See less. Nothing renders for
              empty/whitespace-only captions (no element, no gap). */}
          {activePost.caption?.trim() ? (
            <CaptionBlock caption={activePost.caption} resetKey={activeIndex} onMentionTap={handleMentionTap} />
          ) : null}



          {activePost.isReview && activePost.review && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReviewTap(); }}
              aria-label="Read review"
              style={{
                alignSelf: 'flex-start', marginTop: 3, background: 'transparent',
                border: 'none', padding: 0, cursor: 'pointer', pointerEvents: 'auto',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#fff',
                opacity: 0.7, lineHeight: 1, textShadow: TEXT_SHADOW,
              }}
            >
              read review ›
            </button>
          )}
        </div>

      </div>

      {/* Bottom-RIGHT — vertical action rail (no avatar).
          ONE wrapper, always mounted. Mute is exempt from the !readOnly gate
          (read-only / gallery opens still need audio control on videos) but is
          gated on the active slide BEING a video — a photograph has no audio to
          control. Only the engagement buttons below it are gated on !readOnly.
          The column is bottom-anchored, so dropping mute (its first child)
          shortens it from the top and the buttons beneath do not move. */}
      <div
        style={{
          position: 'fixed',
          right: 'max(12px, env(safe-area-inset-right, 0px))',
          bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 26px)',
          zIndex: Z.echo,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, pointerEvents: 'none',
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {activeMediaIsVideo && (
          <RailButton
            onClick={handleMuteTap}
            ariaLabel={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? (
              <VolumeX size={32} stroke="#fff" strokeWidth={2} />
            ) : (
              <Volume2 size={32} stroke="#fff" strokeWidth={2} />
            )}
          </RailButton>
        )}

        {!readOnly && (
          <>
          <RailButton

            onClick={() => onLike(activePost)}
            ariaLabel={likeState.isLiked ? 'Unlike' : 'Like'}
            count={likeStr}
            accent={likeState.isLiked}
          >
            <Heart
              size={32}
              fill={likeState.isLiked ? AMBER : 'transparent'}
              stroke={likeState.isLiked ? AMBER : '#fff'}
              strokeWidth={2}
            />
          </RailButton>

          <RailButton onClick={onComment} ariaLabel="Comments" count={commentStr}>
            <MessageCircle size={32} stroke="#fff" strokeWidth={2} />
          </RailButton>

          <RailButton onClick={() => onShare(activePost)} ariaLabel="Share">
            <Send size={32} stroke="#fff" strokeWidth={2} />
          </RailButton>

          <RailButton onClick={onMore} ariaLabel="More options">
            <MoreHorizontal size={28} stroke="#fff" strokeWidth={2} />
          </RailButton>
          </>
        )}
      </div>


    </div>
  );
});

interface RailButtonProps {
  onClick: () => void;
  ariaLabel: string;
  count?: string | null;
  accent?: boolean;
  children: React.ReactNode;
}
const RailButton: React.FC<RailButtonProps> = ({ onClick, ariaLabel, count, accent, children }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    aria-label={ariaLabel}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
      pointerEvents: 'auto', filter: ICON_SHADOW,
      fontFamily: 'Geist, system-ui, sans-serif',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </span>
    {count && (
      <span
        style={{
          fontSize: 13, fontWeight: 700, color: accent ? AMBER : '#fff',
          lineHeight: 1, fontVariantNumeric: 'tabular-nums lining', textShadow: TEXT_SHADOW,
        }}
      >
        {count}
      </span>
    )}

  </button>
);

export default ImmersiveFullscreenChrome;
