/**
 * Hub Create Game Page
 * 
 * Full-screen Create Game modal with glass background, rendered over origin page.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateGameModal } from '@/features/nearby/components/CreateGameModal';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';
import { assertDispatch } from '@/utils/assertDispatch';
import { EVT_GAME_CREATED } from '@/features/nearby/constants';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useHub } from '../useHub';
import { Z } from '@/config/zIndex';
import '../home/hubTheme.css';

export function HubCreateGamePage() {
  const navigate = useNavigate();
  const { createBeacon } = useGameBeacon({});
  const { open } = useHub();

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
      
      // Navigate back to Hub after creation
      await new Promise((r) => setTimeout(r, 150));
      open(); // Reopen Hub
      navigate(-1); // Remove Create Game from history
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  };

  const handleClose = () => {
    open(); // Reopen Hub
    navigate(-1); // Go back
  };

  return (
    <>
      {/* Glass background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(120px)',
          WebkitBackdropFilter: 'blur(120px)',
          zIndex: Z.hub,
        }}
      />

      {/* Modal Content */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: Z.hub,
        }}
      >
        <CreateGameModal
          isOpen={true}
          onClose={handleClose}
          onCreateBeacon={handleCreate}
        />
      </div>
    </>
  );
}
