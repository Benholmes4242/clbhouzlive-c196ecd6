/** Inline scorecard uses the brief's compact score grammar without changing
 * ScoreMark's richer shared rings or the canonical fullscreen ScorecardSheet. */
import { Fragment, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SC_FILL_GOLD, SC_BOGEY_DARK, SC_DOUBLE_DARK } from '@/features/courses/components/holes/_constants';
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

/** ONE shared numbered tile row (signed-off hole-tiles mock): the leaderboard
 *  board, the Tour hero board, Also this week and Clubhouse scorecard posts
 *  all draw THE SAME tile, so tour and member data both feed this component.
 *  Plain { strokes, par } per hole, in order; 18 holes get the 4px nine gap,
 *  a nine-hole round renders 9 tiles with no gap. An unplayed hole is an
 *  empty tile with no number. */
export interface HoleTileCell { strokes: number | null; par: number | null }
export const HOLE_TILE_TONES = Object.freeze({
  eagle: { bg: '#FFD200', fg: '#0A0A0C' },
  birdie: { bg: '#E24B3F', fg: '#FFFFFF' },
  par: { bg: 'rgba(255,255,255,.08)', fg: 'rgba(248,250,252,.72)' },
  bogey: { bg: 'rgba(166,194,240,.85)', fg: '#0A0A0C' },
  double: { bg: '#7AA6EC', fg: '#0A0A0C' },
  empty: { bg: 'rgba(255,255,255,.04)', fg: 'transparent' },
} as const);
export function HoleTiles({ holes }: { holes: ReadonlyArray<HoleTileCell | null> }) {
  const nineGap = holes.length === 18;
  return <span className="tour-hole-tiles" data-hole-tiles style={{ gridColumn: '1 / -1' }}>{holes.map((h, i) => {
    const grade = holeGrade(h?.strokes ?? null, h?.par ?? null);
    const tone = HOLE_TILE_TONES[grade];
    return <Fragment key={i}>{nineGap && i === 9 && <i className="tour-hole-tiles-gap" aria-hidden="true" />}<i data-hole-tile={i + 1} data-grade={grade} style={{ background: tone.bg, color: tone.fg }}>{grade === 'empty' ? '' : h?.strokes}</i></Fragment>;
  })}</span>;
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