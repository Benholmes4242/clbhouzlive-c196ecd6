/**
 * Hub Create Game Page
 * 
 * Game creation with validation and analytics (Phase 3).
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateGameModal } from '@/features/nearby/components/CreateGameModal';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';
import { assertDispatch } from '@/utils/assertDispatch';
import { EVT_GAME_CREATED } from '@/features/nearby/constants';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function HubCreateGamePage() {
  const navigate = useNavigate();
  const { createBeacon } = useGameBeacon({});

  useEffect(() => {
    // Track Create Game open
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.create_game_open.event, {
        event_category: analyticsEvents.hub.create_game_open.category,
        event_label: analyticsEvents.hub.create_game_open.label,
      });
    }
  }, []);

  const handleCreate = async (input: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Track game creation
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analyticsEvents.game.created.event, {
          event_category: analyticsEvents.game.created.category,
          event_label: analyticsEvents.game.created.label,
        });
      }

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
