import { useEffect, useMemo, useRef, useState } from 'react';

import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';

/**
 * PHOTOS — the two-column mosaic (BRIEF_COMMUNITY_PAGE_REBUILD, reference
 * frame).
 *
 * TWO COLUMNS WITH REAL HEIGHT VARIATION, not a square grid: a still is
 * composed, and a uniform square crop throws away the composition of every
 * photo on the page. Heights cycle over a fixed step set so a refetch cannot
 * reshuffle the wall.
 *
 * THE COURSE NAME SITS OVER THE FOOT of the tile, on a scrim, and renders
 * ONLY when the post is tagged — absent renders nothing and reserves no height.
 *
 * NO AUTOPLAY IN THIS SECTION — nothing here mounts a video element, so the
 * page-wide coordinator has nothing to elect from the mosaic.
 *
 * INCREMENTAL, NOT PAGED: the pool is already in memory, so the sentinel only
 * governs how many tiles are MOUNTED.
 *
 * INFINITE ONLY WHERE THERE IS NOTHING BELOW (BRIEF_COMMUNITY_PAGE_CORRECTIONS
 * S5): on the Everything view the wall stops at STEP and the section carries a
 * "See all" into the Photos chip, otherwise Browse by club sits under an
 * endless list and does not exist. On the Photos chip `infinite` is true and the
 * sentinel behaviour is exactly as shipped.
 */

/** Tiles mounted initially and per reveal. Even = whole rows across two cols. */
export const PHOTO_MOSAIC_STEP = 30;
const STEP = PHOTO_MOSAIC_STEP;
const PANEL = '#EDF0F3';
/** Height steps, px. Cycled by index so a tile's height is stable. */
const HEIGHTS = [240, 132, 148, 160, 128, 176];

interface Props {
  items: CommunityLibraryItem[];
  onPress: (item: CommunityLibraryItem) => void;
}

export function CommunityPhotoMosaic({ items, onPress }: Props) {
  const [shown, setShown] = useState(STEP);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // A NEW POOL RESETS THE REVEAL: a chip must not keep a scrolled-deep count.
  useEffect(() => setShown(STEP), [items]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= items.length) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown((n) => Math.min(n + STEP, items.length));
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, items.length]);

  /** Alternating fill keeps both columns growing together without measuring. */
  const columns = useMemo(() => {
    const cols: { item: CommunityLibraryItem; height: number }[][] = [[], []];
    items.slice(0, shown).forEach((item, i) => {
      cols[i % 2].push({ item, height: HEIGHTS[i % HEIGHTS.length] });
    });
    return cols;
  }, [items, shown]);

  if (items.length === 0) return null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ display: 'grid', gap: 2, alignContent: 'start' }}>
            {col.map(({ item, height }) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onPress(item)}
                style={{
                  position: 'relative',
                  height,
                  width: '100%',
                  padding: 0,
                  border: 'none',
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: PANEL,
                  cursor: 'pointer',
                }}
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                {item.courseName && (
                  <>
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, rgba(10,14,10,0) 58%, rgba(10,14,10,0.78) 100%)',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: 8,
                        right: 8,
                        bottom: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        lineHeight: 1.25,
                        textAlign: 'left',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}
                    >
                      {item.courseName}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div ref={sentinel} aria-hidden style={{ height: 1 }} />
    </>
  );
}

export default CommunityPhotoMosaic;
