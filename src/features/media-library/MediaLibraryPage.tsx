import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { MomentsGrid } from '@/components/explore-tab-new/courseled/MomentsGrid';
import { MediaRailTile } from '@/components/explore-tab-new/courseled/MediaRailTile';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { useCommunityLibrary } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { useWatchHubCounts } from '@/features/watch-v2/hooks/useWatchHubCounts';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { LibraryHead, LoadMore, SortRail } from './LibraryChrome';
import { RailChips } from '@/components/ui/RailChips';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { MOSAIC_GAP, MOSAIC_RADIUS } from '@/lib/mosaicGeometry';
import { useMergedLibraryTotal } from './libraryTotals';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { LibraryVideoCard } from './LibraryVideoCard';
import {
  MERGED_SORTS,
  MERGED_SORT_LABELS,
  useMergedMediaLibrary,
  type MergedSort,
} from './hooks/useMergedMediaLibrary';

const GUTTER = 14;
const PAGE = 36;
/** ONE PLAYER BUDGET for the whole page, shared by the rail and the mosaic. */
const AUTOPLAY_GROUP = 'media-library';

/**
 * /media — the ONE media destination, with one heading and THREE WALLS:
 * Clips, Longer watch, From the community. The kind chips name each wall and
 * carry the LIBRARY TOTAL from a count query — never the loaded array length.
 *
 * Clips reuse MediaRailTile in the community wall's full-bleed geometry;
 * long-form has a page-scale card; MomentsGrid retains its deployed geometry.
 */
/** THE THREE KINDS /media can be scoped to (BRIEF_EXPLORE_REFINEMENT §1).
 *  A see-all shows ALL OF ONE THING; the chips move between the three without
 *  a trip back. No kind means community, the largest and the one tied to
 *  members and courses. */
const KINDS = ['clips', 'longer', 'community'] as const;
type MediaKind = (typeof KINDS)[number];
const KIND_LABELS: Record<MediaKind, string> = {
  clips: 'Clips',
  longer: 'Longer watch',
  community: 'From the community',
};

