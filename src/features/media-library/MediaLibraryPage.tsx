import { useCallback, useMemo, useState } from 'react';

import { MomentsGrid } from '@/components/explore-tab-new/courseled/MomentsGrid';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { LibraryChrome, LibraryHead, LoadMore, SortRail } from './LibraryChrome';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { useMergedLibraryTotal } from './libraryTotals';
import {
  MERGED_SORTS,
  MERGED_SORT_LABELS,
  useMergedMediaLibrary,
  type MergedSort,
} from './hooks/useMergedMediaLibrary';

const GUTTER = 14;
const PAGE = 36;

/**
 * /media — the ONE media destination. It holds the UNION the Amateur mosaic
 * summarises: review photographs and course-tagged member moments, in the
 * deployed mosaic geometry, revealed by an explicit Load more in place.
 *
 * Its eyebrow reads the same merged count query the See all reads, so the
 * figure a member is shown and the wall they land on describe one set.
 */
export default function MediaLibraryPage() {
  const [sort, setSort] = useState<MergedSort>('recent');
  const [shown, setShown] = useState(PAGE);
  const totalQuery = useMergedLibraryTotal();
  const { tiles, isPending } = useMergedMediaLibrary(sort);

  const visible = useMemo(() => tiles.slice(0, shown), [tiles, shown]);
  const moments = useMemo(() => visible.map((tile) => tile.moment), [visible]);

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

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', color: A.INK, fontFamily: SANS, ...FIGS }}>
      <LibraryChrome label="Media" />
      <main style={{ paddingTop: 'var(--library-header-h)' }}>
        <div style={{ padding: `0 ${GUTTER}px ${NAV_CLEARANCE}` }}>
          <LibraryHead total={totalQuery.data ?? null} title="Media" />
          <SortRail
            options={MERGED_SORTS.map((id) => ({ id, label: MERGED_SORT_LABELS[id] }))}
            value={sort}
            onChange={(next) => changeSort(next as MergedSort)}
          />

          {/* A HELD HEIGHT while both reads settle, so the wall does not jump. */}
          {isPending ? (
            <div style={{ height: 520 }} aria-hidden />
          ) : (
            <>
              <MomentsGrid
                moments={moments}
                gap={5}
                tall={250}
                radius={10}
                onTilePress={openTile}
                autoplayGroup="media-library"
              />
              {tiles.length > shown && (
                <LoadMore busy={false} onPress={() => setShown((value) => value + PAGE)} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
