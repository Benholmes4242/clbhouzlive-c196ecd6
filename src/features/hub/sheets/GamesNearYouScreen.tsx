import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { formatDistanceToNow } from 'date-fns';

type GamesNearYouScreenProps = {
  onClose: () => void;
};

export function GamesNearYouScreen({ onClose }: GamesNearYouScreenProps) {
  const nav = useNavigate();
  const { data: games = [], isLoading } = useGamesQuery();

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-semibold text-white">Games Near You</h2>
      
      <div className="space-y-2">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
        ))}
        
        {!isLoading && games.map(g => (
          <button 
            key={g.id} 
            className="flex flex-col gap-2 w-full p-3 rounded-2xl transition-colors text-left"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onClick={() => nav(`/game/${g.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-medium truncate text-white">
                  {g.course_name || 'Golf Course'}
                </div>
                <div className="text-[13px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {g.start_time ? formatDistanceToNow(new Date(g.start_time), { addSuffix: true }) : 'TBD'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span>{g.slots_open || 0} {(g.slots_open || 0) === 1 ? 'spot' : 'spots'}</span>
            </div>
          </button>
        ))}
        
        {!isLoading && games.length === 0 && (
          <div className="text-center py-8 text-[15px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            No games available nearby
          </div>
        )}
      </div>
    </div>
  );
}
