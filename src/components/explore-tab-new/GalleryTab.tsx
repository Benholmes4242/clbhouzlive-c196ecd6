import { useMemo, useState } from 'react';
import { Play, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { MomentsGrid } from './courseled/MomentsGrid';
import { useDiscoverMediaPreview } from './courseled/hooks/useDiscoverMediaPreview';
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

function RailTile({ item, width, onPress }: { item: CommunityLibraryItem; width: number; onPress: () => void }) {
  return (
    <button type="button" onClick={onPress} style={{ width, flex: `0 0 ${width}px`, padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width, aspectRatio: width === 176 ? '3 / 4' : '16 / 10', overflow: 'hidden', borderRadius: 10, background: A.PANEL }}>
        {item.thumbnail && <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <GlassDurationBadge seconds={item.duration} />
      </div>
      <div style={{ marginTop: 7, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.displayName}</div>
    </button>
  );
}

/**
 * GALLERY holds every media section. It mounts no story query.
 */
export function GalleryTab({ onOpenPost }: { onOpenPost: (items: CommunityLibraryItem[], item: CommunityLibraryItem, source: string) => void }) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const reviewsQuery = useLatestReviews(8, true);
  const reviews = useMemo(() => reviewsQuery.reviews.filter((review) => !!review.mediaUrl).slice(0, 8), [reviewsQuery.reviews]);
  const mediaQuery = useDiscoverMediaPreview(true);
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
  const rounds = media?.rounds ?? [];

  return (
    <main style={{ paddingTop: 'var(--discover-header-h)', minHeight: '100dvh', background: A.CANVAS, color: A.INK, fontFamily: SANS }}>
      <section style={{ position: 'relative', minHeight: 216, overflow: 'hidden', borderBottom: `1px solid ${A.BORDER}` }}>
        {moments[0]?.thumbnail && <img src={moments[0].thumbnail} alt="" loading="eager" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(21,23,31,.10) 0%, rgba(21,23,31,.94) 100%)' }} />
        <div style={{ position: 'relative', minHeight: 216, padding: '34px 20px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0, color: A.BODY, marginBottom: 9 }}>THE AMATEUR GAME</div>
          <div style={{ fontSize: 31, lineHeight: 1.02, fontWeight: 700, letterSpacing: 0, maxWidth: 320 }}>Photographs, clips and the game in motion</div>
          <div style={{ display: 'flex', gap: 22, marginTop: 20, color: A.BODY, fontSize: 12, fontWeight: 700 }}>
            {/* HONEST COUNTS ONLY: no library photo total exists, so no photo figure. */}
            {clips.length > 0 && <span>{clips.length} clips</span>}
            {videos.length > 0 && <span>{videos.length} videos</span>}
          </div>
        </div>
      </section>

      <div style={{ padding: `28px ${GUTTER}px 110px` }}>
        {clips.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="Clips" />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginRight: -GUTTER, paddingRight: GUTTER }}>{clips.map((item) => <RailTile key={item.key} item={item} width={176} onPress={() => onOpenPost(clips, item, 'discover-clips')} />)}</div>
        </section>
        )}

        {reviews.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="From the reviews" />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginRight: -GUTTER, paddingRight: GUTTER }}>{reviews.map((review) => <button key={review.reviewId} type="button" onClick={() => navigate(`/courses/${review.courseId}`)} style={{ position: 'relative', width: 196, flex: '0 0 196px', padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer' }}><div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 10, overflow: 'hidden', background: A.PANEL }}><img src={review.posterUrl ?? review.mediaUrl ?? ''} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><span style={{ position: 'absolute', left: 7, top: 7, borderRadius: 999, padding: '4px 7px', background: 'rgba(13,13,13,.82)', fontSize: 12, fontWeight: 700 }}>{review.rating.toFixed(1)}</span>{(review.mediaCount ?? 1) > 1 && <span style={{ position: 'absolute', right: 7, bottom: 7, borderRadius: 999, padding: '4px 7px', background: 'rgba(13,13,13,.82)', fontSize: 11, fontWeight: 700 }}>+{(review.mediaCount ?? 1) - 1}</span>}</div><div style={{ marginTop: 7, fontSize: 12, fontWeight: 700 }}>{review.courseName}</div><div style={{ marginTop: 2, fontSize: 11, color: A.MUTE }}>{review.reviewerName}</div></button>)}</div>
        </section>
        )}

        {rounds.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="From the rounds" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 5 }}>{rounds.map((item) => <button key={item.key} type="button" aria-label={`Open ${item.displayName}'s round`} onClick={() => onOpenPost(rounds, item, 'discover-rounds')} style={{ position: 'relative', aspectRatio: '1', padding: 0, border: 0, borderRadius: 6, overflow: 'hidden', background: A.PANEL, cursor: 'pointer' }}>{item.thumbnail && <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}{item.kind === 'video' && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: A.INK }}><Play size={18} fill="currentColor" /></span>}</button>)}</div>
        </section>
        )}

        {moments.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="Moments" />
          <MomentsGrid moments={moments} cap={6} gap={5} tall={250} radius={10} onTilePress={(moment) => onOpenPost(momentItems, momentItems.find((entry) => entry.key === moment.key) ?? momentItems[0], 'discover-moments')} autoplayGroup="discover-gallery-moments" />
        </section>
        )}

        {videos.length > 0 && (
        <section style={{ marginBottom: SECTION_GAP }}><SectionHead title="Videos" />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', willChange: 'transform', marginRight: -GUTTER, paddingRight: GUTTER }}>{videos.map((item) => <RailTile key={item.key} item={item} width={250} onPress={() => onOpenPost(videos, item, 'discover-videos')} />)}</div>
        </section>
        )}

        <button type="button" onClick={() => setSearchOpen(true)} style={{ width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', border: `1px solid ${A.BORDER}`, borderRadius: 14, background: A.PANEL, color: A.BODY, font: `700 13px/1 ${SANS}`, cursor: 'pointer' }}><Search size={17} />Search photos, clips and videos</button>
      </div>
      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}
