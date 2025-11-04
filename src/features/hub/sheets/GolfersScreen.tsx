import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';

type GolfersScreenProps = {
  onClose: () => void;
};

export function GolfersScreen({ onClose }: GolfersScreenProps) {
  const nav = useNavigate();
  const { golfers, isLoading } = useActiveGolfers({ limit: 50 });

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-semibold text-white">Nearby Golfers</h2>
      
      <div className="space-y-2">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
        ))}
        
        {!isLoading && golfers.map(g => (
          <button 
            key={g.id} 
            className="flex items-center gap-3 w-full p-3 rounded-2xl transition-colors text-left"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onClick={() => nav(`/profile/${g.username}`)}
          >
            <img 
              src={g.avatar_url || '/placeholder.svg'} 
              alt="" 
              className="w-12 h-12 rounded-full object-cover shrink-0"
              style={{ border: '1px solid var(--hub-stroke-avatar)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-medium truncate text-white">
                {g.display_name || g.username}
              </div>
              <div className="text-[13px] truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {g.distanceText}
              </div>
            </div>
            <span className="text-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
          </button>
        ))}
        
        {!isLoading && golfers.length === 0 && (
          <div className="text-center py-8 text-[15px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            No active golfers nearby
          </div>
        )}
      </div>
    </div>
  );
}
