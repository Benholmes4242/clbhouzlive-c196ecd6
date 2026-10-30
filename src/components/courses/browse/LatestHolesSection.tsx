import { HoleInlineVideo } from '@/components/course-media-tab/HoleInlineVideo';
import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { addedMonthLabel } from '@/lib/courseMedia/addedMonth';
import { latestHolesToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { useSectionReady } from './PageLoadGate';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { RAIL_BLEED } from './format';
import { PHOTO_FIGURE_GAP } from './PhotoFigureCard';
import { LatestHolesShell, LatestHoleSkeletonCard } from './sectionShells';
import { dedupeRailRows, useRailPagination } from './useRailPagination';
import { LATEST_HOLE_W, LATEST_HOLE_H } from './railTileHeights';
import './latestHoles.css';

/** The RPC owns newest-first ordering, up to two shots per course and public eligibility.
 * Cursor pages have no total cap; created_at/id belong to the last raw row, not the deduped cards.
 * The gam_rpc/name prefix preserves AdminHoleTagging predicate invalidation.
 * First-page readiness/minimum are independent of later fetches; fullscreen freezes pagination
 * and receives a snapshot of every loaded row at the moment of the tap.
 * Credit shows the month the member added the shot to clbhouz (added_at), never its EXIF capture date; in-view video tiles play muted and looping through HoleInlineVideo in the page-wide "courses-member-shots" autoplay group (one video at a time).
 * Geometry is shared with the loading shell, not PhotoFigureCard.
 * BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS §2: a tap opens the CANONICAL
 * full-screen viewer (FullscreenFeedOverlay via openWithOrigin, readOnly)
 * over EVERY ready card on the rail in RPC order, without another network read,
 * one sideways carousel with each shot credited to its contributor, landing on the
 * tapped shot. The ?tab=media&hole=&shot= deep link in CourseMediaTabNew is
 * unchanged.
 */
export { LATEST_HOLE_W, LATEST_HOLE_H };
export const LATEST_HOLE_PAGE_SIZE = 20;
const holesViewerOpen = () => useFullscreenFeedStore.getState().isOpen;

export interface LatestHoleMedia {
  id: string;
  course_id: string;
  course_name: string;
  hole_no: number;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  exif_captured_at: string | null;
  added_at: string;
  created_at: string;
  member_id: string;
  member_name: string | null;
  member_avatar_url: string | null;
  par: number | null;
  yards: number | null;
}

function LatestHoleCard({ row, onOpen }: { row: LatestHoleMedia; onOpen: (row: LatestHoleMedia) => void }) {
  const credit = [row.member_name, addedMonthLabel(row.added_at)].filter(Boolean).join(' · ');
  const seconds = Math.round(row.duration_seconds ?? 0);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <button type="button" className="latest-hole-card" aria-label={`Hole ${row.hole_no}, ${row.course_name}`}
      style={{ width: LATEST_HOLE_W, height: LATEST_HOLE_H, background: A.PANEL, opacity: 1 }}
      onClick={() => onOpen(row)}>
      {row.media_type === 'video'
        ? <HoleInlineVideo media={row} alt="" fit="cover" autoplayGroup="courses-member-shots" active />
        : <img src={row.media_url} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}
      <div className="latest-hole-scrim" style={{ background: SCRIM_STANDOUT }} />
      <div className="latest-hole-figure">
        <div className="latest-hole-number">{row.hole_no}</div>
        <div className="latest-hole-label">{row.par != null ? `Par ${row.par}${row.yards != null ? ` · ${row.yards} yds` : ''}` : 'Hole'}</div>
      </div>
      <div className="latest-hole-name">
        <div className="latest-hole-course">{row.course_name}</div>
        {credit && <div className="latest-hole-credit">{credit}</div>}
      </div>
      {row.media_type === 'video' && <span className="glass-chip latest-hole-video">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" /></svg>
        {duration}
      </span>}
    </button>
  );
}

export function LatestHolesSection() {
  const viewerOpen = useFullscreenFeedStore(state => state.isOpen);
  // Guests: the RPC is member-only (401 for anonymous sessions) — never fire it.
  const isGuest = useIsGuest();
  const { user } = useSupabaseSession();
  const { data, isLoading, isError, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['gam_rpc', 'get_latest_hole_media', 'infinite', user?.id, isGuest],
    initialPageParam: undefined as { at: string; id: string } | undefined,
    queryFn: async ({ pageParam }) => {
      const args = { p_limit: LATEST_HOLE_PAGE_SIZE, ...(pageParam ? { p_before_at: pageParam.at, p_before_id: pageParam.id } : {}) };
      // RPC cursor arguments are already deployed; generated client types may lag that contract.
      const { data, error } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: LatestHoleMedia[] | null; error: unknown }>)('get_latest_hole_media', args);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: page => {
      const last = page[page.length - 1];
      return page.length < LATEST_HOLE_PAGE_SIZE || !last ? undefined : { at: last.created_at, id: last.id };
    },
    staleTime: 60_000,
    enabled: !viewerOpen && !isGuest,
  });
  useSectionReady('latestHoles', !isLoading);
  const rows = useMemo(() => dedupeRailRows(data?.pages ?? [], row => row.id), [data]);
  const visible = !isLoading && !isError && (data?.pages[0]?.length ?? 0) >= 3;
  const { railRef, sentinelRef } = useRailPagination({ hasNextPage, isFetching, fetchNextPage, cardWidth: LATEST_HOLE_W, pageCount: data?.pages.length ?? 0, visible, blocked: viewerOpen, isBlocked: holesViewerOpen });
  const posts = useMemo(() => latestHolesToFeedPosts(rows), [rows]);
  const onOpen = (tapped: LatestHoleMedia) => {
    openWithOrigin({
      posts,
      index: 0,
      originEl: null,
      posterUrl: tapped.media_type === 'video' ? holeMediaPoster(tapped) : tapped.media_url,
      mediaId: tapped.id,
      openedFrom: 'course-media',
      options: { readOnly: true, syntheticPosts: true },
    });
  };

  if (isLoading) return <LatestHolesShell />;
  if (!visible) return null;
  return <section style={SECTION_WRAP}>
    <SectionHead tone="amber" kicker="Hole by hole" title="Latest holes" />
    <div ref={railRef} className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: PHOTO_FIGURE_GAP, marginTop: HEAD_GAP, willChange: 'transform' }}>
      {rows.map(row => <LatestHoleCard key={row.id} row={row} onOpen={onOpen} />)}
      {isFetchingNextPage && <LatestHoleSkeletonCard />}
      {hasNextPage && <div ref={sentinelRef} aria-hidden style={{ width: 1, flex: 'none', alignSelf: 'stretch' }} />}
    </div>
  </section>;
}
