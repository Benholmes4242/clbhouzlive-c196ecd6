/**
 * segmentWall — split a flat ordered rows array into layout segments:
 *   - portrait rows pack in two-column pairs
 *   - landscape rows break out full-width
 *
 * flatIndex (the row's index in the original flat array) is CARRIED
 * THROUGH SEGMENTATION. It is load-bearing for autoplay
 * (data-watch-tile-index) and openWithOrigin (index into feedPosts).
 *
 * Landscape = width && height && width > height. Missing/zero dims are
 * treated as PORTRAIT.
 */

export interface WallItem<Row = any> {
  row: Row;
  flatIndex: number;
}

export type Segment<Row = any> =
  | { kind: 'pack'; items: WallItem<Row>[] }
  | { kind: 'wide'; item: WallItem<Row> };

function isLandscape(row: any): boolean {
  const w = Number(row?.width) || 0;
  const h = Number(row?.height) || 0;
  return w > 0 && h > 0 && w > h;
}

export function segmentWall<Row = any>(rows: Row[]): Segment<Row>[] {
  const segments: Segment<Row>[] = [];
  let buf: WallItem<Row>[] = [];

  const flushPack = () => {
    if (buf.length === 0) return;
    segments.push({ kind: 'pack', items: buf });
    buf = [];
  };

  (rows ?? []).forEach((row, i) => {
    const item: WallItem<Row> = { row, flatIndex: i };
    if (isLandscape(row)) {
      flushPack();
      segments.push({ kind: 'wide', item });
    } else {
      buf.push(item);
    }
  });
  flushPack();
  return segments;
}
