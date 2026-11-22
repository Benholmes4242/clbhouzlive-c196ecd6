/** One batched board read, one optional batched R1 draw read, and one optional
 * batched tee read of rounds 1..provider round for in-progress events (the
 * shared effective round may sit below the provider's). Current tees are
 * joined by tournament AND round, never by tournament alone. The draw is
 * the published pre-round field; absent draws do not invent counts. Refresh
 * matches the hero's shared tournaments-cache 60-second cadence. No provider calls. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { LIVE_STATUSES } from '@/utils/tournamentState';

export interface AlsoWeekRound { tournamentId: string; round: number }

export async function readAlsoWeekData(ids: string[], upcoming: string[], liveRounds: AlsoWeekRound[] = []) {
  const firstTees = new Map<string, Map<number, string>>();
  if (!ids.length) return { boards:new Map<string,BoardEntry[]>(), draws:new Map<string,{first:string | null;players:NonNullable<BoardEntry['player']>[]}>(), firstTees };
  const [board,tees,currentTees] = await Promise.all([
    supabase.from('sr_leaderboards').select('id,tournament_id,position,position_tied,score,today,today_round,thru,status,round_1,round_2,round_3,round_4,player:sr_players!sr_leaderboards_player_id_fkey(id,sr_id,full_name,first_name,last_name,photo_url,pga_tour_id,headshot_override)').in('tournament_id',ids).order('position',{ascending:true}).limit(4000),
    upcoming.length ? supabase.from('sr_tee_times').select('tournament_id,tee_time,players:sr_tee_time_players(player:sr_players(id,sr_id,full_name,first_name,last_name,photo_url,headshot_override))').in('tournament_id',upcoming).eq('round_number',1).order('tee_time',{ascending:true}).limit(1000) : Promise.resolve({data:[],error:null}),
    liveRounds.length ? supabase.from('sr_tee_times').select('tournament_id,round_number,tee_time').in('tournament_id',[...new Set(liveRounds.map(r=>r.tournamentId))]).in('round_number',[...new Set(liveRounds.map(r=>r.round))]).order('tee_time',{ascending:true}).limit(4000) : Promise.resolve({data:[],error:null}),
  ]);
  if (board.error) throw board.error;
  if (tees.error) throw tees.error;
  if (currentTees.error) throw currentTees.error;
  for (const tee of currentTees.data ?? []) {
    if (!liveRounds.some(r=>r.tournamentId===tee.tournament_id && r.round===tee.round_number) || !Number.isFinite(Date.parse(tee.tee_time))) continue;
    const rounds = firstTees.get(tee.tournament_id) ?? new Map<number, string>();
    const first = rounds.get(tee.round_number);
    if (!first || Date.parse(tee.tee_time) < Date.parse(first)) rounds.set(tee.round_number,tee.tee_time);
    firstTees.set(tee.tournament_id,rounds);
  }
  const boards = new Map<string,BoardEntry[]>();
  for (const e of board.data ?? []) { const rows=boards.get(e.tournament_id) ?? [];rows.push(e);boards.set(e.tournament_id,rows); }
  const draws = new Map<string,{first:string | null;players:NonNullable<BoardEntry['player']>[]} >();
  for (const tee of tees.data ?? []) {
    const draw=draws.get(tee.tournament_id) ?? {first:tee.tee_time,players:[]};
    for (const slot of tee.players ?? []) if (slot.player && !draw.players.some(p=>p.id===slot.player.id)) draw.players.push(slot.player);
    draws.set(tee.tournament_id,draw);
  }
  return {boards,draws,firstTees};
}
export function useAlsoWeekData(slides: HeroSlide[]) {
  const ids=slides.map(s=>s.tournament.id);const upcoming=slides.filter(s=>s.type==='upcoming').map(s=>s.tournament.id);
  const liveRounds = slides.flatMap(s=>LIVE_STATUSES.includes((s.tournament.status ?? '').trim().toLowerCase()) && s.tournament.currentRound != null ? Array.from({length:Math.max(1,Math.min(s.tournament.currentRound,4))},(_,i)=>({tournamentId:s.tournament.id,round:i+1})) : []);
  return useQuery({queryKey:['also-week-data',ids,upcoming,liveRounds],enabled:ids.length>0,queryFn:()=>readAlsoWeekData(ids,upcoming,liveRounds),staleTime:30_000,refetchInterval:60_000,refetchOnWindowFocus:true});
}