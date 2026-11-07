import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ProSeasonSection } from '@/features/pro-profile/ProSeasonSection';
import type { ProEvent } from '@/features/pro-profile/proProfileRules';
import { readFileSync } from 'node:fs';
const event=(id:string,source:string,date:string|null,week:number,score:number):ProEvent=>({id,user_id:'pro',source,event_name:`Event ${id}`,start_date:date,end_date:date,venue:null,country:'Belgium',tour_name:'Alps Tour',finish:id==='win'?'1':'T31',total_strokes:source==='owgr'?score:null,to_par:source==='pro'?score:null,tee_time:null,tee_hole:null,scheduled_rounds:3,owgr_year:2026,owgr_week:week,owgr_rank_before:1440,owgr_rank_after:1436,owgr_points:.03,owgr_event_id:id,created_at:'',updated_at:'',rounds:[]});
const mount=(events:ProEvent[],linked=false,onSeeAll?:()=>void)=>render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProSeasonSection events={events} year={2026} first="Mason" linked={linked} scoring={69.8} onSeeAll={onSeeAll}/></QueryClientProvider></MemoryRouter>);
afterEach(cleanup);
describe('Pro profile season results',()=>{
  it('season-only tiles are centred outlines and result-sheet tiles do not opt in',()=>{
    const view=mount([event('one','owgr',null,43,219)]);
    expect(view.container.querySelector('.pro-profile-tiles')).toHaveClass('pro-season-tiles');
    const css=readFileSync('src/features/pro-profile/pro-profile.css','utf8');
    const rule=css.match(/\.pro-season-tiles \.pro-profile-tile \{([^}]+)\}/)?.[1];
    expect(rule).toContain('text-align:center'); expect(rule).toContain('background:transparent'); expect(rule).toContain('border-radius:12px'); expect(rule).toContain('padding:8px 5px 7px');
    expect(css).toContain('.pro-season-tiles .pro-profile-tile span { line-height:1.3; margin-top:4px; font-size:7px; font-weight:700; letter-spacing:.1em; }');
    fireEvent.click(screen.getByRole('button',{name:/Event one/}));
    expect(screen.getByRole('dialog').querySelector('.pro-profile-tiles')).not.toHaveClass('pro-season-tiles');
  });
  it('season result rows sit outside any profile card',()=>{
    const view=mount([event('one','owgr',null,43,219)]);
    const result=view.container.querySelector('.pro-season-results');
    expect(result).not.toBeNull(); expect(result?.closest('.pro-profile-card')).toBeNull();
    expect(result?.querySelector('.pro-result-line')).not.toBeNull();
  });
  it('latest four ordered rows retain gross versus signed to-par',()=>{mount([event('old','owgr',null,20,200),event('pro','pro','2026-11-05',45,-2),event('gross','owgr','2026-11-01',44,219),event('mid','owgr',null,40,140),event('new','owgr',null,43,148)]);const rows=screen.getAllByRole('button').filter(b=>b.classList.contains('pro-profile-row'));expect(rows.map(r=>r.textContent)).toEqual([expect.stringContaining('Event pro'),expect.stringContaining('Event gross'),expect.stringContaining('Event new'),expect.stringContaining('Event mid')]);expect(screen.getByText('−2')).toBeInTheDocument();expect(screen.getByText('219')).toBeInTheDocument();expect(screen.getByText('ADDED BY MASON')).toBeInTheDocument();});
  it('see-all hands off to the caller with the all-years count, never a sheet',()=>{const onSeeAll=vi.fn();mount([event('one','owgr',null,43,219),event('two','pro','2025-01-01',1,2)],false,onSeeAll);fireEvent.click(screen.getByRole('button',{name:'See all 2 results ›'}));expect(onSeeAll).toHaveBeenCalledOnce();expect(screen.queryByRole('dialog')).toBeNull();});
  it('covered-tour BEST tile is best finish 1st, not wins count',()=>{mount([event('win','tour','2026-10-01',40,-18)],true);expect(screen.getByText('BEST')).toBeInTheDocument();expect(screen.queryByText('WIN')).toBeNull();expect(screen.getAllByText('1st')).toHaveLength(2);expect(screen.getByText('SCORING')).toBeInTheDocument();expect(screen.getByText('69.8')).toBeInTheDocument();});
  it('pro result sheet shows TO PAR and no OWGR footnote',()=>{mount([event('pro','pro','2026-11-01',44,-2)]);fireEvent.click(screen.getByRole('button',{name:/Event pro/}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByText('TO PAR')).toBeInTheDocument();expect(within(dialog).queryByText(/Strokes as published/)).toBeNull();});
  it('there is no Add a result card for anyone',()=>{mount([event('one','owgr',null,43,219)]);expect(screen.queryByText('Add a result')).toBeNull();});
});
