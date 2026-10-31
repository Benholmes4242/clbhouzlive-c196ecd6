import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BoardTable, boardGridTemplate, computeBoardColumns, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { BoardRound, holeGrade, orderedHoleCells, roundNineOrder } from '@/features/tourhub/leaderboard/BoardRound';
import { eventLeaderLabel, fieldAverageToday, leaderSummary, boardTieRole } from '@/features/tourhub/leaderboard/leaderboardRules';
import type { BoardHole } from '@/features/tourhub/leaderboard/useBoardHoles';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
afterEach(cleanup);
const entry = (id:string, position=1):BoardEntry => ({id,position,score:-4,thru:3,round_1:-2,round_2:-2,player:{id,full_name:`Player ${id}`}});
const hole = (n:number, strokes=4):BoardHole => ({player_id:'a',round_number:2,hole_number:n,par:4,strokes,starting_hole:10});
const cut = {kind:'none' as const,cutline:null,extraCount:0};
function board(entries:BoardEntry[], extra:Partial<Parameters<typeof BoardTable>[0]>={}) {
  return render(<MemoryRouter><BoardTable entries={entries} cutState={cut} currentRound={2} {...extra}/></MemoryRouter>);
}
describe('leaderboard rule preservation and new grouping',()=>{
  it('event leader uses surname and score',()=>expect(eventLeaderLabel('Andrew Novak',1,-15)).toBe('Novak −15'));
  it('event top tie uses number tied and score',()=>expect(eventLeaderLabel('Andrew Novak',3,-15)).toBe('3 tied −15'));
  it('field average and low are absent at nineteen completed rounds',()=>expect(fieldAverageToday(Array.from({length:19},(_,i)=>({...entry(String(i)),thru:18})),2)).toBeNull());
  it('twenty completed rounds unlock exact average and tied lows',()=>{const value=fieldAverageToday(Array.from({length:20},(_,i)=>({...entry(String(i)),thru:18})),2);expect(value?.avg).toBe(-2);expect(value?.lowPlayers).toHaveLength(20);});
  it('unfinished rounds do not satisfy the twenty-round gate',()=>expect(fieldAverageToday(Array.from({length:20},(_,i)=>entry(String(i))),2)).toBeNull());
  it('lead excludes demoted rows and measures shots to next score',()=>expect(leaderSummary([{...entry('wd'),score:-10,status:'WD'},entry('a'),{...entry('b',2),score:-1}])?.lead).toBe(3));
  it('all joint leaders count at the top',()=>expect(leaderSummary([entry('a'),entry('b')])?.count).toBe(2));
  it('ties group first middle last',()=>{const rows=[entry('a',2),entry('b',2),entry('c',2)];expect(rows.map((_,i)=>boardTieRole(rows,i))).toEqual(['first','middle','last']);});
  it('round count remains capped at four with future current round',()=>expect(computeBoardColumns([entry('a')],7).rounds).toEqual([1,2,3,4]));
  it('prize rule remains whole-table money presence',()=>expect(computeBoardColumns([{...entry('a'),money:100}],2).showPrize).toBe(true));
});
describe('hole rules',()=>{
  it.each([[2,'eagle'],[3,'birdie'],[4,'par'],[5,'bogey'],[6,'double'],[7,'double'],[null,'empty']] as const)('strokes %s grade %s',(strokes,grade)=>expect(holeGrade(strokes,4)).toBe(grade));
  it('tenth-tee holes retain absolute hole order',()=>{const cells=orderedHoleCells([hole(10,3),hole(11)]);expect(cells).toHaveLength(18);expect(cells[0]).toBeNull();expect(cells[9]?.hole_number).toBe(10);});
  it('tenth-tee starter shows back nine first',()=>expect(roundNineOrder([hole(10)],false)).toEqual([9,0]));
  it('front starter shows only front until back play',()=>expect(roundNineOrder([{...hole(1),starting_hole:1}],false)).toEqual([0]));
  it('finished round shows both nines',()=>expect(roundNineOrder([],true)).toEqual([0,9]));
});
describe('board interactions',()=>{
  it('one inline round opens, switches and closes without opening full sheet',()=>{
    const onFull=vi.fn();const view=board([entry('a'),entry('b',2)],{onRowClick:onFull});
    const rows=view.container.querySelectorAll<HTMLElement>('[data-board-row]');
    fireEvent.click(rows[0]);expect(rows[0]).toHaveAttribute('aria-expanded','true');expect(onFull).not.toHaveBeenCalled();
    fireEvent.click(rows[1]);expect(rows[0]).toHaveAttribute('aria-expanded','false');expect(rows[1]).toHaveAttribute('aria-expanded','true');
    fireEvent.click(rows[1]);expect(rows[1]).toHaveAttribute('aria-expanded','false');
  });
  it('hole strip absent without played data',()=>expect(board([entry('a')]).container.querySelector('[data-hole-strip]')).toBeNull());
  it('absolute hole cells and bracket roles render together',()=>{const view=board([entry('a',2),entry('b',2)],{holesByPlayer:new Map([['a',[hole(10,3)]]])});expect(view.container.querySelector('[data-hole="10"]')).toHaveAttribute('data-grade','birdie');expect(view.container.querySelectorAll('[data-tie-bracket]')).toHaveLength(2);});
  it('your player positions are never suppressed by ties',()=>{const view=board([entry('a',2),entry('b',2)],{yourPlayers:true});expect(view.container.querySelectorAll('[data-your-player]')).toHaveLength(2);expect(view.container.querySelector('[data-tie-bracket]')).toBeNull();});
  it('full scorecard door invokes the existing target callback',()=>{const full=vi.fn();const view=board([entry('a')],{onRowClick:full});fireEvent.click(view.container.querySelector('[data-board-row]') as HTMLElement);fireEvent.click(view.container.querySelector('.tour-scorecard-door') as HTMLElement);expect(full).toHaveBeenCalledWith(entry('a'));});
  it('follow and player-page doors call separate handlers',()=>{const follow=vi.fn(),player=vi.fn();render(<BoardRound holes={[]} round={2} following={false} busy={false} onFollow={follow} onPlayer={player} onFull={vi.fn()}/>);const buttons=screen.getAllByRole('button');fireEvent.click(buttons[1]);fireEvent.click(buttons[2]);expect(follow).toHaveBeenCalledTimes(1);expect(player).toHaveBeenCalledTimes(1);});
});