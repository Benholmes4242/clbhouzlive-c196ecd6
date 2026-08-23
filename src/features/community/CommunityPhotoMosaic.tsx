import type { Ref } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { mediaTarget, useMediaImpression } from '@/utils/mediaEngagement';
import { A, CARD_RADIUS } from '@/components/explore-tab-new/courseled/tokens';

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
/** /community's placeholder. Dark is Discover's — see CommunityCourseIndex. */
const PANEL = '#EDF0F3';
const PANEL_DARK = A.PANEL;
/** Height steps, px. Cycled by index so a tile's height is stable. */
const HEIGHTS = [240, 132, 148, 160, 128, 176];

interface Props {
  items: CommunityLibraryItem[];
  onPress: (item: CommunityLibraryItem) => void;
  /** False on Everything: the wall stops at one page. Default true (Photos chip). */
  infinite?: boolean;
  /** Discover is dark and owns the 8px radius system. Default light. */
  tone?: 'light' | 'dark';
  /**
   * WHICH SURFACE IS REPORTING (BRIEF_MEDIA_TRACKING_MINIMUM). The section value
   * stays 'photos' on both pages, so the before-and-after survives the move.
   */
  surface?: 'community' | 'discover';
}

export function CommunityPhotoMosaic({
  items,
  onPress,
  infinite = true,
  tone = 'light',
  surface = 'community',
}: Props) {
  const [shown, setShown] = useState(STEP);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // A NEW POOL RESETS THE REVEAL: a chip must not keep a scrolled-deep count.
  useEffect(() => setShown(STEP), [items]);

  useEffect(() => {
    const el = sentinel.current;
    if (!infinite || !el || shown >= items.length) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown((n) => Math.min(n + STEP, items.length));
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, items.length, infinite]);

  /** Alternating fill keeps both columns growing together without measuring. */
  const columns = useMemo(() => {
    const cols: { item: CommunityLibraryItem; height: number; index: number }[][] = [[], []];
    items.slice(0, shown).forEach((item, i) => {
      cols[i % 2].push({ item, height: HEIGHTS[i % HEIGHTS.length], index: i });
    });
    return cols;
  }, [items, shown]);

  if (items.length === 0) return null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ display: 'grid', gap: 2, alignContent: 'start' }}>
            {col.map(({ item, height, index }) => (
              <PhotoTile
                key={item.key}
                item={item}
                height={height}
                index={index}
                onPress={onPress}
                tone={tone}
                surface={surface}
              />
            ))}
          </div>
        ))}
      </div>
      <div ref={sentinel} aria-hidden style={{ height: 1 }} />
    </>
  );
}

/**
 * ONE TILE, so the impression observer has a per-tile element to register and
 * the open fires from the same place the member taps. Purely structural — the
 * markup, the geometry and the scrim are byte-for-byte what shipped.
 */
function PhotoTile({
  item,
  height,
  index,
  onPress,
}: {
  item: CommunityLibraryItem;
  height: number;
  index: number;
  onPress: (item: CommunityLibraryItem) => void;
  tone: 'light' | 'dark';
  surface: 'community' | 'discover';
}) {
  const track = mediaTarget(item, surface, 'photos', index);
  const impressionRef = useMediaImpression(track);
  return (
              <button
                ref={impressionRef as unknown as Ref<HTMLButtonElement>}
                type="button"
                onClick={() => {
                  analyticsEvents.media.opened(track);
                  onPress(item);
                }}
                style={{
                  position: 'relative',
                  height,
                  width: '100%',
                  padding: 0,
                  border: 'none',
                  borderRadius: tone === 'dark' ? CARD_RADIUS : 14,
                  overflow: 'hidden',
                  background: tone === 'dark' ? PANEL_DARK : PANEL,
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
  );
}

export default CommunityPhotoMosaic;
