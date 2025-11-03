/**
 * Your Games Tile
 * Shows games user is hosting or joined
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';
import { TileHeader } from '../components/TileHeader';
import { Chip } from '../components/Chip';

interface YourGamesTileProps {
  viewAllTo: string;
}

export function YourGamesTile({ viewAllTo }: YourGamesTileProps) {
  const nav = useNavigate();
  
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['userGames'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get games where user is host
      const { data: hosting = [] } = await supabase
        .from('games')
        .select('*')
        .eq('host_user_id', user.id)
        .order('start_time', { ascending: true })
        .limit(2);

      // Get games where user is participant
      const { data: participants = [] } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', user.id)
        .limit(2);

      const gameIds = participants.map(p => p.game_id);
      const { data: joined = [] } = gameIds.length > 0
        ? await supabase
            .from('games')
            .select('*')
            .in('id', gameIds)
            .order('start_time', { ascending: true })
        : { data: [] };

      return [
        ...hosting.map(g => ({ ...g, kind: 'Hosting' as const })),
        ...joined.map(g => ({ ...g, kind: 'Joined' as const }))
      ].slice(0, 3);
    },
  });

  return (
    <Tile className="col-span-2">
      <TileHeader 
        title="Your Games" 
        subtitle="Hosting & Joined" 
        onViewAll={() => nav(viewAllTo)}
      />
      <div className="space-y-2 mt-2">
        {isLoading && [0, 1, 2].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-white/04 animate-pulse" />
        ))}
        {!isLoading && games.map(g => {
          const totalSlots = g.slots_total || 0;
          const availableSlots = g.slots_open || 0;
          return (
            <button 
              key={g.id} 
              className="flex items-center justify-between gap-2.5 w-full p-2.5 rounded-2xl hover:bg-white/06 transition-colors text-left"
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Chip>{g.kind}</Chip>
                  <span className="text-[15px] font-medium text-white truncate" title={g.course_name}>
                    ⛳ {g.course_name || 'Golf Course'}
                  </span>
                </div>
                <div className="text-[12px] text-white/60">
                  {g.start_time ? formatDistanceToNow(new Date(g.start_time), { addSuffix: true }) : 'TBD'}
                </div>
              </div>
              <div className="shrink-0 text-[13px] text-white/70">
                {availableSlots}/{totalSlots}
              </div>
            </button>
          );
        })}
        {!isLoading && games.length === 0 && (
          <div className="text-[13px] text-white/60 py-2">
            No games yet.{' '}
            <button 
              onClick={() => nav('/hub/create-game')}
              className="text-[#FF8C32] hover:underline"
            >
              Create one
            </button>
          </div>
        )}
      </div>
    </Tile>
  );
}
