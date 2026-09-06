import { useCallback, useMemo, useState } from 'react';

import { MomentsGrid } from '@/components/explore-tab-new/courseled/MomentsGrid';
import { useMomentsOfTheWeek, type Moment, type MomentsSort } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { LibraryChrome, LibraryHead, LoadMore, SortRail } from './LibraryChrome';
import { useMomentsLibraryTotal } from './libraryTotals';

const GUTTER = 14;
const PAGE = 36;

const SORTS: Array<{ id: MomentsSort; label: string }> = [
  { id: 'recent', label: 'Most recent' },
  { id: 'liked', label: 'Most liked' },
  { id: 'course', label: 'By course' },
];

/**
 * BRIEF_WATCH_SEE_ALL S3 — /explore/moments. The whole course-tagged member
 * media pool in the existing two-column mosaic, revealed by an explicit Load
 * more in place. Uncapped per post (maxPerPost: Infinity) so the page's own
 * total is the same number the See all carries.
 */
export default function MomentsLibraryPage() {
  const [sort, setSort] = useState<MomentsSort>('recent');
  const [shown, setShown] = useState(PAGE);
  const totalQuery = useMomentsLibraryTotal();
  const query = useMomentsOfTheWeek(null, { sort, maxPerPost: Number.POSITIVE_INFINITY });

  const moments = useMemo(() => query.data ?? [], [query.data]);
  const visible = useMemo(() => moments.slice(0, shown), [moments, shown]);

  const openTile = useCallback((moment: Moment) => {
    const posts = visible.map((entry) => entry.post);
    const index = Math.max(0, posts.findIndex((post) => post.id === moment.post.id));
    openWithOrigin({
      posts,
      index,
      originEl: null,
      posterUrl: moment.thumbnail,
      mediaIndex: moment.mediaIndex ?? 0,
      mediaId: moment.mediaId ?? null,
      openedFrom: 'explore-moments-library',
    });
  }, [visible]);

  const changeSort = useCallback((next: MomentsSort) => {
    setSort(next);
    setShown(PAGE);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', color: A.INK, fontFamily: SANS, ...FIGS }}>
      <LibraryChrome label="Moments" />
      <main style={{ paddingTop: 'var(--library-header-h)' }}>
        <div style={{ padding: `0 ${GUTTER}px 110px` }}>
          <LibraryHead total={totalQuery.data ?? null} title="Moments" />
          <SortRail options={SORTS} value={sort} onChange={(next) => changeSort(next as MomentsSort)} />

          <MomentsGrid
            moments={visible}
            gap={5}
            tall={250}
            radius={10}
            onTilePress={openTile}
            autoplayGroup="explore-moments-library"
          />

          {moments.length > shown && (
            <LoadMore busy={false} onPress={() => setShown((value) => value + PAGE)} />
          )}
        </div>
      </main>
    </div>
  );
}
