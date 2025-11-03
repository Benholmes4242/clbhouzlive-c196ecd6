/**
 * Your Games Tile
 * Full-width tile showing games user is hosting or joined
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tile } from '../components/Tile';

function GameRow({ 
  tag, 
  club, 
  meta, 
  onClick 
}: { 
  tag: 'Hosting' | 'Joined'; 
  club: string; 
  meta: string; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-2.5 py-2.5 rounded-xl transition-colors text-left"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-subtle)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <span 
        className="rounded-xl px-2.5 py-1.5 text-[12px] shrink-0"
        style={{
          border: '1px solid var(--hub-stroke-subtle)',
          color: 'var(--hub-text-body)',
          background: 'var(--hub-glass-subtle)',
        }}
      >
        {tag}
      </span>
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <span role="img" aria-label="flag">⛳️</span>
        <span className="truncate text-[15px]" style={{ color: 'var(--hub-text-bright)' }}>
          {club}
        </span>
      </div>
      <span className="text-[13px] shrink-0" style={{ color: 'var(--hub-text-sub)' }}>
        {meta}
      </span>
    </button>
  );
}

export function YourGamesTile() {
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

      // Filter out duplicates (in case user is both host and participant)
      const hostingWithKind = hosting.map(g => ({ ...g, kind: 'Hosting' as const }));
      const hostingIds = new Set(hosting.map(g => g.id));
      const joinedWithKind = joined
        .filter(g => !hostingIds.has(g.id))
        .map(g => ({ ...g, kind: 'Joined' as const }));
      
      return [...hostingWithKind, ...joinedWithKind].slice(0, 3);
    },
  });

  return (
    <Tile 
      title="Your Games" 
      subtitle="Hosting & Joined"
      onViewAll={() => nav('/hub/your-games')}
    >
      <ul className="mt-1.5 space-y-2.5">
        {isLoading && [0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-subtle)' }} />
        ))}
        {!isLoading && games.map(g => {
          const totalSlots = g.slots_total || 0;
          const availableSlots = g.slots_open || 0;
          return (
            <GameRow
              key={g.id}
              tag={g.kind}
              club={g.course_name || 'Golf Course'}
              meta={`${availableSlots ?? 0}/${totalSlots}`}
              onClick={() => nav(`/game/${g.id}`)}
            />
          );
        })}
        {!isLoading && games.length === 0 && (
          <p className="text-[15px]" style={{ color: 'var(--hub-text-sub)' }}>
            No games yet.{' '}
            <button 
              onClick={() => nav('/hub/create-game')}
              className="underline-offset-2 hover:underline"
              style={{ color: 'var(--hub-accent-orange)' }}
            >
              Create one
            </button>
          </p>
        )}
      </ul>
    </Tile>
  );
}
