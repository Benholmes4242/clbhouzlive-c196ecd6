/** Inline scorecard uses the brief's compact score grammar without changing
 * ScoreMark's richer shared rings or the canonical fullscreen ScorecardSheet. */
import { Fragment, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SC_FILL_GOLD, SC_BOGEY_DARK, SC_DOUBLE_DARK, SC_EAGLE_DARK, SC_TRIPLE_DARK, SC_FILL_TRIPLE_DK } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '../_shared/tokens';
import type { BoardHole } from './useBoardHoles';

export function holeGrade(strokes: number | null, par: number | null) {
  if (strokes == null || strokes <= 0 || par == null) return 'empty';
  const delta = strokes-par;
  return delta <= -2 ? 'eagle' : delta === -1 ? 'birdie' : delta === 0 ? 'par' : delta === 1 ? 'bogey' : 'double';
}
export function holeTone(grade: ReturnType<typeof holeGrade>) {
  return grade === 'eagle' ? SC_FILL_GOLD : grade === 'birdie' ? TOPAR_UNDER_DARK : grade === 'bogey' ? SC_BOGEY_DARK : grade === 'double' ? SC_DOUBLE_DARK : grade === 'par' ? 'var(--tour-board-faint)' : 'var(--tour-board-empty)';
}
export function orderedHoleCells(holes: BoardHole[]) {
  return Array.from({length:18},(_,i) => holes.find(h => h.hole_number === i+1) ?? null);
}

/** ONE shared scorecard-mark row (signed-off hole-marks mock): the
 *  leaderboard board, the Tour hero board, Also this week and Clubhouse
 *  scorecard posts all draw THE SAME marks — the scorecard sheet's grammar at
 *  row size — so tour and member data both feed this component. Plain
 *  { strokes, par } per hole, in order; 18 holes get the 4px nine gap, a
 *  nine-hole round renders 9 cells with no gap. `surface` is the background
 *  the row sits on; it paints the gaps inside the double marks. Unplayed holes
 *  are a centred 3px dot with no figure. */
export interface HoleMarkCell { strokes: number | null; par: number | null }
export type HoleMarkGrade = 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple' | 'empty';
export function holeMarkGrade(strokes: number | null, par: number | null): HoleMarkGrade {
  if (strokes == null || strokes <= 0 || par == null) return 'empty';
  const d = strokes - par;
  return d <= -2 ? 'eagle' : d === -1 ? 'birdie' : d === 0 ? 'par' : d === 1 ? 'bogey' : d === 2 ? 'double' : 'triple';
}
export const HOLE_MARK_INK = Object.freeze({ birdie: TOPAR_UNDER_DARK, eagle: SC_EAGLE_DARK, bogey: 'rgba(248,250,252,.55)', double: SC_TRIPLE_DARK, tripleFill: SC_FILL_TRIPLE_DK });
/** The row tints are translucent; the gap inside a double mark must be the
 *  OPAQUE colour the row reads as, so tints are flattened onto the canvas. */
export const MARK_SURFACE_LEADER = 'color-mix(in srgb, rgb(255,255,255) 3.5%, var(--tour-board-canvas))';
export const MARK_SURFACE_MINE = 'color-mix(in srgb, rgb(247,147,30) 6%, var(--tour-board-canvas))';
export function HoleMarks({ holes, surface = 'var(--tour-board-canvas)', raised = null }: { holes: ReadonlyArray<HoleMarkCell | null>; surface?: string; raised?: number | null }) {
  const nineGap = holes.length === 18;
  return <span className="tour-hole-marks" data-hole-marks style={{ gridColumn: '1 / -1', '--hm-surface': surface } as CSSProperties}>{holes.map((h, i) => {
    const grade = holeMarkGrade(h?.strokes ?? null, h?.par ?? null);
    return <Fragment key={i}>{nineGap && i === 9 && <i className="tour-hole-marks-gap" aria-hidden="true" />}<i data-hole-mark={i + 1} data-grade={grade} data-raised={raised === i + 1 ? 'true' : undefined}>{grade === 'empty' ? null : <><b className="hm-shape" aria-hidden="true" /><span className="hm-fig">{h?.strokes}</span></>}</i></Fragment>;
  })}</span>;
}
/** Shared key under a marks board: Birdie, Eagle+, Bogey, Double, Triple+;
 *  each 12px swatch is drawn as its mark. */
export function HoleMarksKey({ surface = 'var(--tour-board-canvas)', padX = 16 }: { surface?: string; padX?: number }) {
  const { t } = useTranslation('tourhub');
  const items = [['birdie','Birdie'],['eagle','Eagle+'],['bogey','Bogey'],['double','Double'],['triple','Triple+']] as const;
  return <div className="tour-hole-marks-key" data-hole-marks-key style={{ padding: `10px ${padX}px 0`, '--hm-surface': surface } as CSSProperties}>
    {items.map(([k, label]) => <span key={k} data-hole-marks-key-item={k}><i data-grade={k} aria-hidden="true" />{t(`board.markKey.${k}`, { defaultValue: label })}</span>)}
  </div>;
}
export function roundNineOrder(holes: BoardHole[], finished: boolean) {
  const backPlayed = holes.some(h => h.hole_number > 9 && holeGrade(h.strokes,h.par) !== 'empty');
  const backStart = holes.some(h => h.starting_hole === 10);
  return backStart ? [9,0] : backPlayed || finished ? [0,9] : [0];
}
export function BoardRound({ holes, round, thru, following, busy, error, onFollow, onFull, onPlayer }: {
  holes: BoardHole[]; round: number; thru?: number | null; following:boolean; busy:boolean; error?:boolean;
  onFollow:()=>void; onFull:()=>void; onPlayer:()=>void;
}) {
  const {t} = useTranslation('tourhub');
  const cells = orderedHoleCells(holes);
  return <div className="tour-round-card">
    <div className="tour-round-top"><span>{t('rebuilt.roundThru',{round,thru:thru != null ? thru>=18 ? 'F' : thru : '—'})}</span><Button variant="ghost" className="tour-scorecard-door" onClick={onFull}>{t('rebuilt.fullScorecard')}</Button></div>
    {roundNineOrder(holes,(thru ?? 0)>=18).map(from => <div className="tour-round-nine" data-nine={from===9 ? 'back' : 'front'} key={from}>
      <span className="lab">HOLE</span>{cells.slice(from,from+9).map((_,i)=><span className="hn" key={i}>{from+i+1}</span>)}
      <span className="lab">PAR</span>{cells.slice(from,from+9).map((h,i)=><span className="pr" key={i}>{h?.par ?? '·'}</span>)}
      <span className="lab">R{round}</span>{cells.slice(from,from+9).map((h,i)=>{const grade=holeGrade(h?.strokes ?? null,h?.par ?? null); return <span className="tour-inline-mark" data-grade={grade} key={i} style={{'--tour-mark-tone':holeTone(grade)} as CSSProperties}>{grade==='empty' ? '·' : h?.strokes}</span>;})}
    </div>)}
    <div className="tour-round-foot"><Button variant="outline" className="tour-follow-pill" aria-pressed={following} disabled={busy} onClick={onFollow}>{t(following ? 'rebuilt.following' : 'rebuilt.follow')}</Button><Button variant="outline" className="tour-follow-pill" onClick={onPlayer}>{t('rebuilt.playerPage')}</Button></div>
    {error && <div role="status" className="tour-follow-error">{t('rebuilt.followError')}</div>}
  </div>;
}