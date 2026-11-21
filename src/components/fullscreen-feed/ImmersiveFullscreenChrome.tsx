/**
 * ImmersiveFullscreenChrome — persistent top+bottom chrome for the fullscreen
 * viewer (signed-off FULLSCREEN_VIEWER_REDESIGN mock). Chrome-only; playback
 * machinery (SnapFeed / VideoEngine / lanes), resting rects and every
 * fullscreenBand constant are untouched, so media geometry never moves.
 *
 * Layout (real posts):
 *   TOP: 40px glass back circle inside a 44px hit area, then the course
 *     header — name 17/700 two-line clamp, location 12.5/500 (· World #n),
 *     and the VIEWER's own record row (status pill, rounds, best). No rating
 *     chip on a post: a post is one golfer's. Hole chip / RoundVideoChip and
 *     the slide-local notch scrim are unchanged.
 *   SHADE: one fixed, pointer-events-none bottom gradient (62vh) where the
 *     solid band used to be. No hard edge.
 *   BOTTOM STACK (16px gutters, full width, bottom-anchored), top down:
 *     dots (2+ items, active slide) · author row (38px squircle, name, sub-row
 *     index · club · time · Follow) · round pill · review scores in a glass
 *     strip · caption (two lines; tap expands non-review captions in place;
 *     reviews print "Full review ›" on its own line) · likers row · video row
 *     (mute, FullscreenVideoScrubber with persistent time) · pill row.
 *   PILL ROW: like, comment, share, more — glass pills in the old comment
 *     bar's slot (COMMENT_BAR_BOTTOM, COMMENT_BAR_H). Hidden when readOnly.
 *     While scrubbing, the stack and top bar fade to 0, the pills to 0.35.
 *
 * Course photos (syntheticPosts) use the SAME layout (CANONICAL_FULLSCREEN_VIEWER
 * part 1): same top bar (no rating chip anywhere), the author row from the
 * active item's memberShot (sub-row = added month), a word-sized glass hole tile
 * beside the name (geometry owned by fullscreen-hole-tile.css), and the
 * canonical video row. Source-post pills target the post; standalone shots share the Media link.
 * Review targets (engagementTarget review) hide More: MoreOptionsDrawer has
 * no review mode.
 *
 * NO TEXT FIELDS. The comment pill opens CommentsSheetV2 (composer focused when
 * signed in); the chrome contains no input/textarea/contentEditable, because a
 * focused field inside this fixed full-screen overlay raises the keyboard over
 * a fixed layer on iOS/WKWebView and would be a second composer.
 */
import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';
import './fullscreen-hole-tile.css';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ChevronRight, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { ReactionGlyph, AMBER, reactionKindFor } from '@/lib/reactionKind';
import { LikedByRow } from '@/components/likes/LikedByRow';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenMuteControl } from './useFullscreenMuteControl';
import { BACK_HIT, BackCircle, COMMENT_BAR_BOTTOM, FS_GLASS, FS_SHADE_BG, FullscreenVideoRow, GUTTER_L, GUTTER_R } from './fullscreenCanon';
import { COMMENT_BAR_H, BAND_H_CSS } from '@/lib/media/fullscreenBand';
import { useVideoProgressWriter } from '@/video/useVideoProgressWriter';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';

