import React from 'react';
import { useNavigate } from 'react-router-dom';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { supabase } from '@/integrations/supabase/client';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';

type YourGamesScreenProps = {
  onClose: () => void;
};

export function YourGamesScreen({ onClose }: YourGamesScreenProps) {
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
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-semibold text-white">Your Games</h2>
      
      <YourGamesList
        activeTab="your-games"
        onCancelGame={cancelBeacon}
        onLeaveGame={handleLeaveGame}
        onCreateGame={() => nav('/hub?sheet=create-game')}
        onFindGame={() => nav('/hub?sheet=games')}
      />
    </div>
  );
}
