import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type YourGamesScreenProps = {
  onClose: () => void;
};

export function YourGamesScreen({ onClose }: YourGamesScreenProps) {
  const nav = useNavigate();
  
  const { data: games = { hosting: [], joined: [] }, isLoading } = useQuery({
    queryKey: ['userGames'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { hosting: [], joined: [] };

      const { data: hosting = [] } = await supabase
        .from('games')
        .select('*')
        .eq('host_user_id', user.id)
        .order('start_time', { ascending: true });

      const { data: participants = [] } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', user.id);

      const gameIds = participants.map(p => p.game_id);
      const { data: joined = [] } = gameIds.length > 0
        ? await supabase
            .from('games')
            .select('*')
            .in('id', gameIds)
            .order('start_time', { ascending: true })
        : { data: [] };

      const hostingWithKind = hosting.map(g => ({ ...g, kind: 'Hosting' as const }));
      const hostingIds = new Set(hosting.map(g => g.id));
      const joinedWithKind = joined
        .filter(g => !hostingIds.has(g.id))
        .map(g => ({ ...g, kind: 'Joined' as const }));
      
      return { hosting: hostingWithKind, joined: joinedWithKind };
    },
  });

  const hosting = games.hosting || [];
  const joined = games.joined || [];

  return (
    <div className="space-y-6 pb-6">
      <h2 className="text-xl font-semibold text-white">Your Games</h2>
      
      {/* Hosting */}
      <div>
        <h3 className="text-[15px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Hosting</h3>
        <div className="space-y-2">
          {isLoading && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          ))}
          
          {!isLoading && hosting.map(g => (
            <button 
              key={g.id} 
              className="flex flex-col gap-2 w-full p-3 rounded-2xl transition-colors text-left"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="text-[16px] font-medium truncate text-white">
                {g.course_name || 'Golf Course'}
              </div>
              <div className="text-[13px] truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {g.start_time ? new Date(g.start_time).toLocaleDateString() : 'TBD'}
              </div>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {g.slots_open || 0}/{g.slots_total || 0} slots
              </div>
            </button>
          ))}
          
          {!isLoading && hosting.length === 0 && (
            <div className="text-[13px] py-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              No games hosted
            </div>
          )}
        </div>
      </div>

      {/* Joined */}
      <div>
        <h3 className="text-[15px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Joined</h3>
        <div className="space-y-2">
          {isLoading && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          ))}
          
          {!isLoading && joined.map(g => (
            <button 
              key={g.id} 
              className="flex flex-col gap-2 w-full p-3 rounded-2xl transition-colors text-left"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onClick={() => nav(`/game/${g.id}`)}
            >
              <div className="text-[16px] font-medium truncate text-white">
                {g.course_name || 'Golf Course'}
              </div>
              <div className="text-[13px] truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {g.start_time ? new Date(g.start_time).toLocaleDateString() : 'TBD'}
              </div>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {g.slots_open || 0}/{g.slots_total || 0} slots
              </div>
            </button>
          ))}
          
          {!isLoading && joined.length === 0 && (
            <div className="text-[13px] py-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              No games joined
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
