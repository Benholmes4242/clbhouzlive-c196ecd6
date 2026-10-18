/** MEDIA_WALK_1_R: public walk derives only from approved rows and analysis holes.
 * Capture months use EXIF, never contribution timestamps; no alias inference.
 */
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { capitalPhotoCount, spellPhotoCount, type HolePhoto } from './holePhotoData';

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth'];
export const holeOrdinal = (hole: number) => ORDINALS[hole - 1] ?? `${hole}th`;

export function deriveHoleWalk(holes: readonly CourseHole[], rows: readonly HolePhoto[]) {
  const tiles = [...holes].sort((a, b) => a.hole_no - b.hole_no).map(hole => ({
    hole, photos: rows.filter(row => row.status === 'approved' && row.hole_no === hole.hole_no),
  }));
  const open = tiles.filter(tile => tile.photos.length === 0);
  const photographed = tiles.length - open.length;
  const max = Math.max(0, ...tiles.map(tile => tile.photos.length));
  const winners = tiles.filter(tile => tile.photos.length === max);
  const most = max >= 2 && winners.length === 1 ? winners[0]?.hole.hole_no ?? null : null;
  const hardest = [...holes].filter(hole => Number.isFinite(hole.avg_to_par)).sort((a, b) => b.avg_to_par - a.avg_to_par || a.hole_no - b.hole_no)[0];
  const hardestOpen = hardest && open.some(tile => tile.hole.hole_no === hardest.hole_no) ? hardest.hole_no : null;
  return { tiles, openCount: open.length, photographed, most, hardestOpen,
    headlineTotal: holes.length >= 10 ? holes.length : null,
    photoCount: tiles.reduce((sum, tile) => sum + tile.photos.length, 0),
    headline: holes.length >= 10
      ? `${capitalPhotoCount(photographed)} of the ${spellPhotoCount(holes.length)} have been photographed`
      : `${capitalPhotoCount(open.length)} holes here have no photograph yet.`,
  };
}

export function captureMonth(row: HolePhoto): string | null {
  const value = row.exif_captured_at;
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])-\d{2}/.test(value)) return null;
  return value.slice(0, 7);
}
export function captureMonthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
export function holePhotoMonths(rows: readonly HolePhoto[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== 'approved') continue;
    const month = captureMonth(row);
    if (month) counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return counts.size >= 2 ? [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })) : [];
}