import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
/**
 * ReviewPostCard — the Clubhouse feed's review post (BRIEF_REVIEW_POST_V2,
 * spec reviewpost-v2.html). A REVIEW POST IS NOT A CARD: the article takes
 * FeedCard's own frame — edge to edge, no border, no radius, a 1px hairline
 * above unless it is the first post. FeedCard hands in the media and the
 * shared footer as slots, so likes, comments, sharing, the owner menu and
 * the fullscreen viewer keep exactly their existing paths.
 *
 * Scores render through the shared ReviewScoreRow (all white, centred);
 * shared CategoryScores remains unchanged for course surfaces.
 * CB109: feed callers opt into mediaFirst; the review block is handed to
 * FeedCard's footer caption slot, retaining one engagement/comment path.
 * The two-line body clamp is retained by Ben's explicit CB109 ruling.
 * Media-first reviews with media use FeedCard's intrinsic media sizing and
 * natural article height; only words-first/no-media reviews retain the cap.
 * Grid reviews use feedPhotoGridLayout, exactly like FeedCard; their shared
 * score contents sit below media without glass, keeping small photos clear.
 */
import { CourseNameLink } from '@/components/shared/CourseNameLink';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { FS_GLASS } from '@/components/fullscreen-feed/fullscreenCanon';
import { useFeedReviewTop100 } from '@/hooks/feed/useTop100CourseIds';
import './feedReviewGlass.css';
import { useTranslation } from 'react-i18next';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { CARD, LINE, T100, T60, T40 } from './feedTokens';
import { REVIEW_CARD_MAX_HEIGHT, REVIEW_MEDIA_MIN_HEIGHT, REVIEW_BODY_CLAMP, REVIEW_COURSE_CLAMP } from './reviewPostCard';
import { PlayedWithByline, PlayedWithMediaOverlay, PlayedWithNameFaces, PlayedWithSheet, type PlayedWithPerson } from './PostGolfTags';
import { feedPhotoGridLayout } from './feedPhotoGrid';

const GUTTER = 14;
const NAME_SIZE = 15;
const NAME_LINE = 1.25;


const COURSE_NAME_STYLE: React.CSSProperties = {
  fontSize: 19, fontWeight: 700, letterSpacing: '-0.028em', lineHeight: 1.16, color: A.INK,
  ...REVIEW_COURSE_CLAMP,
};

export interface ReviewPostCardProps {
  post: FeedPost;
  articleRef: React.Ref<HTMLElement>;
  /** FeedCard's feedIndex: no hairline on the first post, same rule as a round. */
  feedIndex?: number;
  onProfile: () => void;
  onReadReview: (e: React.MouseEvent) => void;
  onPrefetch: () => void;
  onOpenCourse?: () => void;
  /** The same FeedFollowPill a normal post mounts; inline on the meta line after the date. */
  followPill?: React.ReactNode;
  /** The owner menu: inline on the meta line, before the date, as a normal post does. */
  ownerMenu?: React.ReactNode;
  /** F — shared media; intrinsic for mediaFirst, sized to fill for standard. */
  media?: React.ReactNode;
  /** G — the shared footer, unchanged. */
  footer: React.ReactNode;
  layout?: 'standard' | 'mediaFirst';
  /** FeedCard owns actions, liked-by, comments and Add-a-comment in both states. */
  mediaFirstFooter?: (reviewBlock: React.ReactNode) => React.ReactNode;
  playedWith?: ReadonlyArray<PlayedWithPerson>;
  onPlayedWithProfile?: (userId: string) => void;
  activeMediaIndex?: number;
}

