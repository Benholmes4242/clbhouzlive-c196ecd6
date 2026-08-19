import { useMemo } from 'react';

import { CommunityClipTile } from '@/components/explore-tab-new/courseled/CommunityMediaTiles';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';

/**
 * CLIPS — a TWO-COLUMN MASONRY AT TRUE ASPECT (BRIEF_COMMUNITY_PAGE_CORRECTIONS
 * S4).
 *
 * THE FAULT IT CORRECTS: the clips grid forced aspectRatio 9/16 on every tile,
 * so a landscape or square clip was centre-cropped into a portrait frame and
 * the thing the member filmed was cut away. The rebuild's 9/16 assumed every
 * clip is vertical. It is not.
 *
 * TWO COLUMNS, NOT THREE: a landscape clip in a third-width column is too small
 * to read.
 *
 * NULL ASPECT FALLS BACK TO SQUARE, not 9/16 — square is the honest guess for
 * unmeasured media because it crops least in either direction.
 *
 * CLAMPED to [0.5, 1.9] (width / height): a 21:9 clip in a half-width column is
 * a sliver and a 9:21 one would take a whole screen. The tile takes the CLAMPED
 * ratio and the media covers it — nothing is letterboxed.
 *
 * WHY THIS IS NOT CommunityPhotoMosaic: the photo mosaic assigns a tile height
 * from a fixed cycling step set and fills columns by alternating index. It never
 * reads an aspect, and it has no ratio to balance on. Reusing it would mean
 * replacing that height model, which the brief holds fixed (S7). So this is a
 * separate, aspect-driven masonry that balances on measured column height.
 */

/** Square is the honest guess for an unmeasured clip. */
const FALLBACK_ASPECT = 1;
/** width / height clamp. Below = too tall, above = a sliver at half width. */
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 1.9;

/** TRUE aspect, clamped, with square standing in for "we do not know". */
export function clipAspect(aspect: number | null | undefined): number {
  const raw = aspect && aspect > 0 ? aspect : FALLBACK_ASPECT;
  return Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, raw));
}

interface Props {
  items: CommunityLibraryItem[];
  onPress: (item: CommunityLibraryItem) => void;
}

export function CommunityClipMosaic({ items, onPress }: Props) {
  /**
   * SHORTEST-COLUMN FILL on relative height (1 / aspect), so a column of
   * landscape clips does not run half the length of a column of portraits.
   */
  const columns = useMemo(() => {
    const cols: { item: CommunityLibraryItem; aspect: number }[][] = [[], []];
    const heights = [0, 0];
    for (const item of items) {
      const aspect = clipAspect(item.aspect);
      const target = heights[0] <= heights[1] ? 0 : 1;
      cols[target].push({ item, aspect });
      heights[target] += 1 / aspect;
    }
    return cols;
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
          {col.map(({ item, aspect }) => (
            <CommunityClipTile
              key={item.key}
              item={item}
              railVisible
              onPress={onPress}
              width="100%"
              aspect={aspect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default CommunityClipMosaic;
