/**
 * Your Games Tile
 * Shows games user is hosting or joined
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TileHeader } from '../parts/TileHeader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface YourGamesTileProps {
  className?: string;
  viewAllTo: string;
}

export function YourGamesTile({ className, viewAllTo }: YourGamesTileProps) {
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
    <section className={className}>
      <TileHeader 
        title="Your Games" 
        subtitle="Hosting & Joined" 
        viewAllTo={viewAllTo}
      />
      <div className="list">
        {isLoading && [0, 1, 2].map(i => <div className="skel" key={i} />)}
        {!isLoading && games.map(g => {
          const totalSlots = g.slots_total || 0;
          const availableSlots = g.slots_open || 0;
          return (
            <button 
              key={g.id} 
              className="row text-left w-full p-2 rounded-lg hover:bg-white/03 transition-colors"
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="chip text-xs" aria-pressed="false">{g.kind}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{g.course_name}</div>
                <div className="eyebrow text-xs">
                  {g.start_time ? formatDistanceToNow(new Date(g.start_time), { addSuffix: true }) : 'TBD'}
                </div>
              </div>
              <span className="eyebrow text-xs">{availableSlots}/{totalSlots}</span>
            </button>
          );
        })}
        {!isLoading && games.length === 0 && (
          <div className="eyebrow">No games yet — create one to get started.</div>
        )}
      </div>
    </section>
  );
}
