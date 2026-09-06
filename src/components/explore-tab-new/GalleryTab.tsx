import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import type { FeedPost } from '@/components/media-system/types/media';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { MomentsGrid } from './courseled/MomentsGrid';
import { autoplayBlocked, registerReviewVideo } from './courseled/reviewVideoAutoplay';
import { attachTileHls } from './courseled/tileHlsPlayer';
import { useDiscoverMediaPreview } from './courseled/hooks/useDiscoverMediaPreview';
import { useGalleryCourseReviewMedia } from './courseled/hooks/useGalleryCourseReviewMedia';
import { useLatestReviews } from './courseled/hooks/useLatestReviews';
import { useMomentsOfTheWeek } from './courseled/hooks/useMomentsOfTheWeek';
import type { CommunityLibraryItem } from './courseled/hooks/useCommunityLibrary';

const GUTTER = 14;
const SECTION_GAP = 36;

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <h2 style={{ margin: 0, font: `700 11px/1 ${SANS}`, letterSpacing: 0, color: A.INK, textTransform: 'uppercase' }}>{title}</h2>
    </div>
  );
}

const GALLERY_AUTOPLAY_GROUP = 'discover-gallery-video-rails';

function RailTile({ item, index, width, onPress }: { item: CommunityLibraryItem; index: number; width: number; onPress: () => void }) {
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const mountVideo = item.kind === 'video' && !!item.hlsUrl && !failed && !autoplayBlocked(reducedMotion);

  useEffect(() => {
    const el = hostRef.current;
    if (!mountVideo || !el) return;
    return registerReviewVideo(GALLERY_AUTOPLAY_GROUP, el, setActive, { threshold: 0.5, maxPlaying: 2 });
  }, [mountVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !item.hlsUrl) return;
    const attachment = attachTileHls(video, item.hlsUrl, () => setFailed(true));
    video.muted = true;
    video.currentTime = 0;
    const play = video.play();
    play?.catch(() => setPlaying(false));
    return () => {
      setPlaying(false);
      video.pause();
      video.currentTime = 0;
      attachment.detach();
    };
  }, [active, item.hlsUrl]);

  return (
    <button ref={hostRef} data-gallery-video-index={index} type="button" onClick={onPress} style={{ width, flex: `0 0 ${width}px`, padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width, aspectRatio: width === 176 ? '3 / 4' : '16 / 10', overflow: 'hidden', borderRadius: 10, background: A.PANEL }}>
        {item.thumbnail && <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {mountVideo && <video ref={videoRef} poster={item.thumbnail ?? undefined} muted loop playsInline preload="none" disableRemotePlayback aria-hidden tabIndex={-1} onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={(event) => { if (event.currentTarget.getAttribute('src')) setFailed(true); }} style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', objectFit: 'cover', opacity: playing ? 1 : 0, transition: 'opacity 140ms linear', pointerEvents: 'none' }} />}
        <GlassDurationBadge seconds={item.duration} />
      </div>
      <div style={{ marginTop: 7, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.displayName}</div>
    </button>
  );
}

/**
 * GALLERY holds every media section. It mounts no story query.
 */
export function GalleryTab({ onOpenPost, onOpenReview }: { onOpenPost: (items: CommunityLibraryItem[], item: CommunityLibraryItem, source: string) => void; onOpenReview: (posts: FeedPost[], mediaId: string | null, posterUrl: string | null) => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingReview, setPendingReview] = useState<{ courseId: string; reviewId: string; mediaId: string | null; posterUrl: string | null } | null>(null);
  const reviewsQuery = useLatestReviews(8, true);
  const reviews = useMemo(() => reviewsQuery.reviews.filter((review) => !!review.mediaUrl).slice(0, 8), [reviewsQuery.reviews]);
  const mediaQuery = useDiscoverMediaPreview(true);
  const courseReviewsQuery = useGalleryCourseReviewMedia(pendingReview?.courseId ?? null);
  const media = mediaQuery.data;
  const momentsQuery = useMomentsOfTheWeek(30, { enabled: true, candidateLimit: 72 });
  const moments = useMemo(() => (momentsQuery.data ?? []).slice(0, 6), [momentsQuery.data]);
  const momentItems = useMemo<CommunityLibraryItem[]>(() => moments.map((moment) => ({
    key: moment.key,
    postId: moment.post.id,
    userId: moment.post.userId,
    createdAt: moment.post.createdAt,
    title: (moment.post.caption ?? '').split('\n')[0]?.trim() ?? '',
    likeCount: moment.post.likeCount ?? 0,
    durationSeconds: moment.durationSeconds ?? 0,
    duration: moment.durationSeconds ?? null,
    kind: moment.mediaType === 'video' ? 'video' : 'photo',
    thumbnail: moment.thumbnail,
    hlsUrl: null,
    displayName: moment.post.displayName,
    avatarUrl: moment.post.avatarUrl || null,
    courseName: moment.courseName,
    courseId: moment.courseId,
    aspect: moment.aspect ?? null,
    post: moment.post,
    mediaIndex: moment.mediaIndex ?? 0,
    mediaId: moment.mediaId ?? '',
  })), [moments]);

  const clips = media?.clips ?? [];
  const videos = media?.videos ?? [];

  useEffect(() => {
    if (!pendingReview || !courseReviewsQuery.data) return;
    const selectedId = `gallery-review-${pendingReview.reviewId}`;
    const selected = courseReviewsQuery.data.find((post) => post.id === selectedId);
    if (!selected) {
      setPendingReview(null);
      return;
    }
    const ordered = [selected, ...courseReviewsQuery.data.filter((post) => post.id !== selectedId)];
    onOpenReview(ordered, pendingReview.mediaId, pendingReview.posterUrl);
    setPendingReview(null);
  }, [courseReviewsQuery.data, onOpenReview, pendingReview]);

  return (
    <main style={{ paddingTop: 'var(--discover-header-h)', minHeight: '100dvh', background: A.CANVAS, color: A.INK, fontFamily: SANS }}>
      <div style={{ padding: `18px ${GUTTER}px 110px` }}>
        {clips.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="Clips" />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginRight: -GUTTER, paddingRight: GUTTER }}>{clips.map((item, index) => <RailTile key={item.key} item={item} index={index} width={176} onPress={() => onOpenPost(clips, item, 'discover-clips')} />)}</div>
        </section>
        )}

        {reviews.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="From the reviews" />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginRight: -GUTTER, paddingRight: GUTTER }}>{reviews.map((review) => <button key={review.reviewId} type="button" onClick={() => setPendingReview({ courseId: review.courseId, reviewId: review.reviewId, mediaId: review.mediaId ?? null, posterUrl: review.posterUrl ?? review.mediaUrl })} style={{ position: 'relative', width: 196, flex: '0 0 196px', padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer' }}><div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 10, overflow: 'hidden', background: A.PANEL }}><img src={review.posterUrl ?? review.mediaUrl ?? ''} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><span style={{ position: 'absolute', left: 7, top: 7, borderRadius: 999, padding: '4px 7px', background: 'rgba(13,13,13,.82)', fontSize: 12, fontWeight: 700 }}>{review.rating.toFixed(1)}</span>{(review.mediaCount ?? 1) > 1 && <span style={{ position: 'absolute', right: 7, bottom: 7, borderRadius: 999, padding: '4px 7px', background: 'rgba(13,13,13,.82)', fontSize: 11, fontWeight: 700 }}>+{(review.mediaCount ?? 1) - 1}</span>}</div><div style={{ marginTop: 7, fontSize: 12, fontWeight: 700 }}>{review.courseName}</div><div style={{ marginTop: 2, fontSize: 11, color: A.MUTE }}>{review.reviewerName}</div></button>)}</div>
        </section>
        )}

        {/* FROM THE ROUNDS was removed: round posts are scorecard posts built from
            round data and carry no post_media rows — 760 of them, none with a photo —
            so the section could never fill. That stops it being rebuilt against the
            same join later. */}

        {moments.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="Moments" />
          <MomentsGrid moments={moments} cap={6} gap={5} tall={250} radius={10} onTilePress={(moment) => onOpenPost(momentItems, momentItems.find((entry) => entry.key === moment.key) ?? momentItems[0], 'discover-moments')} autoplayGroup={GALLERY_AUTOPLAY_GROUP} />
        </section>
        )}

        {videos.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="Videos" />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginRight: -GUTTER, paddingRight: GUTTER }}>{videos.map((item, index) => <RailTile key={item.key} item={item} index={clips.length + index} width={250} onPress={() => onOpenPost(videos, item, 'discover-videos')} />)}</div>
        </section>
        )}

        <button type="button" onClick={() => setSearchOpen(true)} style={{ width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', border: `1px solid ${A.BORDER}`, borderRadius: 14, background: A.PANEL, color: A.BODY, font: `700 13px/1 ${SANS}`, cursor: 'pointer' }}><Search size={17} />Search photos, clips and videos</button>
      </div>
      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}
