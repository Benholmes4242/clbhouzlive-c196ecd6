import { useCallback, useMemo, useState } from 'react';

import { GlassBadge } from '@/components/media/GlassDurationBadge';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { LibraryChrome, LibraryHead, LoadMore, SortRail } from './LibraryChrome';
import { useReviewLibraryTotal } from './libraryTotals';
import {
  REVIEW_LIBRARY_SORTS,
  REVIEW_LIBRARY_SORT_LABELS,
  useReviewMediaLibrary,
  type ReviewLibrarySort,
  type ReviewLibraryTile,
} from './hooks/useReviewMediaLibrary';

const GUTTER = 14;

/**
 * BRIEF_WATCH_SEE_ALL S3 — /explore/reviews. The destination behind Watch's
 * "From the reviews" See all. Its total is the SAME count query the See all
 * reads, so the two figures cannot disagree.
 */
export default function ReviewsLibraryPage() {
  const [sort, setSort] = useState<ReviewLibrarySort>('recent');
  const totalQuery = useReviewLibraryTotal();
  const query = useReviewMediaLibrary(sort);

  const tiles = useMemo(() => {
    const rows = (query.data?.pages ?? []).flatMap((page) => page.rows);
    if (sort !== 'course') return rows;
    return [...rows].sort((a, b) => a.courseName.localeCompare(b.courseName) || b.at.localeCompare(a.at));
  }, [query.data, sort]);

  const openTile = useCallback((tile: ReviewLibraryTile) => {
    const posts = tiles.map((entry) => entry.post);
    const index = Math.max(0, posts.findIndex((post) => post.id === tile.reviewId));
    openWithOrigin({
      posts,
      index,
      originEl: null,
      posterUrl: tile.thumbnail,
      mediaId: tile.post.mediaItems[0]?.id ?? null,
      openedFrom: 'explore-reviews-library',
      options: { readOnly: true },
    });
  }, [tiles]);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', color: A.INK, fontFamily: SANS, ...FIGS }}>
      <LibraryChrome label="From the reviews" />
      <main style={{ paddingTop: 'var(--library-header-h)' }}>
        <div style={{ padding: `0 ${GUTTER}px 110px` }}>
          <LibraryHead total={totalQuery.data ?? null} title="From the reviews" />
          <SortRail<ReviewLibrarySort>
            options={REVIEW_LIBRARY_SORTS.map((id) => ({ id, label: REVIEW_LIBRARY_SORT_LABELS[id] }))}
            value={sort}
            onChange={setSort}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {tiles.map((tile) => (
              <button
                key={tile.reviewId}
                type="button"
                onClick={() => openTile(tile)}
                style={{ padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', height: 132, borderRadius: 10, overflow: 'hidden', background: A.PANEL }}>
                  {tile.thumbnail && (
                    <img src={tile.thumbnail} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <GlassBadge corner="top-left">
                    <span style={{ color: A.AMBER }}>{tile.rating.toFixed(1)}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.72)' }}>/10</span>
                  </GlassBadge>
                  {tile.mediaCount > 1 && <GlassBadge>+{tile.mediaCount - 1}</GlassBadge>}
                </div>
                <div style={{ marginTop: 7, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tile.courseName}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tile.reviewerName}</div>
              </button>
            ))}
          </div>

          {query.hasNextPage && (
            <LoadMore busy={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
          )}
        </div>
      </main>
    </div>
  );
}
