/** PF3C totals use PF1B's stored round context, holes use actual gross from
 * useRoundHoleShapes. Never sum played pars into a missing final round par. */
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { PostGolfContext } from '@/hooks/feed/usePostGolfContext';
import { golfRoundToPar } from '@/hooks/feed/usePostGolfContext';
import { holeOrdinal, type VideoChapter } from '@/features/post-v2/lib/videoDetails';
export interface VideoRound { context: PostGolfContext; shape: HoleShape | null }
export const roundScoreText = (n: number | null) => n == null ? '—' : n === 0 ? 'E' : n < 0 ? `−${Math.abs(n)}` : `+${n}`;
export function playingRoundScore(round: VideoRound, chapter: VideoChapter | null) {
  const { context, shape } = round;
  if (!shape || !context.roundScoreId || (context.roundHoles !== 9 && context.roundHoles !== 18)) return null;
  if (!chapter?.holeNo) return context.roundGross == null ? null : { kicker: `ROUND · ${context.roundHoles} HOLES`, gross: context.roundGross, toPar: golfRoundToPar(context), thru: null };
  const hole = shape.holes.find(h => h.holeNo === chapter.holeNo);
  if (hole?.strokes == null || hole.par == null) return null;
  const prior = shape.holes.filter(h => h.holeNo <= hole.holeNo);
  const complete = prior.length === hole.holeNo && prior.every(h => h.par != null && h.strokes != null);
  return { kicker: `${holeOrdinal(hole.holeNo).toUpperCase()} · PAR ${hole.par}`, gross: hole.strokes, toPar: complete ? prior.reduce((n, h) => n + (h.strokes ?? 0) - (h.par ?? 0), 0) : null, thru: hole.holeNo };
}
export function roundChapterLabel(chapter: VideoChapter, shape: HoleShape | null): string {
  const hole = chapter.holeNo ? shape?.holes.find(h => h.holeNo === chapter.holeNo) : null;
  return chapter.holeNo ? `${chapter.label}${hole?.par != null ? ` · Par ${hole.par}` : ''}` : chapter.label;
}