import { FeedFollowPill } from '@/components/feed/FeedFollowPill';
import { PlayedWithViewerChip, type PlayedWithPerson } from '@/components/feed/PostGolfTags';
import { getActorRouteByType } from '@/types/actor';
import { Z } from '@/config/zIndex';
import { formatHcp } from '@/lib/formatHcp';
import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { FullscreenHoleChipSlot, FullscreenRoundPill } from '@/components/feed/PostGolfContext';
import { golfRoundToPar, type PostGolfContext } from '@/hooks/feed/usePostGolfContext';
import type { TeeHole } from '@/features/courses/hooks/useCourseTeeSets';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useFollowState } from '@/hooks/useFollowState';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { FeedPost } from '@/components/media-system/types/media';
import { formatCountKilo, formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { chaptersForPost, isDetailedVideo, type PostVideoDetails } from '@/features/video-details/videoDetailsModel';
import { VideoTeaser } from '@/features/video-details/VideoTeaser';
import { VideoAboutSheet } from '@/features/video-details/VideoAboutSheet';
import { useVideoChapter } from '@/features/video-details/useVideoChapter';
import { ownerMatches } from './scrubberMath';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { RoundVideoChip } from '@/features/video-details/RoundVideoScore';
import { roundChapterLabel } from '@/features/video-details/roundVideoModel';

/* Like glyph comes from reactionGlyph('like') — the one place that decides it. */

const MUTE = 'rgba(248,250,252,0.68)';
const HOLE_KICKER = /^the (first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|[1-9]\d*(st|nd|rd|th))$/i;
const BODY = 'rgba(248,250,252,0.9)';
const META = 'rgba(255,255,255,0.62)';
const META_STRONG = 'rgba(255,255,255,0.78)';
const FIG: React.CSSProperties = { color: '#FFFFFF', fontWeight: 700 };
const TABULAR: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

function formatCount(n: number | null | undefined): string | null {
  if (n === null || n === undefined || n === 0) return null;
  return formatCountKilo(n);
}

/**
 * FullscreenCaption — two-line clamp. A non-review caption expands in place on
 * tap (no printed "Read more"); a review never expands here and prints
 * "Full review ›" on its own line instead. Collapses when the post changes.
 */
const CAPTION_FONT_SIZE = 15;
const CAPTION_LINE_HEIGHT = 1.45;

const CaptionBlock: React.FC<{
  caption: string;
  resetKey: number;
  onMentionTap: (m: { entityType: 'user' | 'business'; entityId: string; display: string }) => void;
  variant: 'caption' | 'review';
  onFullReview?: () => void;
}> = ({ caption, resetKey, onMentionTap, variant, onFullReview }) => {
  const [expanded, setExpanded] = useState(false);
  const isReview = variant === 'review';
  const isExpanded = !isReview && expanded;
  const isEmpty = !caption.trim();
  useEffect(() => { setExpanded(false); }, [resetKey]);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      {!isEmpty && (
        <div
          data-fullscreen-caption
          data-expanded={isExpanded ? '' : undefined}
          aria-expanded={isReview ? undefined : isExpanded}
          role={isReview ? undefined : 'button'}
          onClick={(e) => { e.stopPropagation(); if (!isReview) setExpanded((v) => !v); }}
          onPointerDown={stop}
          onTouchStart={stop}
          onTouchMove={stop}
          style={{
            marginTop: 12, minWidth: 0, pointerEvents: 'auto', cursor: isReview ? 'default' : 'pointer',
            fontSize: CAPTION_FONT_SIZE, lineHeight: CAPTION_LINE_HEIGHT, color: BODY,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            ...(isExpanded
              ? { overflow: 'auto', maxHeight: '40vh', overscrollBehavior: 'contain' }
              : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
          }}
        >
          <MentionText text={caption} onMentionTap={onMentionTap} style={{ pointerEvents: 'auto' }} />
        </div>
      )}
      {isReview && (
        <button
          type="button"
          data-full-review
          onClick={(e) => { e.stopPropagation(); onFullReview?.(); }}
          style={{
            marginTop: 10, minHeight: 28, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', pointerEvents: 'auto',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#FFFFFF',
          }}
        >
          Full review
          <ChevronRight size={13} strokeWidth={2.6} aria-hidden />
        </button>
      )}
    </>
  );
};





interface Props {
  videoDetails?: PostVideoDetails | null;
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
  /** A successful source batch omitted this post: no phantom mutations/share. */
  actionsUnavailable?: boolean;
  /** Only ids returned by the viewer's successful RLS source-post batch. */
  confirmedSourcePostIds?: readonly string[];
  /** Member-shot opens only: synthetic post ids — the progress writer stays off. */
  syntheticPosts?: boolean;
  onBeforeNavigate?: () => void;
  /** When true, only the back chevron renders — the user is on the end-of-feed plate. */
  feedEnded?: boolean;
  /** PF1B: the active post's golf context (batched by the overlay). */
  golfContext?: PostGolfContext | null;
  videoRoundShape?: HoleShape | null;
  /** PF1B: par/yards for the context's hole. */
  golfHole?: TeeHole | null;
  golfHoles?: readonly TeeHole[];
  /** PF1B: opens the attached round's scorecard sheet over the viewer. */
  onOpenScorecard?: (scoreId: string) => void;
  /** The active post's post_with people (batched once by the overlay). */
  playedWith?: ReadonlyArray<PlayedWithPerson>;
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
  actionsUnavailable = false,
  confirmedSourcePostIds = [],
  syntheticPosts = false,
  onBeforeNavigate,
  feedEnded = false,
  golfContext = null,
  golfHole = null,
  golfHoles,
  onOpenScorecard,
  videoDetails,
  videoRoundShape,
  playedWith,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();

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
  // The shared fullscreen sound control (useFullscreenMuteControl); the
  // course gallery chrome uses the same one.
  const { soundLaneId, shownMuted, handleMuteTap } = useFullscreenMuteControl();

  const activePost = posts[activeIndex] ?? null;
  const [videoAboutOpen, setVideoAboutOpen] = useState(false);
  const videoChapters = React.useMemo(() => chaptersForPost(activePost, videoDetails, golfContext), [activePost, videoDetails, golfContext]);
  const detailedVideo = !syntheticPosts && isDetailedVideo(activePost, videoDetails, golfContext);
  const videoRound = golfContext?.roundScoreId && videoChapters.some(c => c.holeNo != null) ? { context: golfContext, shape: videoRoundShape ?? null } : null;
  const chapter = useVideoChapter(detailedVideo ? activePost?.id ?? null : null, soundLaneId, videoChapters);
  useEffect(() => { setVideoAboutOpen(false); }, [activePost?.id]);
  // K.1: the member's position is saved on pause, close and a throttled interval.
  // syntheticPosts opens carry synthetic post ids — never write video_progress
  // for them (BRIEF_SYNTHETIC_SHOT_GATES).
  useVideoProgressWriter(syntheticPosts ? null : activePost);

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
  const activeMediaItem = activePost?.mediaItems?.[activeSlide];
  const shotCourse = syntheticPosts && activeMediaItem?.memberShot?.courseId
    ? activeMediaItem.memberShot : null;
  const activeMediaIsVideo =
    mediaCount > 0 && activeMediaItem?.type === 'video';
  const [scrubbing, setScrubbing] = useState(false);



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
  // THE ONE resolved course id — the header, chip and record all read it.
  const resolvedCourseId =
    shotCourse?.courseId ?? hookPost?.review?.courseId ?? golfCourse?.id ?? hookPost?.courseId ?? null;
  // The VIEWER's own record at this course. Lazy: only while the viewer is live.
  const personal = useCoursePersonalStatus(hooksLive ? resolvedCourseId ?? undefined : undefined);
  const recordStats = useCourseStatsDetail(resolvedCourseId, hooksLive);

  if (feedEnded) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 30, pointerEvents: 'none' }} data-immersive-chrome>
        {<div data-fullscreen-shade aria-hidden style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: '62vh', background: FS_SHADE_BG, pointerEvents: 'none', zIndex: Z.echo }} />}
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
            style={BACK_HIT}
          >
            <BackCircle />
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
    shotCourse?.courseName ?? activePost.review?.courseName ??
    golfCourse?.name ??
    activePost.courseName ??
    null;
  const courseLocation = shotCourse ? null :
    activePost.review?.courseSubCountry ??
    activePost.review?.courseCountry ??
    (activePost as any).courseSubCountry ??
    (activePost as any).courseCountry ??
    golfCourse?.courseCountry ??
    null;
  const showVideoRow = activeMediaIsVideo;
  const reviewTarget = activePost.engagementTarget?.type === 'review' ? activePost.engagementTarget.id : null;
  // Course photos: the active item's member credit (media-local identity).
  const shot = syntheticPosts ? activeMediaItem?.memberShot ?? null : null;
  const shotDate = shot ? (shot.credit.startsWith(shot.memberName) ? shot.credit.slice(shot.memberName.length) : shot.credit).replace(/^\s*·\s*/, '').trim() : '';
  // Only hole rows carry an ordinal kicker ("The 4th" / "The fifteenth", from
  // holeOrdinal); place labels and course-tile shots never do.
  const shotHasHole = !!shot && HOLE_KICKER.test(shot.kicker.trim());
  const shotSourcePostId = shot?.sourcePostId && confirmedSourcePostIds.includes(shot.sourcePostId) ? shot.sourcePostId : null;
  const hasPostActions = !syntheticPosts || !!shotSourcePostId;
  const standaloneCourseId = shot?.courseId || activePost.courseId;
  // Tag previews without a post/course have no valid share destination.
  const showPills = !readOnly && (syntheticPosts || !actionsUnavailable) && (hasPostActions || !!standaloneCourseId);
  const shareShot = () => {
    if (hasPostActions) { onShare(activePost); return; }
    if (!standaloneCourseId) return;
    const url = `${window.location.origin}/courses/${standaloneCourseId}?tab=media&shot=${encodeURIComponent(activeMediaItem?.id ?? '')}`;
    if (navigator.share) void navigator.share({ title: courseName ?? undefined, url }).catch(() => {});
    else void navigator.clipboard.writeText(url);
  };
  const stackBottom = showVideoRow ? `calc(${BAND_H_CSS} + 38px)` : `calc(${BAND_H_CSS} + 2px)`;
  const handleCommentPill = () => { if (activeActor && onCompose) onCompose(); else onComment(); };
  const fadeWhileScrubbing: React.CSSProperties = scrubbing
    ? { opacity: 0, transition: 'opacity 150ms', pointerEvents: 'none' }
    : { opacity: 1, transition: 'opacity 150ms' };
  // inert, not pointerEvents: child buttons set pointerEvents 'auto' themselves; inert disables every descendant.
  const inertWhileScrubbing = scrubbing ? ({ inert: '' } as Record<string, string>) : {};
  const likeStr = formatCount(likeState.count);
  const commentStr = formatCount(commentCount);
  const timeLabel = timeAgo(activePost.createdAt);
  const worldRank = activePost.courseGlobalRank ?? null;

  // Record row: never rendered while either read is unsettled (no skeleton).
  const statusKind = personal.status?.status ?? null;
  const recordSettled =
    !!resolvedCourseId && statusKind != null && !personal.isLoading &&
    (statusKind !== 'played' || !recordStats.isLoading);
  const yourRounds = recordStats.data?.your_rounds;
  const yourBest = recordStats.data?.your_best;
  const hasRounds = yourRounds != null && yourRounds > 0;
  const hasBest = yourBest != null && yourBest > 0;
  const showRecord = recordSettled && (statusKind === 'played' || statusKind === 'want_to_play');

  // Author meta: index · club · time. Hidden fields arrive null -> omitted.
  const authorMeta: React.ReactNode[] = [];
  if (activePost.handicapIndex != null) {
    authorMeta.push(<span key="i" style={{ ...FIG, flexShrink: 0 }}>{formatHcp(activePost.handicapIndex)}</span>);
  }
  if (activePost.homeClub) {
    authorMeta.push(
      <span key="c" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
        {activePost.homeClub}
      </span>,
    );
  }
  if (timeLabel) authorMeta.push(<span key="t" style={{ flexShrink: 0 }}>{timeLabel}</span>);

  const review = activePost.isReview ? activePost.review : null;

  const handleCourseTap = () => {
    const cid = shotCourse?.courseId ?? activePost.review?.courseId ?? golfCourse?.id ?? activePost.courseId;
    if (!cid) return;
    onBeforeNavigate?.();
    navigate(`/courses/${cid}`);
  };


  return (
    <div className="fixed inset-0" style={{ zIndex: 30, pointerEvents: 'none' }} data-immersive-chrome>
      {detailedVideo && <VideoAboutSheet open={videoAboutOpen} post={activePost} details={videoDetails} chapters={videoChapters} round={videoRound} chapter={chapter} onScorecard={onOpenScorecard && videoRound ? () => onOpenScorecard(videoRound.context.roundScoreId ?? '') : undefined} likes={likeState.count} onClose={() => setVideoAboutOpen(false)} onTime={seconds => { const snapshot = VideoEngine.snapshot(soundLaneId); if (ownerMatches(snapshot.postId, `${activePost.id}:0`)) VideoEngine.seek(soundLaneId, seconds); }} onNavigate={path => { if (onBeforeNavigate) onBeforeNavigate(); else onClose(); requestAnimationFrame(() => navigate(path)); }} />}
      {<div data-fullscreen-shade aria-hidden style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: '62vh', background: FS_SHADE_BG, pointerEvents: 'none', zIndex: Z.echo }} />}
      {/* FeedSlide owns the slide-level notch scrim for top-0 non-gallery rects. */}
      <div
        {...inertWhileScrubbing}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: Z.echo + 2,
          pointerEvents: 'none',
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 48px) + 8px)',
          paddingLeft: 'max(14px, env(safe-area-inset-left, 0px))',
          paddingRight: GUTTER_R,
          paddingBottom: 10,
          ...fadeWhileScrubbing,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Back"
          style={BACK_HIT}
        >
          <BackCircle />
        </button>

        {/* PF1B hole chip (mock B): below the top bar, first slide only. */}
        <FullscreenHoleChipSlot context={golfContext} hole={golfHole} holes={golfHoles} item={activePost?.mediaItems[activeSlide]} activeSlide={activeSlide} />
        <RoundVideoChip round={videoRound} chapter={chapter} follows={videoDetails?.scoreFollows !== false} />

        {courseName && (
          <div data-fullscreen-course-header style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', paddingTop: 2, textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleCourseTap(); }}
              aria-label={`Open ${courseName}`}
              style={{
                minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                textAlign: 'left', background: 'transparent', border: 'none', padding: 0, margin: 0,
                cursor: 'pointer', pointerEvents: 'auto', fontFamily: 'inherit', color: 'inherit',
              }}
            >
              <span
                data-fullscreen-course-name
                title={courseName}
                style={{
                  fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#FFFFFF',
                  maxWidth: '100%', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}
              >
                {courseName}
              </span>
              {(courseLocation || worldRank != null) && (
                <span
                  style={{
                    marginTop: 1, fontSize: 12.5, fontWeight: 500, color: MUTE, lineHeight: 1.3,
                    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...TABULAR,
                  }}
                >
                  {courseLocation}
                  {courseLocation && worldRank != null && ' · '}
                  {worldRank != null && (
                    <span style={{ color: META_STRONG, fontWeight: 700 }}>World #{worldRank}</span>
                  )}
                </span>
              )}
            </button>
            {showRecord && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, color: META, ...TABULAR }}>
                <span
                  style={{
                    border: `1px solid ${statusKind === 'want_to_play' ? 'rgba(247,147,30,0.6)' : 'rgba(255,255,255,0.28)'}`,
                    color: statusKind === 'want_to_play' ? AMBER : '#FFFFFF',
                    borderRadius: 999, padding: '3px 9px', fontSize: 8.5, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1, textShadow: 'none',
                  }}
                >
                  {statusKind === 'want_to_play' ? 'Want to play' : 'Played'}
                </span>
                {statusKind === 'played' && (hasRounds || hasBest) && (
                  <span>
                    {hasRounds && (<><span style={FIG}>{yourRounds}</span> {yourRounds === 1 ? 'round' : 'rounds'}</>)}
                    {hasRounds && hasBest && ' · '}
                    {hasBest && (<>best <span style={FIG}>{yourBest}</span></>)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom stack — one grammar for posts, reviews and course photos. */}
      {<div
        {...inertWhileScrubbing}
        data-fullscreen-stack
        style={{
          position: 'fixed',
          bottom: stackBottom,
          left: GUTTER_L,
          right: GUTTER_R,
          zIndex: Z.echo,
          pointerEvents: 'none',
          ...fadeWhileScrubbing,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {mediaCount >= 2 && (
          <div data-fullscreen-dots aria-hidden style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            {Array.from({ length: mediaCount }, (_, i) => (
              <span key={i} data-dot-active={i === activeSlide ? '' : undefined} style={{ width: 6, height: 6, borderRadius: '50%', background: i === activeSlide ? '#FFFFFF' : 'rgba(255,255,255,0.38)' }} />
            ))}
          </div>
        )}

        {shot ? (
          <div data-fullscreen-author data-fullscreen-shot-author className="fullscreen-shot-author">
            <SquircleAvatar key={activeMediaItem?.id} size={38} src={shot.avatarUrl} alt={shot.memberName} hairlineRing />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span className={shotHasHole ? 'fullscreen-shot-name-hole' : 'fullscreen-shot-name-single'} style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2, minWidth: 0 }}>
                <InlineProMemberName userId={shot.memberUserId} flow={shotHasHole ? 'text' : undefined}>{shot.memberName}</InlineProMemberName>
              </span>
              {shotDate && (
                <span data-fullscreen-shot-date style={{ marginTop: 2, fontSize: 12, fontWeight: 500, color: MUTE, lineHeight: 1.2, ...TABULAR }}>{shotDate}</span>
              )}
            </div>
            {shotHasHole && (
              <div data-fullscreen-hole-strip className="fullscreen-hole-tile" style={FS_GLASS}>
                <div className="fullscreen-hole-tile-kicker" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE, lineHeight: 1.2 }}>{shot.kicker}</div>
                {shot.detail && <div className="fullscreen-hole-tile-detail" style={{ color: '#FFFFFF' }}>{shot.detail}</div>}
              </div>
            )}
          </div>
        ) : !syntheticPosts && (
        <div data-fullscreen-author style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
            aria-label={`View ${activePost.displayName}'s profile`}
            style={{
              width: 38, height: 38, padding: 0, background: 'transparent',
              border: 'none', cursor: 'pointer', pointerEvents: 'auto',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <SquircleAvatar
              size={38}
              src={activePost.avatarUrl}
              alt={activePost.displayName}
              userId={activePost.actorId ?? activePost.userId}
              hairlineRing
            />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span
                onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
                style={{
                  fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  minWidth: 0, flex: '0 1 auto', pointerEvents: 'auto', cursor: 'pointer',
                }}
              >
                {activePost.displayName}
              </span>
              <ProOrVerifiedMark userId={activePost.actorType === 'business' ? null : activePost.actorId ?? activePost.userId} verified={activePost.isVerified} name={activePost.displayName} />
            </div>
            <div
              style={{
                marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
                fontSize: 12, fontWeight: 500, color: MUTE, lineHeight: 1.2, ...TABULAR,
              }}
            >
              {authorMeta.map((node, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span aria-hidden style={{ flexShrink: 0 }}>·</span>}
                  {node}
                </React.Fragment>
              ))}
              {!readOnly && !isOwnPost && (
                <>
                  {authorMeta.length > 0 && <span aria-hidden style={{ flexShrink: 0 }}>·</span>}
                  <div style={{ pointerEvents: 'auto', flexShrink: 0 }}>
                    <FeedFollowPill isFollowed={isFollowed} onFollow={() => onFollow(activePost, isFollowed)} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}

        {!shot && !syntheticPosts && activePost.actorType !== 'business' && playedWith && playedWith.length > 0 && (
          <PlayedWithViewerChip
            key={activePost.id}
            people={playedWith}
            onOpenProfile={(userId) => {
              if (onBeforeNavigate) onBeforeNavigate(); else onClose();
              navigate(getActorRouteByType('personal', userId));
            }}
          />
        )}

        {golfContext?.roundScoreId && onOpenScorecard && (
          <FullscreenRoundPill
            gross={golfContext.roundGross}
            toPar={golfRoundToPar(golfContext)}
            onOpen={() => onOpenScorecard(golfContext.roundScoreId as string)}
          />
        )}

        {review && (
          <div data-review-score-strip style={{ ...FS_GLASS, marginTop: 12, borderRadius: 14, padding: '11px 14px 10px', minWidth: 0 }}>
            <ReviewScoreRow
              variant="card"
              overall={review.rating ?? null}
              breakdown={{
                design: review.breakdown?.design ?? null,
                condition: review.breakdown?.conditions ?? null,
                clubhouse: review.breakdown?.clubhouse ?? null,
                facilities: review.breakdown?.facilities ?? null,
              }}
            />
          </div>
        )}

        {syntheticPosts ? null : detailedVideo ? <VideoTeaser title={videoDetails?.title ?? ''} description={activePost.caption ?? ''} hasMore={!!(videoChapters.length || activePost.courseId || videoDetails?.credits.length || videoDetails?.thanks.length || videoDetails?.links.length || videoDetails?.gear.length)} chapter={chapter} chapterLabel={videoRound && chapter ? roundChapterLabel(chapter, videoRound.shape) : undefined} onOpen={() => setVideoAboutOpen(true)} /> : activePost.caption?.trim() || activePost.isReview ? (
          <CaptionBlock
            caption={activePost.caption ?? ''}
            resetKey={activeIndex}
            onMentionTap={handleMentionTap}
            variant={activePost.isReview ? 'review' : 'caption'}
            onFullReview={onReviewTap}
          />
        ) : null}

        {/* Fullscreen only: no empty trailing wrapper at zero; positive counts retain the reserved row while avatars load. */}
        {!syntheticPosts && likeState.count > 0 && <div style={{ pointerEvents: 'auto', minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
          <LikedByRow
            postId={reviewTarget ?? activePost.id}
            count={likeState.count}
            source={reviewTarget ? 'review' : 'post'}
            subject={reviewTarget && review ? { authorName: activePost.displayName || null, courseId: review.courseId ?? null, courseName: review.courseName ?? null, kind: 'review', gross: null, toPar: null, rating: review.rating ?? null } : undefined}
            /* isRound is false by construction: rounds do not appear in this feed. */
            kind={reactionKindFor({ isRound: false, isReview: !!activePost.isReview })}
            avatarRing="media"
            reserve={likeState.count > 0}
            lines={1}
            fontSize={12.5}
            fontWeight={500}
            color={MUTE}
            style={{ marginTop: 10 }}
          />
        </div>}
      </div>}

      <FullscreenVideoRow activePost={activePost} chapters={detailedVideo ? videoChapters : undefined} showMute={showVideoRow} scrubbing={scrubbing} shownMuted={shownMuted} onMute={handleMuteTap} onDraggingChange={setScrubbing} />

      {/* Pill row — in the old comment bar's slot. Buttons only; never a field. */}
      {showPills && (
        <div
          {...(scrubbing ? { inert: '' } : {})}
          data-fullscreen-pills
          style={{
            position: 'fixed', left: GUTTER_L, right: GUTTER_R, bottom: COMMENT_BAR_BOTTOM,
            height: COMMENT_BAR_H, zIndex: Z.echo + 1, display: 'flex', gap: 8,
            pointerEvents: 'none', opacity: scrubbing ? 0.35 : 1, transition: 'opacity 150ms',
          }}
        >
          {hasPostActions && <><Pill pill="like" onClick={() => onLike(activePost)} ariaLabel={likeState.isLiked ? 'Unlike' : 'Like'} count={likeStr} accent={likeState.isLiked}>
            <ReactionGlyph reacted={likeState.isLiked} size={20} tone="chrome" />
          </Pill>
          <Pill pill="comment" onClick={handleCommentPill} ariaLabel="Comments" count={commentStr}>
            <MessageCircle size={20} stroke="currentColor" strokeWidth={2} />
          </Pill></>}
          <Pill pill="share" onClick={shareShot} ariaLabel="Share">
            <Share size={19} stroke="currentColor" strokeWidth={2} />
          </Pill>
          {hasPostActions && !reviewTarget && (
            <Pill pill="more" onClick={onMore} ariaLabel="More options" square>
              <MoreHorizontal size={18} stroke="currentColor" strokeWidth={2} />
            </Pill>
          )}
        </div>
      )}
    </div>
  );
});


interface PillProps {
  pill: 'like' | 'comment' | 'share' | 'more';
  onClick: () => void;
  ariaLabel: string;
  count?: string | null;
  accent?: boolean;
  square?: boolean;
  children: React.ReactNode;
}
const Pill: React.FC<PillProps> = ({ pill, onClick, ariaLabel, count, accent, square, children }) => (
  <button
    type="button"
    data-pill={pill}
    data-reacted={accent ? '' : undefined}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    aria-label={ariaLabel}
    style={{
      ...FS_GLASS,
      height: COMMENT_BAR_H, borderRadius: 22, boxSizing: 'border-box',
      flex: square ? '0 0 44px' : '1 1 0', minWidth: 0, width: square ? 44 : undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 0,
      color: accent ? '#FFFFFF' : '#F8FAFC', cursor: 'pointer', pointerEvents: 'auto', fontFamily: 'inherit',
    }}
  >
    {children}
    {count && (
      <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums lining-nums' }}>
        {count}
      </span>
    )}
  </button>
);

export default ImmersiveFullscreenChrome;
