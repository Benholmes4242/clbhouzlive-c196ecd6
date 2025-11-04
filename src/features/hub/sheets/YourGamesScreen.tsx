import React from 'react';
import { useNavigate } from 'react-router-dom';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { supabase } from '@/integrations/supabase/client';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';

type YourGamesScreenProps = {
  onClose: () => void;
  focusId?: string;
};

export function YourGamesScreen({ onClose, focusId }: YourGamesScreenProps) {
  const nav = useNavigate();
  const { cancelBeacon } = useGameBeacon({});

  const handleLeaveGame = async (gameId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from('game_participants')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', user.id);
  };

  return (
    <div className="flex flex-col h-full">
      {focusId && (
        <div
          className="sticky top-0 z-10 px-4 py-2 text-[13px]"
          style={{
            background: 'rgba(255,255,255,0.10)',
            borderBottom: '1px solid rgba(255,255,255,0.16)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--hub-text-body)',
          }}
          aria-live="polite"
        >
          Jumped to selected game
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Your Games</h2>
        
        <YourGamesList
          activeTab="your-games"
          onCancelGame={cancelBeacon}
          onLeaveGame={handleLeaveGame}
          onCreateGame={() => nav('/hub?sheet=create-game')}
          onFindGame={() => nav('/hub?sheet=games')}
          focusId={focusId}
        />
      </div>
    </div>
  );
}
