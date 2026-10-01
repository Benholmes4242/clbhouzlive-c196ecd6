/**
 * ImmersiveFullscreenChrome — persistent top+bottom chrome for the fullscreen
 * viewer. Chrome-only; playback machinery (SnapFeed / VideoEngine / lanes) is
 * untouched.
 *
 * Layout:
 *   TOP (no scrim — the back chevron and course block carry their own
 *   shadow over the blurred media backdrop):
 *     - Back chevron top-LEFT (circular rgba(0,0,0,.32))
 *     - Course block top-RIGHT (name 12/500 ellipsis, location 9/.75 w/ map-pin,
 *       amber ◉ score chip below)
 *   BOTTOM (no scrim — removed earlier; every element carries its own
 *   drop-shadow over the blurred media backdrop). From the top down:
 *     - LEFT: 40px squircle avatar + column (name · [time · FollowPill] ·
 *       caption with one inline CTA at the end of line three — "Read more"
 *       (expands in place) or, on reviews, "Full review" (opens the sheet;
 *       own line when the review has no text) · likers row). LikedByRow
 *       with avatarRing="media"; it reserves its full size at first paint.
 *     - RIGHT: vertical action rail (mute, heart, comment, send, more)
 *     - BOTTOM-MOST: the comment bar (viewer avatar + "Add a comment…"),
 *       clamped to the physical bottom edge as an opaque bar. When it
 *       renders, the author column and rail clear it by COMMENT_BAR_BLOCK;
 *       when it does not, they sit on the safe-area floor. There are no
 *       bottom carousel dots and no bottom scrubber bar.
 *   TOP STRIP: FullscreenTopProgress — a segmented strip carrying carousel
 *   position and video progress (not draggable; no seeking). The top chrome
 *   row is pushed down to clear it whenever it renders (showsTopProgress).
 *
 * THE COMMENT BAR IS A BUTTON, NOT AN INPUT. It opens CommentsSheetV2 with its
 * composer focused and contains no input/textarea/contentEditable, because a
 * focused field inside this fixed full-screen overlay raises the keyboard over
 * a fixed layer on iOS/WKWebView (the same class of bug
 * lockFullscreenViewportScroll exists for) and would be a second composer.
 * Do not "fix" it into a real field.
 *
 * NO fade-on-idle. NO score eyebrow. Course chip in
 * the top-right is the ONLY score surface.
 */
import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, MessageCircle, Send, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import { ReactionGlyph, AMBER, reactionKindFor } from '@/lib/reactionKind';
import { LikedByRow } from '@/components/likes/LikedByRow';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { triggerHaptic } from '@/lib/ui/haptics';
import { FullscreenTopProgress, showsTopProgress } from './FullscreenTopProgress';
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

/* Like glyph comes from reactionGlyph('like') — the one place that decides it. */

const CHEVRON_BG = 'rgba(0,0,0,0.32)';
const CHIP_BG = 'rgba(0,0,0,0.40)';
const ICON_SHADOW = 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))';
const TEXT_SHADOW = '0 1px 3px rgba(0,0,0,0.55)';
/* The clamped comment bar's real block height: 11px top padding + 38px field
   + 10px bottom padding = 59, plus the safe area. Change these together. */
const COMMENT_BAR_BLOCK = 'calc(59px + env(safe-area-inset-bottom, 0px))';

function formatCount(n: number | null | undefined): string | null {
  if (n === null || n === undefined || n === 0) return null;
  return formatCountKilo(n);
}

/**
 * FullscreenCaption — the post caption beneath the author sub-row.
 *
 * Cut to 3 lines by a measured mirror; the inline CTA renders ONLY when the text really overflows
 * (measured scrollHeight vs clientHeight, same approach as the tour hero
 * insight line). Collapses again whenever the pager moves to another post.
 */
const CAPTION_FONT_SIZE = 13.5;
const CAPTION_LINE_HEIGHT = 1.35;
const CAPTION_LINE_PX = `${CAPTION_FONT_SIZE}px * ${CAPTION_LINE_HEIGHT}`;