export const ReviewPostCard: React.FC<ReviewPostCardProps> = ({
  post, articleRef, feedIndex, onProfile, onReadReview, onPrefetch, onOpenCourse, followPill, ownerMenu, media, footer,
  layout = 'standard', mediaFirstFooter, playedWith, onPlayedWithProfile, activeMediaIndex = 0,
}) => {
  const { t } = useTranslation('common');
  const { t: tCourses } = useTranslation('courses');
  /* ONE HOME: a review whose course did not resolve has no `review` object;
     every part below drops independently. */
  const review = post.review;
  const rating = review?.rating ?? null;

  /* A — the meta line is the date only, exactly like a normal post: the
     handicap-index and courses-reviewed clauses were removed by user decision
     ("just have the date and then following/follow, like the normal post"). */
  const whoLine = timeAgo(post.createdAt, { absoluteAfterDays: 30 });

  const region = [
    review?.courseRegion || review?.courseSubCountry || post.courseRegion || post.courseSubCountry,
    review?.courseCountry || post.courseCountry,
  ].filter(Boolean).join(', ');

  const courseName = review?.courseName || post.courseName || null;
  const scores = {
    design: review?.breakdown?.design ?? null,
    condition: review?.breakdown?.conditions ?? null,
    clubhouse: review?.breakdown?.clubhouse ?? null,
    facilities: review?.breakdown?.facilities ?? null,
  };
  const body = review?.reviewText || post.caption || '';

  const isMediaFirst = layout === 'mediaFirst';
  const mediaLeads = isMediaFirst && !!media;
  const glassRegion = [review?.courseRegion, review?.courseSubCountry, review?.courseCountry].find(value => value?.trim()) ?? '';
  const isGridReview = feedPhotoGridLayout(post.mediaItems ?? []) !== null;
  const hasScoreContents = !!courseName || [rating, ...Object.values(scores)].some(value => value != null && Number.isFinite(Number(value)));
  const showGridScores = mediaLeads && isGridReview && hasScoreContents;
  const showGlass = mediaLeads && !isGridReview && hasScoreContents;
  const people = post.actorType !== 'business' && playedWith?.length ? playedWith : null;
  const [withSheetOpen, setWithSheetOpen] = useState(false);
  const withBottom = mediaLeads && isGridReview ? 'media' as const : post.mediaItems?.[activeMediaIndex]?.type === 'video' ? 'review-video' as const : 'review' as const;
  const mediaRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const top100Ids = useFeedReviewTop100();
  const isTop100 = top100Ids.has(review?.courseId ?? post.courseId ?? '');
  useLayoutEffect(() => {
    const host = mediaRef.current;
    const strip = glassRef.current;
    if (!host || !strip || !showGlass) return;
    const measure = () => host.style.setProperty('--review-glass-h', `${strip.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(strip);
    return () => { observer.disconnect(); host.style.removeProperty('--review-glass-h'); };
  }, [showGlass]);
  const scoreContents = <>
    <div data-review-glass-name style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10, minWidth: 0 }}>
      {courseName ? <CourseNameLink as="div" onNavigate={onOpenCourse} courseId={review?.courseId ?? post.courseId} wrapperStyle={{ pointerEvents: 'auto', flex: '1 1 auto', minWidth: 0 }} textProps={{ 'data-review-course': '' }} style={{ ...COURSE_NAME_STYLE, fontSize: 16, letterSpacing: '-0.02em', lineHeight: 1.2, ...(showGridScores ? { display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis' } : null) }}>{courseName}</CourseNameLink> : null}
      {glassRegion ? <span data-review-glass-region style={{ fontSize: 11.5, color: A.MUTE, whiteSpace: 'nowrap', flex: 'none' }}>{glassRegion}</span> : null}
    </div>
    <ReviewScoreRow variant="card" overall={rating} breakdown={scores} />
  </>;
  const reviewBlock = (
    <>
      {!mediaLeads ? <>
      {/* B — the full-width subject; scores live together in D. */}
      <div data-review-subject style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: mediaLeads ? `12px ${GUTTER}px 12px` : `8px ${GUTTER}px 14px` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!courseName ? null : (
            <CourseNameLink as="div" onNavigate={onOpenCourse} textProps={{ 'data-review-course': '' }} style={COURSE_NAME_STYLE}>
              {courseName}
            </CourseNameLink>
          )}
          {region ? (
            <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.2, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region}</div>
          ) : null}
        </div>
      </div>
      <ReviewScoreRow overall={rating} breakdown={scores} style={{ flex: 'none', padding: `0 ${GUTTER}px 14px` }} />
      </> : null}
      {body ? (
        <div data-review-body-wrap style={{ flex: 'none', display: 'flex', padding: `0 ${GUTTER}px 6px` }}>
          <div data-review-body style={{ fontSize: 15, lineHeight: 1.4, color: A.INK, ...REVIEW_BODY_CLAMP }}>
            {mediaLeads ? <><span data-review-body-lead style={{ fontWeight: 600, color: A.INK }}>{post.displayName}</span>{' '}</> : null}
            <MentionText text={body} />
          </div>
        </div>
      ) : null}
      <button type="button" data-review-cta onClick={(e) => { e.stopPropagation(); onReadReview(e); }}
        style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: `0 ${GUTTER}px 12px`, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: A.INK }}>
        {t('feed.reviewPost.readFullReview')}
        <span aria-hidden style={{ color: T40 }}>{'\u203A'}</span>
      </button>
    </>
  );

  return (
    <article
      ref={articleRef}
      data-review-post-card
      onPointerDown={onPrefetch}
      style={{
        display: 'flex',
        flexDirection: 'column',
        containerType: 'inline-size',
        maxHeight: mediaLeads ? undefined : REVIEW_CARD_MAX_HEIGHT,
        marginInline: 0,
        background: CARD,
        borderTop: feedIndex === 0 ? undefined : `1px solid ${LINE}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* A — the reviewer */}
      <div data-review-who style={{ flex: 'none', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px 2px' }}>
        <button type="button" onClick={onProfile} style={{ display: 'flex', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
          <SquircleAvatar
            src={post.avatarUrl}
            alt={post.displayName}
            userId={post.actorId ?? post.userId}
            size={34}
            hairlineRing
          />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <button
            type="button"
            onClick={onProfile}
            style={{
              display: 'block', maxWidth: '100%', background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
              fontSize: NAME_SIZE, fontWeight: 700, lineHeight: NAME_LINE, color: T100, cursor: 'pointer',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            <InlineProMemberName userId={post.actorType === 'business' || post.actorType === 'system' ? undefined : post.userId}>{post.displayName}</InlineProMemberName>
          </button>
          {people && !media && <PlayedWithNameFaces people={people} onOpen={() => setWithSheetOpen(true)} />}
          </div>
          {/* A.1 — the meta line reads exactly like a normal post: the owner
              menu, then the date, then the follow pill, all inline. The earlier
              deliberate top-right departure was removed by user decision. */}
          <div data-review-who-line style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
            {ownerMenu}
            {people && !media ? <PlayedWithByline people={people} onOpen={() => setWithSheetOpen(true)} tail={whoLine} style={{ fontSize: 12, lineHeight: NAME_LINE, color: T60, flex: '0 1 auto' }} /> : <span style={{ fontSize: 12, lineHeight: NAME_LINE, color: T60, whiteSpace: 'nowrap' }}>{whoLine}</span>}
            {followPill}
          </div>
        </div>
        <div data-review-header-pills style={{ marginLeft: 'auto', flex: 'none', display: 'flex', gap: 6, alignSelf: 'center' }}>
          {[['review', t('feed.reviewPost.pillReview')], ...(isTop100 ? [['top100', t('feed.reviewPost.pillTop100')]] : [])].map(([key, label]) => (
            <span key={key} data-review-pill={key} style={{ height: 18, padding: '0 7px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.28)', display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', color: A.INK }}>{label}</span>
          ))}
        </div>
      </div>

      {!mediaLeads ? reviewBlock : null}

      {/* F — media-first media flows at its own size. Standard retains the
          only flexible child: square cap and remaining-height 120px floor. */}
      {media ? (
        <div
          ref={mediaRef}
          data-review-media
          style={mediaLeads ? { display: 'block', marginTop: 10, position: 'relative' } : {
            flex: '1 1 auto',
            minHeight: REVIEW_MEDIA_MIN_HEIGHT,
            maxHeight: '100cqw',
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {mediaLeads ? media : <div style={{ position: 'absolute', inset: 0 }}>{media}</div>}
          {people && onPlayedWithProfile && <PlayedWithMediaOverlay key={post.id} people={people} onOpenProfile={onPlayedWithProfile} resetKey={activeMediaIndex} offset={withBottom} />}
          {showGlass ? <>
            <div data-review-glass-fade style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%', pointerEvents: 'none', zIndex: 2 }} />
            <div ref={glassRef} data-review-score-strip style={{ ...FS_GLASS, position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 14, padding: '11px 14px 10px', containerType: 'inline-size', pointerEvents: 'none', zIndex: 2 }}>
              {scoreContents}
            </div>
          </> : null}
        </div>
      ) : null}

      {showGridScores ? <div data-review-grid-scores>{scoreContents}</div> : null}

      {/* G — engagement, unchanged objects */}
      <div style={{ flex: 'none' }}>{isMediaFirst && mediaFirstFooter ? mediaFirstFooter(mediaLeads ? reviewBlock : null) : <>{mediaLeads ? reviewBlock : null}{footer}</>}</div>
      {people && onPlayedWithProfile && <PlayedWithSheet open={withSheetOpen} people={people} onClose={() => setWithSheetOpen(false)} onOpenProfile={onPlayedWithProfile} />}
    </article>
  );
};
