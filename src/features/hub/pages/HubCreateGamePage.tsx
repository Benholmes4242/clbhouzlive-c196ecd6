/**
 * Hub Create Game Page
 * 
 * Full-screen glass page for game creation.
 * Opens as an overlay above the origin page.
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHub } from '@/features/hub/useHub';
import { CreateGameModal } from '@/features/nearby/components/CreateGameModal';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';
import { assertDispatch } from '@/utils/assertDispatch';
import { EVT_GAME_CREATED } from '@/features/nearby/constants';
import { analyticsEvents } from '@/utils/analyticsEvents';
import '../home/hubTheme.css';

export function HubCreateGamePage() {
  const { open } = useHub();
  const nav = useNavigate();
  const loc = useLocation();
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

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Return to Hub overlay
      open();
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

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
      nav('/hub/your-games');
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      <CreateGameModal
        isOpen={true}
        onClose={handleBack}
        onCreateBeacon={handleCreate}
      />
    </div>
  );
}
