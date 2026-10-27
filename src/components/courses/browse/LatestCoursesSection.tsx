/** BRIEF_COURSES_LATEST_FROM_COURSES §1-3 — "Through members' eyes / Latest
 * from the courses": one card per course from get_latest_course_media (RPC
 * owns one row per course, newest member shot first and three-shot eligibility).
 * Cursor pages of ten have no total cap: latest_at/course_id comes from the last
 * raw row; first-page minimum/readiness and the existing tap ladder stay unchanged.
 * BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS §3 — tapping a tile opens the
 * CANONICAL full-screen viewer (FullscreenFeedOverlay via openWithOrigin,
 * readOnly) over ONE run through every photo and video of that course,
 * starting on the tapped shot. The set is still the course's media from
 * get_course_media_v2 via useGalleryCourseMedia, in the Media tab's order,
 * flattened post-then-media into one sideways carousel, each credited to the
 * member who added it. Only the big slot autoplays: when it is a video it plays
 * muted and looping through HoleInlineVideo in the page-wide
 * "courses-member-shots" group (one video at a time); small slots draw their poster. */
import { HoleInlineVideo } from '@/components/course-media-tab/HoleInlineVideo';
import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useGalleryCourseMedia } from '@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia';
import { coursePostsToShotPosts } from '@/lib/courseMedia/memberShotPosts';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FeedPost } from '@/components/media-system/types/media';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { useSectionReady } from './PageLoadGate';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { RAIL_BLEED } from './format';
import { PHOTO_FIGURE_GAP } from './PhotoFigureCard';
import { LatestCoursesShell, LatestCourseSkeletonCard } from './sectionShells';
import { dedupeRailRows, useRailPagination } from './useRailPagination';
import { LATEST_HOLE_W, LATEST_HOLE_H } from './railTileHeights';

/* Card geometry, read by the card AND its shell (BRIEF_COURSES_SKELETONS 2.3). */
// The two rails share one tile height (Ben, 27 Oct 2026).
export const LATEST_COURSE_H = LATEST_HOLE_H;
// The big photo is exactly the size of a Latest holes tile (Ben, 27 Oct 2026).
export const LATEST_COURSE_BIG_W = LATEST_HOLE_W;
export const LATEST_COURSE_SMALL_W = 110;
// The 2 is the grid gap: the card is the two photos plus the gap between them.
export const LATEST_COURSE_W = LATEST_COURSE_BIG_W + 2 + LATEST_COURSE_SMALL_W;
// The 2 is the grid gap: the two small photos stack exactly to the tile height.
export const LATEST_COURSE_SMALL_H = (LATEST_COURSE_H - 2) / 2;
export const LATEST_COURSE_PAGE_SIZE = 10;

