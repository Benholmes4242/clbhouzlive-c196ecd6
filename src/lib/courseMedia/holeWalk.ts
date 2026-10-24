/** MEDIA_WALK_1_R: public walk derives only from approved rows and analysis holes.
 * - Hole-walk public counts share `courseMedia/holeWalk.ts`: no pending.
 * Photo and video display months use EXIF capture timestamp only, never contribution date.
 * Publication is unchanged; row counts include both media types; no alias inference.
 * Media alone uses courseWalkHoles for empty available analysis; other tabs
 * retain the analysis hook's original holes so invented scoring never leaks.
 */
import type { CourseHole, CourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { capitalPhotoCount, spellPhotoCount, type HolePhoto } from './holePhotoData';

export const UNSCORED_HOLE_COUNT = 18;
export function courseWalkHoles(data: CourseHoleAnalysis | null | undefined): { holes: CourseHole[]; scored: boolean } | null {
  if (!data || !data.available) return null;
  if (data.holes.length > 0) return { holes: data.holes, scored: true };
  return { holes: Array.from({ length: UNSCORED_HOLE_COUNT }, (_, i) => ({
    hole_no: i + 1, par: 0, yards: null, stroke_index: null, rounds: 0,
    avg_to_par: Number.NaN, avg_gross: Number.NaN,
    dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 },
  })), scored: false };
}

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