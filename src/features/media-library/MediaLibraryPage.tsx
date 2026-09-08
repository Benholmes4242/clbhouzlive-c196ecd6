import { useCallback, useMemo, useState } from 'react';

import { MomentsGrid } from '@/components/explore-tab-new/courseled/MomentsGrid';
import { MediaRailTile } from '@/components/explore-tab-new/courseled/MediaRailTile';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { useCommunityLibrary } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { useWatchHubCounts } from '@/features/watch-v2/hooks/useWatchHubCounts';
import { VideoRow } from '@/features/amateur/AmateurMediaBlock';
import AboutSection from '@/components/courses/course-detail/about/AboutSection';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { LibraryHead, LoadMore, SortRail } from './LibraryChrome';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { MOSAIC_GAP, MOSAIC_RADIUS } from '@/lib/mosaicGeometry';
import { useMergedLibraryTotal } from './libraryTotals';
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
 * /media — the ONE media destination, in THREE SECTIONS (BRIEF_MEDIA_TAB §2):
 * Clips, Longer watch, From the community. Each carries a real section heading
 * in the treatment now standard across the five course tabs (AboutSection over
 * DiscoverSectionHeading), and each meta figure is the LIBRARY TOTAL from a
 * count query — never the length of the loaded array, which is the fault that
 * bit us twice today.
 *
 * The three shapes are the deployed ones, not new ones: the clips rail and the
 * long-form row are the SAME components the Amateur media block renders, and
 * the mosaic is MomentsGrid in the one mosaic geometry (2px gutter, r.xs).
 */
export default function MediaLibraryPage() {
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
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

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
          <LibraryHead total={mergedTotal} title="Media" />
        </div>

        <div style={{ paddingBottom: NAV_CLEARANCE }}>
          {/* 1. CLIPS — the 9:16 rail, its own deployed tile size. */}
          {clips.length > 0 && (
            <AboutSection
              heading="Clips"
              meta={clipTotal == null ? null : String(clipTotal)}
              first
              bleed
            >
              <div
                className="scrollbar-hide"
                style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: `0 20px`, willChange: 'transform' }}
              >
                {clips.map((item, index) => (
                  <MediaRailTile
                    key={item.key}
                    item={item}
                    index={index}
                    width={176}
                    autoplayGroup={AUTOPLAY_GROUP}
                    onPress={() => openPost(clips, item, 'clip')}
                  />
                ))}
              </div>
            </AboutSection>
          )}

          {/* 2. LONGER WATCH — the shared long-form row, text-led. */}
          {videos.length > 0 && (
            <AboutSection heading="Longer watch" meta={videoTotal == null ? null : String(videoTotal)}>
              {videos.map((item, index) => (
                <VideoRow
                  key={item.key}
                  item={item}
                  first={index === 0}
                  onPress={() => openPost(videos, item, 'video')}
                />
              ))}
            </AboutSection>
          )}

          {/* 3. FROM THE COMMUNITY — the merged mosaic, full bleed. */}
          <AboutSection
            heading="From the community"
            meta={mergedTotal == null ? null : String(mergedTotal)}
            bleed
          >
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
          </AboutSection>
        </div>
      </main>
    </div>
  );
}
