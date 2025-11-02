/**
 * Hub Create Game Page
 * 
 * Full-screen game creation form (converted from modal).
 * Includes debounce fix from Phase 1 audit.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateGameModal } from '@/features/nearby/components/CreateGameModal';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';
import { assertDispatch } from '@/utils/assertDispatch';
import { EVT_GAME_CREATED } from '@/features/nearby/constants';

export function HubCreateGamePage() {
  const navigate = useNavigate();
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
      
      // Navigate to Your Games after creation
      await new Promise((r) => setTimeout(r, 150));
      navigate('/hub/your-games');
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  };

  return (
    <CreateGameModal
      isOpen={true}
      onClose={() => navigate('/hub/your-games')}
      onCreateBeacon={handleCreate}
    />
  );
}
