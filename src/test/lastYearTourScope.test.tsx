import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTournamentLastYearTop4 } from '@/features/tourhub/hooks/useTournamentLastYearTop4';
const state = vi.hoisted(() => ({ mismatch: false, candidates: [] as any[], calls: [] as any[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const filters: any[] = []; let cap = Infinity; let select = ''; let current = false;
  const q: any = { select: (s: string) => { select = s; return q; }, eq: (k: string, v: any) => { filters.push([k,v]); current ||= k === 'id'; return q; }, lt: () => q, gte: () => q, gt: () => q, not: () => q, lte: () => q, order: () => q, limit: (n: number) => { cap = n; return q; }, maybeSingle: () => Promise.resolve({ data: { id:'current',name:'The March Open 2026 presented by Sponsor',start_date:'2026-03-20',event_type:'stroke',season:{tour_name:'PGA',year:2026} } }), then: (resolve: any) => {
    state.calls.push({ table, filters, cap, select });
    if (table === 'sr_leaderboards') return Promise.resolve({ data: [{ position:1,score:-12,player:{full_name:'March Winner'} }] }).then(resolve);
    let rows = state.candidates;
    const tour = filters.find(([k]) => k === 'sr_seasons.tour_name')?.[1];
    if (tour && !state.mismatch) rows = rows.filter(c => c.season.tour_name === tour);
    return Promise.resolve({ data: rows.slice(0, cap) }).then(resolve);
  } }; return q;
} } }));
beforeEach(() => { state.calls = []; state.mismatch = false; state.candidates = []; });
const mount = () => renderHook(() => useTournamentLastYearTop4('current'), { wrapper: ({children}: React.PropsWithChildren) => <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider> });
describe('Last year tour-scoped search', () => {
  it('finds last March despite more than 50 newer events on other tours', async () => {
    state.candidates = [...Array.from({length:60},(_,i)=>({id:`other${i}`,name:`Other ${i}`,season:{tour_name:'EURO',year:2025}})),{id:'march',name:'March Open 2025',end_date:'2025-03-23',season:{tour_name:'PGA',year:2025}}];
    const {result}=mount(); await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({name:'March Winner',year:'2025'});
    const call=state.calls.find(c=>c.table==='sr_tournaments');
    expect(call.filters).toContainEqual(['sr_seasons.tour_name','PGA']); expect(call.cap).toBe(200);
    expect(call.select).toContain('season:sr_seasons!inner(tour_name, year)');
  });
  it('never matches the same event name on a different tour', async () => {
    state.mismatch=true; state.candidates=[{id:'other',name:'March Open 2025',season:{tour_name:'EURO',year:2025}}];
    const {result}=mount();await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();expect(state.calls.some(c=>c.table==='sr_leaderboards')).toBe(false);
  });
});