export default function MediaLibraryPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('kind');
  const kind: MediaKind = (KINDS as ReadonlyArray<string>).includes(raw ?? '') ? (raw as MediaKind) : 'community';
  const [sort, setSort] = useState<MergedSort>('recent');
  const [shown, setShown] = useState(PAGE);
  const totalQuery = useMergedLibraryTotal();
  const hubCounts = useWatchHubCounts();
  const { tiles, isPending } = useMergedMediaLibrary(sort);

  /* THE WHOLE LIBRARY, all-time, newest first — the same read /community uses,
     so the two watch sections are not a second definition of "clip". */
  const library = useCommunityLibrary();
  const clips = useMemo(() => library.data?.clips ?? [], [library.data]);
  const videos = useMemo(() => library.data?.videos ?? [], [library.data]);
  const visibleClips = useMemo(() => clips.slice(0, shown), [clips, shown]);

  const visible = useMemo(() => tiles.slice(0, shown), [tiles, shown]);
  const moments = useMemo(() => visible.map((tile) => tile.moment), [visible]);

  const openPost = useCallback(
    (pool: CommunityLibraryItem[], item: CommunityLibraryItem, source: 'clip' | 'video') => {
      analyticsEvents.track('media_library_tile_tapped', {
        source,
        course_id: item.courseId,
        sort,
      });
      const posts = pool.map((entry) => entry.post);
      const index = Math.max(0, posts.findIndex((post) => post.id === item.postId));
      openWithOrigin({
        posts,
        index,
        originEl: null,
        posterUrl: item.thumbnail,
        mediaIndex: item.mediaIndex ?? 0,
        mediaId: item.mediaId ?? null,
        openedFrom: source === 'clip' ? 'media-library-clips' : 'media-library-videos',
        forceStartAtZero: true,
      });
    },
    [sort],
  );

  const openTile = useCallback(
    (moment: Moment) => {
      const at = visible.findIndex((tile) => tile.moment.key === moment.key);
      const tile = at >= 0 ? visible[at] : null;
      analyticsEvents.track('media_library_tile_tapped', {
        source: tile?.review ? 'review' : 'moment',
        course_id: moment.courseId,
        sort,
      });
      const posts = visible.map((entry) => entry.moment.post);
      openWithOrigin({
        posts,
        index: Math.max(0, at),
        originEl: null,
        posterUrl: moment.thumbnail,
        mediaIndex: moment.mediaIndex ?? 0,
        mediaId: moment.mediaId ?? null,
        openedFrom: tile?.review ? 'media-library-review' : 'media-library-moment',
        options: { readOnly: true },
      });
    },
    [sort, visible],
  );

  const changeSort = useCallback((next: MergedSort) => {
    setSort(next);
    setShown(PAGE);
    analyticsEvents.track('media_library_sort_changed', { sort: next });
    scrollPageToTop('auto');
  }, []);

  const changeKind = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set('kind', next);
          return out;
        },
        { replace: true },
      );
      analyticsEvents.track('media_library_kind_changed', { kind: next });
    },
    [setParams],
  );

  /* Entering with no kind states the default in the URL, so a share or a
     refresh lands on the same wall. */
  useEffect(() => {
    if (!raw) changeKind('community');
  }, [raw, changeKind]);

  useEffect(() => {
    setShown(PAGE);
    scrollPageToTop('auto');
  }, [kind]);

  const clipTotal = hubCounts.data?.clip_count ?? null;
  const videoTotal = hubCounts.data?.video_count ?? null;
  const mergedTotal = totalQuery.data ?? null;

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', color: A.INK, fontFamily: SANS, ...FIGS }}>
      {/* No page-owned header: /media wears the shared chrome islands (registry
          rule), the same object the course detail page wears. The ISLAND is the
          single safe-area owner — it pays env(safe-area-inset-top) and publishes
          --island-clearance (sat + island height + gap). This page pads with that
          one token and never pays the inset again. */}
      <main style={{ paddingTop: 'var(--island-clearance, calc(env(safe-area-inset-top, 0px) + 70px))' }}>

        <div style={{ padding: `0 ${GUTTER}px` }}>
          <LibraryHead title="Media" />
        </div>

        {/* THE KIND RAIL — the canonical chip, each carrying its count. One wall
            or list at a time; the heading and meta below follow the active kind. */}
        <div style={{ padding: `0 ${GUTTER}px ${kind === 'community' ? 12 : 14}px` }}>
          <RailChips
            options={KINDS.map((id) => ({
              id,
              label: `${KIND_LABELS[id]}${
                (id === 'clips' ? clipTotal : id === 'longer' ? videoTotal : mergedTotal) == null
                  ? ''
                  : ` ${id === 'clips' ? clipTotal : id === 'longer' ? videoTotal : mergedTotal}`
              }`,
            }))}
            value={kind}
            onChange={changeKind}
            ariaLabel="Media kind"
          />
        </div>

        <div style={{ paddingBottom: NAV_CLEARANCE }}>
          {/* 1. CLIPS — the full-bleed 9:16 wall, paged like community. */}
          {kind === 'clips' && clips.length > 0 && (
            <>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: MOSAIC_GAP, willChange: 'transform' }}
              >
                {visibleClips.map((item, index) => (
                  <MediaRailTile
                    key={item.key}
                    item={item}
                    index={index}
                    width={176}
                    fill
                    aspect={9 / 16}
                    radius={MOSAIC_RADIUS}
                    showCaption={false}
                    autoplayGroup={AUTOPLAY_GROUP}
                    maxPlaying={2}
                    onPress={() => openPost(clips, item, 'clip')}
                  />
                ))}
              </div>
              {clips.length > shown && (
                <div style={{ padding: `0 ${GUTTER}px` }}>
                  <LoadMore busy={false} onPress={() => setShown((value) => value + PAGE)} />
                </div>
              )}
            </>
          )}

          {/* 2. LONGER WATCH — page-scale cards, not the Amateur shelf row. */}
          {kind === 'longer' && videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: `0 ${GUTTER}px` }}>
              {videos.map((item, index) => (
                <LibraryVideoCard
                  key={item.key}
                  item={item}
                  onPress={() => openPost(videos, item, 'video')}
                />
              ))}
            </div>
          )}

          {/* 3. FROM THE COMMUNITY — the merged mosaic, full bleed. */}
          {kind === 'community' && (
          <>
            <div style={{ padding: '0 20px' }}>
              <SortRail
                options={MERGED_SORTS.map((id) => ({ id, label: MERGED_SORT_LABELS[id] }))}
                value={sort}
                onChange={(next) => changeSort(next as MergedSort)}
              />
            </div>

            {/* A HELD HEIGHT while both reads settle, so the wall does not jump. */}
            {isPending ? (
              <div style={{ height: 520 }} aria-hidden />
            ) : (
              <>
                <MomentsGrid
                  moments={moments}
                  gap={MOSAIC_GAP}
                  tall={250}
                  radius={MOSAIC_RADIUS}
                  onTilePress={openTile}
                  autoplayGroup={AUTOPLAY_GROUP}
                />
                {tiles.length > shown && (
                  <div style={{ padding: `0 ${GUTTER}px` }}>
                    <LoadMore busy={false} onPress={() => setShown((value) => value + PAGE)} />
                  </div>
                )}
              </>
            )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
