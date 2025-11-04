import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreateGameModal } from '@/features/nearby/components/CreateGameModal';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';
import { assertDispatch } from '@/utils/assertDispatch';
import { EVT_GAME_CREATED } from '@/features/nearby/constants';

type CreateGameScreenProps = {
  onClose: () => void;
};

export function CreateGameScreen({ onClose }: CreateGameScreenProps) {
  const nav = useNavigate();
  const [qs, setQs] = useSearchParams();
  const { createBeacon } = useGameBeacon({});

  const handleCreate = async (input: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await assertDispatch(
        EVT_GAME_CREATED,
        () => createBeacon(input),
        (result) => ({ gameId: result?.id, hostUserId: user?.id }),
        700
      );
      
      // Navigate to Your Games sheet after creation
      await new Promise((r) => setTimeout(r, 150));
      qs.set('sheet', 'your-games');
      setQs(qs, { replace: true });
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  };

  return (
    <CreateGameModal
      isOpen={true}
      onClose={onClose}
      onCreateBeacon={handleCreate}
    />
  );
}