export interface LatestCourseMediaTile {
  post_id: string;
  media_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface LatestCourseMedia {
  course_id: string;
  latest_at: string;
  course_name: string;
  media_count: number;
  contributor_count: number;
  latest_member_name: string | null;
  tiles: LatestCourseMediaTile[];
}

interface PendingOpen {
  courseId: string;
  courseName: string;
  postId: string;
  mediaId: string;
  mediaUrl: string;
  posterUrl: string | null;
}

const tileImage = (tile: LatestCourseMediaTile) =>
  tile.media_type === 'video' ? holeMediaPoster(tile) : tile.media_url;

function creditLine(row: LatestCourseMedia): string | null {
  const name = row.latest_member_name;
  if (!name) return null;
  const others = row.contributor_count - 1;
  if (others <= 0) return name;
  if (others === 1) return `${name} and 1 other`;
  return `${name} and ${others} others`;
}

/** Existing start ladder: media id, URL, first ready item of source post, first item. */
function shotStartId(source: readonly FeedPost[], post: FeedPost, pending: PendingOpen): string | null {
  const items = post.mediaItems;
  const direct = items.find(item => item.id === pending.mediaId);
  const url = items.find(item => item.imageUrl === pending.mediaUrl || item.mp4Url === pending.mediaUrl
    || item.hlsUrl === pending.mediaUrl || item.thumbnailUrl === pending.mediaUrl);
  const sourceIds = new Set(source.find(p => p.id === pending.postId)?.mediaItems.map(item => item.id) ?? []);
  return (direct ?? url ?? items.find(item => sourceIds.has(item.id)) ?? items[0])?.id ?? null;
}

function LatestCourseCard({ row, pending, onOpen }: {
  row: LatestCourseMedia;
  pending: boolean;
  onOpen: (tile: LatestCourseMediaTile) => void;
}) {
  const credit = creditLine(row);
  const cells: Array<LatestCourseMediaTile | null> = [row.tiles[0] ?? null, row.tiles[1] ?? null, row.tiles[2] ?? null];
  return (
    <div
      style={{
        width: LATEST_COURSE_W, height: LATEST_COURSE_H, flex: 'none',
        display: 'grid', gridTemplateColumns: `${LATEST_COURSE_BIG_W}px ${LATEST_COURSE_SMALL_W}px`,
        gridTemplateRows: `${LATEST_COURSE_SMALL_H}px ${LATEST_COURSE_SMALL_H}px`,
        gap: 2, overflow: 'hidden', background: A.PANEL,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {cells.map((tile, i) => {
        const cellStyle: React.CSSProperties = {
          position: 'relative', overflow: 'hidden', background: A.PANEL,
          ...(i === 0 ? { gridRow: '1 / 3' } : {}),
        };
        if (!tile) return <div key={i} style={cellStyle} />;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Open ${row.course_name} shot ${i + 1} of ${row.media_count}`}
            disabled={pending}
            onClick={() => onOpen(tile)}
            style={{ ...cellStyle, padding: 0, border: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            {i === 0 && tile.media_type === 'video'
              ? <HoleInlineVideo media={tile} alt="" fit="cover" autoplayGroup="courses-member-shots" active />
              : <img
              src={tileImage(tile)}
              alt=""
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={event => { event.currentTarget.hidden = true; }}
            />}
            {i === 0 && <>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 45%)' }} />
              <div style={{ position: 'absolute', top: 14, left: 14 }}>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                  {row.media_count}
                </div>
                <div style={{ marginTop: 5, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  {row.media_count === 1 ? 'Member shot' : 'Member shots'}
                </div>
              </div>
              <div style={{ position: 'absolute', left: 14, right: 12, bottom: 13 }}>
                <div style={{
                  fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#FFFFFF',
                  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                }}>
                  {row.course_name}
                </div>
                {credit && <div style={{ marginTop: 5, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.78)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {credit}
                </div>}
              </div>
            </>}
            {i > 0 && tile.media_type === 'video' && (
              <span
                className="glass-chip"
                aria-hidden="true"
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFFFFF', fontSize: 11, paddingLeft: 2,
                }}
              >{'▶'}</span>
            )}
            {i === 2 && row.media_count > 3 && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(10,10,12,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontSize: 15, fontWeight: 700,
              }}>
                +{row.media_count - 3}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function LatestCoursesSection() {
  const { user } = useSupabaseSession();
  const { data, isLoading, isError, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['gam_rpc', 'get_latest_course_media', 'infinite'],
    initialPageParam: undefined as { at: string; id: string } | undefined,
    queryFn: async ({ pageParam }) => {
      const args = { p_limit: LATEST_COURSE_PAGE_SIZE, ...(pageParam ? { p_before_at: pageParam.at, p_before_id: pageParam.id } : {}) };
      const { data, error } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: LatestCourseMedia[] | null; error: unknown }>)('get_latest_course_media', args);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: page => {
      const last = page[page.length - 1];
      return page.length < LATEST_COURSE_PAGE_SIZE || !last ? undefined : { at: last.latest_at, id: last.course_id };
    },
    staleTime: 60_000,
  });
  useSectionReady('latestCourses', !isLoading);
  const rows = useMemo(() => dedupeRailRows(data?.pages ?? [], row => row.course_id), [data]);
  const visible = !isLoading && !isError && (data?.pages[0]?.length ?? 0) >= 3;
  const { railRef, sentinelRef } = useRailPagination({ hasNextPage, isFetching, fetchNextPage, cardWidth: LATEST_COURSE_W, pageCount: data?.pages.length ?? 0, visible });
  const [pending, setPending] = useState<PendingOpen | null>(null);
  const gallery = useGalleryCourseMedia(pending?.courseId ?? null, user?.id);

  // §1-3 — once the course's media set arrives, combine it into one sideways run through every
  // shot and open the canonical viewer on the tapped shot (media id, then
  // url, then post id, then 0). An empty or errored set just clears the tap.
  useEffect(() => {
    if (!pending) return;
    if (gallery.isError) { setPending(null); return; }
    const data = gallery.data;
    if (!data) return;
    const posts = coursePostsToShotPosts(data, pending.courseId, pending.courseName);
    if (posts.length === 0) { setPending(null); return; }
    const post = posts[0];
    if (!post) { setPending(null); return; }
    const mediaId = shotStartId(data, post, pending);
    openWithOrigin({
      posts,
      index: 0,
      originEl: null,
      posterUrl: pending.posterUrl,
      mediaId,
      openedFrom: 'course-media',
      options: { readOnly: true, syntheticPosts: true },
    });
    setPending(null);
  }, [gallery.data, gallery.isError, pending]);

  if (isLoading) return <LatestCoursesShell />;
  if (!visible) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="Through members' eyes" title="Latest from the courses" />
      <div ref={railRef} className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: PHOTO_FIGURE_GAP, marginTop: HEAD_GAP, willChange: 'transform' }}>
        {rows.map(row => (
          <LatestCourseCard
            key={row.course_id}
            row={row}
            pending={pending?.courseId === row.course_id}
            onOpen={tile => {
              if (pending) return;
              setPending({
                courseId: row.course_id,
                courseName: row.course_name,
                postId: tile.post_id,
                mediaId: tile.media_id,
                mediaUrl: tile.media_url,
                posterUrl: tile.poster_url ?? (tile.media_type === 'video' ? holeMediaPoster(tile) : tile.media_url),
              });
            }}
          />
        ))}
        {isFetchingNextPage && <LatestCourseSkeletonCard />}
        {hasNextPage && <div ref={sentinelRef} aria-hidden style={{ width: 1, flex: 'none', alignSelf: 'stretch' }} />}
      </div>
    </section>
  );
}
