/** MEDIA_FAST_1: a batch is a snapshot of untagged sources. Successful tags
 * alone move its last-tag floor; skip never writes or alters source membership.
 * Verdicts use the engine, not the display-date fallback.
 */
import type { HolePhotoExif } from './holePhotoExif';
import { holePhotoVerdict, type HolePhotoRound } from './holePhotoVerdict';

export interface BatchPhoto {
  url: string;
  createdAt: string;
  exif: HolePhotoExif;
}
export interface BatchProgress {
  index: number;
  floor: number;
  tags: Readonly<Record<string, number>>;
}
export const startBatch = (): BatchProgress => ({ index: 0, floor: 0, tags: {} });
export function advanceBatch(state: BatchProgress, url: string, hole: number | null): BatchProgress {
  if (hole === null) return { ...state, index: state.index + 1 };
  if (!Number.isInteger(hole) || hole < 1 || hole < state.floor) throw new Error('This hole is closed.');
  return { index: state.index + 1, floor: hole, tags: { ...state.tags, [url]: hole } };
}
export const closedHoleCount = (floor: number) => Math.max(0, floor - 1);
export function orderedBatch<T extends BatchPhoto>(photos: readonly T[]): T[] {
  const stamp = (photo: BatchPhoto) => Date.parse(photo.exif.capturedAt ?? photo.createdAt) || 0;
  return [...photos].sort((a, b) => stamp(a) - stamp(b) || a.url.localeCompare(b.url));
}
export function batchVerdicts(photos: readonly BatchPhoto[], memberId: string, courseId: string, rounds: readonly HolePhotoRound[]) {
  const published = photos.filter(photo => holePhotoVerdict(photo.exif, memberId, courseId, rounds).status === 'approved').length;
  return { published, waiting: 0, all: photos.length > 0 };
}