const CaptionBlock: React.FC<{
  caption: string;
  resetKey: number;
  onMentionTap: (m: { entityType: 'user' | 'business'; entityId: string; display: string }) => void;
  variant: 'caption' | 'review';
  onFullReview?: () => void;
}> = ({ caption, resetKey, onMentionTap, variant, onFullReview }) => {
  const [expanded, setExpanded] = useState(false);
  // null = caption fits (no CTA). A string = the word-snapped prefix that fits
  // three lines WITH the CTA inline. This is the sole overflow answer.
  const [visibleText, setVisibleText] = useState<string | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const isReview = variant === 'review';
  const isExpanded = !isReview && expanded;
  const label = isReview ? 'Full review' : 'Read more';
  const isEmpty = !caption.trim();

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  // Measured cut (real geometry in a hidden mirror; never string-length estimates).
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || isEmpty) return;
    const measure = () => {
      const node = textRef.current;
      const mirror = mirrorRef.current;
      const slot = slotRef.current;
      if (!node || !mirror || !slot) return;
      if (isExpanded) return; // clamp is off — nothing meaningful to measure
      mirror.style.width = `${node.clientWidth}px`;
      const MAXH = CAPTION_FONT_SIZE * CAPTION_LINE_HEIGHT * 3 + 1;
      slot.textContent = caption;
      if (mirror.scrollHeight <= MAXH) {
        setVisibleText(null);
        return;
      }
      let lo = 0;
      let hi = caption.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        slot.textContent = caption.slice(0, mid);
        if (mirror.scrollHeight <= MAXH) lo = mid;
        else hi = mid - 1;
      }
      const n = lo;
      // Word-boundary snap keeps @mention tokens whole — do not remove.
      let cut = caption.lastIndexOf(' ', n);
      if (cut <= 0) cut = n;
      setVisibleText(caption.slice(0, cut).replace(/\s+$/, ''));
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
  }, [caption, variant, isExpanded, isEmpty]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const ctaStyle: React.CSSProperties = {
    fontSize: CAPTION_FONT_SIZE, lineHeight: CAPTION_LINE_HEIGHT, fontWeight: 600,
    color: '#fff', opacity: 0.72, whiteSpace: 'nowrap', textShadow: TEXT_SHADOW,
    pointerEvents: 'auto', background: 'transparent', border: 'none', padding: 0,
    margin: 0, fontFamily: 'inherit', cursor: 'pointer',
  };
  const onCta = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReview) onFullReview?.();
    else setExpanded(true);
  };

  // Review with no text: the CTA alone, on its own line, where the old
  // "read review ›" button sat. Non-review empty captions never mount.
  if (isEmpty) {
    if (!isReview) return null;
    return (
      <button
        type="button"
        onClick={onCta}
        style={{ ...ctaStyle, marginTop: 3, alignSelf: 'flex-start' }}
      >
        {label}
      </button>
    );
  }

  const showCta = !isExpanded && visibleText !== null;

  return (
    <div
      style={{ marginTop: 6, minWidth: 0, pointerEvents: 'auto', position: 'relative' }}
      onClick={stop}
      onPointerDown={stop}
      onTouchStart={stop}
      onTouchMove={stop}
    >
      <div
        ref={mirrorRef}
        aria-hidden
        style={{
          position: 'absolute', visibility: 'hidden', pointerEvents: 'none',
          top: 0, left: -9999, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          fontSize: CAPTION_FONT_SIZE, lineHeight: CAPTION_LINE_HEIGHT,
        }}
      >
        <span ref={slotRef} />
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 400, opacity: 0.8 }}>… </span>
          {label}
        </span>
      </div>
      <div
        ref={textRef}
        style={{
          fontSize: CAPTION_FONT_SIZE,
          lineHeight: CAPTION_LINE_HEIGHT,
          color: '#fff',
          opacity: 0.92,
          textShadow: TEXT_SHADOW,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...(isExpanded
            ? { overflow: 'auto', maxHeight: '40vh', overscrollBehavior: 'contain' }
            : { maxHeight: `calc(${CAPTION_LINE_PX} * 3)`, overflow: 'hidden' }),
        }}
      >
        <MentionText
          text={isExpanded ? caption : (visibleText ?? caption)}
          onMentionTap={onMentionTap}
          style={{ pointerEvents: 'auto' }}
        />
        {showCta && (
          <button
            type="button"
            onClick={onCta}
            aria-expanded={isReview ? undefined : false}
            style={ctaStyle}
          >
            <span style={{ fontWeight: 400, opacity: 0.8 }}>… </span>
            {label}
          </button>
        )}
      </div>
      {isExpanded && (
        <button
          type="button"
          aria-expanded
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          style={{
            marginTop: 4, alignSelf: 'flex-start', background: 'transparent',
            border: 'none', padding: 0, cursor: 'pointer', pointerEvents: 'auto',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#fff',
            opacity: 0.7, textShadow: TEXT_SHADOW, lineHeight: 1.2,
          }}
        >
          See less
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
  /** The comment bar: opens the same sheet with its composer focused. */
  onCompose?: () => void;
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
  onCompose,
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
  const { t } = useTranslation('common');

  // Mentions inside the caption must dismiss the fullscreen overlay BEFORE
  // routing, otherwise the profile mounts underneath the still-open viewer.
  // The navigate is deferred one frame so the overlay unmounts cleanly.
  const handleMentionTap = useCallback(
    (m: { entityType: 'user' | 'business'; entityId: string; display: string }) => {
      // Prefer the navigation-aware close (carries reason: 'navigating') so a
      // deep-link route doesn't also pop history. Falls back to plain close.
      if (onBeforeNavigate) onBeforeNavigate(); else onClose();
      const to = m.entityType === 'business' ? `/business/${m.entityId}` : `/profile/${m.entityId}`;
      requestAnimationFrame(() => navigate(to));
    },
    [onClose, onBeforeNavigate, navigate],
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



  // HOOKS BEFORE EVERY EARLY RETURN (rules of hooks). The queries still run on
  // every render; only their fetch is gated on the conditions the returns test.
  const hookPost = posts[activeIndex] ?? null;
  const hookEditorial =
    hookPost?.postType === 'tournament_result' ||
    hookPost?.postType === 'pga_card' ||
    hookPost?.postType === 'course_of_week_card';
  const hooksLive = !feedEnded && !!hookPost && !hookEditorial && !isTournamentCardActive;
  const { activeActor } = useActiveActor();
  const canFollowActor =
    hookPost?.actorType === 'personal' || hookPost?.actorType === 'business';
  const { isFollowing: canonicalFollowing } = useFollowState({
    targetActorType: canFollowActor ? (hookPost!.actorType as 'personal' | 'business') : 'personal',
    targetActorId: hooksLive && canFollowActor ? hookPost?.actorId : undefined,
    viewerActorType: activeActor?.type ?? 'personal',
    viewerActorId: activeActor?.id ?? undefined,
  });
  const hookCourseId =
    hookPost?.review?.courseId ?? golfCourse?.id ?? hookPost?.courseId ?? null;
  const { data: ratingAggregate } = useCourseRatingAggregates(
    hooksLive && hookPost?.courseRating == null ? hookCourseId ?? undefined : undefined,
  );

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
  const courseRating =
    activePost.viewerRating ??
    activePost.courseRating ??
    (ratingAggregate?.avg_overall_score != null ? Number(ratingAggregate.avg_overall_score) : null);
  const showCourseChip = courseRating != null;
  const courseRatingLabel = courseRating == null ? '' : formatRatingValue(courseRating);

  // Same guard the rail's comment glyph uses (!readOnly), plus a signed-in
  // actor to comment as.
  const showCommentBar = !readOnly && !!activeActor && !!onCompose;
  const bottomAnchor = (gap: number) => showCommentBar
    ? `calc(${COMMENT_BAR_BLOCK} + ${gap}px)`
    : `calc(max(env(safe-area-inset-bottom, 0px), 24px) + ${gap}px)`;
  const showTopStrip = showsTopProgress(activePost);
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
      <FullscreenTopProgress activePost={activePost} />
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
          paddingTop: showTopStrip ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 19px)' : 'calc(max(env(safe-area-inset-top, 0px), 48px) + 8px)',
          paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(14px, env(safe-area-inset-right, 0px))',
          paddingBottom: 10,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
                aria-label={`${activePost.viewerRating != null ? 'Review rating' : 'Community rating'} ${courseRatingLabel}`}
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
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 1 }}>
                  {courseRatingLabel}
                </span>
              </button>
            )}

          </div>
        )}

      </div>

      {/* Bottom scrim removed — author strip + action rail sit on the
          blurred backdrop; each element carries its own drop-shadow. */}

      {/* Bottom-LEFT — author + info stack */}
      <div
        style={{
          position: 'fixed',
          bottom: bottomAnchor(26),
          left: 'max(14px, env(safe-area-inset-left, 0px))',
          right: 64, // reserve space for right rail
          zIndex: Z.echo,
          pointerEvents: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
            userId={activePost.actorId ?? activePost.userId}
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

          {/* Caption — measured 3-line cut + one inline CTA. Non-review posts
              with an empty caption render nothing; reviews always mount so the
              empty-text "Full review" fallback can reach the sheet. */}
          {activePost.caption?.trim() || activePost.isReview ? (
            <CaptionBlock
              caption={activePost.caption ?? ''}
              resetKey={activeIndex}
              onMentionTap={handleMentionTap}
              variant={activePost.isReview ? 'review' : 'caption'}
              onFullReview={onReviewTap}
            />
          ) : null}

          {/* Likers row — LikedByRow returns null at zero; no second guard. */}
          <div style={{ pointerEvents: 'auto', minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
            <LikedByRow
              postId={activePost.id}
              count={likeState.count}
              source="post"
              /* isRound is false by construction: rounds do not appear in this feed
                 (auto-posting of rounds to Clubhouse was discontinued). The derivation is
                 kept rather than hardcoding 'like' so that if rounds ever return to this
                 surface, only the flag changes. */
              kind={reactionKindFor({ isRound: false, isReview: !!activePost.isReview })}
              avatarRing="media"
              lines={1}
              fontSize={12.5}
              fontWeight={500}
              color="rgba(255,255,255,0.86)"
              style={{ marginTop: 9, textShadow: TEXT_SHADOW }}
            />
          </div>
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
          bottom: bottomAnchor(26),
          zIndex: Z.echo,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, pointerEvents: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
            <ReactionGlyph reacted={likeState.isLiked} size={32} tone="chrome" />
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

      {/* Comment bar — a BUTTON styled as a field (see header). Inside the
          data-immersive-chrome root so the scrubber's tap-to-pause skips it. */}
      {showCommentBar && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCompose?.(); }}
          aria-label={t('comments.placeholder')}
          style={{
            position: 'fixed',
            left: 0, right: 0,
            bottom: 0,
            zIndex: Z.echo + 1,
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
            borderTop: '0.5px solid rgba(255,255,255,0.12)',
            paddingTop: 11,
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
            paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(14px, env(safe-area-inset-right, 0px))',
            borderLeft: 'none', borderRight: 'none', borderBottom: 'none', margin: 0,
            cursor: 'pointer', pointerEvents: 'auto', textAlign: 'left',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <span
            style={{
              width: 26, height: 26, borderRadius: 8, flex: 'none', overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.12)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.86)',
            }}
          >
            {activeActor!.avatarUrl ? (
              <img src={activeActor!.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              (activeActor!.name ?? '').trim().charAt(0).toUpperCase()
            )}
          </span>
          <span
            style={{
              flex: 1, minWidth: 0, height: 38, borderRadius: 12,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.20)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              padding: '0 13px', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center',
              fontSize: 13, color: 'rgba(255,255,255,0.62)',
            }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
              {t('comments.placeholder')}
            </span>
          </span>
        </button>
      )}
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </span>
    {count && (
      <span
        style={{
          fontSize: 13, fontWeight: 700, color: accent ? AMBER : '#fff',
          lineHeight: 1, fontVariantNumeric: 'tabular-nums lining-nums', textShadow: TEXT_SHADOW,
        }}
      >
        {count}
      </span>
    )}

  </button>
);

export default ImmersiveFullscreenChrome;
