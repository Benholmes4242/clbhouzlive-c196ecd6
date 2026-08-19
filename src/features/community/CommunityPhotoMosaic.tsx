import { useEffect, useRef, useState } from 'react';

import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';

/**
 * PHOTOS — the mosaic that replaced CommunityEverythingGrid
 * (BRIEF_COMMUNITY_PAGE_REBUILD S2.1/S5.3).
 *
 * THREE SQUARE TILES PER ROW. Squares here and true aspect in the video
 * sections is deliberate: the video tiers present a handful of framed pieces
 * and their shape is information; this presents everything else and its job is
 * scanning.
 *
 * NO AUTOPLAY IN THIS SECTION (S6.5) — nothing here mounts a video element at
 * all, so the page-wide coordinator has nothing to elect from the mosaic.
 *
 * INCREMENTAL, NOT PAGED: the pool is already in memory, so this only governs
 * how many tiles are MOUNTED. A sentinel reveals the next step, so there is no
 * button and no fetch.
 *
 * THE COURSE TAG RESERVES NO HEIGHT WHEN ABSENT (S3.3) — it is drawn over the
 * media, so an untagged tile is exactly the same size as a tagged one.
 */

/** Tiles mounted initially and per reveal. Multiple of 3 = whole rows. */
const STEP = 30;
const PANEL = '#EDF0F3';

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

  if (items.length === 0) return null;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
        }}
      >
        {items.slice(0, shown).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPress(item)}
            style={{
              position: 'relative',
              aspectRatio: '1 / 1',
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
          </button>
        ))}
      </div>
      <div ref={sentinel} aria-hidden style={{ height: 1 }} />
    </>
  );
}

export default CommunityPhotoMosaic;
