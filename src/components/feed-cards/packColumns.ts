/**
 * packColumns — greedy height-balanced two-column packer for the
 * shared feed. Preserves feed order (never reorders items); the only
 * choice made per item is which column receives it. The item's
 * position in the input array is stamped as `flatIndex` BEFORE
 * placement so autoplay + openWithOrigin keep reading the same value
 * they always have.
 *
 * `getAspect(item)` must return the tile's aspect ratio as
 * width / height (e.g. 16/9 for landscape, 9/14 for portrait). Height
 * cost is 1 / aspect, matching the layout: taller tiles push the
 * column down more, so subsequent items favour the shorter column.
 * Ties break left.
 *
 * Pure function, no React.
 */

export interface PackedItem<T> {
  item: T;
  flatIndex: number;
}

export interface PackedColumns<T> {
  left: PackedItem<T>[];
  right: PackedItem<T>[];
}

export function packColumns<T>(
  items: T[],
  getAspect: (item: T) => number,
): PackedColumns<T> {
  const left: PackedItem<T>[] = [];
  const right: PackedItem<T>[] = [];
  let leftH = 0;
  let rightH = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const aspect = getAspect(item) || 9 / 14;
    const h = 1 / aspect;
    if (leftH <= rightH) {
      left.push({ item, flatIndex: i });
      leftH += h;
    } else {
      right.push({ item, flatIndex: i });
      rightH += h;
    }
  }

  return { left, right };
}
